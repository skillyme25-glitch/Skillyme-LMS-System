import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Error]', err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        error: { message: 'A record with this value already exists', code: 'CONFLICT', details: err.meta },
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        error: { message: 'Record not found', code: 'NOT_FOUND' },
      });
      return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      error: { message: 'Invalid data provided', code: 'VALIDATION_ERROR' },
    });
    return;
  }

  const status = (err as { status?: number }).status || 500;
  res.status(status).json({
    error: {
      message: status === 500 ? 'Internal server error' : err.message,
      code: status === 500 ? 'INTERNAL_ERROR' : 'ERROR',
    },
  });
}
