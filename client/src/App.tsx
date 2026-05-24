import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import Layout from '@/components/layout/Layout';
import Login from '@/pages/Login';
import AcceptInvite from '@/pages/AcceptInvite';
import Dashboard from '@/pages/Dashboard';
import TeamPage from '@/pages/Team';
import CalendarPage from '@/pages/Calendar';
import NotificationsPage from '@/pages/Notifications';
import ProfilePage from '@/pages/Profile';
import AdminLayout from '@/pages/admin/AdminLayout';
import ParticipantsPage from '@/pages/admin/Participants';
import TeamsAdminPage from '@/pages/admin/Teams';
import MilestonesAdminPage from '@/pages/admin/Milestones';
import AnnouncementsAdminPage from '@/pages/admin/Announcements';
import ApplicationsPage from '@/pages/admin/Applications';
import ApplyPage from '@/pages/Apply';

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
