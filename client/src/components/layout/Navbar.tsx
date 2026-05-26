import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Bell, Users, Settings, LogOut, User, ChevronDown, X, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authStore } from '@/store/authStore';
import { authApi, configApi } from '@/api/endpoints';
import { initials } from '@/lib/utils';
import NotificationBell from './NotificationBell';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { resetRedirectGuard } from '@/api/client';

type NavItem = { to: string; label: string; icon: React.ReactNode };

function navLinks(role: string): NavItem[] {
  const common: NavItem[] = [
    { to: '/dashboard',     label: 'Dashboard',     icon: <LayoutDashboard size={14} /> },
    { to: '/calendar',      label: 'Calendar',      icon: <Calendar size={14} /> },
    { to: '/notifications', label: 'Notifications', icon: <Bell size={14} /> },
  ];
  if (role === 'MEMBER' || role === 'MENTOR') {
    return [...common, { to: '/team', label: 'My Team', icon: <Users size={14} /> }];
  }
  if (role === 'SUPER_ADMIN' || role === 'FACILITATOR') {
    return [...common,
      { to: '/team',               label: 'Teams',    icon: <Users size={14} /> },
      { to: '/admin/participants', label: 'Admin',    icon: <Settings size={14} /> },
    ];
  }
  return common;
}

function Logo({ size = 32 }: { size?: number }) {
  const [err, setErr] = useState(false);
  if (!err) {
    return (
      <img src="/logo.png" alt="Skillyme"
        style={{ width: size, height: size }}
        className="object-contain"
        onError={() => setErr(true)} />
    );
  }
  return (
    <div style={{ width: size, height: size }}
      className="bg-[#3730A3] rounded-md flex items-center justify-center flex-shrink-0 shadow-sm">
      <span className="text-white font-bold text-sm font-heading">S</span>
    </div>
  );
}

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ['config'], queryFn: () => configApi.get(), staleTime: Infinity,
  });

  const programName = config?.data.programName ?? 'Skillyme Africa';

  const handleLogout = async () => {
    resetRedirectGuard();
    try { await authApi.logout(); } catch { /* ignore */ }
    queryClient.cancelQueries();
    queryClient.clear();
    authStore.clearAuth();
    navigate('/login');
  };

  if (!user) return null;
  const links = navLinks(user.role);

  return (
    <>
      {/* ── Top navbar ── */}
      <header className="navbar sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">

            {/* Mobile menu button */}
            <button onClick={() => setDrawerOpen(true)}
              className="md:hidden p-2 text-[#6B7280] hover:text-[#3730A3] hover:bg-[#EEF2FF] rounded-md transition-colors">
              <Menu size={20} />
            </button>

            {/* Logo + name */}
            <Link to="/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
              <Logo size={30} />
              <div className="hidden sm:block">
                <p className="text-[#111827] font-semibold text-sm leading-tight">
                  {programName.split('—')[0].trim()}
                </p>
                <p className="text-[#F59E0B] text-[10px] uppercase tracking-widest font-semibold">
                  Cohort 2 · Build Track
                </p>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-0.5 flex-1 ml-4">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-[#EEF2FF] text-[#3730A3] font-semibold'
                        : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
                    }`
                  }
                >
                  {l.icon}{l.label}
                </NavLink>
              ))}
            </nav>

            {/* Right: bell + avatar */}
            <div className="flex items-center gap-2 ml-auto">
              <NotificationBell />

              <div className="relative">
                <button onClick={() => setDropdownOpen(v => !v)}
                  className="flex items-center gap-2 pl-2 pr-1.5 py-1.5 rounded-lg hover:bg-[#F3F4F6] transition-colors">
                  <div className="w-8 h-8 bg-[#EEF2FF] border border-[#3730A3]/20 rounded-full flex items-center justify-center overflow-hidden">
                    {user.photoUrl
                      ? <img src={user.photoUrl} alt="avatar" className="w-full h-full object-cover" />
                      : <span className="text-[#3730A3] text-xs font-bold">{initials(user.firstName, user.lastName)}</span>
                    }
                  </div>
                  <span className="hidden sm:block text-sm text-[#374151] max-w-[72px] truncate font-medium">
                    {user.firstName}
                  </span>
                  <ChevronDown size={12} className="text-[#9CA3AF]" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-56 bg-white border border-[#3730A3]/10 rounded-xl shadow-lg z-50 animate-scale-in overflow-hidden"
                    onMouseLeave={() => setDropdownOpen(false)}>
                    <div className="px-4 py-3 border-b border-[#3730A3]/08 bg-[#F8F7FF]">
                      <p className="text-sm font-semibold text-[#111827]">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-[#6B7280] mt-0.5">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <button onClick={() => { navigate('/profile'); setDropdownOpen(false); }}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[#374151] hover:bg-[#EEF2FF] hover:text-[#3730A3] transition-colors">
                        <User size={14} /> Profile
                      </button>
                      <button onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[#DC2626]/80 hover:bg-[#FEF2F2] hover:text-[#DC2626] transition-colors">
                        <LogOut size={14} /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer overlay ── */}
      <div className={`drawer-overlay ${drawerOpen ? 'open' : ''}`} onClick={() => setDrawerOpen(false)} />

      {/* ── Mobile drawer ── */}
      <div className={`mobile-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#3730A3]/08 bg-[#F8F7FF]">
          <div className="flex items-center gap-2.5">
            <Logo size={28} />
            <div>
              <p className="font-semibold text-[#111827] text-sm">{programName.split('—')[0].trim()}</p>
              <p className="text-[#F59E0B] text-[10px] uppercase tracking-widest font-semibold">Cohort 2</p>
            </div>
          </div>
          <button onClick={() => setDrawerOpen(false)}
            className="p-1.5 text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-md">
            <X size={18} />
          </button>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-[#3730A3]/08">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#EEF2FF] border border-[#3730A3]/20 rounded-full flex items-center justify-center overflow-hidden">
              {user.photoUrl
                ? <img src={user.photoUrl} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-[#3730A3] text-sm font-bold">{initials(user.firstName, user.lastName)}</span>
              }
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111827]">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-[#6B7280]">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="px-3 py-3 flex flex-col gap-0.5">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#EEF2FF] text-[#3730A3] font-semibold'
                    : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
                }`
              }
            >
              {l.icon}{l.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="absolute bottom-0 left-0 right-0 px-3 py-4 border-t border-[#3730A3]/08 space-y-0.5 bg-white">
          <button onClick={() => { navigate('/profile'); setDrawerOpen(false); }}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-lg text-sm text-[#374151] hover:bg-[#F3F4F6] transition-colors font-medium">
            <User size={14} /> Profile
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-lg text-sm text-[#DC2626]/80 hover:bg-[#FEF2F2] hover:text-[#DC2626] transition-colors font-medium">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>
    </>
  );
}
