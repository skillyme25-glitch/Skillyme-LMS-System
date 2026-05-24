import { Router, Response, Request } from 'express';
import { body, query } from 'express-validator';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { isAdminOrFacilitator } from '../middleware/roles';
import { validate } from '../middleware/validate';
import { AuthRequest } from '../types';
import { notifyAllActive } from '../services/notifications';

const router = Router();
router.use(authenticate);

function generateIcs(event: {
  title: string; description?: string | null;
  startTime: Date; endTime: Date; id: string;
}): string {
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace('.000', '');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Skillyme Africa//LMS//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@skillyme.africa`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(event.startTime)}`,
    `DTEND:${fmt(event.endTime)}`,
    `SUMMARY:${event.title}`,
    event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

// GET /api/calendar
router.get(
  '/',
  [query('from').optional().isISO8601(), query('to').optional().isISO8601()],
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { from, to } = req.query as { from?: string; to?: string };
    const user = req.user!;

    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    let where: Record<string, unknown> = {};
    if (Object.keys(dateFilter).length) where.startTime = dateFilter;

    if (user.role === 'MEMBER' || user.role === 'MENTOR') {
      const teamIds: string[] = [];
      if (user.role === 'MEMBER') {
        const memberships = await prisma.teamMember.findMany({ where: { userId: user.userId }, select: { teamId: true } });
        memberships.forEach((m) => teamIds.push(m.teamId));
      } else {
        const assignments = await prisma.mentorTeam.findMany({ where: { mentorId: user.userId }, select: { teamId: true } });
        assignments.forEach((a) => teamIds.push(a.teamId));
      }
      where = {
        ...where,
        OR: [{ isAllTeams: true }, { teamId: { in: teamIds } }],
      };
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      include: { createdBy: { select: { firstName: true, lastName: true } }, team: { select: { name: true } } },
      orderBy: { startTime: 'asc' },
    });

    res.json(events);
  }
);

// POST /api/calendar
router.post(
  '/',
  isAdminOrFacilitator,
  [
    body('title').trim().notEmpty(),
    body('startTime').isISO8601(),
    body('endTime').isISO8601(),
    body('eventType').isIn(['SESSION', 'MILESTONE_DEADLINE', 'TEAM_EVENT', 'PROGRAM_EVENT']),
    body('isAllTeams').isBoolean(),
  ],
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { title, description, startTime, endTime, eventType, isAllTeams, teamId, googleCalendarLink } = req.body as {
      title: string; description?: string; startTime: string; endTime: string;
      eventType: string; isAllTeams: boolean; teamId?: string; googleCalendarLink?: string;
    };

    const event = await prisma.calendarEvent.create({
      data: {
        title, description,
        startTime: new Date(startTime), endTime: new Date(endTime),
        eventType: eventType as Parameters<typeof prisma.calendarEvent.create>[0]['data']['eventType'],
        isAllTeams,
        teamId: isAllTeams ? null : teamId,
        createdById: req.user!.userId,
        googleCalendarLink,
      },
    });

    if (isAllTeams) {
      await notifyAllActive({
        type: 'SESSION_REMINDER',
        title: `New event: ${title}`,
        body: `${new Date(startTime).toLocaleDateString()} — ${title}`,
        linkUrl: '/calendar',
        excludeUserId: req.user!.userId,
      });
    }

    res.status(201).json(event);
  }
);

// PATCH /api/calendar/:id
router.patch(
  '/:id',
  isAdminOrFacilitator,
  [
    body('startTime').optional().isISO8601(),
    body('endTime').optional().isISO8601(),
  ],
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { title, description, startTime, endTime, eventType, isAllTeams, teamId, googleCalendarLink } = req.body as {
      title?: string; description?: string; startTime?: string; endTime?: string;
      eventType?: string; isAllTeams?: boolean; teamId?: string; googleCalendarLink?: string;
    };

    const event = await prisma.calendarEvent.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(eventType && { eventType: eventType as Parameters<typeof prisma.calendarEvent.update>[0]['data']['eventType'] }),
        ...(isAllTeams !== undefined && { isAllTeams }),
        ...(teamId !== undefined && { teamId }),
        ...(googleCalendarLink !== undefined && { googleCalendarLink }),
      },
    });
    res.json(event);
  }
);

// DELETE /api/calendar/:id
router.delete('/:id', isAdminOrFacilitator, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.calendarEvent.delete({ where: { id: req.params.id } });
  res.json({ message: 'Event deleted' });
});

// GET /api/calendar/:id/ics
router.get('/:id/ics', async (req: Request, res: Response): Promise<void> => {
  const event = await prisma.calendarEvent.findUnique({ where: { id: req.params.id } });
  if (!event) {
    res.status(404).json({ error: { message: 'Event not found', code: 'NOT_FOUND' } });
    return;
  }
  const ics = generateIcs(event);
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${event.title.replace(/[^a-z0-9]/gi, '_')}.ics"`);
  res.send(ics);
});

export default router;
