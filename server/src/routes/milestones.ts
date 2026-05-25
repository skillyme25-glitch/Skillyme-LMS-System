import { Router, Response } from 'express';
import { body } from 'express-validator';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { isAdmin, isAdminOrFacilitator } from '../middleware/roles';
import { validate } from '../middleware/validate';
import { AuthRequest } from '../types';
import { notifyTeamMembers } from '../services/notifications';
import { emailService } from '../services/email';

const router = Router();
router.use(authenticate);

// GET /api/milestones
router.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  const milestones = await prisma.milestone.findMany({
    orderBy: [{ stageGroup: 'asc' }, { weekNumber: 'asc' }],
  });
  res.json(milestones);
});

// POST /api/milestones (SUPER_ADMIN only)
router.post(
  '/',
  isAdmin,
  [
    body('weekNumber').isInt({ min: 1, max: 12 }),
    body('stageGroup').isIn(['IDEA_STAGE', 'EARLY_BUILDER', 'EARLY_TRACTION']),
    body('title').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('dueDate').isISO8601(),
  ],
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { weekNumber, stageGroup, title, description, dueDate } = req.body as {
      weekNumber: number; stageGroup: string; title: string; description: string; dueDate: string;
    };
    const ms = await prisma.milestone.create({
      data: {
        weekNumber, title, description,
        dueDate: new Date(dueDate),
        stageGroup: stageGroup as Parameters<typeof prisma.milestone.create>[0]['data']['stageGroup'],
      },
    });

    // Auto-create TeamMilestone only for teams of the matching stageGroup
    const teams = await prisma.team.findMany({
      where: { stageGroup: stageGroup as 'IDEA_STAGE' | 'EARLY_BUILDER' | 'EARLY_TRACTION' },
      select: { id: true },
    });
    await Promise.all(
      teams.map((t) => prisma.teamMilestone.create({ data: { teamId: t.id, milestoneId: ms.id } }))
    );

    res.status(201).json(ms);
  }
);

// PATCH /api/milestones/:id (SUPER_ADMIN only)
router.patch(
  '/:id',
  isAdmin,
  [
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim().notEmpty(),
    body('dueDate').optional().isISO8601(),
  ],
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { title, description, dueDate } = req.body as {
      title?: string; description?: string; dueDate?: string;
    };
    const ms = await prisma.milestone.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
      },
    });
    res.json(ms);
  }
);

// DELETE /api/milestones/:id (SUPER_ADMIN only)
router.delete('/:id', isAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.milestone.delete({ where: { id: req.params.id } });
  res.json({ message: 'Milestone deleted' });
});

// GET /api/teams/:teamId/milestones
router.get('/teams/:teamId', async (req: AuthRequest, res: Response): Promise<void> => {
  const { teamId } = req.params;
  const user = req.user!;

  // Access control
  if (user.role === 'MEMBER') {
    const membership = await prisma.teamMember.findFirst({ where: { userId: user.userId, teamId } });
    if (!membership) {
      res.status(403).json({ error: { message: 'Access denied', code: 'FORBIDDEN' } });
      return;
    }
  } else if (user.role === 'MENTOR') {
    const assignment = await prisma.mentorTeam.findFirst({ where: { mentorId: user.userId, teamId } });
    if (!assignment) {
      res.status(403).json({ error: { message: 'Access denied', code: 'FORBIDDEN' } });
      return;
    }
  }

  const milestones = await prisma.teamMilestone.findMany({
    where: { teamId },
    include: { milestone: true, reviewedBy: { select: { firstName: true, lastName: true } } },
    orderBy: { milestone: { weekNumber: 'asc' } },
  });
  res.json(milestones);
});

