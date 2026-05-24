import { Router, Response } from 'express';
import { body } from 'express-validator';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { isAdminOrFacilitator } from '../middleware/roles';
import { validate } from '../middleware/validate';
import { AuthRequest } from '../types';
import { createNotification, notifyAllActive, notifyTeamMembers } from '../services/notifications';
import { emailService } from '../services/email';

const router = Router();
router.use(authenticate);

// GET /api/announcements
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;

  const where: Record<string, unknown> = {};
  if (user.role === 'MEMBER' || user.role === 'MENTOR') {
    const teamIds: string[] = [];
    if (user.role === 'MEMBER') {
      const ms = await prisma.teamMember.findMany({ where: { userId: user.userId }, select: { teamId: true } });
      ms.forEach((m) => teamIds.push(m.teamId));
    } else {
      const ms = await prisma.mentorTeam.findMany({ where: { mentorId: user.userId }, select: { teamId: true } });
      ms.forEach((m) => teamIds.push(m.teamId));
    }
    where.OR = [{ targetAudience: 'ALL' }, { teamId: { in: teamIds } }];
  }

  const announcements = await prisma.announcement.findMany({
    where,
    include: { postedBy: { select: { firstName: true, lastName: true, photoUrl: true } }, team: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(announcements);
});

// POST /api/announcements
router.post(
  '/',
  isAdminOrFacilitator,
  [
    body('title').trim().notEmpty(),
    body('body').trim().notEmpty(),
    body('targetAudience').isIn(['ALL', 'SPECIFIC_TEAM']),
    body('teamId').if(body('targetAudience').equals('SPECIFIC_TEAM')).isUUID(),
  ],
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { title, body: bodyText, targetAudience, teamId } = req.body as {
      title: string; body: string; targetAudience: 'ALL' | 'SPECIFIC_TEAM'; teamId?: string;
    };

    const announcement = await prisma.announcement.create({
      data: {
        title, body: bodyText, targetAudience,
        postedById: req.user!.userId,
        teamId: targetAudience === 'SPECIFIC_TEAM' ? teamId : null,
      },
    });

    // Notifications + emails
    if (targetAudience === 'ALL') {
      const users = await prisma.user.findMany({
        where: { status: 'ACTIVE', id: { not: req.user!.userId } },
        select: { id: true, email: true, firstName: true },
      });
      await Promise.all(
        users.map(async (u) => {
          await createNotification({
            userId: u.id, type: 'ANNOUNCEMENT', title, body: bodyText,
            linkUrl: '/announcements',
          });
          await emailService.sendAnnouncement({ to: u.email, firstName: u.firstName, title, body: bodyText });
        })
      );
    } else if (teamId) {
      const members = await prisma.teamMember.findMany({
        where: { teamId },
        include: { user: { select: { id: true, email: true, firstName: true, status: true } } },
      });
      await Promise.all(
        members
          .filter((m) => m.user.status === 'ACTIVE' && m.userId !== req.user!.userId)
          .map(async (m) => {
            await createNotification({
              userId: m.userId, type: 'ANNOUNCEMENT', title, body: bodyText, linkUrl: '/announcements',
            });
            await emailService.sendAnnouncement({ to: m.user.email, firstName: m.user.firstName, title, body: bodyText });
          })
      );
    }

    res.status(201).json(announcement);
  }
);

// PATCH /api/announcements/:id
router.patch(
  '/:id',
  isAdminOrFacilitator,
  [body('title').optional().trim().notEmpty(), body('body').optional().trim().notEmpty()],
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const announcement = await prisma.announcement.findUnique({ where: { id: req.params.id } });
    if (!announcement) {
      res.status(404).json({ error: { message: 'Announcement not found', code: 'NOT_FOUND' } });
      return;
    }

    if (
      req.user!.role !== 'SUPER_ADMIN' &&
      announcement.postedById !== req.user!.userId
    ) {
      res.status(403).json({ error: { message: 'Access denied', code: 'FORBIDDEN' } });
      return;
    }

    const updated = await prisma.announcement.update({
      where: { id: req.params.id },
      data: {
        ...(req.body.title && { title: req.body.title }),
        ...(req.body.body && { body: req.body.body }),
      },
    });
    res.json(updated);
  }
);

// DELETE /api/announcements/:id
router.delete('/:id', isAdminOrFacilitator, async (req: AuthRequest, res: Response): Promise<void> => {
  const announcement = await prisma.announcement.findUnique({ where: { id: req.params.id } });
  if (!announcement) {
    res.status(404).json({ error: { message: 'Announcement not found', code: 'NOT_FOUND' } });
    return;
  }
  if (req.user!.role !== 'SUPER_ADMIN' && announcement.postedById !== req.user!.userId) {
    res.status(403).json({ error: { message: 'Access denied', code: 'FORBIDDEN' } });
    return;
  }
  await prisma.announcement.delete({ where: { id: req.params.id } });
  res.json({ message: 'Announcement deleted' });
});

export default router;
