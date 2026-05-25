import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { applicationsApi } from '@/api/endpoints';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { Input, Textarea } from '@/components/ui/input';
import {
  Users, UserCheck, Clock, XCircle, ListFilter,
  ExternalLink, ChevronRight, Star, Key, Copy,
} from 'lucide-react';
import { formatDate, stageGroupLabel, functionalRoleLabel } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Application, ApplicationStatus } from '@/types';

const STATUS_VARIANT: Record<ApplicationStatus, 'success' | 'warning' | 'danger' | 'info' | 'secondary'> = {
  PENDING: 'warning',
  SHORTLISTED: 'info',
  ACCEPTED: 'success',
  REJECTED: 'danger',
  WAITLISTED: 'secondary',
};

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'WAITLISTED', label: 'Waitlisted' },
];

const STAGE_FILTER = [
  { value: '', label: 'All stages' },
  { value: 'IDEA_STAGE', label: 'Idea Stage' },
  { value: 'EARLY_BUILDER', label: 'Early Builder' },
  { value: 'EARLY_TRACTION', label: 'Early Traction' },
];

const SESSION_LABELS: Record<string, string> = {
  TUE_6PM: 'Tue 6–8 PM',
  WED_6PM: 'Wed 6–8 PM',
  THU_6PM: 'Thu 6–8 PM',
  SAT_MORNING: 'Sat 9:30–12',
  FRI_6PM: 'Fri 6–8 PM',
};

