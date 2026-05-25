import { Router, Response } from 'express';
import { body, query } from 'express-validator';
import crypto from 'crypto';
import prisma from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { isAdminOrFacilitator, isAdmin } from '../../middleware/roles';
import { validate } from '../../middleware/validate';
import { AuthRequest } from '../../types';
import { emailService } from '../../services/email';
import { env } from '../../config/env';

const router = Router();
router.use(authenticate, isAdminOrFacilitator);

function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function inviteExpiry(): Date {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

// GET /api/admin/users
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const page = parseInt((req.query.page as string) || '1');
    const limit = parseInt((req.query.limit as string) || '20');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (req.query.role) where.role = req.query.role;
    if (req.query.status) where.status = req.query.status;

    let teamFilter: Record<string, unknown> | undefined;
    if (req.query.teamId) {
      teamFilter = { some: { teamId: req.query.teamId } };
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where: { ...where, ...(teamFilter ? { teamMemberships: teamFilter } : {}) } }),
      prisma.user.findMany({
        where: { ...where, ...(teamFilter ? { teamMemberships: teamFilter } : {}) },
        include: {
          teamMemberships: { include: { team: { select: { id: true, name: true } } } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      data: users.map(({ passwordHash, refreshToken, invitationToken, ...u }) => u),
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  }
);

// POST /api/admin/invite
router.post(
  '/invite',
  [
    body('email').isEmail().normalizeEmail(),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('role').isIn(['SUPER_ADMIN', 'FACILITATOR', 'MENTOR', 'MEMBER']),
    body('teamId').optional().isUUID(),
    body('functionalRole').optional().isIn(['BUILDER', 'COMMERCIAL', 'GROWTH', 'PRODUCT', 'DOMAIN_EXPERT', 'DESIGN', 'LEGAL']),
  ],
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { email, firstName, lastName, role, teamId, functionalRole } = req.body as {
      email: string; firstName: string; lastName: string;
      role: string; teamId?: string; functionalRole?: string;
    };

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: { message: 'User with this email already exists', code: 'CONFLICT' } });
      return;
    }

    const token = generateInviteToken();
    const user = await prisma.user.create({
      data: {
        email, firstName, lastName,
        role: role as Parameters<typeof prisma.user.create>[0]['data']['role'],
        status: 'INVITED',
        invitationToken: token,
        invitationExpiresAt: inviteExpiry(),
      },
    });

    let team: { name: string } | null = null;
    if (teamId && functionalRole) {
      const teamRecord = await prisma.team.findUnique({ where: { id: teamId } });
      if (teamRecord) {
        team = teamRecord;
        await prisma.teamMember.create({
          data: {
            userId: user.id,
            teamId,
            functionalRole: functionalRole as Parameters<typeof prisma.teamMember.create>[0]['data']['functionalRole'],
          },
        });
      }
    }

    await emailService.sendInvitation({
      to: email, firstName, teamName: team?.name, functionalRole, token,
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user!.userId,
        action: 'INVITED_USER',
        targetType: 'User',
        targetId: user.id,
        metadata: { email, role, teamId },
      },
    });

    const inviteUrl = `${env.FRONTEND_URL}/accept-invite?token=${token}`;
    res.status(201).json({ message: 'Invitation sent', userId: user.id, inviteUrl });
  }
);

// POST /api/admin/invite/bulk
router.post(
  '/invite/bulk',
  isAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const invites = req.body as Array<{
      email: string; firstName: string; lastName: string;
      role: string; teamId?: string; functionalRole?: string;
    }>;

    if (!Array.isArray(invites)) {
      res.status(400).json({ error: { message: 'Body must be an array', code: 'BAD_REQUEST' } });
      return;
    }

    const results = await Promise.all(
      invites.map(async (inv) => {
        try {
          const existing = await prisma.user.findUnique({ where: { email: inv.email } });
          if (existing) return { email: inv.email, success: false, error: 'Already exists' };

          const token = generateInviteToken();
          const user = await prisma.user.create({
            data: {
              email: inv.email, firstName: inv.firstName, lastName: inv.lastName,
              role: inv.role as Parameters<typeof prisma.user.create>[0]['data']['role'],
              status: 'INVITED',
              invitationToken: token,
              invitationExpiresAt: inviteExpiry(),
            },
          });

          let teamName: string | undefined;
          if (inv.teamId && inv.functionalRole) {
            const team = await prisma.team.findUnique({ where: { id: inv.teamId } });
            if (team) {
              teamName = team.name;
              await prisma.teamMember.create({
                data: {
                  userId: user.id, teamId: inv.teamId,
                  functionalRole: inv.functionalRole as Parameters<typeof prisma.teamMember.create>[0]['data']['functionalRole'],
                },
              });
            }
          }

          await emailService.sendInvitation({ to: inv.email, firstName: inv.firstName, teamName, functionalRole: inv.functionalRole, token });
          await prisma.auditLog.create({
            data: { actorId: req.user!.userId, action: 'INVITED_USER', targetType: 'User', targetId: user.id, metadata: { email: inv.email } },
          });
          return { email: inv.email, success: true };
        } catch (err) {
          return { email: inv.email, success: false, error: String(err) };
        }
      })
    );

    res.json({ results });
  }
);

