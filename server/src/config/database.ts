import { PrismaClient } from '@prisma/client';

// Neon free tier allows ~10 connections; cap Prisma's pool to avoid exhaustion
function buildUrl(): string {
  const url = process.env.DATABASE_URL ?? '';
  if (!url || url.includes('connection_limit')) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}connection_limit=3&pool_timeout=20`;
}

const prisma = new PrismaClient({
  datasources: { db: { url: buildUrl() } },
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export default prisma;
