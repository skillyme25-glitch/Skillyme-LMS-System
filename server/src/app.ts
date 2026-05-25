import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/auth';
import adminUserRoutes from './routes/admin/users';
import adminTeamRoutes from './routes/admin/teams';
import adminDashboardRoutes from './routes/admin/dashboard';
import milestoneRoutes from './routes/milestones';
import calendarRoutes from './routes/calendar';
import announcementRoutes from './routes/announcements';
import notificationRoutes from './routes/notifications';
import teamRoutes from './routes/teams';
import profileRoutes from './routes/profile';
import configRoutes from './routes/config';
import applicationRoutes from './routes/applications';

const app = express();

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet());

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Explicit preflight handler MUST come before other middleware
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static uploads ──────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/config', configRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/teams', adminTeamRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/applications', applicationRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ status: 'ok', ts: new Date() }));

// ─── Error handler (must be last) ────────────────────────────────────────────
app.use(errorHandler);

export default app;
