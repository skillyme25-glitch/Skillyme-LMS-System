import { Router, Response } from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import path from 'path';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { isAdminOrFacilitator } from '../middleware/roles';
import { validate } from '../middleware/validate';
import { AuthRequest } from '../types';
import { notifyTeamMembers } from '../services/notifications';
import { emailService } from '../services/email';
import { env } from '../config/env';

const router = Router();
router.use(authenticate);

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, env.UPLOAD_DIR),
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: env.MAX_UPLOAD_SIZE } });

async function checkTeamAccess(userId: string, role: string, teamId: string): Promise<boolean> {
  if (role === 'SUPER_ADMIN' || role === 'FACILITATOR') return true;
  if (role === 'MEMBER') {
    const m = await prisma.teamMember.findFirst({ where: { userId, teamId } });
    return !!m;
  }
  if (role === 'MENTOR') {
    const a = await prisma.mentorTeam.findFirst({ where: { mentorId: userId, teamId } });
    return !!a;
  }
  return false;
}

// GET /api/teams/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: teamId } = req.params;
  const user = req.user!;

  const hasAccess = await checkTeamAccess(user.userId, user.role, teamId);
  if (!hasAccess) {
    res.status(403).json({ error: { message: 'Access denied', code: 'FORBIDDEN' } });
    return;
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, photoUrl: true, role: true, linkedinUrl: true } },
        },
      },
      mentors: {
        include: {
          mentor: { select: { id: true, firstName: true, lastName: true, email: true, photoUrl: true, linkedinUrl: true } },
        },
      },
      milestones: { include: { milestone: true } },
    },
  });

  if (!team) {
    res.status(404).json({ error: { message: 'Team not found', code: 'NOT_FOUND' } });
    return;
  }

  res.json(team);
});

// GET /api/teams/:id/posts
router.get('/:id/posts', async (req: AuthRequest, res: Response): Promise<void> => {
  const teamId = req.params.id;
  const user = req.user!;

  const hasAccess = await checkTeamAccess(user.userId, user.role, teamId);
  if (!hasAccess) {
    res.status(403).json({ error: { message: 'Access denied', code: 'FORBIDDEN' } });
    return;
  }

  const page = parseInt((req.query.page as string) || '1');
  const limit = parseInt((req.query.limit as string) || '20');

  const [total, posts] = await Promise.all([
    prisma.teamPost.count({ where: { teamId } }),
    prisma.teamPost.findMany({
      where: { teamId },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, photoUrl: true, role: true },
          // Include functional role from team membership
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  // Enrich with functional role
  const enriched = await Promise.all(
    posts.map(async (p) => {
      const membership = await prisma.teamMember.findFirst({
        where: { userId: p.authorId, teamId },
        select: { functionalRole: true, isTeamLead: true },
      });
      return { ...p, membership };
    })
  );

  res.json({ data: enriched, meta: { total, page, limit } });
});

// POST /api/teams/:id/posts
router.post(
  '/:id/posts',
  upload.single('attachment'),
  [body('content').trim().notEmpty()],
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const teamId = req.params.id;
    const user = req.user!;

    const hasAccess = await checkTeamAccess(user.userId, user.role, teamId);
    if (!hasAccess) {
      res.status(403).json({ error: { message: 'Access denied', code: 'FORBIDDEN' } });
      return;
    }

    const attachmentUrl = req.file
      ? `/uploads/${req.file.filename}`
      : undefined;

    const post = await prisma.teamPost.create({
      data: {
        teamId, authorId: user.userId,
        content: req.body.content,
        attachmentUrl,
      },
      include: { author: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } },
    });

    await notifyTeamMembers({
      teamId, type: 'TEAM_UPDATE',
      title: 'New team post',
      body: `${post.author.firstName} posted an update.`,
      linkUrl: '/team?tab=feed',
      excludeUserId: user.userId,
    });

    res.status(201).json(post);
  }
);

// DELETE /api/teams/:id/posts/:postId
router.delete('/:id/posts/:postId', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const post = await prisma.teamPost.findUnique({ where: { id: req.params.postId } });
  if (!post) {
    res.status(404).json({ error: { message: 'Post not found', code: 'NOT_FOUND' } });
    return;
  }
  if (post.authorId !== user.userId && user.role !== 'SUPER_ADMIN') {
    res.status(403).json({ error: { message: 'Access denied', code: 'FORBIDDEN' } });
    return;
  }
  await prisma.teamPost.delete({ where: { id: req.params.postId } });
  res.json({ message: 'Post deleted' });
});

