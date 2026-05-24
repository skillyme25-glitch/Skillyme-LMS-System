import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi, milestonesApi, calendarApi, announcementsApi, postsApi } from '@/api/endpoints';
import { MilestoneStatusBadge } from '@/components/ui/badge';
import { Card, CardHeader, CardBody, StatCard } from '@/components/ui/card';
import { Users, UserCheck, UserPlus, Layers, AlertTriangle, Clock } from 'lucide-react';
import { formatDate, formatDateTime, timeAgo, stageGroupLabel } from '@/lib/utils';
import { Link } from 'react-router-dom';
import type { MilestoneStatus } from '@/types';

const STATUS_COLORS: Record<MilestoneStatus, string> = {
  NOT_STARTED: 'bg-gray-200',
  IN_PROGRESS: 'bg-blue-400',
  SUBMITTED: 'bg-yellow-400',
  APPROVED: 'bg-green-500',
  FLAGGED: 'bg-red-500',
};

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === 'SUPER_ADMIN' || user.role === 'FACILITATOR') {
    return <AdminDashboard />;
  }
  if (user.role === 'MENTOR') {
    return <MentorDashboard />;
  }
  return <MemberDashboard />;
}

function MemberDashboard() {
  const { user } = useAuth();
  const teamId = user?.teams?.[0]?.teamId ?? '';

  const { data: tmData } = useQuery({
    queryKey: ['team-milestones', teamId],
    queryFn: () => milestonesApi.teamMilestones(teamId),
    enabled: !!teamId,
  });

  const { data: calData } = useQuery({
    queryKey: ['calendar'],
    queryFn: () => calendarApi.list({ from: new Date().toISOString() }),
  });

  const { data: annData } = useQuery({ queryKey: ['announcements'], queryFn: () => announcementsApi.list() });

  const { data: postsData } = useQuery({
    queryKey: ['posts', teamId],
    queryFn: () => postsApi.list(teamId),
    enabled: !!teamId,
  });

  const teamMilestones = tmData?.data ?? [];
  const events = (calData?.data ?? []).slice(0, 3);
  const announcements = (annData?.data ?? []).slice(0, 3);
  const posts = postsData?.data.data?.slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">
          Welcome back, {user?.firstName}!
        </h1>
        {user?.teams?.[0] && (
          <p className="text-[#6B7280] mt-1">
            Your team: <Link to="/team" className="text-[#3730A3] font-medium hover:underline">{user.teams[0].teamName}</Link>
          </p>
        )}
      </div>

      {/* Milestone Tracker */}
      {teamMilestones.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-[#111827]">Milestone Progress</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {teamMilestones.map((tm) => (
                <div key={tm.id} className="text-center">
                  <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-sm ${STATUS_COLORS[tm.status]}`}>
                    {tm.milestone?.weekNumber}
                  </div>
                  <p className="text-xs font-medium text-[#374151] truncate">{tm.milestone?.title}</p>
                  <MilestoneStatusBadge status={tm.status} />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upcoming Events */}
        <Card>
          <CardHeader><h2 className="font-semibold text-[#111827] flex items-center gap-2"><Clock size={16} /> Upcoming Events</h2></CardHeader>
          <CardBody className="space-y-3">
            {events.length === 0 && <p className="text-sm text-[#9CA3AF]">No upcoming events</p>}
            {events.map((e) => (
              <div key={e.id} className="border-l-2 border-[#3730A3]/600 pl-3">
                <p className="text-sm font-medium text-[#111827]">{e.title}</p>
                <p className="text-xs text-[#6B7280]">{formatDateTime(e.startTime)}</p>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Announcements */}
        <Card>
          <CardHeader><h2 className="font-semibold text-[#111827]">Recent Announcements</h2></CardHeader>
          <CardBody className="space-y-3">
            {announcements.length === 0 && <p className="text-sm text-[#9CA3AF]">No announcements</p>}
            {announcements.map((a) => (
              <div key={a.id}>
                <p className="text-sm font-semibold text-[#111827]">{a.title}</p>
                <p className="text-xs text-[#6B7280]">{timeAgo(a.createdAt)}</p>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Team Activity */}
        <Card>
          <CardHeader><h2 className="font-semibold text-[#111827]">Team Activity</h2></CardHeader>
          <CardBody className="space-y-3">
            {posts.length === 0 && <p className="text-sm text-[#9CA3AF]">No recent activity</p>}
            {posts.map((p) => (
              <div key={p.id} className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[#3730A3] text-xs font-semibold">
                    {p.author?.firstName?.[0]}{p.author?.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#111827]">{p.author?.firstName} {p.author?.lastName}</p>
                  <p className="text-xs text-[#6B7280] line-clamp-2">{p.content}</p>
                  <p className="text-xs text-[#9CA3AF]">{timeAgo(p.createdAt)}</p>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { data: statsData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.stats(),
    refetchInterval: 60000,
  });

  const stats = statsData?.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-[#111827]">Program Dashboard</h1>
        <div className="flex gap-3">
          <Link to="/admin/participants" className="btn-primary text-sm px-4 py-2 bg-[#3730A3] text-white rounded-lg font-medium hover:bg-[#0369A1] transition-colors">
            + Invite Participant
          </Link>
          <Link to="/calendar" className="text-sm px-4 py-2 bg-white border border-gray-300 text-[#374151] rounded-lg font-medium hover:bg-[#F9FAFB] transition-colors">
            + Create Event
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Participants" value={stats?.totalParticipants ?? '—'} icon={<Users size={20} />} />
        <StatCard label="Active" value={stats?.activeParticipants ?? '—'} icon={<UserCheck size={20} />} colorClass="bg-green-100 text-green-700" />
        <StatCard label="Pending Invites" value={stats?.invitedPending ?? '—'} icon={<UserPlus size={20} />} colorClass="bg-yellow-100 text-yellow-700" />
        <StatCard label="Teams" value={stats?.totalTeams ?? '—'} icon={<Layers size={20} />} colorClass="bg-blue-100 text-blue-700" />
      </div>

      {/* Milestone Progress Grid */}
      {stats?.milestoneProgressByWeek && (
        <Card>
          <CardHeader><h2 className="font-semibold text-[#111827]">Milestone Progress by Week</h2></CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#6B7280] border-b border-[#F3F4F6]">
                    <th className="pb-2 font-medium">Week</th>
                    <th className="pb-2 font-medium">Milestone</th>
                    <th className="pb-2 font-medium">Due</th>
                    <th className="pb-2 font-medium text-[#9CA3AF]">Not Started</th>
                    <th className="pb-2 font-medium text-blue-600">In Progress</th>
                    <th className="pb-2 font-medium text-yellow-600">Submitted</th>
                    <th className="pb-2 font-medium text-green-600">Approved</th>
                    <th className="pb-2 font-medium text-red-600">Flagged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stats.milestoneProgressByWeek.map((row) => (
                    <tr key={row.weekNumber} className="hover:bg-[#F9FAFB]">
                      <td className="py-3 font-bold text-[#3730A3]">W{row.weekNumber}</td>
                      <td className="py-3 text-[#111827] max-w-[200px] truncate">{row.milestoneTitle}</td>
                      <td className="py-3 text-[#6B7280] text-xs">{formatDate(row.dueDate)}</td>
                      <td className="py-3 text-center text-[#9CA3AF]">{row.teamStatuses.NOT_STARTED}</td>
                      <td className="py-3 text-center text-blue-600">{row.teamStatuses.IN_PROGRESS}</td>
                      <td className="py-3 text-center text-yellow-600">{row.teamStatuses.SUBMITTED}</td>
                      <td className="py-3 text-center text-green-600">{row.teamStatuses.APPROVED}</td>
                      <td className="py-3 text-center text-red-600">{row.teamStatuses.FLAGGED}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Teams at Risk */}
      {stats?.teamsAtRisk && stats.teamsAtRisk.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-[#111827] flex items-center gap-2 text-red-700">
              <AlertTriangle size={16} /> Teams at Risk
            </h2>
          </CardHeader>
          <CardBody className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.teamsAtRisk.map((t) => (
              <Link key={t.teamId} to="/team" className="block rounded-lg border border-red-200 bg-red-50 px-4 py-3 hover:bg-red-100 transition-colors">
                <p className="font-semibold text-red-800">{t.teamName}</p>
                <p className="text-xs text-red-600 mt-1">Flagged: Week {t.flaggedWeeks.join(', ')}</p>
              </Link>
            ))}
          </CardBody>
        </Card>
      )}

      {/* Recent Activity */}
      {stats?.recentActivity && (
        <Card>
          <CardHeader><h2 className="font-semibold text-[#111827]">Recent Activity</h2></CardHeader>
          <CardBody>
            <div className="space-y-2">
              {stats.recentActivity.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-[#3730A3] mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-[#111827]">
                      <span className="font-medium">{log.actor?.firstName} {log.actor?.lastName}</span>{' '}
                      <span className="text-[#6B7280]">{log.action.replace(/_/g, ' ').toLowerCase()}</span>{' '}
                      <span className="text-[#9CA3AF]">{log.targetType}</span>
                    </p>
                    <p className="text-xs text-[#9CA3AF]">{timeAgo(log.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function MentorDashboard() {
  const { user } = useAuth();
  const teamIds = user?.teams?.map((t) => t.teamId) ?? [];

  const { data: calData } = useQuery({
    queryKey: ['calendar'],
    queryFn: () => calendarApi.list({ from: new Date().toISOString() }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">Welcome back, {user?.firstName}!</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teamIds.map((teamId) => (
          <MentorTeamCard key={teamId} teamId={teamId} />
        ))}
      </div>

      <Card>
        <CardHeader><h2 className="font-semibold text-[#111827]">Upcoming Events</h2></CardHeader>
        <CardBody className="space-y-3">
          {(calData?.data ?? []).slice(0, 5).map((e) => (
            <div key={e.id} className="flex items-center gap-3 border-b border-gray-50 pb-3 last:border-0">
              <div className="w-2 h-2 rounded-full bg-[#3730A3] flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#111827]">{e.title}</p>
                <p className="text-xs text-[#6B7280]">{formatDateTime(e.startTime)}</p>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}

function MentorTeamCard({ teamId }: { teamId: string }) {
  const { data } = useQuery({
    queryKey: ['team-milestones', teamId],
    queryFn: () => milestonesApi.teamMilestones(teamId),
  });
  const milestones = data?.data ?? [];

  return (
    <Card>
      <CardHeader><h2 className="font-semibold text-[#111827]">Team Milestone Progress</h2></CardHeader>
      <CardBody>
        <div className="flex gap-2 flex-wrap">
          {milestones.map((tm) => (
            <div key={tm.id} className="text-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${STATUS_COLORS[tm.status]}`}>
                {tm.milestone?.weekNumber}
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
