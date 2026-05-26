import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/api/endpoints';
import { authStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import type { FunctionalRole } from '@/types';
import Navbar from './Navbar';

export default function Layout() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sessionExpired, setSessionExpired] = useState(false);

  // Keep auth store teams fresh so Dashboard + Team page always reflect DB state
  const { data: meData } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => authApi.me(),
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!meData?.data) return;
    const m = meData.data;
    const teams = m.teamMemberships?.map((mb) => ({
      teamId: mb.teamId,
      teamName: mb.team?.name ?? '',
      functionalRole: mb.functionalRole as FunctionalRole,
      isTeamLead: mb.isTeamLead,
    })) ?? [];
    const stored = authStore.getUser();
    if (stored) authStore.setUser({ ...stored, teams });
  }, [meData]);

  // Listen for session expiry dispatched by the axios interceptor.
  // Replaces the old window.location.href hard reload with an in-app screen.
  useEffect(() => {
    const handle = () => {
      queryClient.cancelQueries();
      queryClient.clear();
      authStore.clearAuth();
      setSessionExpired(true);
    };
    window.addEventListener('auth:session-expired', handle);
    return () => window.removeEventListener('auth:session-expired', handle);
  }, [queryClient]);

  if (sessionExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="text-center px-6 max-w-sm w-full animate-fade-in">
          <div className="w-16 h-16 bg-[#E8FAF6] rounded-2xl flex items-center justify-center mx-auto mb-5">
            <LogIn size={26} className="text-[#1DB89A]" />
          </div>
          <h2 className="font-heading text-2xl text-[#1A1A2E] mb-2">Session expired</h2>
          <p className="text-[#64748B] text-sm leading-relaxed mb-6">
            Your session timed out after a period of inactivity.<br />Please log in again to continue.
          </p>
          <Button className="w-full" onClick={() => navigate('/login')}>
            Log in again
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 bg-[#1DB89A] rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg font-heading">S</span>
          </div>
          <div className="w-5 h-5 border-2 border-[#1DB89A] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar />
      <main
        key={location.pathname}
        className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-7 page-fade"
      >
        <Outlet />
      </main>
    </div>
  );
}
