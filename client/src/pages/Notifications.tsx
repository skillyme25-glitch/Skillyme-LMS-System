import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api/endpoints';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Megaphone, AlertTriangle, CheckCircle, Calendar, Users, Settings, Info, Check } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import type { NotificationType } from '@/types';

const typeIcon: Record<NotificationType, React.ReactNode> = {
  ANNOUNCEMENT: <Megaphone size={16} className="text-blue-600" />,
  MILESTONE_REMINDER: <AlertTriangle size={16} className="text-yellow-600" />,
  MILESTONE_APPROVED: <CheckCircle size={16} className="text-green-600" />,
  MILESTONE_FLAGGED: <AlertTriangle size={16} className="text-red-600" />,
  SESSION_REMINDER: <Calendar size={16} className="text-purple-600" />,
  TEAM_UPDATE: <Users size={16} className="text-indigo-600" />,
  SYSTEM: <Settings size={16} className="text-[#4B5563]" />,
};

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-page', filter, page],
    queryFn: () => notificationsApi.list({ unreadOnly: filter === 'unread', page }),
  });

  const markRead = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); qc.invalidateQueries({ queryKey: ['notifications-page'] }); },
  });

  const notifications = data?.data.data ?? [];
  const meta = data?.data.meta;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#111827]">Notifications</h1>
        <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} loading={markAllRead.isPending}>
          <Check size={14} /> Mark all read
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 border-b border-[#E5E7EB]">
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors -mb-px ${
              filter === f ? 'border-[#3730A3]/600 text-[#3730A3]' : 'border-transparent text-[#6B7280] hover:text-[#374151]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-[#3730A3]/600 border-t-transparent rounded-full" />
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <div className="flex flex-col items-center py-16 text-[#9CA3AF]">
          <Bell size={40} className="mb-3 opacity-30" />
          <p className="text-sm">No notifications</p>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((n) => (
          <Card key={n.id} className={!n.isRead ? 'border-[#3730A3]/300 bg-[#EEF2FF]/30' : ''}>
            <CardBody>
              <button
                className="w-full text-left flex items-start gap-4"
                onClick={() => {
                  if (!n.isRead) markRead.mutate(n.id);
                  if (n.linkUrl) navigate(n.linkUrl);
                }}
              >
                <div className="w-9 h-9 rounded-full bg-[#F3F4F6] flex items-center justify-center flex-shrink-0 mt-0.5">
                  {typeIcon[n.type] ?? <Info size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm text-[#111827] ${!n.isRead ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
                  <p className="text-sm text-[#4B5563] mt-0.5">{n.body}</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && <div className="w-2.5 h-2.5 rounded-full bg-[#3730A3] flex-shrink-0 mt-1.5" />}
              </button>
            </CardBody>
          </Card>
        ))}
      </div>

      {meta && meta.total > meta.limit && (
        <div className="flex justify-center gap-3 pt-4">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-[#6B7280] self-center">Page {page}</span>
          <Button variant="outline" size="sm" disabled={page * meta.limit >= meta.total} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
