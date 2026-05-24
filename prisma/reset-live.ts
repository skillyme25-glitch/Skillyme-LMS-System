/**
 * Resets all program data but keeps the SUPER_ADMIN account.
 * Run with: npm run db:reset-live
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('⚠️  Resetting all program data (keeping SUPER_ADMIN accounts)...');

  await prisma.teamPost.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.teamMilestone.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.mentorTeam.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.user.deleteMany({ where: { role: { not: 'SUPER_ADMIN' } } });

  console.log('✅ Reset complete. Only SUPER_ADMIN accounts remain.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
