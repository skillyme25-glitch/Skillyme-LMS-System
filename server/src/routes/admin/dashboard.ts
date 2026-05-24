import { Router, Response } from 'express';
import prisma from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { isAdminOrFacilitator } from '../../middleware/roles';
import { AuthRequest } from '../../types';

const router = Router();
router.use(authenticate, isAdminOrFacilitator);

router.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  const [
    totalParticipants,
    activeParticipants,
    invitedPending,
    totalTeams,
    milestones,
    recentActivity,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'MEMBER' } }),
    prisma.user.count({ where: { role: 'MEMBER', status: 'ACTIVE' } }),
    prisma.user.count({ where: { status: 'INVITED' } }),
    prisma.team.count(),
    prisma.milestone.findMany({
      include: {
        teamMilestones: { select: { status: true } },
      },
      orderBy: { weekNumber: 'asc' },
    }),
    prisma.auditLog.findMany({
      include: { actor: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  const milestoneProgressByWeek = milestones.map((ms) => {
    const counts = { NOT_STARTED: 0, IN_PROGRESS: 0, SUBMITTED: 0, APPROVED: 0, FLAGGED: 0 };
    ms.teamMilestones.forEach((tm) => {
      counts[tm.status]++;
    });
    return {
      weekNumber: ms.weekNumber,
      milestoneTitle: ms.title,
      dueDate: ms.dueDate,
      teamStatuses: counts,
    };
  });

  // Teams at risk = teams with any FLAGGED milestone
  const flaggedMilestones = await prisma.teamMilestone.findMany({
    where: { status: 'FLAGGED' },
    include: { team: { select: { id: true, name: true } }, milestone: { select: { weekNumber: true } } },
  });
  const teamsAtRiskMap = new Map<string, { teamId: string; teamName: string; flaggedWeeks: number[] }>();
  for (const fm of flaggedMilestones) {
    const existing = teamsAtRiskMap.get(fm.teamId);
    if (existing) {
      existing.flaggedWeeks.push(fm.milestone.weekNumber);
    } else {
      teamsAtRiskMap.set(fm.teamId, {
        teamId: fm.teamId,
        teamName: fm.team.name,
        flaggedWeeks: [fm.milestone.weekNumber],
      });
    }
  }

  res.json({
    totalParticipants,
    activeParticipants,
    invitedPending,
    totalTeams,
    milestoneProgressByWeek,
    teamsAtRisk: Array.from(teamsAtRiskMap.values()),
    recentActivity,
  });
});

export default router;