// PATCH /api/teams/:teamId/milestones/:milestoneId/submit
router.patch(
  '/teams/:teamId/milestones/:milestoneId/submit',
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { teamId, milestoneId } = req.params;
    const user = req.user!;

    if (user.role !== 'MEMBER' && user.role !== 'SUPER_ADMIN' && user.role !== 'FACILITATOR') {
      res.status(403).json({ error: { message: 'Only team members can submit', code: 'FORBIDDEN' } });
      return;
    }

    if (user.role === 'MEMBER') {
      const membership = await prisma.teamMember.findFirst({ where: { userId: user.userId, teamId } });
      if (!membership || !membership.isTeamLead) {
        res.status(403).json({ error: { message: 'Only team leads can submit milestones', code: 'FORBIDDEN' } });
        return;
      }
    }

    const tm = await prisma.teamMilestone.findUnique({
      where: { teamId_milestoneId: { teamId, milestoneId } },
      include: { milestone: true, team: true },
    });
    if (!tm) {
      res.status(404).json({ error: { message: 'Team milestone not found', code: 'NOT_FOUND' } });
      return;
    }

    const updated = await prisma.teamMilestone.update({
      where: { teamId_milestoneId: { teamId, milestoneId } },
      data: { status: 'SUBMITTED', submissionNote: req.body.submissionNote, submittedAt: new Date() },
      include: { milestone: true },
    });

    await notifyTeamMembers({
      teamId,
      type: 'TEAM_UPDATE',
      title: `Milestone submitted: ${updated.milestone.title}`,
      body: `Week ${updated.milestone.weekNumber} milestone has been submitted for review.`,
      linkUrl: '/team?tab=milestones',
      excludeUserId: user.userId,
    });

    res.json(updated);
  }
);

// PATCH /api/teams/:teamId/milestones/:milestoneId/review
router.patch(
  '/teams/:teamId/milestones/:milestoneId/review',
  isAdminOrFacilitator,
  [
    body('status').isIn(['APPROVED', 'FLAGGED']),
    body('facilitatorNote').optional().isString(),
  ],
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { teamId, milestoneId } = req.params;
    const { status, facilitatorNote } = req.body as { status: 'APPROVED' | 'FLAGGED'; facilitatorNote?: string };

    const updated = await prisma.teamMilestone.update({
      where: { teamId_milestoneId: { teamId, milestoneId } },
      data: {
        status,
        facilitatorNote,
        reviewedAt: new Date(),
        reviewedById: req.user!.userId,
      },
      include: { milestone: true, team: { include: { members: { include: { user: true } } } } },
    });

    // Next milestone for the same stage group
    const nextMilestone = await prisma.milestone.findFirst({
      where: {
        stageGroup: updated.milestone.stageGroup,
        weekNumber: { gt: updated.milestone.weekNumber },
      },
      orderBy: { weekNumber: 'asc' },
    });

    for (const member of updated.team.members) {
      if (member.user.status !== 'ACTIVE') continue;

      await notifyTeamMembers({
        teamId,
        type: status === 'APPROVED' ? 'MILESTONE_APPROVED' : 'MILESTONE_FLAGGED',
        title: status === 'APPROVED'
          ? `Milestone approved: ${updated.milestone.title}`
          : `Milestone flagged: ${updated.milestone.title}`,
        body: facilitatorNote || (status === 'APPROVED' ? 'Great work!' : 'Please review the facilitator feedback.'),
        linkUrl: '/team?tab=milestones',
      });

      if (status === 'APPROVED') {
        await emailService.sendMilestoneApproved({
          to: member.user.email,
          firstName: member.user.firstName,
          teamName: updated.team.name,
          weekNumber: updated.milestone.weekNumber,
          milestoneTitle: updated.milestone.title,
          facilitatorNote,
          nextTitle: nextMilestone?.title,
          nextDueDate: nextMilestone?.dueDate,
        });
      } else {
        await emailService.sendMilestoneFlagged({
          to: member.user.email,
          firstName: member.user.firstName,
          teamName: updated.team.name,
          weekNumber: updated.milestone.weekNumber,
          milestoneTitle: updated.milestone.title,
          facilitatorNote,
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        actorId: req.user!.userId,
        action: status === 'APPROVED' ? 'APPROVED_MILESTONE' : 'FLAGGED_MILESTONE',
        targetType: 'TeamMilestone',
        targetId: updated.id,
        metadata: { teamId, milestoneId, facilitatorNote },
      },
    });

    res.json(updated);
  }
);

export default router;
