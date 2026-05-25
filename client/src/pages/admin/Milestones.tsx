import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { milestonesApi, adminTeamsApi } from '@/api/endpoints';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { MilestoneStatusBadge } from '@/components/ui/badge';
import { Edit, Trash2, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { formatDate, stageGroupLabel } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import type { Milestone, StageGroup } from '@/types';

type StageFilter = 'ALL' | StageGroup;

const STAGE_TABS: { value: StageFilter; label: string }[] = [
  { value: 'ALL',            label: 'All Stages' },
  { value: 'IDEA_STAGE',     label: 'Idea Stage' },
  { value: 'EARLY_BUILDER',  label: 'Early Builder' },
  { value: 'EARLY_TRACTION', label: 'Early Traction' },
];

const STAGE_BADGE_VARIANT: Record<StageGroup, 'info' | 'warning' | 'success'> = {
  IDEA_STAGE:    'info',
  EARLY_BUILDER: 'warning',
  EARLY_TRACTION:'success',
};

const STAGE_GROUPS: StageGroup[] = ['IDEA_STAGE', 'EARLY_BUILDER', 'EARLY_TRACTION'];

const STAGE_OPTIONS = [
  { value: 'IDEA_STAGE',    label: 'Idea Stage' },
  { value: 'EARLY_BUILDER', label: 'Early Builder' },
  { value: 'EARLY_TRACTION','label': 'Early Traction' },
];

export default function MilestonesAdminPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editMs, setEditMs] = useState<Milestone | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<StageFilter>('ALL');

  const isAdmin = user?.role === 'SUPER_ADMIN';

  const { data: msData } = useQuery({
    queryKey: ['milestones'],
    queryFn: () => milestonesApi.list(),
  });

  const deleteMs = useMutation({
    mutationFn: (id: string) => milestonesApi.delete(id),
    onSuccess: () => { toast.success('Milestone deleted'); qc.invalidateQueries({ queryKey: ['milestones'] }); qc.invalidateQueries({ queryKey: ['admin-teams'] }); },
    onError: () => toast.error('Failed to delete milestone'),
  });

  const { data: teamsData } = useQuery({
    queryKey: ['admin-teams'],
    queryFn: () => adminTeamsApi.list(),
  });

  const allMilestones = msData?.data ?? [];
  const allTeams = teamsData?.data ?? [];

  const visibleMilestones = stageFilter === 'ALL'
    ? allMilestones
    : allMilestones.filter((ms) => ms.stageGroup === stageFilter);

  // Group milestones by stageGroup for the "All" view
  const groupedMilestones: Record<StageGroup, Milestone[]> = {
    IDEA_STAGE: [],
    EARLY_BUILDER: [],
    EARLY_TRACTION: [],
  };
  allMilestones.forEach((ms) => { groupedMilestones[ms.stageGroup].push(ms); });

  const renderMilestone = (ms: Milestone) => {
    const isExpanded = expanded === ms.id;
    const stageTeams = allTeams.filter((t) => t.stageGroup === ms.stageGroup);
    return (
      <Card key={ms.id}>
        <CardBody>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-[#3730A3] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {ms.weekNumber}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-[#111827]">{ms.title}</h3>
                    {stageFilter === 'ALL' && (
                      <Badge variant={STAGE_BADGE_VARIANT[ms.stageGroup]} className="text-xs">
                        {stageGroupLabel(ms.stageGroup)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-[#6B7280]">{ms.description}</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">Due: {formatDate(ms.dueDate)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setEditMs(ms)}>
                        <Edit size={12} /> Edit
                      </Button>
                      <button
                        onClick={() => { if (confirm(`Delete "${ms.title}"? Team milestone records will also be removed.`)) deleteMs.mutate(ms.id); }}
                        className="p-1.5 text-[#9CA3AF] hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete milestone"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : ms.id)}
                    className="p-1.5 hover:bg-[#F3F4F6] rounded text-[#9CA3AF]"
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Team statuses — only teams of the same stage */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-[#F3F4F6]">
                  <p className="text-xs font-medium text-[#6B7280] mb-3 uppercase tracking-wide">
                    {stageGroupLabel(ms.stageGroup)} Team Statuses
                    <span className="normal-case text-[#9CA3AF] ml-1">({stageTeams.length} teams)</span>
                  </p>
                  {stageTeams.length === 0 ? (
                    <p className="text-sm text-[#9CA3AF]">No teams in this stage yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {stageTeams.map((team) => {
                        const tm = team.milestones?.find((m) => m.milestoneId === ms.id);
                        return (
                          <div key={team.id} className="flex items-center justify-between">
                            <span className="text-sm text-[#374151]">{team.name}</span>
                            <MilestoneStatusBadge status={tm?.status ?? 'NOT_STARTED'} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="label-muted mb-1">Admin</p>
          <h1 className="font-heading text-3xl text-[#111827]">Program Milestones</h1>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateModal(true)}>
            <Plus size={15} /> Add Milestone
          </Button>
        )}
      </div>

      {/* Stage tabs */}
      <div className="flex items-center gap-1 border-b border-[#E5E7EB]">
        {STAGE_TABS.map((tab) => {
          const count = tab.value === 'ALL'
            ? allMilestones.length
            : allMilestones.filter((ms) => ms.stageGroup === tab.value).length;
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

      {/* Filtered view */}
      {stageFilter !== 'ALL' && (
        <div className="space-y-3">
          {visibleMilestones.length === 0 ? (
            <div className="text-center py-12 text-[#9CA3AF]">
              No milestones for this stage yet.
              {isAdmin && (
                <div className="mt-3">
                  <Button size="sm" onClick={() => setCreateModal(true)}>
                    <Plus size={13} /> Add Milestone
                  </Button>
                </div>
              )}
            </div>
          ) : visibleMilestones.map(renderMilestone)}
        </div>
      )}

      {/* Grouped view (All) */}
      {stageFilter === 'ALL' && (
        <div className="space-y-8">
          {STAGE_GROUPS.map((stage) => {
            const msList = groupedMilestones[stage];
            if (msList.length === 0) return null;
            return (
              <div key={stage}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={STAGE_BADGE_VARIANT[stage]}>{stageGroupLabel(stage)}</Badge>
                  <span className="text-sm text-[#9CA3AF]">{msList.length} milestone{msList.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-3">
                  {msList.map(renderMilestone)}
                </div>
              </div>
            );
          })}
          {allMilestones.length === 0 && (
            <div className="text-center py-12 text-[#9CA3AF]">
              No milestones yet. {isAdmin && (
                <button onClick={() => setCreateModal(true)} className="text-[#3730A3] underline">Add one</button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit modal */}
      {editMs && (
        <EditMilestoneModal
          milestone={editMs}
          onClose={() => setEditMs(null)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ['milestones'] }); setEditMs(null); }}
        />
      )}

      {/* Create modal */}
      {isAdmin && (
        <CreateMilestoneModal
          open={createModal}
          defaultStage={stageFilter !== 'ALL' ? stageFilter : 'IDEA_STAGE'}
          onClose={() => setCreateModal(false)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ['milestones'] }); setCreateModal(false); }}
        />
      )}
    </div>
  );
}

/* ── Edit modal ────────────────────────────────────────────────────────────── */
function EditMilestoneModal({
  milestone, onClose, onSuccess,
}: {
  milestone: Milestone; onClose: () => void; onSuccess: () => void;
}) {
  const [title, setTitle] = useState(milestone.title);
  const [description, setDescription] = useState(milestone.description);
  const [dueDate, setDueDate] = useState(milestone.dueDate.slice(0, 10));
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await milestonesApi.update(milestone.id, {
        title, description, dueDate: new Date(dueDate).toISOString(),
      });
      toast.success('Milestone updated');
      onSuccess();
    } catch {
      toast.error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title={`Edit Week ${milestone.weekNumber} — ${stageGroupLabel(milestone.stageGroup)}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <Textarea label="Description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} required />
        <Input label="Due date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Create modal ──────────────────────────────────────────────────────────── */
function CreateMilestoneModal({
  open, defaultStage, onClose, onSuccess,
}: {
  open: boolean; defaultStage: StageGroup; onClose: () => void; onSuccess: () => void;
}) {
  const [weekNumber, setWeekNumber] = useState('1');
  const [stageGroup, setStageGroup] = useState<StageGroup>(defaultStage);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setStageGroup(defaultStage);
  }, [defaultStage, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await milestonesApi.create({
        weekNumber: parseInt(weekNumber),
        stageGroup,
        title,
        description,
        dueDate: new Date(dueDate).toISOString(),
      });
      toast.success('Milestone created');
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Failed to create';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Milestone">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Week number"
            type="number"
            min="1"
            max="12"
            value={weekNumber}
            onChange={(e) => setWeekNumber(e.target.value)}
            required
          />
          <Select
            label="Stage group"
            options={STAGE_OPTIONS}
            value={stageGroup}
            onChange={(e) => setStageGroup(e.target.value as StageGroup)}
          />
        </div>
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Problem Discovery & Validation" required />
        <Textarea label="Description" rows={3} value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What should teams accomplish this week?" required />
        <Input label="Due date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Create Milestone</Button>
        </div>
      </form>
    </Modal>
  );
}
