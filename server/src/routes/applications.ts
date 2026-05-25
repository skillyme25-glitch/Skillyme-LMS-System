import { Router, Request, Response } from 'express';
import { body, query } from 'express-validator';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { isAdminOrFacilitator, isAdmin } from '../middleware/roles';
import { validate } from '../middleware/validate';
import { AuthRequest } from '../types';
import bcrypt from 'bcryptjs';

const router = Router();

const FUNCTIONAL_ROLES = ['BUILDER', 'COMMERCIAL', 'GROWTH', 'PRODUCT', 'DOMAIN_EXPERT', 'DESIGN', 'LEGAL'];
const STAGE_GROUPS = ['IDEA_STAGE', 'EARLY_BUILDER', 'EARLY_TRACTION'];

function generateTempPassword(): string {
  const adjectives = ['Bold', 'Swift', 'Keen', 'Sharp', 'Prime', 'Bright', 'Forge'];
  const nouns = ['Build', 'Pitch', 'Ship', 'Launch', 'Grow', 'Scale', 'Close'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return `${adj}${noun}${num}!`;
}

// POST /api/applications — public
router.post(
  '/',
  [
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('phone').optional().trim(),
    body('location').optional().trim(),
    body('employmentStatus').optional().trim(),
    body('workLink').optional().trim(),
    body('stageGroup').optional().isIn(STAGE_GROUPS),
    body('applyingAs').optional().isIn(['INDIVIDUAL', 'PRE_FORMED_TEAM', 'HARDSHIP']),
    body('primaryRole').isIn(FUNCTIONAL_ROLES),
    body('ideaDescription').optional().trim(),
    body('customerInsight').optional().trim(),
    body('ideaOwnership').optional().trim(),
    body('canCommit').optional().trim(),
    body('sessionPreference').optional(),
    body('hoursPerWeek').optional().trim(),
    body('commitment').optional().trim(),
    body('teammateInfo').optional(),
    body('hardshipReason').optional().trim(),
    body('referralSource').optional().trim(),
    body('additionalInfo').optional().trim(),
    body('confirmedTerms').optional().isBoolean(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const b = req.body as Record<string, unknown>;

    const existing = await prisma.application.findUnique({ where: { email: b.email as string } });
    if (existing) {
      res.status(409).json({ error: { message: 'An application with this email already exists.', code: 'CONFLICT' } });
      return;
    }

    const app = await prisma.application.create({
      data: {
        firstName: b.firstName as string,
        lastName: b.lastName as string,
        email: b.email as string,
        phone: b.phone as string | undefined,
        location: b.location as string | undefined,
        employmentStatus: b.employmentStatus as string | undefined,
        workLink: (b.workLink as string) || undefined,
        stageGroup: ((b.stageGroup as string) || 'IDEA_STAGE') as Parameters<typeof prisma.application.create>[0]['data']['stageGroup'],
        applyingAs: ((b.applyingAs as string) ?? 'INDIVIDUAL') as Parameters<typeof prisma.application.create>[0]['data']['applyingAs'],
        primaryRole: b.primaryRole as Parameters<typeof prisma.application.create>[0]['data']['primaryRole'],
        ideaDescription: b.ideaDescription as string | undefined,
        customerInsight: b.customerInsight as string | undefined,
        ideaOwnership: b.ideaOwnership as string | undefined,
        canCommit: b.canCommit as string | undefined,
        sessionPreference: b.sessionPreference ?? undefined,
        hoursPerWeek: b.hoursPerWeek as string | undefined,
        commitment: b.commitment as string | undefined,
        teammateInfo: b.teammateInfo ?? undefined,
        hardshipReason: b.hardshipReason as string | undefined,
        referralSource: b.referralSource as string | undefined,
        additionalInfo: b.additionalInfo as string | undefined,
        confirmedTerms: (b.confirmedTerms as boolean) ?? false,
      },
    });

    // Send confirmation email (async — don't block response)
    const { emailService } = await import('../services/email');
    emailService.sendApplicationConfirmation({ to: app.email, firstName: app.firstName }).catch(console.error);

    res.status(201).json({ message: 'Application submitted successfully!', id: app.id });
  }
);

// ─── Admin routes ──────────────────────────────────────────────────────────────

// GET /api/applications/admin-stats
router.get(
  '/admin-stats',
  authenticate, isAdminOrFacilitator,
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const [total, pending, shortlisted, accepted, rejected, waitlisted] = await Promise.all([
      prisma.application.count(),
      prisma.application.count({ where: { status: 'PENDING' } }),
      prisma.application.count({ where: { status: 'SHORTLISTED' } }),
      prisma.application.count({ where: { status: 'ACCEPTED' } }),
      prisma.application.count({ where: { status: 'REJECTED' } }),
      prisma.application.count({ where: { status: 'WAITLISTED' } }),
    ]);
    res.json({ total, pending, shortlisted, accepted, rejected, waitlisted });
  }
);

// GET /api/applications/admin
router.get(
  '/admin',
  authenticate, isAdminOrFacilitator,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const page = parseInt((req.query.page as string) || '1');
    const limit = parseInt((req.query.limit as string) || '25');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.stageGroup) where.stageGroup = req.query.stageGroup;
    if (req.query.primaryRole) where.primaryRole = req.query.primaryRole;
    if (req.query.applyingAs) where.applyingAs = req.query.applyingAs;

    const [total, apps] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
        include: { reviewedBy: { select: { firstName: true, lastName: true } } },
      }),
    ]);

    res.json({ data: apps, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
  }
);

