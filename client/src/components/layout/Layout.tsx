import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Navbar from './Navbar';

export default function Layout() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7FF]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 bg-[#3730A3] rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg font-heading">S</span>
          </div>
          <div className="w-5 h-5 border-2 border-[#3730A3] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
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