export default function ApplicationsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Application | null>(null);

  const params: Record<string, string> = { page: String(page) };
  if (statusFilter) params.status = statusFilter;
  if (stageFilter) params.stageGroup = stageFilter;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-applications', params],
    queryFn: () => applicationsApi.adminList(params),
  });

  const { data: statsData } = useQuery({
    queryKey: ['application-stats'],
    queryFn: () => applicationsApi.adminStats(),
  });

  const stats = statsData?.data;
  const apps = data?.data.data ?? [];
  const meta = data?.data.meta;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="label-tag">Cohort 2 · Build Track</p>
          <h1 className="font-heading text-3xl text-[#111827] mt-0.5">Applications</h1>
        </div>
        <a href="/apply" target="_blank" rel="noreferrer">
          <Button size="sm" variant="outline">
            <ExternalLink size={14} /> Open Form
          </Button>
        </a>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total',       value: stats.total,       icon: <Users size={14} />,      bg: 'bg-[#EEF2FF]', fg: 'text-[#3730A3]' },
            { label: 'Pending',     value: stats.pending,     icon: <Clock size={14} />,      bg: 'bg-[#FFFBEB]', fg: 'text-[#B45309]' },
            { label: 'Shortlisted', value: stats.shortlisted, icon: <Star size={14} />,       bg: 'bg-[#EEF2FF]', fg: 'text-[#3730A3]' },
            { label: 'Accepted',    value: stats.accepted,    icon: <UserCheck size={14} />,  bg: 'bg-[#F0FDF4]', fg: 'text-[#15803D]' },
            { label: 'Waitlisted',  value: stats.waitlisted,  icon: <ListFilter size={14} />, bg: 'bg-[#F3F4F6]', fg: 'text-[#6B7280]' },
            { label: 'Rejected',    value: stats.rejected,    icon: <XCircle size={14} />,    bg: 'bg-[#FEF2F2]', fg: 'text-[#DC2626]' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-lg border border-[#3730A3]/08 p-4 stat-card">
              <div className={`inline-flex p-2 rounded-lg mb-2 ${s.bg} ${s.fg}`}>{s.icon}</div>
              <p className="text-2xl font-bold text-[#111827]">{s.value}</p>
              <p className="text-xs text-[#6B7280] mt-0.5 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="w-44"
        />
        <Select
          options={STAGE_FILTER}
          value={stageFilter}
          onChange={(e) => { setStageFilter(e.target.value); setPage(1); }}
          className="w-48"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#3730A3]/08 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#F8F7FF] border-b border-[#3730A3]/08">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Applicant</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide hidden md:table-cell">Stage</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide hidden lg:table-cell">Role</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide hidden lg:table-cell">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide hidden xl:table-cell">Applied</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide hidden lg:table-cell">Score</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3730A3]/05">
            {isLoading && (
              <tr><td colSpan={8} className="text-center py-12 text-[#6B7280]">Loading…</td></tr>
            )}
            {!isLoading && apps.length === 0 && (
              <tr><td colSpan={8} className="text-center py-12 text-[#6B7280]">No applications yet.</td></tr>
            )}
            {apps.map((a) => (
              <tr key={a.id} className="hover:bg-[#F8F7FF] cursor-pointer transition-colors" onClick={() => setSelected(a)}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-[#111827]">{a.firstName} {a.lastName}</p>
                  <p className="text-xs text-[#6B7280]">{a.email}</p>
                  {a.location && <p className="text-xs text-[#6B7280]/60">{a.location}</p>}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <Badge variant="info">{stageGroupLabel(a.stageGroup)}</Badge>
                </td>
                <td className="px-4 py-3 text-[#6B7280] text-sm hidden lg:table-cell">
                  {functionalRoleLabel(a.primaryRole)}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-xs text-[#6B7280]">
                    {a.applyingAs === 'PRE_FORMED_TEAM' ? 'Group' : a.applyingAs === 'HARDSHIP' ? 'Hardship' : 'Individual'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[a.status]}>{a.status}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-[#6B7280] hidden xl:table-cell">
                  {formatDate(a.createdAt)}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {a.adminScore ? (
                    <span className="font-bold text-[#3730A3]">{a.adminScore}/10</span>
                  ) : (
                    <span className="text-[#111827]/20">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <ChevronRight size={16} className="text-[#111827]/20" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta && meta.total > meta.limit && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#6B7280]">
            {(page - 1) * meta.limit + 1}–{Math.min(page * meta.limit, meta.total)} of {meta.total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page * meta.limit >= meta.total} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {selected && (
        <ApplicationDetailModal
          app={selected}
          onClose={() => setSelected(null)}
          onUpdated={() => {
            qc.invalidateQueries({ queryKey: ['admin-applications'] });
            qc.invalidateQueries({ queryKey: ['application-stats'] });
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}

/* ── Accept result types ──────────────────────────────── */
interface TeammateResult { email: string; success: boolean; tempPassword?: string; error?: string }
interface AcceptResult {
  userId: string;
  tempPassword: string;
  teammateResults?: TeammateResult[];
  autoTeamId?: string;
}

/* ── Detail modal ─────────────────────────────────────── */
function ApplicationDetailModal({
  app, onClose, onUpdated,
}: {
  app: Application; onClose: () => void; onUpdated: () => void;
}) {
  const [status, setStatus] = useState(app.status);
  const [score, setScore] = useState(String(app.adminScore ?? ''));
  const [notes, setNotes] = useState(app.adminNotes ?? '');
  const [saving, setSaving] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [acceptResult, setAcceptResult] = useState<AcceptResult | null>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      await applicationsApi.adminUpdate(app.id, {
        status,
        adminScore: score ? parseInt(score) : undefined,
        adminNotes: notes || undefined,
      });
      toast.success('Application updated');
      onUpdated();
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const res = await applicationsApi.adminAccept(app.id);
      setAcceptResult(res.data);
      toast.success('Accepted — credentials sent by email');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Failed to accept';
      toast.error(msg);
    } finally {
      setAccepting(false);
    }
  };

  /* Credentials display after accept */
  if (acceptResult) {
    return (
      <Modal open title="Accepted — Credentials Created" onClose={onClose} size="lg">
        <div className="space-y-5">
          <div className="bg-[#EEF2FF] border-l-4 border-[#3730A3] px-4 py-3">
            <p className="text-sm font-semibold text-[#111827]">
              {app.firstName} {app.lastName} has been accepted.
            </p>
            <p className="text-xs text-[#6B7280] mt-1">
              Login credentials have been sent to <strong>{app.email}</strong>.
            </p>
          </div>

          <div className="bg-[#F8F7FF] border border-[#0D1E2C]/08 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Key size={14} className="text-[#3730A3]" />
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Temporary password (for reference)</p>
            </div>
            <div className="flex items-center gap-3">
              <code className="flex-1 bg-white border border-[#0D1E2C]/12 px-3 py-2 text-sm font-mono text-[#111827]">
                {acceptResult.tempPassword}
              </code>
              <Button size="sm" variant="outline"
                onClick={() => { navigator.clipboard.writeText(acceptResult.tempPassword); toast.success('Copied!'); }}>
                <Copy size={13} />
              </Button>
            </div>
            <p className="text-xs text-[#6B7280] mt-2">
              The participant will use this to log in and should change it immediately.
            </p>
          </div>

          {acceptResult.autoTeamId && (
            <div className="bg-[#E8FAF6] border border-[#1DB89A]/30 px-4 py-3 text-sm text-[#0F9A7E] font-medium">
              Team created automatically — all members placed in one team. You can rename it and adjust roles from the Teams page.
            </div>
          )}

          {acceptResult.teammateResults && acceptResult.teammateResults.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">Teammate accounts</p>
              <div className="space-y-2">
                {acceptResult.teammateResults.map((t) => (
                  <div key={t.email}
                    className={`px-3 py-2 border text-sm ${
                      t.success ? 'border-[#1DB89A]/30 bg-[#E8FAF6]' : 'border-[#F04E37]/30 bg-[#FFECE9]'
                    }`}>
                    <div className="flex items-center justify-between">
                      <span className={t.success ? 'text-[#1A1A2E] font-medium' : 'text-[#F04E37]'}>{t.email}</span>
                      <span className={`text-xs font-semibold ${t.success ? 'text-[#0F9A7E]' : 'text-[#F04E37]'}`}>
                        {t.success ? 'Account created' : t.error ?? 'Failed'}
                      </span>
                    </div>
                    {t.success && t.tempPassword && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <code className="flex-1 bg-white border border-[#1DB89A]/20 px-2 py-1 text-xs font-mono text-[#1A1A2E]">
                          {t.tempPassword}
                        </code>
                        <Button size="sm" variant="outline"
                          onClick={() => { navigator.clipboard.writeText(t.tempPassword!); toast.success('Copied!'); }}>
                          <Copy size={11} />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button variant="gold" className="w-full" onClick={onClose}>Done</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open title={`${app.firstName} ${app.lastName}`} onClose={onClose} size="lg">
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">

        {/* Basic info grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Detail label="Email" value={app.email} />
          {app.phone && <Detail label="Phone" value={app.phone} />}
          {app.location && <Detail label="Location" value={app.location} />}
          {app.employmentStatus && <Detail label="Employment" value={app.employmentStatus.replace(/_/g, ' ')} />}
          <Detail label="Stage" value={stageGroupLabel(app.stageGroup)} />
          <Detail label="Primary role" value={functionalRoleLabel(app.primaryRole)} />
          <Detail label="Applying as"
            value={app.applyingAs === 'PRE_FORMED_TEAM' ? 'Pre-formed team' : app.applyingAs === 'HARDSHIP' ? 'Hardship' : 'Individual'} />
          {app.canCommit && <Detail label="Can commit" value={app.canCommit.replace(/_/g, ' ')} />}
          {app.hoursPerWeek && <Detail label="Hours/week" value={app.hoursPerWeek.replace(/_/g, '–').replace('PLUS', '+')} />}
          {app.referralSource && <Detail label="Referral" value={app.referralSource.replace(/_/g, ' ')} />}
        </div>

        {/* Work link */}
        {app.workLink && (
          <div>
            <p className="text-xs text-[#6B7280] mb-1">Work link</p>
            <a href={app.workLink} target="_blank" rel="noreferrer"
              className="text-[#3730A3] hover:underline flex items-center gap-1 text-sm font-semibold">
              {app.workLink} <ExternalLink size={11} />
            </a>
          </div>
        )}

        {/* Session preferences */}
        {app.sessionPreference && app.sessionPreference.length > 0 && (
          <div>
            <p className="text-xs text-[#6B7280] mb-2">Session preferences</p>
            <div className="flex flex-wrap gap-2">
              {app.sessionPreference.map((s) => (
                <span key={s} className="bg-[#EEF2FF] text-[#2E27A3] text-xs px-2 py-1 font-semibold uppercase tracking-wide">
                  {SESSION_LABELS[s] ?? s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Long-form answers */}
        {app.ideaDescription && <LongDetail label="Idea / business" value={app.ideaDescription} />}
        {app.customerInsight && <LongDetail label="Customer insight" value={app.customerInsight} />}
        {app.ideaOwnership && <LongDetail label="Idea ownership" value={app.ideaOwnership.replace(/_/g, ' ')} />}
        {app.commitment && <LongDetail label="Commitment answer" value={app.commitment} />}
        {app.hardshipReason && <LongDetail label="Hardship reason" value={app.hardshipReason} />}
        {app.additionalInfo && <LongDetail label="Additional info" value={app.additionalInfo} />}

        {/* Teammates */}
        {app.teammateInfo && app.teammateInfo.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Team members</p>
            <div className="space-y-1.5">
              {app.teammateInfo.map((t, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 bg-[#F8F7FF] border border-[#0D1E2C]/06 text-sm">
                  <span className="font-semibold text-[#111827]">{t.firstName} {t.lastName}</span>
                  <span className="text-[#6B7280]">{t.email}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-[#0D1E2C]/08 pt-5">
          {/* Admin review */}
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">Admin Review</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Select
              label="Status"
              options={STATUS_OPTIONS.filter((o) => o.value)}
              value={status}
              onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
            />
            <Input
              label="Score (1–10)"
              type="number"
              min={1} max={10}
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
          </div>
          <Textarea
            label="Admin notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes visible only to admin / facilitators…"
          />
        </div>

        <div className="flex gap-3 flex-wrap">
          <Button onClick={handleSave} loading={saving} variant="outline">Save Review</Button>
          {app.status !== 'ACCEPTED' && (
            <Button onClick={handleAccept} loading={accepting} variant="gold">
              <UserCheck size={14} /> Accept & Send Credentials
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#6B7280] mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-[#111827]">{value}</p>
    </div>
  );
}

function LongDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#F8F7FF] border-l-2 border-[#3730A3]/40 px-4 py-3">
      <p className="text-xs text-[#6B7280] mb-1 font-semibold uppercase tracking-wide">{label}</p>
      <p className="text-sm text-[#111827] whitespace-pre-wrap leading-relaxed">{value}</p>
    </div>
  );
}
