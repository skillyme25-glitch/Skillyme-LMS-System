import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Users, Layers, Target, Megaphone, ClipboardList } from 'lucide-react';

const adminLinks = [
  { to: '/admin/applications', label: 'Applications', icon: <ClipboardList size={15} /> },
  { to: '/admin/participants', label: 'Participants', icon: <Users size={15} /> },
  { to: '/admin/teams', label: 'Teams', icon: <Layers size={15} /> },
  { to: '/admin/milestones', label: 'Milestones', icon: <Target size={15} /> },
  { to: '/admin/announcements', label: 'Announcements', icon: <Megaphone size={15} /> },
];

export default function AdminLayout() {
  const { user } = useAuth();
  if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'FACILITATOR') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex gap-7">
      {/* ── Sidebar — desktop ── */}
      <aside className="hidden md:flex flex-col gap-0.5 w-44 flex-shrink-0 pt-1">
        <p className="label-muted px-3 mb-3">Admin Panel</p>
        {adminLinks.map((l) => (
          <NavLink key={l.to} to={l.to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#EEF2FF] text-[#3730A3] font-semibold'
                  : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
              }`
            }
          >
            {l.icon} {l.label}
          </NavLink>
        ))}
      </aside>

      {/* ── Mobile horizontal tabs ── */}
      <div className="md:hidden -mx-4 mb-5 flex overflow-x-auto border-b border-[#3730A3]/08 px-4">
        {adminLinks.map((l) => (
          <NavLink key={l.to} to={l.to}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-3 text-xs font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors uppercase tracking-wide ${
                isActive
                  ? 'border-[#3730A3] text-[#3730A3]'
                  : 'border-transparent text-[#6B7280]'
              }`
            }
          >
            {l.icon} {l.label}
          </NavLink>
        ))}
      </div>

      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
