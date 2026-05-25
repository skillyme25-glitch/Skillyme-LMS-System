import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminTeamsApi } from '@/api/endpoints';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Plus, Edit, Trash2, Users, Package, ChevronRight, Layers } from 'lucide-react';
import { stageGroupLabel } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { Team, MilestoneStatus, StageGroup } from '@/types';

const STATUS_DOT: Record<MilestoneStatus, string> = {
  NOT_STARTED: 'bg-[#E5E7EB]',
  IN_PROGRESS: 'bg-[#3730A3]',
  SUBMITTED:   'bg-[#F59E0B]',
  APPROVED:    'bg-[#16A34A]',
  FLAGGED:     'bg-[#DC2626]',
};

const STAGE_OPTIONS = [
  { value: 'IDEA_STAGE',    label: 'Idea Stage' },
  { value: 'EARLY_BUILDER', label: 'Early Builder' },
  { value: 'EARLY_TRACTION','label': 'Early Traction' },
];

const STAGE_BADGE: Record<string, 'info' | 'warning' | 'success'> = {
  IDEA_STAGE:    'info',
  EARLY_BUILDER: 'warning',
  EARLY_TRACTION:'success',
};

const STAGE_COLOR: Record<StageGroup, { bg: string; border: string; dot: string }> = {
  IDEA_STAGE:    { bg: 'bg-blue-50',   border: 'border-blue-200',  dot: 'bg-blue-400' },
  EARLY_BUILDER: { bg: 'bg-amber-50',  border: 'border-amber-200', dot: 'bg-amber-400' },
  EARLY_TRACTION:{ bg: 'bg-green-50',  border: 'border-green-200', dot: 'bg-green-400' },
};

type StageFilter = 'ALL' | StageGroup;

const STAGE_TABS: { value: StageFilter; label: string }[] = [
  { value: 'ALL',           label: 'All Teams' },
  { value: 'IDEA_STAGE',    label: 'Idea Stage' },
  { value: 'EARLY_BUILDER', label: 'Early Builder' },
  { value: 'EARLY_TRACTION','label': 'Early Traction' },
];

export default function TeamsAdminPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [createModal, setCreateModal] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [stageFilter, setStageFilter] = useState<StageFilter>('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-teams'],
    queryFn: () => adminTeamsApi.list(),
  });

  const deleteTeam = useMutation({
    mutationFn: (id: string) => adminTeamsApi.delete(id),
    onSuccess: () => { toast.success('Team deleted'); qc.invalidateQueries({ queryKey: ['admin-teams'] }); },
    onError: () => toast.error('Failed to delete team'),
  });

  const allTeams = data?.data ?? [];

  const visibleTeams = stageFilter === 'ALL'
    ? allTeams
    : allTeams.filter((t) => t.stageGroup === stageFilter);

  // Group by stage when showing all
  const groupedByStage: Record<StageGroup, Team[]> = {
    IDEA_STAGE:    [],
    EARLY_BUILDER: [],
    EARLY_TRACTION:[],
  };
  allTeams.forEach((t) => { groupedByStage[t.stageGroup].push(t); });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="label-muted mb-1">Admin</p>
          <h1 className="font-heading text-3xl text-[#111827]">Teams</h1>
        </div>
        <Button onClick={() => setCreateModal(true)}>
          <Plus size={15} /> Create Team
        </Button>
      </div>

      {/* Stage tabs */}
      <div className="flex items-center gap-1 border-b border-[#E5E7EB]">
        {STAGE_TABS.map((tab) => {
          const count = tab.value === 'ALL'
            ? allTeams.length
            : allTeams.filter((t) => t.stageGroup === tab.value).length;
          return (
            <button
              key={tab.value}
              onClick={() => setStageFilter(tab.value)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-1.5 ${
                stageFilter === tab.value
                  ? 'border-[#3730A3] text-[#3730A3]'
                  : 'border-transparent text-[#6B7280] hover:text-[#374151]'
              }`}
            >
              {tab.label}
              <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${
                stageFilter === tab.value ? 'bg-[#EEF2FF] text-[#3730A3]' : 'bg-[#F3F4F6] text-[#6B7280]'
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-7 h-7 border-2 border-[#3730A3] border-t-transparent rounded-full" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && allTeams.length === 0 && (
        <div className="bg-white rounded-xl border border-[#3730A3]/08 flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-14 h-14 bg-[#EEF2FF] rounded-xl flex items-center justify-center mb-4">
            <Layers size={22} className="text-[#3730A3]" />
          </div>
          <h3 className="font-heading text-xl text-[#111827] mb-2">No teams yet</h3>
          <p className="text-sm text-[#6B7280] max-w-xs mb-5">
            Create your first cohort team to start tracking milestones and managing members.
          </p>
          <Button onClick={() => setCreateModal(true)}>
            <Plus size={14} /> Create First Team
          </Button>
        </div>
      )}

      {/* Content: filtered view */}
      {!isLoading && stageFilter !== 'ALL' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleTeams.length === 0 ? (
            <div className="col-span-full text-center py-12 text-[#9CA3AF]">
              No teams in this stage yet.
            </div>
          ) : visibleTeams.map((team) => (
            <TeamCard key={team.id} team={team} onEdit={() => setEditTeam(team)} onView={() => navigate('/team')}
              onDelete={() => { if (confirm(`Delete "${team.name}"? This removes all members and milestone data.`)) deleteTeam.mutate(team.id); }} />
          ))}
        </div>
      )}

      {/* Content: grouped view (All) */}
      {!isLoading && stageFilter === 'ALL' && allTeams.length > 0 && (
        <div className="space-y-8">
          {(Object.entries(groupedByStage) as [StageGroup, Team[]][]).map(([stage, teams]) => {
            if (teams.length === 0) return null;
            const col = STAGE_COLOR[stage];
            return (
              <div key={stage}>
                {/* Stage section header */}
                <div className={`flex items-center gap-3 mb-4 px-4 py-2.5 rounded-lg ${col.bg} border ${col.border}`}>
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${col.dot}`} />
                  <span className="font-semibold text-[#111827]">{stageGroupLabel(stage)}</span>
                  <span className="text-sm text-[#6B7280]">· {teams.length} team{teams.length !== 1 ? 's' : ''}</span>
                  <span className="text-sm text-[#6B7280]">
                    · {teams.reduce((s, t) => s + (t.members?.length ?? 0), 0)} members
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {teams.map((team) => (
                    <TeamCard key={team.id} team={team} onEdit={() => setEditTeam(team)} onView={() => navigate('/team')}
                      onDelete={() => { if (confirm(`Delete "${team.name}"? This removes all members and milestone data.`)) deleteTeam.mutate(team.id); }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <TeamFormModal
        open={createModal}
        onClose={() => setCreateModal(false)}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ['admin-teams'] }); setCreateModal(false); }}
      />

      {editTeam && (
        <TeamFormModal
          open={true}
          team={editTeam}
          onClose={() => setEditTeam(null)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ['admin-teams'] }); setEditTeam(null); }}
        />
      )}
    </div>
  );
}

