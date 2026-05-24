import { Router, Response } from 'express';
import { body } from 'express-validator';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AuthRequest } from '../types';
import { env } from '../config/env';

const router = Router();
router.use(authenticate);

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, env.UPLOAD_DIR),
  filename: (_, file, cb) => cb(null, `avatar-${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  limits: { fileSize: env.MAX_UPLOAD_SIZE },
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
});

// GET /api/profile
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: {
      teamMemberships: {
        include: {
          team: {
            include: {
              milestones: { include: { milestone: true } },
            },
          },
        },
      },
      mentorAssignments: { include: { team: true } },
    },
  });
  if (!user) {
    res.status(404).json({ error: { message: 'Not found', code: 'NOT_FOUND' } });
    return;
  }
  const { passwordHash, refreshToken, invitationToken, ...safe } = user;
  res.json(safe);
});

// PATCH /api/profile
router.patch(
  '/',
  upload.single('photo'),
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('phone').optional().isMobilePhone('any'),
    body('linkedinUrl').optional().isURL(),
  ],
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { firstName, lastName, phone, linkedinUrl } = req.body as {
      firstName?: string; lastName?: string; phone?: string; linkedinUrl?: string;
    };

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updated = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(linkedinUrl !== undefined && { linkedinUrl }),
        ...(photoUrl && { photoUrl }),
      },
    });

    const { passwordHash, refreshToken, invitationToken, ...safe } = updated;
    res.json(safe);
  }
);

// PATCH /api/profile/password
router.patch(
  '/password',
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }).matches(/\d/),
  ],
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string; newPassword: string;
    };

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user || !user.passwordHash) {
      res.status(400).json({ error: { message: 'Cannot update password', code: 'BAD_REQUEST' } });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: { message: 'Current password is incorrect', code: 'UNAUTHORIZED' } });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });
    res.json({ message: 'Password updated' });
  }
);

export default router;
