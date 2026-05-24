-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'WAITLISTED');

-- CreateEnum
CREATE TYPE "ApplyingAs" AS ENUM ('INDIVIDUAL', 'PRE_FORMED_TEAM');

-- CreateEnum
CREATE TYPE "PricingTier" AS ENUM ('INDIVIDUAL', 'GROUP', 'HARDSHIP');

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "location" TEXT,
    "linkedinUrl" TEXT,
    "portfolioUrl" TEXT,
    "stageGroup" "StageGroup" NOT NULL,
    "applyingAs" "ApplyingAs" NOT NULL DEFAULT 'INDIVIDUAL',
    "primaryRole" "FunctionalRole" NOT NULL,
    "secondaryRole" "FunctionalRole",
    "ideaSummary" TEXT,
    "problemStatement" TEXT,
    "targetCustomer" TEXT,
    "availability" TEXT,
    "commitment" TEXT,
    "pricingTier" "PricingTier" NOT NULL DEFAULT 'INDIVIDUAL',
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "adminScore" INTEGER,
    "adminNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "applications_email_key" ON "applications"("email");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
