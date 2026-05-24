import { Role } from '@prisma/client';
import { Request } from 'express';

export interface AuthPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface ApiError {
  message: string;
  code: string;
  details?: unknown;
}

export type SSEClient = {
  userId: string;
  res: import('express').Response;
};
