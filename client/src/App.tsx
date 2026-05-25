import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import Layout from '@/components/layout/Layout';

const Login            = lazy(() => import('@/pages/Login'));
const AcceptInvite     = lazy(() => import('@/pages/AcceptInvite'));
const ApplyPage        = lazy(() => import('@/pages/Apply'));
const Dashboard        = lazy(() => import('@/pages/Dashboard'));
const TeamPage         = lazy(() => import('@/pages/Team'));
const CalendarPage     = lazy(() => import('@/pages/Calendar'));
const NotificationsPage= lazy(() => import('@/pages/Notifications'));
const ProfilePage      = lazy(() => import('@/pages/Profile'));
const AdminLayout      = lazy(() => import('@/pages/admin/AdminLayout'));
const ParticipantsPage = lazy(() => import('@/pages/admin/Participants'));
const TeamsAdminPage   = lazy(() => import('@/pages/admin/Teams'));
const MilestonesAdminPage    = lazy(() => import('@/pages/admin/Milestones'));
const AnnouncementsAdminPage = lazy(() => import('@/pages/admin/Announcements'));
const ApplicationsPage = lazy(() => import('@/pages/admin/Applications'));

function PageSpinner() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-7 h-7 border-2 border-[#3730A3] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />
            <Route path="/apply" element={<ApplyPage />} />

            {/* Protected (requires auth) */}
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile" element={<ProfilePage />} />

              {/* Admin sub-routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/participants" replace />} />
                <Route path="participants" element={<ParticipantsPage />} />
                <Route path="teams" element={<TeamsAdminPage />} />
                <Route path="milestones" element={<MilestonesAdminPage />} />
                <Route path="announcements" element={<AnnouncementsAdminPage />} />
                <Route path="applications" element={<ApplicationsPage />} />
              </Route>
            </Route>

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '10px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#0284C7', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  );
}
