import api from './client';
import type {
  User, Team, Milestone, TeamMilestone, CalendarEvent,
  Announcement, Notification, TeamPost, DashboardStats, PaginatedResponse,
  Application,
} from '../types';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  validateToken: (token: string) =>
    api.get<{ valid: boolean; user: Partial<User> }>(`/auth/validate-token?token=${token}`),
  acceptInvite: (body: { token: string; password: string; firstName: string; lastName: string }) =>
    api.post('/auth/accept-invite', body),
  login: (body: { email: string; password: string }) => api.post('/auth/login', body),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<User>('/auth/me'),
};

// ─── Config ───────────────────────────────────────────────────────────────────
export const configApi = {
  get: () => api.get<{ programName: string; adminEmail: string }>('/config'),
};

// ─── Admin Users ──────────────────────────────────────────────────────────────
export const adminUsersApi = {
  list: (params?: Record<string, string>) => api.get<PaginatedResponse<User>>('/admin/users', { params }),
  invite: (body: Record<string, unknown>) => api.post('/admin/users/invite', body),
  bulkInvite: (body: unknown[]) => api.post('/admin/users/invite/bulk', body),
  update: (id: string, body: Record<string, unknown>) => api.patch(`/admin/users/${id}`, body),
  suspend: (id: string) => api.patch(`/admin/users/${id}/suspend`),
  revokeInvite: (id: string) => api.delete(`/admin/users/${id}/revoke-invite`),
  delete: (id: string) => api.delete(`/admin/users/${id}`),
};

// ─── Admin Teams ──────────────────────────────────────────────────────────────
export const adminTeamsApi = {
  list: () => api.get<Team[]>('/admin/teams'),
  get: (id: string) => api.get<Team>(`/admin/teams/${id}`),
  create: (body: Record<string, unknown>) => api.post<Team>('/admin/teams', body),
  update: (id: string, body: Record<string, unknown>) => api.patch<Team>(`/admin/teams/${id}`, body),
  delete: (id: string) => api.delete(`/admin/teams/${id}`),
  addMember: (teamId: string, body: Record<string, unknown>) => api.post(`/admin/teams/${teamId}/members`, body),
  removeMember: (teamId: string, userId: string) => api.delete(`/admin/teams/${teamId}/members/${userId}`),
  addMentor: (teamId: string, body: { mentorId: string }) => api.post(`/admin/teams/${teamId}/mentors`, body),
  removeMentor: (teamId: string, mentorId: string) => api.delete(`/admin/teams/${teamId}/mentors/${mentorId}`),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  stats: () => api.get<DashboardStats>('/admin/dashboard'),
};

// ─── Milestones ───────────────────────────────────────────────────────────────
export const milestonesApi = {
  list: () => api.get<Milestone[]>('/milestones'),
  create: (body: Record<string, unknown>) => api.post<Milestone>('/milestones', body),
  update: (id: string, body: Record<string, unknown>) => api.patch<Milestone>(`/milestones/${id}`, body),
  delete: (id: string) => api.delete(`/milestones/${id}`),
  teamMilestones: (teamId: string) => api.get<TeamMilestone[]>(`/teams/${teamId}/milestones`),
  submit: (teamId: string, milestoneId: string, body: { submissionNote?: string; answers?: Record<string, string> }) =>
    api.patch(`/teams/${teamId}/milestones/${milestoneId}/submit`, body),
  review: (teamId: string, milestoneId: string, body: { status: string; facilitatorNote?: string }) =>
    api.patch(`/teams/${teamId}/milestones/${milestoneId}/review`, body),
};

// ─── Calendar ─────────────────────────────────────────────────────────────────
export const calendarApi = {
  list: (params?: { from?: string; to?: string }) => api.get<CalendarEvent[]>('/calendar', { params }),
  create: (body: Record<string, unknown>) => api.post<CalendarEvent>('/calendar', body),
  update: (id: string, body: Record<string, unknown>) => api.patch<CalendarEvent>(`/calendar/${id}`, body),
  delete: (id: string) => api.delete(`/calendar/${id}`),
  icsUrl: (id: string) => `/api/calendar/${id}/ics`,
};

// ─── Announcements ────────────────────────────────────────────────────────────
export const announcementsApi = {
  list: () => api.get<Announcement[]>('/announcements'),
  create: (body: Record<string, unknown>) => api.post<Announcement>('/announcements', body),
  update: (id: string, body: Record<string, unknown>) => api.patch<Announcement>(`/announcements/${id}`, body),
  delete: (id: string) => api.delete(`/announcements/${id}`),
};

// ─── Teams (member-accessible) ───────────────────────────────────────────────
export const teamsApi = {
  get: (id: string) => api.get<Team>(`/teams/${id}`),
};

// ─── Team Posts ───────────────────────────────────────────────────────────────
export const postsApi = {
  list: (teamId: string, page = 1) =>
    api.get<PaginatedResponse<TeamPost>>(`/teams/${teamId}/posts`, { params: { page } }),
  create: (teamId: string, formData: FormData) =>
    api.post<TeamPost>(`/teams/${teamId}/posts`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (teamId: string, postId: string) => api.delete(`/teams/${teamId}/posts/${postId}`),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  list: (params?: { unreadOnly?: boolean; page?: number }) =>
    api.get<PaginatedResponse<Notification>>('/notifications', { params }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// ─── Applications ─────────────────────────────────────────────────────────────
export const applicationsApi = {
  submit: (body: Record<string, unknown>) => api.post('/applications', body),
  adminList: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<Application>>('/applications/admin', { params }),
  adminGet: (id: string) => api.get<Application>(`/applications/admin/${id}`),
  adminUpdate: (id: string, body: { status?: string; adminScore?: number; adminNotes?: string }) =>
    api.patch<Application>(`/applications/admin/${id}`, body),
  adminAccept: (id: string) =>
    api.post<{ message: string; userId: string; tempPassword: string; teammateResults?: Array<{ email: string; success: boolean; error?: string }> }>(`/applications/admin/${id}/accept`),
  adminStats: () =>
    api.get<{ total: number; pending: number; shortlisted: number; accepted: number; rejected: number; waitlisted: number }>('/applications/admin-stats'),
};

// ─── Profile ──────────────────────────────────────────────────────────────────
export const profileApi = {
  get: () => api.get<User>('/profile'),
  update: (formData: FormData) =>
    api.patch<User>('/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    api.patch('/profile/password', body),
};
