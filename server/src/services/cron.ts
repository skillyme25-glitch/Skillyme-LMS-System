import cron from 'node-cron';
import prisma from '../config/database';
import { emailService } from './email';
import { createNotification } from './notifications';
import { MilestoneStatus } from '@prisma/client';

// 8:00 AM EAT = 5:00 AM UTC
const MORNING_EAT = '0 5 * * *';

export function startCronJobs(): void {
  // JOB 1: Milestone reminder emails (48h before due date)
  cron.schedule(MORNING_EAT, async () => {
    try {
      const now = new Date();
      const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      const milestones = await prisma.milestone.findMany({
        where: { dueDate: { gte: now, lte: in48h } },
        include: {
          teamMilestones: {
            where: {
              status: { notIn: [MilestoneStatus.APPROVED, MilestoneStatus.FLAGGED] },
            },
            include: {
              team: {
                include: {
                  members: { include: { user: true } },
                },
              },
            },
          },
        },
      });

      for (const ms of milestones) {
        for (const tm of ms.teamMilestones) {
          for (const member of tm.team.members) {
            if (member.user.status !== 'ACTIVE') continue;
            await emailService.sendMilestoneReminder({
              to: member.user.email,
              firstName: member.user.firstName,
              teamName: tm.team.name,
              milestoneTitle: ms.title,
              weekNumber: ms.weekNumber,
              dueDate: ms.dueDate,
              teamStatus: tm.status,
              teamId: tm.teamId,
            });
            await createNotification({
              userId: member.userId,
              type: 'MILESTONE_REMINDER',
              title: `Milestone due in 48h: ${ms.title}`,
              body: `Week ${ms.weekNumber} milestone is due ${ms.dueDate.toLocaleDateString()}.`,
              linkUrl: '/team?tab=milestones',
            });
          }
        }
      }
      console.log('[Cron] Milestone reminders sent');
    } catch (err) {
      console.error('[Cron] Milestone reminder error:', err);
    }
  });

  // JOB 2: Session reminder emails (24h before sessions)
  cron.schedule(MORNING_EAT, async () => {
    try {
      const now = new Date();
      const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
      const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

      const sessions = await prisma.calendarEvent.findMany({
        where: {
          eventType: 'SESSION',
          startTime: { gte: in23h, lte: in25h },
        },
      });

      const activeUsers = await prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, email: true, firstName: true },
      });

      for (const session of sessions) {
        for (const user of activeUsers) {
          await emailService.sendSessionReminder({
            to: user.email,
            firstName: user.firstName,
            sessionTitle: session.title,
            startTime: session.startTime,
            description: session.description ?? undefined,
          });
          await createNotification({
            userId: user.id,
            type: 'SESSION_REMINDER',
            title: `Session tomorrow: ${session.title}`,
            body: `Starts at ${session.startTime.toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi' })} EAT.`,
            linkUrl: '/calendar',
          });
        }
      }
      console.log('[Cron] Session reminders sent');
    } catch (err) {
      console.error('[Cron] Session reminder error:', err);
    }
  });

  // JOB 3: Expired invitation cleanup (every hour)
  cron.schedule('0 * * * *', async () => {
    try {
      const expired = await prisma.user.findMany({
        where: {
          status: 'INVITED',
          invitationExpiresAt: { lt: new Date() },
        },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      if (expired.length > 0) {
        console.log(`[Cron] ${expired.length} expired invitations found:`, expired.map((u) => u.email));
        // In production, send a digest to SUPER_ADMIN
      }
    } catch (err) {
      console.error('[Cron] Invitation cleanup error:', err);
    }
  });

  console.log('✅ Cron jobs started');
}