// PATCH /api/admin/users/:id
router.patch(
  '/:id',
  isAdmin,
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('role').optional().isIn(['SUPER_ADMIN', 'FACILITATOR', 'MENTOR', 'MEMBER']),
    body('status').optional().isIn(['INVITED', 'ACTIVE', 'SUSPENDED']),
  ],
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { firstName, lastName, role, status, teamId, functionalRole, isTeamLead, removeFromTeam } = req.body as {
      firstName?: string; lastName?: string; role?: string; status?: string;
      teamId?: string; functionalRole?: string; isTeamLead?: boolean; removeFromTeam?: boolean;
    };

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: { message: 'User not found', code: 'NOT_FOUND' } });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(role && { role: role as Parameters<typeof prisma.user.update>[0]['data']['role'] }),
        ...(status && { status: status as Parameters<typeof prisma.user.update>[0]['data']['status'] }),
      },
    });

    if (removeFromTeam) {
      await prisma.teamMember.deleteMany({ where: { userId: id } });
    } else if (teamId && functionalRole) {
      const existing = await prisma.teamMember.findFirst({ where: { userId: id } });
      if (existing) {
        await prisma.teamMember.update({
          where: { userId_teamId: { userId: id, teamId: existing.teamId } },
          data: {
            teamId,
            functionalRole: functionalRole as Parameters<typeof prisma.teamMember.update>[0]['data']['functionalRole'],
            ...(isTeamLead !== undefined && { isTeamLead }),
          },
        });
      } else {
        await prisma.teamMember.create({
          data: {
            userId: id, teamId,
            functionalRole: functionalRole as Parameters<typeof prisma.teamMember.create>[0]['data']['functionalRole'],
            isTeamLead: isTeamLead ?? false,
          },
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        actorId: req.user!.userId, action: 'UPDATED_USER',
        targetType: 'User', targetId: id, metadata: req.body,
      },
    });

    const { passwordHash, refreshToken, invitationToken, ...safe } = updated;
    res.json(safe);
  }
);

// PATCH /api/admin/users/:id/suspend
router.patch('/:id/suspend', isAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  await prisma.user.update({ where: { id }, data: { status: 'SUSPENDED' } });
  await prisma.auditLog.create({
    data: { actorId: req.user!.userId, action: 'SUSPENDED_USER', targetType: 'User', targetId: id },
  });
  res.json({ message: 'User suspended' });
});

// DELETE /api/admin/users/:id/revoke-invite
router.delete('/:id/revoke-invite', isAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ error: { message: 'User not found', code: 'NOT_FOUND' } });
    return;
  }
  const token = generateInviteToken();
  await prisma.user.update({
    where: { id },
    data: { status: 'INVITED', invitationToken: token, invitationExpiresAt: inviteExpiry() },
  });

  let teamName: string | undefined;
  const membership = await prisma.teamMember.findFirst({
    where: { userId: id }, include: { team: true },
  });
  if (membership) teamName = membership.team.name;

  await emailService.sendInvitation({
    to: user.email, firstName: user.firstName, teamName,
    functionalRole: membership?.functionalRole, token,
  });

  await prisma.auditLog.create({
    data: { actorId: req.user!.userId, action: 'RESENT_INVITE', targetType: 'User', targetId: id },
  });

  res.json({ message: 'Invitation re-sent' });
});

// DELETE /api/admin/users/:id
router.delete('/:id', isAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  if (id === req.user!.userId) {
    res.status(400).json({ error: { message: 'Cannot delete your own account', code: 'BAD_REQUEST' } });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ error: { message: 'User not found', code: 'NOT_FOUND' } });
    return;
  }

  await prisma.$transaction([
    // Null out reviewer/actor references (nullable FK fields with no onDelete)
    prisma.teamMilestone.updateMany({ where: { reviewedById: id }, data: { reviewedById: null } }),
    prisma.application.updateMany({ where: { reviewedById: id }, data: { reviewedById: null } }),
    // Delete owned records
    prisma.auditLog.deleteMany({ where: { actorId: id } }),
    prisma.teamPost.deleteMany({ where: { authorId: id } }),
    prisma.announcement.deleteMany({ where: { postedById: id } }),
    prisma.calendarEvent.deleteMany({ where: { createdById: id } }),
    prisma.user.delete({ where: { id } }),
  ]);

  res.json({ message: 'User deleted' });
});

export default router;