// GET /api/applications/admin/:id
router.get(
  '/admin/:id',
  authenticate, isAdminOrFacilitator,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const app = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: { reviewedBy: { select: { firstName: true, lastName: true } } },
    });
    if (!app) {
      res.status(404).json({ error: { message: 'Not found', code: 'NOT_FOUND' } });
      return;
    }
    res.json(app);
  }
);

// PATCH /api/applications/admin/:id
router.patch(
  '/admin/:id',
  authenticate, isAdminOrFacilitator,
  [
    body('status').optional().isIn(['PENDING', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'WAITLISTED']),
    body('adminScore').optional().isInt({ min: 1, max: 10 }),
    body('adminNotes').optional().isString(),
  ],
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { status, adminScore, adminNotes } = req.body as {
      status?: string; adminScore?: number; adminNotes?: string;
    };
    const app = await prisma.application.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status: status as Parameters<typeof prisma.application.update>[0]['data']['status'] }),
        ...(adminScore !== undefined && { adminScore }),
        ...(adminNotes !== undefined && { adminNotes }),
        ...(status && { reviewedAt: new Date(), reviewedById: req.user!.userId }),
      },
    });
    res.json(app);
  }
);

// POST /api/applications/admin/:id/accept — accept + create accounts + email credentials
router.post(
  '/admin/:id/accept',
  authenticate, isAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const app = await prisma.application.findUnique({ where: { id: req.params.id } });
    if (!app) {
      res.status(404).json({ error: { message: 'Not found', code: 'NOT_FOUND' } });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email: app.email } });
    if (existing) {
      res.status(409).json({ error: { message: 'A user with this email already exists', code: 'CONFLICT' } });
      return;
    }

    const { emailService } = await import('../services/email');
    const { env } = await import('../config/env');

    // ─── Create primary applicant account ─────────────────────────────────────
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const user = await prisma.user.create({
      data: {
        email: app.email,
        firstName: app.firstName,
        lastName: app.lastName,
        phone: app.phone,
        role: 'MEMBER',
        status: 'ACTIVE',
        passwordHash,
      },
    });

    // ─── If pre-formed team: create accounts for all teammates too ─────────────
    const teammates: Array<{ firstName: string; lastName: string; email: string; primaryRole?: string }> =
      app.applyingAs === 'PRE_FORMED_TEAM' && Array.isArray(app.teammateInfo)
        ? (app.teammateInfo as Array<{ firstName: string; lastName: string; email: string; primaryRole?: string }>)
        : [];

    const teammateResults: Array<{ email: string; success: boolean; tempPassword?: string; error?: string }> = [];
    const createdTeammateIds: string[] = [];

    for (const tm of teammates) {
      if (!tm.email || !tm.firstName) continue;
      try {
        const tmExists = await prisma.user.findUnique({ where: { email: tm.email } });
        if (tmExists) {
          teammateResults.push({ email: tm.email, success: false, error: 'Email already exists' });
          continue;
        }
        const tmPass = generateTempPassword();
        const tmHash = await bcrypt.hash(tmPass, 12);
        const tmUser = await prisma.user.create({
          data: {
            email: tm.email,
            firstName: tm.firstName,
            lastName: tm.lastName,
            role: 'MEMBER',
            status: 'ACTIVE',
            passwordHash: tmHash,
          },
        });
        createdTeammateIds.push(tmUser.id);
        // Send acceptance email to teammate
        emailService.sendAcceptanceWithCredentials({
          to: tm.email, firstName: tm.firstName, tempPassword: tmPass,
        }).catch(console.error);
        teammateResults.push({ email: tm.email, success: true, tempPassword: tmPass });
      } catch (err) {
        teammateResults.push({ email: tm.email, success: false, error: String(err) });
      }
    }

    // ─── Auto-create a team for pre-formed group applications ─────────────────
    let autoTeamId: string | undefined;
    if (app.applyingAs === 'PRE_FORMED_TEAM') {
      const team = await prisma.team.create({
        data: {
          name: `${app.firstName} ${app.lastName}'s Team`,
          stageGroup: app.stageGroup as Parameters<typeof prisma.team.create>[0]['data']['stageGroup'],
          productDescription: app.ideaDescription || undefined,
        },
      });
      autoTeamId = team.id;

      // Primary applicant → team lead with their declared functional role
      await prisma.teamMember.create({
        data: {
          userId: user.id,
          teamId: team.id,
          functionalRole: app.primaryRole as Parameters<typeof prisma.teamMember.create>[0]['data']['functionalRole'],
          isTeamLead: true,
        },
      });

      // Teammates → default BUILDER role (admin can reassign from Participants page)
      for (const tmId of createdTeammateIds) {
        await prisma.teamMember.create({
          data: { userId: tmId, teamId: team.id, functionalRole: 'BUILDER' },
        });
      }
    }

    // ─── Update application status ─────────────────────────────────────────────
    await prisma.application.update({
      where: { id: req.params.id },
      data: { status: 'ACCEPTED', reviewedAt: new Date(), reviewedById: req.user!.userId },
    });

    // ─── Send acceptance email to primary applicant ────────────────────────────
    emailService.sendAcceptanceWithCredentials({
      to: app.email, firstName: app.firstName, tempPassword,
    }).catch(console.error);

    await prisma.auditLog.create({
      data: { actorId: req.user!.userId, action: 'ACCEPTED_APPLICATION', targetType: 'Application', targetId: app.id },
    });

    res.json({
      message: 'Application accepted — account created and credentials emailed',
      userId: user.id,
      tempPassword,
      teammateResults: teammateResults.length > 0 ? teammateResults : undefined,
      autoTeamId,
    });
  }
);

export default router;
