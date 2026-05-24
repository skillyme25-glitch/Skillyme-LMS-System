import { NotificationType } from '@prisma/client';
import prisma from '../config/database';
import { sendToUser } from './sseStore';

export async function createNotification(opts: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl?: string;
}): Promise<void> {
  const notification = await prisma.notification.create({
    data: {
      userId: opts.userId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      linkUrl: opts.linkUrl,
    },
  });

  sendToUser(opts.userId, { type: 'new_notification', data: notification });
}

export async function notifyAllActive(opts: {
  type: NotificationType;
  title: string;
  body: string;
  linkUrl?: string;
  excludeUserId?: string;
}): Promise<void> {
  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE', id: { not: opts.excludeUserId } },
    select: { id: true },
  });

  await Promise.all(
    users.map((u) => createNotification({ ...opts, userId: u.id }))
  );
}

export async function notifyTeamMembers(opts: {
  teamId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl?: string;
  excludeUserId?: string;
}): Promise<void> {
  const members = await prisma.teamMember.findMany({
    where: { teamId: opts.teamId },
    include: { user: { select: { id: true, status: true } } },
  });

  await Promise.all(
    members
      .filter((m) => m.user.status === 'ACTIVE' && m.userId !== opts.excludeUserId)
      .map((m) =>
        createNotification({
          userId: m.userId,
          type: opts.type,
          title: opts.title,
          body: opts.body,
          linkUrl: opts.linkUrl,
        })
      )
  );
}
