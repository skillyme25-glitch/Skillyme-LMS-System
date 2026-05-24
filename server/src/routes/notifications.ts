import { Router, Response, Request } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { AuthRequest, AuthPayload } from '../types';
import { addClient, removeClient } from '../services/sseStore';
import { env } from '../config/env';

const router = Router();

// GET /api/notifications/stream (SSE)
// Defined BEFORE router.use(authenticate) so we can handle token via query param
// (EventSource API does not support custom request headers)
router.get('/stream', (req: Request, res: Response): void => {
  let userId: string | null = null;

  // Try Authorization header first
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), env.JWT_ACCESS_SECRET) as AuthPayload;
      userId = payload.userId;
    } catch { /* fall through to query param */ }
  }

  // Fallback: token in query string (sent by EventSource clients)
  if (!userId) {
    const qToken = req.query._token as string | undefined;
    if (qToken) {
      try {
        const payload = jwt.verify(qToken, env.JWT_ACCESS_SECRET) as AuthPayload;
        userId = payload.userId;
      } catch { /* invalid */ }
    }
  }

  if (!userId) {
    res.status(401).json({ error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  res.write(': connected\n\n');

  const uid = userId;
  addClient(uid, res);

  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); }
    catch { clearInterval(heartbeat); }
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeClient(uid, res);
  });
});

// All remaining notification routes require standard JWT auth
router.use(authenticate);

// GET /api/notifications
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const unreadOnly = req.query.unreadOnly === 'true';
  const page = parseInt((req.query.page as string) || '1');
  const limit = parseInt((req.query.limit as string) || '20');

  const where: Record<string, unknown> = { userId: req.user!.userId };
  if (unreadOnly) where.isRead = false;

  const [total, notifications] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where, orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit, take: limit,
    }),
  ]);

  res.json({ data: notifications, meta: { total, page, limit } });
});

// PATCH /api/notifications/read-all  (must come before /:id/read)
router.patch('/read-all', async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.userId, isRead: false },
    data: { isRead: true },
  });
  res.json({ message: 'All marked as read' });
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user!.userId },
    data: { isRead: true },
  });
  res.json({ message: 'Marked as read' });
});

export default router;
