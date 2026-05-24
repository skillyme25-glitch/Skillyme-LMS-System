import { Response } from 'express';

interface SSEClient {
  userId: string;
  res: Response;
}

const clients: SSEClient[] = [];

export function addClient(userId: string, res: Response): void {
  clients.push({ userId, res });
}

export function removeClient(userId: string, res: Response): void {
  const idx = clients.findIndex((c) => c.userId === userId && c.res === res);
  if (idx !== -1) clients.splice(idx, 1);
}

export function sendToUser(userId: string, event: { type: string; data: unknown }): void {
  clients
    .filter((c) => c.userId === userId)
    .forEach((c) => {
      try {
        c.res.write(`data: ${JSON.stringify(event)}\n\n`);
      } catch {
        // client disconnected
      }
    });
}

export function broadcastHeartbeat(): void {
  clients.forEach((c) => {
    try {
      c.res.write(': heartbeat\n\n');
    } catch {
      // ignore
    }
  });
}
