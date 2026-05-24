import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthRequest } from '../types';

export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: { message: 'Insufficient permissions', code: 'FORBIDDEN' } });
      return;
    }
    next();
  };
}

export const isAdmin = requireRole('SUPER_ADMIN');
export const isAdminOrFacilitator = requireRole('SUPER_ADMIN', 'FACILITATOR');
export const isAnyRole = requireRole('SUPER_ADMIN', 'FACILITATOR', 'MENTOR', 'MEMBER');