// GET /api/teams/:id/milestones
router.get('/:id/milestones', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: teamId } = req.params;
  const user = req.user!;

  if (user.role === 'MEMBER') {
    const membership = await prisma.teamMember.findFirst({ where: { userId: user.userId, teamId } });
    if (!membership) { res.status(403).json({ error: { message: 'Access denied', code: 'FORBIDDEN' } }); return; }
  } else if (user.role === 'MENTOR') {
    const assignment = await prisma.mentorTeam.findFirst({ where: { mentorId: user.userId, teamId } });
    if (!assignment) { res.status(403).json({ error: { message: 'Access denied', code: 'FORBIDDEN' } }); return; }
  }

  const milestones = await prisma.teamMilestone.findMany({
    where: { teamId },
    include: { milestone: true, reviewedBy: { select: { firstName: true, lastName: true } } },
    orderBy: { milestone: { weekNumber: 'asc' } },
  });
  res.json(milestones);
});

// PATCH /api/teams/:id/milestones/:milestoneId/submit
router.patch('/:id/milestones/:milestoneId/submit',
  [body('submissionNote').optional().isString(), body('answers').optional().isObject()],
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id: teamId, milestoneId } = req.params;
    const user = req.user!;

    if (user.role === 'MEMBER') {
      const membership = await prisma.teamMember.findFirst({ where: { userId: user.userId, teamId } });
      if (!membership || !membership.isTeamLead) {
        res.status(403).json({ error: { message: 'Only team leads can submit milestones', code: 'FORBIDDEN' } });
        return;
      }
    } else if (user.role !== 'SUPER_ADMIN' && user.role !== 'FACILITATOR') {
      res.status(403).json({ error: { message: 'Access denied', code: 'FORBIDDEN' } });
      return;
    }

    const { submissionNote, answers } = req.body as { submissionNote?: string; answers?: Record<string, string> };

    const updated = await prisma.teamMilestone.update({
      where: { teamId_milestoneId: { teamId, milestoneId } },
      data: { status: 'SUBMITTED', submissionNote, answers: answers ?? undefined, submittedAt: new Date() },
      include: { milestone: true },
    });

    await notifyTeamMembers({
      teamId, type: 'TEAM_UPDATE',
      title: `Milestone submitted: ${updated.milestone.title}`,
      body: `Week ${updated.milestone.weekNumber} milestone submitted for review.`,
      linkUrl: '/team?tab=milestones',
      excludeUserId: user.userId,
    });

    res.json(updated);
  }
);

// PATCH /api/teams/:id/milestones/:milestoneId/review
router.patch('/:id/milestones/:milestoneId/review',
  isAdminOrFacilitator,
  [body('status').isIn(['APPROVED', 'FLAGGED']), body('facilitatorNote').optional().isString()],
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id: teamId, milestoneId } = req.params;
    const { status, facilitatorNote } = req.body as { status: 'APPROVED' | 'FLAGGED'; facilitatorNote?: string };

    const updated = await prisma.teamMilestone.update({
      where: { teamId_milestoneId: { teamId, milestoneId } },
      data: { status, facilitatorNote, reviewedAt: new Date(), reviewedById: req.user!.userId },
      include: {
        milestone: true,
        team: { include: { members: { include: { user: true } } } },
      },
    });

    const nextMilestone = await prisma.milestone.findFirst({
      where: { weekNumber: { gt: updated.milestone.weekNumber } },
      orderBy: { weekNumber: 'asc' },
    });

    for (const member of updated.team.members) {
      if (member.user.status !== 'ACTIVE') continue;
      await notifyTeamMembers({
        teamId, type: status === 'APPROVED' ? 'MILESTONE_APPROVED' : 'MILESTONE_FLAGGED',
        title: status === 'APPROVED' ? `Approved: ${updated.milestone.title}` : `Flagged: ${updated.milestone.title}`,
        body: facilitatorNote ?? (status === 'APPROVED' ? 'Great work!' : 'Please review facilitator feedback.'),
        linkUrl: '/team?tab=milestones',
      });
      if (status === 'APPROVED') {
        await emailService.sendMilestoneApproved({
          to: member.user.email, firstName: member.user.firstName, teamName: updated.team.name,
          weekNumber: updated.milestone.weekNumber, milestoneTitle: updated.milestone.title,
          facilitatorNote, nextTitle: nextMilestone?.title, nextDueDate: nextMilestone?.dueDate,
        });
      } else {
        await emailService.sendMilestoneFlagged({
          to: member.user.email, firstName: member.user.firstName, teamName: updated.team.name,
          weekNumber: updated.milestone.weekNumber, milestoneTitle: updated.milestone.title, facilitatorNote,
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        actorId: req.user!.userId,
        action: status === 'APPROVED' ? 'APPROVED_MILESTONE' : 'FLAGGED_MILESTONE',
        targetType: 'TeamMilestone', targetId: updated.id,
        metadata: { teamId, milestoneId, facilitatorNote },
      },
    });

    res.json(updated);
  }
);

export default router;
