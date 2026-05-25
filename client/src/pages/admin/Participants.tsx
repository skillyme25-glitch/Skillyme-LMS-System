import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminUsersApi, adminTeamsApi } from '@/api/endpoints';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { UserPlus, Users, Mail, Edit, Ban, RefreshCw, Search, UserCheck, Trash2 } from 'lucide-react';
import { formatDate, roleLabel, functionalRoleLabel, initials } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { User, Team } from '@/types';

const ROLES = [
  { value: 'MEMBER', label: 'Member' },
  { value: 'MENTOR', label: 'Mentor' },
  { value: 'FACILITATOR', label: 'Facilitator' },
  { value: 'SUPER_ADMIN', label: 'Admin' },
];

const FUNC_ROLES = [
  { value: 'BUILDER', label: 'Builder' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'GROWTH', label: 'Growth' },
  { value: 'PRODUCT', label: 'Product' },
  { value: 'DOMAIN_EXPERT', label: 'Domain Expert' },
  { value: 'DESIGN', label: 'Design' },
  { value: 'LEGAL', label: 'Legal' },
];

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'danger'> = {
  ACTIVE: 'success',
  INVITED: 'warning',
  SUSPENDED: 'danger',
};

export default function ParticipantsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [inviteModal, setInviteModal] = useState(false);
  const [bulkModal, setBulkModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [assignUser, setAssignUser] = useState<User | null>(null);

  const params: Record<string, string> = { page: String(page) };
  if (roleFilter) params.role = roleFilter;
  if (statusFilter) params.status = statusFilter;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => adminUsersApi.list(params),
  });

  const { data: teamsData } = useQuery({
    queryKey: ['admin-teams'],
    queryFn: () => adminTeamsApi.list(),
  });

  const teams = teamsData?.data ?? [];
  const teamOptions = teams.map((t) => ({ value: t.id, label: t.name }));

  const suspendUser = useMutation({
    mutationFn: (id: string) => adminUsersApi.suspend(id),
    onSuccess: () => { toast.success('User suspended'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => adminUsersApi.delete(id),
    onSuccess: () => {
      toast.success('User deleted');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-teams'] });
    },
    onError: () => toast.error('Failed to delete user'),
  });

  const revokeInvite = useMutation({
    mutationFn: (id: string) => adminUsersApi.revokeInvite(id),
    onSuccess: () => { toast.success('Invite re-sent'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
  });

  const users = data?.data.data ?? [];
  const meta = data?.data.meta;

  const filtered = users.filter((u) => {
    const matchesSearch = !search || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchesUnassigned = !unassignedOnly || !u.teamMemberships?.length;
    return matchesSearch && matchesUnassigned;
  });

  const unassignedCount = users.filter((u) => !u.teamMemberships?.length).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-[#111827]">Participants</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setBulkModal(true)}>
            <Users size={14} /> Bulk Invite
          </Button>
          <Button size="sm" onClick={() => setInviteModal(true)}>
            <UserPlus size={14} /> Invite Participant
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3730A3]/40"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          options={[{ value: '', label: 'All roles' }, ...ROLES]}
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="w-36"
        />
        <Select
          options={[
            { value: '', label: 'All statuses' },
            { value: 'ACTIVE', label: 'Active' },
            { value: 'INVITED', label: 'Invited' },
            { value: 'SUSPENDED', label: 'Suspended' },
          ]}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="w-36"
        />
        <button
          onClick={() => { setUnassignedOnly((v) => !v); setPage(1); }}
          className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-md border transition-colors ${
            unassignedOnly
              ? 'bg-[#3730A3] text-white border-[#3730A3]'
              : 'bg-white text-[#6B7280] border-gray-300 hover:border-[#3730A3] hover:text-[#3730A3]'
          }`}
        >
          <UserCheck size={13} />
          Unassigned
          {unassignedCount > 0 && (
            <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ml-0.5 ${
              unassignedOnly ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
            }`}>{unassignedCount}</span>
          )}
        </button>
      </div>

      {unassignedOnly && unassignedCount > 0 && (
        <div className="text-sm text-[#D97706] bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 flex items-center gap-2">
          <UserCheck size={14} />
          {unassignedCount} accepted participant{unassignedCount !== 1 ? 's' : ''} not yet placed in a team.
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-[#6B7280]">Name</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7280] hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7280]">Role</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7280]">Status</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7280] hidden lg:table-cell">Team</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7280] hidden xl:table-cell">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr><td colSpan={7} className="text-center py-12 text-[#9CA3AF]">Loading…</td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-[#9CA3AF]">No participants found</td></tr>
              )}
              {filtered.map((u) => {
                const membership = u.teamMemberships?.[0];
                const isUnassigned = !membership;
                return (
                  <tr key={u.id} className={`hover:bg-[#F9FAFB] ${isUnassigned && unassignedOnly ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#EEF2FF] flex items-center justify-center flex-shrink-0 text-xs font-semibold text-[#3730A3] overflow-hidden">
                          {u.photoUrl ? <img src={u.photoUrl} alt="" className="w-full h-full object-cover" /> : initials(u.firstName, u.lastName)}
                        </div>
                        <div>
                          <p className="font-medium text-[#111827]">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-[#6B7280] md:hidden">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#4B5563] hidden md:table-cell">{u.email}</td>
                    <td className="px-4 py-3"><Badge variant="secondary">{roleLabel(u.role)}</Badge></td>
                    <td className="px-4 py-3"><Badge variant={STATUS_COLORS[u.status] ?? 'outline'}>{u.status}</Badge></td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {membership ? (
                        <div>
                          <p className="text-[#111827]">{membership.team?.name}</p>
                          <p className="text-xs text-[#9CA3AF]">{functionalRoleLabel(membership.functionalRole)}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Not assigned
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#9CA3AF] text-xs hidden xl:table-cell">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {isUnassigned && u.role === 'MEMBER' && (
                          <button
                            onClick={() => setAssignUser(u)}
                            className="p-1 hover:bg-[#EEF2FF] rounded text-[#9CA3AF] hover:text-[#3730A3]"
                            title="Assign to team"
                          >
                            <UserCheck size={14} />
                          </button>
                        )}
                        <button onClick={() => setEditUser(u)} className="p-1 hover:bg-[#F3F4F6] rounded text-[#9CA3AF] hover:text-[#374151]">
                          <Edit size={14} />
                        </button>
                        {u.status === 'INVITED' && (
                          <button onClick={() => revokeInvite.mutate(u.id)} className="p-1 hover:bg-[#F3F4F6] rounded text-[#9CA3AF] hover:text-blue-600" title="Re-send invite">
                            <RefreshCw size={14} />
                          </button>
                        )}
                        {u.status === 'ACTIVE' && (
                          <button onClick={() => { if (confirm('Suspend this user?')) suspendUser.mutate(u.id); }} className="p-1 hover:bg-[#F3F4F6] rounded text-[#9CA3AF] hover:text-orange-500" title="Suspend">
                            <Ban size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => { if (confirm(`Permanently delete ${u.firstName} ${u.lastName}? This cannot be undone.`)) deleteUser.mutate(u.id); }}
                          className="p-1 hover:bg-red-50 rounded text-[#9CA3AF] hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {meta && meta.total > meta.limit && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#F3F4F6]">
            <p className="text-xs text-[#6B7280]">
              Showing {(page - 1) * meta.limit + 1}–{Math.min(page * meta.limit, meta.total)} of {meta.total}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page * meta.limit >= meta.total} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Invite Modal */}
      <InviteModal
        open={inviteModal}
        onClose={() => setInviteModal(false)}
        teamOptions={teamOptions}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ['admin-users'] }); setInviteModal(false); }}
      />

      {/* Bulk Invite Modal */}
      <BulkInviteModal
        open={bulkModal}
        onClose={() => setBulkModal(false)}
        teamOptions={teamOptions}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ['admin-users'] }); setBulkModal(false); }}
      />

      {/* Edit Modal */}
      {editUser && (
        <EditUserModal
          user={editUser}
          teamOptions={teamOptions}
          onClose={() => setEditUser(null)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['admin-users'] });
            qc.invalidateQueries({ queryKey: ['admin-teams'] });
            setEditUser(null);
          }}
        />
      )}

      {/* Assign to Team Modal */}
      {assignUser && (
        <AssignTeamModal
          user={assignUser}
          teams={teams}
          onClose={() => setAssignUser(null)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['admin-users'] });
            qc.invalidateQueries({ queryKey: ['admin-teams'] });
            setAssignUser(null);
          }}
        />
      )}
    </div>
  );
}

/* ── Assign to Team Modal ──────────────────────────────────────────────────── */
function AssignTeamModal({
  user, teams, onClose, onSuccess,
}: {
  user: User; teams: Team[]; onClose: () => void; onSuccess: () => void;
}) {
  const [teamId, setTeamId] = useState('');
  const [functionalRole, setFunctionalRole] = useState('BUILDER');
  const [isTeamLead, setIsTeamLead] = useState(false);
  const [loading, setLoading] = useState(false);

  const teamOptions = teams.map((t) => ({ value: t.id, label: `${t.name} · ${t.stageGroup.replace('_', ' ')}` }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId) { toast.error('Please select a team'); return; }
    setLoading(true);
    try {
      await adminUsersApi.update(user.id, { teamId, functionalRole, isTeamLead });
      toast.success(`${user.firstName} placed in team`);
      onSuccess();
    } catch {
      toast.error('Failed to assign team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title={`Place ${user.firstName} ${user.lastName} in a Team`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-[#F8F7FF] rounded-lg border border-[#3730A3]/10">
          <div className="w-10 h-10 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[#3730A3] font-semibold text-sm">
            {initials(user.firstName, user.lastName)}
          </div>
          <div>
            <p className="font-medium text-[#111827]">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-[#6B7280]">{user.email}</p>
          </div>
        </div>

        <Select
          label="Team *"
          options={[{ value: '', label: 'Select a team…' }, ...teamOptions]}
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
        />

        <Select
          label="Functional role *"
          options={FUNC_ROLES}
          value={functionalRole}
          onChange={(e) => setFunctionalRole(e.target.value)}
        />

        <label className="flex items-center gap-2 text-sm text-[#374151] cursor-pointer">
          <input
            type="checkbox"
            checked={isTeamLead}
            onChange={(e) => setIsTeamLead(e.target.checked)}
            className="rounded border-gray-300 text-[#3730A3] focus:ring-[#3730A3]"
          />
          Make this person the team lead
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading} disabled={!teamId}>
            <UserCheck size={14} /> Place in Team
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Invite Modal ──────────────────────────────────────────────────────────── */
function InviteModal({
  open, onClose, teamOptions, onSuccess,
}: {
  open: boolean; onClose: () => void; teamOptions: Array<{ value: string; label: string }>; onSuccess: () => void;
}) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [teamId, setTeamId] = useState('');
  const [functionalRole, setFunctionalRole] = useState('BUILDER');
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminUsersApi.invite({
        email, firstName, lastName, role,
        teamId: teamId || undefined,
        functionalRole: teamId ? functionalRole : undefined,
      });
      setInviteLink(res.data.inviteUrl ?? null);
      toast.success('Invitation created!');
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (inviteLink) { navigator.clipboard.writeText(inviteLink); toast.success('Link copied!'); }
  };

  if (inviteLink) {
    return (
      <Modal open={open} onClose={() => { setInviteLink(null); onClose(); }} title="Invitation Created">
        <div className="space-y-4">
          <p className="text-sm text-[#4B5563]">
            Share this link directly with <strong>{firstName} {lastName}</strong>:
          </p>
          <div className="invite-link-box">{inviteLink}</div>
          <div className="flex gap-3">
            <Button className="flex-1" onClick={handleCopy}>Copy Link</Button>
            <Button variant="outline" onClick={() => { setInviteLink(null); onClose(); }}>Done</Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Invite Participant">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Select label="Role" options={ROLES} value={role} onChange={(e) => setRole(e.target.value)} />
        <Select label="Team (optional)" options={[{ value: '', label: 'No team' }, ...teamOptions]} value={teamId} onChange={(e) => setTeamId(e.target.value)} />
        {teamId && (
          <Select label="Functional role" options={FUNC_ROLES} value={functionalRole} onChange={(e) => setFunctionalRole(e.target.value)} />
        )}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}><Mail size={14} /> Create Invitation</Button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Bulk Invite Modal ─────────────────────────────────────────────────────── */
function BulkInviteModal({
  open, onClose, teamOptions, onSuccess,
}: {
  open: boolean; onClose: () => void; teamOptions: Array<{ value: string; label: string }>; onSuccess: () => void;
}) {
  const [csv, setCsv] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<{ email: string; success: boolean; error?: string }> | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const rows = csv.trim().split('\n').map((line) => {
        const [firstName, lastName, email, role, teamName, functionalRole] = line.split(',').map((s) => s.trim());
        const teamId = teamOptions.find((t) => t.label === teamName)?.value;
        return { firstName, lastName, email, role: role || 'MEMBER', teamId, functionalRole };
      });
      const res = await adminUsersApi.bulkInvite(rows);
      setResults(res.data.results);
    } catch {
      toast.error('Bulk invite failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Bulk Invite" size="lg">
      {!results ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-[#4B5563]">
            One person per line, format:<br />
            <code className="text-xs bg-[#F3F4F6] px-1 py-0.5 rounded">firstName, lastName, email, role, teamName, functionalRole</code>
          </p>
          <Textarea
            label="CSV data"
            rows={10}
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder="Alice, Kamau, alice@example.com, MEMBER, Team Alpha, BUILDER"
            className="font-mono text-xs"
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading} disabled={!csv.trim()}>Send Invitations</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="max-h-72 overflow-y-auto space-y-1">
            {results.map((r, i) => (
              <div key={i} className={`flex items-center gap-2 text-sm px-3 py-2 rounded ${r.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <span>{r.success ? '✓' : '✗'}</span>
                <span className="flex-1">{r.email}</span>
                {r.error && <span className="text-xs">{r.error}</span>}
              </div>
            ))}
          </div>
          <Button onClick={onSuccess} className="w-full">Done</Button>
        </div>
      )}
    </Modal>
  );
}

/* ── Edit User Modal ───────────────────────────────────────────────────────── */
function EditUserModal({
  user, teamOptions, onClose, onSuccess,
}: {
  user: User; teamOptions: Array<{ value: string; label: string }>; onClose: () => void; onSuccess: () => void;
}) {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [role, setRole] = useState(user.role);
  const [status, setStatus] = useState(user.status);
  const originalTeamId = user.teamMemberships?.[0]?.teamId ?? '';
  const [teamId, setTeamId] = useState(originalTeamId);
  const [functionalRole, setFunctionalRole] = useState(user.teamMemberships?.[0]?.functionalRole ?? 'BUILDER');
  const [isTeamLead, setIsTeamLead] = useState(user.teamMemberships?.[0]?.isTeamLead ?? false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const removeFromTeam = !!originalTeamId && !teamId;
    try {
      await adminUsersApi.update(user.id, {
        firstName, lastName, role, status,
        ...(removeFromTeam && { removeFromTeam: true }),
        ...(!removeFromTeam && teamId && { teamId, functionalRole, isTeamLead }),
      });
      toast.success('User updated');
      onSuccess();
    } catch {
      toast.error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title={`Edit: ${user.firstName} ${user.lastName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
        <Select label="Role" options={ROLES} value={role} onChange={(e) => setRole(e.target.value as typeof role)} />
        <Select label="Status" options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'INVITED', label: 'Invited' }, { value: 'SUSPENDED', label: 'Suspended' }]} value={status} onChange={(e) => setStatus(e.target.value as typeof status)} />
        <Select label="Team" options={[{ value: '', label: 'No team' }, ...teamOptions]} value={teamId} onChange={(e) => setTeamId(e.target.value)} />
        {teamId && (
          <>
            <Select label="Functional role" options={FUNC_ROLES} value={functionalRole} onChange={(e) => setFunctionalRole(e.target.value as typeof functionalRole)} />
            <label className="flex items-center gap-2 text-sm text-[#374151]">
              <input type="checkbox" checked={isTeamLead} onChange={(e) => setIsTeamLead(e.target.checked)} className="rounded" />
              Team lead
            </label>
          </>
        )}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
}
