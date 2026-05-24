import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Megaphone, AlertTriangle, CheckCircle, Calendar, Users, Settings, Info } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api/endpoints';
import { useSSE } from '@/hooks/useSSE';
import { timeAgo } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import type { Notification, NotificationType } from '@/types';
import toast from 'react-hot-toast';

const typeIcon: Record<NotificationType, React.ReactNode> = {
  ANNOUNCEMENT: <Megaphone size={14} className="text-blue-600" />,
  MILESTONE_REMINDER: <AlertTriangle size={14} className="text-yellow-600" />,
  MILESTONE_APPROVED: <CheckCircle size={14} className="text-green-600" />,
  MILESTONE_FLAGGED: <AlertTriangle size={14} className="text-red-600" />,
  SESSION_REMINDER: <Calendar size={14} className="text-purple-600" />,
  TEAM_UPDATE: <Users size={14} className="text-indigo-600" />,
  SYSTEM: <Settings size={14} className="text-[#4B5563]" />,
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationsApi.list({ unreadOnly: false, page: 1 }),
    refetchInterval: 60000,
  });

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'count'],
    queryFn: () => notificationsApi.list({ unreadOnly: true }),
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); },
  });

  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); },
  });

  useSSE((n: Notification) => {
    qc.invalidateQueries({ queryKey: ['notifications'] });
    toast(`${n.title}`, { icon: '🔔' });
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const notifications = data?.data.data?.slice(0, 10) ?? [];
  const unreadCount = unreadData?.data.meta.total ?? 0;

  const handleClick = (n: Notification) => {
    if (!n.isRead) markRead.mutate(n.id);
    if (n.linkUrl) navigate(n.linkUrl);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-[#F3F4F6] transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-[#4B5563]" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-600 text-white text-[10px] font-bold px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border border-[#E5E7EB] rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F3F4F6]">
            <h3 className="font-semibold text-[#111827] text-sm">Notifications</h3>
            <button
              onClick={() => markAllRead.mutate()}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Check size={12} /> Mark all read
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[#9CA3AF]">
                <Bell size={32} className="mb-2 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-[#F9FAFB] transition-colors flex items-start gap-3 ${!n.isRead ? 'bg-green-50/50' : ''}`}
                >
                  <div className="flex-shrink-0 mt-0.5 w-6 h-6 flex items-center justify-center rounded-full bg-[#F3F4F6]">
                    {typeIcon[n.type] ?? <Info size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium text-[#111827] truncate ${!n.isRead ? 'font-semibold' : ''}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-[#6B7280] line-clamp-2 mt-0.5">{n.body}</p>
                    <p className="text-xs text-[#9CA3AF] mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                </button>
              ))
            )}
          </div>
          <div className="px-4 py-2 border-t border-[#F3F4F6]">
            <button
              onClick={() => { navigate('/notifications'); setOpen(false); }}
              className="text-xs text-primary hover:underline w-full text-center"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
