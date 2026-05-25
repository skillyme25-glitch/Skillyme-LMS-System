import { Router, Response } from 'express';
import { body } from 'express-validator';
import prisma from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { isAdminOrFacilitator, isAdmin } from '../../middleware/roles';
import { validate } from '../../middleware/validate';
import { AuthRequest } from '../../types';

const router = Router();
router.use(authenticate, isAdminOrFacilitator);

// GET /api/admin/teams
router.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  const teams = await prisma.team.findMany({
    include: {
      members: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, photoUrl: true, role: true, linkedinUrl: true } } } },
      mentors: { include: { mentor: { select: { id: true, firstName: true, lastName: true, email: true, photoUrl: true, linkedinUrl: true } } } },
      milestones: { include: { milestone: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  res.json(teams);
});

// POST /api/admin/teams
router.post(
  '/',
  isAdmin,
  [
    body('name').trim().notEmpty(),
    body('stageGroup').isIn(['IDEA_STAGE', 'EARLY_BUILDER', 'EARLY_TRACTION']),
  ],
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { name, productName, productDescription, sector, stageGroup } = req.body as {
      name: string; productName?: string; productDescription?: string;
      sector?: string; stageGroup: string;
    };
    const team = await prisma.team.create({
      data: {
        name, productName, productDescription, sector,
        stageGroup: stageGroup as Parameters<typeof prisma.team.create>[0]['data']['stageGroup'],
      },
    });

    // Initialise TeamMilestone records for milestones matching this team's stageGroup
    const milestones = await prisma.milestone.findMany({
      where: { stageGroup: team.stageGroup },
    });
    await Promise.all(
      milestones.map((ms) =>
        prisma.teamMilestone.create({ data: { teamId: team.id, milestoneId: ms.id } })
      )
    );

    await prisma.auditLog.create({
      data: { actorId: req.user!.userId, action: 'CREATED_TEAM', targetType: 'Team', targetId: team.id },
    });
    res.status(201).json(team);
  }
);

// GET /api/admin/teams/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const team = await prisma.team.findUnique({
    where: { id: req.params.id },
    include: {
      members: { include: { user: true } },
      mentors: { include: { mentor: true } },
      milestones: { include: { milestone: true } },
      posts: { include: { author: true }, orderBy: { createdAt: 'desc' }, take: 20 },
      calendarEvents: { orderBy: { startTime: 'asc' } },
    },
  });
  if (!team) {
    res.status(404).json({ error: { message: 'Team not found', code: 'NOT_FOUND' } });
    return;
  }
  res.json(team);
});

// PATCH /api/admin/teams/:id
router.patch(
  '/:id',
  [body('name').optional().trim().notEmpty()],
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { name, productName, productDescription, sector, stageGroup } = req.body as {
      name?: string; productName?: string; productDescription?: string;
      sector?: string; stageGroup?: string;
    };
    const team = await prisma.team.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(productName !== undefined && { productName }),
        ...(productDescription !== undefined && { productDescription }),
        ...(sector !== undefined && { sector }),
        ...(stageGroup && { stageGroup: stageGroup as Parameters<typeof prisma.team.update>[0]['data']['stageGroup'] }),
      },
    });
    await prisma.auditLog.create({
      data: { actorId: req.user!.userId, action: 'UPDATED_TEAM', targetType: 'Team', targetId: team.id, metadata: req.body },
    });
    res.json(team);
  }
);

// DELETE /api/admin/teams/:id
router.delete('/:id', isAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) {
    res.status(404).json({ error: { message: 'Team not found', code: 'NOT_FOUND' } });
    return;
  }
  await prisma.team.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { actorId: req.user!.userId, action: 'DELETED_TEAM', targetType: 'Team', targetId: id, metadata: { name: team.name } },
  });
  res.json({ message: 'Team deleted' });
});

// POST /api/admin/teams/:id/members
router.post(
  '/:id/members',
  isAdmin,
  [
    body('userId').isUUID(),
    body('functionalRole').isIn(['BUILDER', 'COMMERCIAL', 'GROWTH', 'PRODUCT', 'DOMAIN_EXPERT', 'DESIGN', 'LEGAL']),
  ],
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { userId, functionalRole, isTeamLead } = req.body as {
      userId: string; functionalRole: string; isTeamLead?: boolean;
    };
    const member = await prisma.teamMember.upsert({
      where: { userId_teamId: { userId, teamId: req.params.id } },
      update: {
        functionalRole: functionalRole as Parameters<typeof prisma.teamMember.update>[0]['data']['functionalRole'],
        isTeamLead: isTeamLead ?? false,
      },
      create: {
        userId, teamId: req.params.id,
        functionalRole: functionalRole as Parameters<typeof prisma.teamMember.create>[0]['data']['functionalRole'],
        isTeamLead: isTeamLead ?? false,
      },
    });
    res.status(201).json(member);
  }
);

// DELETE /api/admin/teams/:id/members/:userId
router.delete('/:id/members/:userId', isAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.teamMember.deleteMany({
    where: { teamId: req.params.id, userId: req.params.userId },
  });
  res.json({ message: 'Member removed' });
});

// POST /api/admin/teams/:id/mentors
router.post(
  '/:id/mentors',
  isAdmin,
  [body('mentorId').isUUID()],
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { mentorId } = req.body as { mentorId: string };
    const record = await prisma.mentorTeam.upsert({
      where: { mentorId_teamId: { mentorId, teamId: req.params.id } },
      update: {},
      create: { mentorId, teamId: req.params.id },
    });
    res.status(201).json(record);
  }
);

// DELETE /api/admin/teams/:id/mentors/:mentorId
router.delete('/:id/mentors/:mentorId', isAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.mentorTeam.deleteMany({
    where: { teamId: req.params.id, mentorId: req.params.mentorId },
  });
  res.json({ message: 'Mentor removed' });
});

export default router;
