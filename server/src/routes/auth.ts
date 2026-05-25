import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import prisma from '../config/database';
import { env } from '../config/env';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';
import { emailService } from '../services/email';

const router = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true });

function signAccessToken(userId: string, email: string, role: string): string {
  return jwt.sign({ userId, email, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY,
  } as jwt.SignOptions);
}

function signRefreshToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY,
  } as jwt.SignOptions);
}

// GET /api/auth/validate-token?token=xxx
router.get('/validate-token', async (req: Request, res: Response): Promise<void> => {
  const { token } = req.query as { token?: string };
  if (!token) {
    res.status(400).json({ error: { message: 'Token required', code: 'BAD_REQUEST' } });
    return;
  }
  const user = await prisma.user.findFirst({
    where: {
      invitationToken: token,
      invitationExpiresAt: { gt: new Date() },
      status: 'INVITED',
    },
    select: { firstName: true, lastName: true, email: true },
  });
  if (!user) {
    res.status(400).json({ error: { message: 'Invalid or expired invitation link', code: 'INVALID_TOKEN' } });
    return;
  }
  res.json({ valid: true, user });
});

// POST /api/auth/accept-invite
router.post(
  '/accept-invite',
  authLimiter,
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }).matches(/\d/),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { token, password, firstName, lastName } = req.body as {
      token: string; password: string; firstName: string; lastName: string;
    };

    const user = await prisma.user.findFirst({
      where: {
        invitationToken: token,
        invitationExpiresAt: { gt: new Date() },
        status: 'INVITED',
      },
      include: {
        teamMemberships: { include: { team: true } },
      },
    });

    if (!user) {
      res.status(400).json({ error: { message: 'Invalid or expired invitation link', code: 'INVALID_TOKEN' } });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const refreshToken = signRefreshToken(user.id);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName,
        lastName,
        passwordHash,
        status: 'ACTIVE',
        invitationToken: null,
        invitationExpiresAt: null,
        refreshToken,
      },
    });

    await prisma.auditLog.create({
      data: { actorId: user.id, action: 'ACCEPTED_INVITE', targetType: 'User', targetId: user.id },
    });

    const team = user.teamMemberships[0]?.team;
    await emailService.sendWelcome({
      to: updated.email,
      firstName: updated.firstName,
      teamName: team?.name,
      functionalRole: user.teamMemberships[0]?.functionalRole,
    });

    const accessToken = signAccessToken(updated.id, updated.email, updated.role);
    res.json({
      accessToken,
      refreshToken,
      user: {
        id: updated.id, email: updated.email, firstName: updated.firstName,
        lastName: updated.lastName, role: updated.role, status: updated.status,
        photoUrl: updated.photoUrl,
        teams: user.teamMemberships.map((m) => ({
          teamId: m.teamId, teamName: m.team.name,
          functionalRole: m.functionalRole, isTeamLead: m.isTeamLead,
        })),
      },
    });
  }
);

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body as { email: string; password: string };

    const user = await prisma.user.findUnique({
      where: { email },
      include: { teamMemberships: { include: { team: true } } },
    });

    if (!user || !user.passwordHash || user.status === 'SUSPENDED') {
      res.status(401).json({ error: { message: 'Invalid credentials', code: 'UNAUTHORIZED' } });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: { message: 'Invalid credentials', code: 'UNAUTHORIZED' } });
      return;
    }

    const accessToken = signAccessToken(user.id, user.email, user.role);
    const refreshToken = signRefreshToken(user.id);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id, email: user.email, firstName: user.firstName,
        lastName: user.lastName, role: user.role, status: user.status,
        photoUrl: user.photoUrl,
        teams: user.teamMemberships.map((m) => ({
          teamId: m.teamId, teamName: m.team.name, functionalRole: m.functionalRole, isTeamLead: m.isTeamLead,
        })),
      },
    });
  }
);

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    res.status(401).json({ error: { message: 'Refresh token required', code: 'UNAUTHORIZED' } });
    return;
  }
  try {
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.refreshToken !== refreshToken || user.status === 'SUSPENDED') {
      res.status(401).json({ error: { message: 'Invalid refresh token', code: 'UNAUTHORIZED' } });
      return;
    }
    const accessToken = signAccessToken(user.id, user.email, user.role);
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: { message: 'Invalid refresh token', code: 'UNAUTHORIZED' } });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { teamMemberships: { include: { team: true } } },
  });
  if (!user) {
    res.status(404).json({ error: { message: 'User not found', code: 'NOT_FOUND' } });
    return;
  }
  const { passwordHash, refreshToken, invitationToken, ...safe } = user;
  res.json({
    ...safe,
    teams: user.teamMemberships.map((m) => ({
      teamId: m.teamId,
      teamName: m.team.name,
      functionalRole: m.functionalRole,
      isTeamLead: m.isTeamLead,
    })),
  });
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user) {
    await prisma.user.update({ where: { id: req.user.userId }, data: { refreshToken: null } });
  }
  res.json({ message: 'Logged out' });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: {
      teamMemberships: {
        include: { team: { include: { milestones: { include: { milestone: true } } } } },
      },
      mentorAssignments: { include: { team: true } },
    },
  });
  if (!user) {
    res.status(404).json({ error: { message: 'User not found', code: 'NOT_FOUND' } });
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, refreshToken, invitationToken, ...safe } = user;
  res.json(safe);
});

export default router;
