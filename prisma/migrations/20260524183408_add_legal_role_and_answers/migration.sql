-- AlterEnum
ALTER TYPE "FunctionalRole" ADD VALUE 'LEGAL';

-- AlterTable
ALTER TABLE "team_milestones" ADD COLUMN     "answers" JSONB;