/* ── Team card ─────────────────────────────────────────────────────────────── */
function TeamCard({ team, onEdit, onView, onDelete }: { team: Team; onEdit: () => void; onView: () => void; onDelete: () => void }) {
  return (
    <div
      className="bg-white rounded-xl border border-[#3730A3]/08 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
      onClick={onView}
    >
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#111827] truncate">{team.name}</h3>
            {team.productName && (
              <p className="text-sm text-[#3730A3] font-medium mt-0.5 flex items-center gap-1.5">
                <Package size={11} /> {team.productName}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 text-[#9CA3AF] hover:text-[#3730A3] hover:bg-[#EEF2FF] rounded-md transition-colors">
              <Edit size={14} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 text-[#9CA3AF] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <Badge variant={STAGE_BADGE[team.stageGroup] ?? 'info'}>
            {stageGroupLabel(team.stageGroup)}
          </Badge>
          {team.sector && <Badge variant="secondary">{team.sector}</Badge>}
        </div>

        {/* Milestone progress dots */}
        {team.milestones && team.milestones.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-[#9CA3AF] mb-1.5">Milestones</p>
            <div className="flex gap-1.5 flex-wrap">
              {team.milestones
                .sort((a, b) => (a.milestone?.weekNumber ?? 0) - (b.milestone?.weekNumber ?? 0))
                .map((tm) => (
                  <div key={tm.id}
                    title={`Week ${tm.milestone?.weekNumber}: ${tm.status}`}
                    className={`w-3.5 h-3.5 rounded-full ${STATUS_DOT[tm.status]}`} />
                ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#3730A3]/06 text-sm">
          <span className="text-[#6B7280] flex items-center gap-1.5">
            <Users size={12} />
            {team.members?.length ?? 0} member{(team.members?.length ?? 0) !== 1 ? 's' : ''}
          </span>
          <ChevronRight size={14} className="text-[#9CA3AF] group-hover:text-[#3730A3] transition-colors" />
        </div>
      </div>
    </div>
  );
}

/* ── Team form modal ─────────────────────────────────────────────────────── */
function TeamFormModal({
  open, onClose, team, onSuccess,
}: {
  open: boolean; onClose: () => void; team?: Team; onSuccess: () => void;
}) {
  const [name, setName] = useState(team?.name ?? '');
  const [productName, setProductName] = useState(team?.productName ?? '');
  const [productDescription, setProductDescription] = useState(team?.productDescription ?? '');
  const [sector, setSector] = useState(team?.sector ?? '');
  const [stageGroup, setStageGroup] = useState(team?.stageGroup ?? 'IDEA_STAGE');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (team) {
      setName(team.name);
      setProductName(team.productName ?? '');
      setProductDescription(team.productDescription ?? '');
      setSector(team.sector ?? '');
      setStageGroup(team.stageGroup);
    } else {
      setName(''); setProductName(''); setProductDescription(''); setSector(''); setStageGroup('IDEA_STAGE');
    }
  }, [team, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Team name is required'); return; }
    setLoading(true);
    try {
      const body = {
        name: name.trim(),
        productName: productName.trim() || undefined,
        productDescription: productDescription.trim() || undefined,
        sector: sector.trim() || undefined,
        stageGroup,
      };
      if (team) {
        await adminTeamsApi.update(team.id, body);
        toast.success('Team updated');
      } else {
        await adminTeamsApi.create(body);
        toast.success('Team created');
      }
      onSuccess();
    } catch {
      toast.error('Failed to save team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={team ? 'Edit Team' : 'Create Team'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input label="Team name *" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Team Kiboko, Cohort Alpha…" required />
          </div>
          <Input label="Product name" value={productName} onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g. AgriLink, PayFast…" />
          <Input label="Sector" value={sector} onChange={(e) => setSector(e.target.value)}
            placeholder="e.g. AgriTech, FinTech…" />
        </div>

        <Select label="Stage group" options={STAGE_OPTIONS} value={stageGroup}
          onChange={(e) => setStageGroup(e.target.value as typeof stageGroup)} />

        <Textarea label="Product description" rows={3} value={productDescription}
          onChange={(e) => setProductDescription(e.target.value)}
          placeholder="What is this team building? Who is the customer?" />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{team ? 'Save Changes' : 'Create Team'}</Button>
        </div>
      </form>
    </Modal>
  );
}
