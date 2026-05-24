import { Router, Request, Response } from 'express';
import { env } from '../config/env';

const router = Router();

// GET /api/config — public, returns program metadata for frontend display
router.get('/', (_req: Request, res: Response): void => {
  res.json({
    programName: env.PROGRAM_NAME,
    adminEmail: env.ADMIN_EMAIL,
  });
});

export default router;
