import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminTeamsApi, teamsApi, milestonesApi, postsApi, authApi } from '@/api/endpoints';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge, MilestoneStatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea, Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Linkedin, Mail, Crown, Paperclip, Send, Trash2, ChevronDown } from 'lucide-react';
import { formatDate, formatDateTime, timeAgo, functionalRoleLabel, stageGroupLabel, initials } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Team, TeamMilestone } from '@/types';

type Tab = 'overview' | 'milestones' | 'feed';

const WEEK_QUESTIONS: Record<number, string[]> = {
  1: [
    'What problem are you solving and who is the target customer?',
    'What evidence do you have that this problem exists? (research, observations, etc.)',
    'Describe your team roles and working agreements.',
    'What is your initial product or service idea?',
  ],
  2: [
    'How many customer discovery interviews did your team conduct this week?',
    'What were the top 3 insights from your customer interviews?',
    'Did your interviews validate or change your problem hypothesis? How?',
    'What is your updated problem statement after validation?',
  ],
  3: [
    'List the core features of your MVP — what made the cut and what did not?',
    'What is your build plan and timeline for the coming week?',
    'Who on the team owns each feature or component?',
    'Describe or link your wireframes or prototype (if available).',
  ],
  4: [
    'What can your MVP currently do? Walk us through a demo scenario.',
    'How many qualified leads are in your sales pipeline right now?',
    'What is the current status of your top 3 leads?',
    'What is your biggest blocker and how are you addressing it?',
  ],
  5: [
    'Do you have a paying client? Describe the deal (client, amount, and terms).',
    'What is the total value of your qualified pipeline in KES?',
    'What is your main sales challenge right now?',
    'What have you learned from your sales process this week?',
  ],
  6: [
    'What was the central message of your Demo Day pitch?',
    'What feedback did you receive from judges or investors?',
    'What is your plan for the next 90 days post-cohort?',
    'What is one thing you would do differently if you started the cohort again?',
  ],
};

export default function TeamPage() {
  const { user } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('overview');

  const isMember = user?.role === 'MEMBER';
  const isMentor = user?.role === 'MENTOR';
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'FACILITATOR';

  // Fetch fresh membership data directly — shared cache with Layout, no extra request.
  // Read teamId from the API response directly to avoid the auth-store timing gap.
  const { data: meData, isLoading: meLoading } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => authApi.me(),
    enabled: isMember || isMentor,
    staleTime: 30_000,
  });

  const { data: teamsData } = useQuery({
    queryKey: ['admin-teams'],
    queryFn: () => adminTeamsApi.list(),
    enabled: isAdmin,
  });

  // Determine which teamId to display
  const allTeams = teamsData?.data ?? [];

  // For members/mentors: read teamId straight from the /me response (most reliable),
  // fall back to auth store only while meData is still loading.
  const memberTeamId =
    meData?.data?.teamMemberships?.[0]?.teamId ?? user?.teams?.[0]?.teamId ?? '';

  const teamId: string = (() => {
    if (isMember) return memberTeamId;
    if (isMentor) return selectedTeamId ?? memberTeamId;
    return selectedTeamId ?? (allTeams[0]?.id ?? '');
  })();

  // Show spinner while the first auth-me fetch is in flight (don't prematurely show "no team")
  const resolvingTeam = (isMember || isMentor) && meLoading;

  const { data: teamData } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => isAdmin ? adminTeamsApi.get(teamId) : teamsApi.get(teamId),
    enabled: !!teamId,
  });

  const team = teamData?.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-[#111827]">
          {isMember ? 'My Team' : 'Teams'}
        </h1>

        {(isAdmin || isMentor) && allTeams.length > 1 && (
          <Select
            options={allTeams.map((t) => ({ value: t.id, label: t.name }))}
            value={teamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            placeholder="Select team"
            className="w-48"
          />
        )}
      </div>

      {team && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 border-b border-[#E5E7EB]">
            {(['overview', 'milestones', 'feed'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors -mb-px ${
                  tab === t
                    ? 'border-[#3730A3]/600 text-[#3730A3]'
                    : 'border-transparent text-[#6B7280] hover:text-[#374151]'
                }`}
              >
                {t === 'feed' ? 'Activity Feed' : t}
              </button>
            ))}
          </div>

          {tab === 'overview' && <TeamOverview team={team} />}
          {tab === 'milestones' && <TeamMilestones team={team} />}
          {tab === 'feed' && <TeamFeed teamId={team.id} />}
        </>
      )}

      {resolvingTeam && (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-7 h-7 border-2 border-[#3730A3] border-t-transparent rounded-full" />
        </div>
      )}

      {!resolvingTeam && !team && (
        <div className="text-center py-16 text-[#9CA3AF]">
          <p>No team selected or you are not assigned to a team yet.</p>
        </div>
      )}
    </div>
  );
}

function TeamOverview({ team }: { team: Team }) {
  const STAGE_BADGE: Record<string, 'info' | 'warning' | 'success'> = {
    IDEA_STAGE:    'info',
    EARLY_BUILDER: 'warning',
    EARLY_TRACTION:'success',
  };

  return (
    <div className="space-y-6">
      {/* Team identity banner */}
      <div className="bg-white rounded-xl border border-[#3730A3]/08 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h2 className="font-heading text-2xl text-[#111827]">{team.name}</h2>
              <Badge variant={STAGE_BADGE[team.stageGroup] ?? 'info'} className="text-sm">
                {stageGroupLabel(team.stageGroup)}
              </Badge>
            </div>
            {team.productName && (
              <p className="text-[#3730A3] font-semibold text-lg mb-1">{team.productName}</p>
            )}
            {team.productDescription && (
              <p className="text-sm text-[#4B5563] max-w-2xl">{team.productDescription}</p>
            )}
            {team.sector && (
              <p className="text-xs text-[#9CA3AF] mt-1.5">
                Sector: <span className="font-medium text-[#6B7280]">{team.sector}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Team members grid */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-semibold text-[#111827] text-lg">Team Members</h3>
          <span className="text-sm text-[#9CA3AF]">· {team.members?.length ?? 0} people</span>
        </div>

        {(!team.members || team.members.length === 0) ? (
          <div className="text-center py-10 bg-white rounded-xl border border-dashed border-[#3730A3]/20 text-[#9CA3AF]">
            No members assigned yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {team.members.map((m) => (
              <div key={m.id} className={`bg-white rounded-xl border shadow-sm p-4 flex flex-col gap-3 ${m.isTeamLead ? 'border-[#F59E0B]/60 ring-1 ring-[#F59E0B]/30' : 'border-[#3730A3]/08'}`}>
                {/* Avatar + name */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#EEF2FF] flex items-center justify-center overflow-hidden flex-shrink-0 text-[#3730A3] font-bold text-base">
                    {m.user?.photoUrl ? (
                      <img src={m.user.photoUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      initials(m.user?.firstName ?? '', m.user?.lastName ?? '')
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-semibold text-[#111827] text-sm leading-tight">
                        {m.user?.firstName} {m.user?.lastName}
                      </p>
                      {m.isTeamLead && (
                        <span className="inline-flex items-center gap-0.5 text-xs text-amber-700 bg-amber-100 rounded-full px-2 py-0.5 font-semibold">
                          <Crown size={9} /> Lead
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6B7280] mt-0.5">{functionalRoleLabel(m.functionalRole)}</p>
                  </div>
                </div>

                {/* Contact row */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#F3F4F6]">
                  <a
                    href={`mailto:${m.user?.email}`}
                    className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#3730A3] transition-colors min-w-0 flex-1 truncate"
                  >
                    <Mail size={12} className="flex-shrink-0" />
                    <span className="truncate">{m.user?.email}</span>
                  </a>
                  {m.user?.linkedinUrl && (
                    <a
                      href={m.user.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-shrink-0 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Linkedin size={13} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mentors */}
      {(team.mentors && team.mentors.length > 0) && (
        <div>
          <h3 className="font-semibold text-[#111827] text-lg mb-4">Assigned Mentors</h3>
          <div className="flex flex-wrap gap-3">
            {team.mentors.map((mt) => (
              <div key={mt.id} className="bg-white rounded-xl border border-[#3730A3]/08 shadow-sm p-4 flex items-center gap-3 min-w-[220px]">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-700 text-sm font-semibold">
                    {initials(mt.mentor?.firstName ?? '', mt.mentor?.lastName ?? '')}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111827]">{mt.mentor?.firstName} {mt.mentor?.lastName}</p>
                  <p className="text-xs text-[#9CA3AF]">Mentor</p>
                  {mt.mentor?.linkedinUrl && (
                    <a href={mt.mentor.linkedinUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                      <Linkedin size={10} /> LinkedIn
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TeamMilestones({ team }: { team: Team }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [submitModal, setSubmitModal] = useState<{ open: boolean; milestoneId: string; weekNumber: number; title: string } | null>(null);
  const [reviewModal, setReviewModal] = useState<{ open: boolean; tm: TeamMilestone } | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [reviewNote, setReviewNote] = useState('');

  const openSubmit = (milestoneId: string, weekNumber: number, title: string) => {
    setAnswers({});
    setCurrentQ(0);
    setSubmitModal({ open: true, milestoneId, weekNumber, title });
  };

  const { data } = useQuery({
    queryKey: ['team-milestones', team.id],
    queryFn: () => milestonesApi.teamMilestones(team.id),
  });
  const milestones = data?.data ?? [];

  const isTeamLead = user?.teams?.find((t) => t.teamId === team.id)?.isTeamLead;
  const canSubmit = user?.role === 'MEMBER' && isTeamLead;
  const canReview = user?.role === 'SUPER_ADMIN' || user?.role === 'FACILITATOR';

  const submitMilestone = useMutation({
    mutationFn: () => {
      const questions = WEEK_QUESTIONS[submitModal!.weekNumber] ?? [];
      const summaryNote = questions
        .map((q, i) => `Q: ${q}\nA: ${answers[String(i)] ?? '(no answer)'}`)
        .join('\n\n');
      return milestonesApi.submit(team.id, submitModal!.milestoneId, {
        submissionNote: summaryNote,
        answers,
      });
    },
    onSuccess: () => {
      toast.success('Milestone submitted!');
      qc.invalidateQueries({ queryKey: ['team-milestones', team.id] });
      setSubmitModal(null);
      setAnswers({});
      setCurrentQ(0);
    },
    onError: () => toast.error('Failed to submit milestone'),
  });

  const reviewMilestone = useMutation({
    mutationFn: (status: 'APPROVED' | 'FLAGGED') =>
      milestonesApi.review(team.id, reviewModal!.tm.milestoneId, { status, facilitatorNote: reviewNote }),
    onSuccess: () => {
      toast.success('Review saved');
      qc.invalidateQueries({ queryKey: ['team-milestones', team.id] });
      setReviewModal(null);
      setReviewNote('');
    },
    onError: () => toast.error('Failed to save review'),
  });

  return (
    <>
      <div className="space-y-4">
        {milestones.map((tm) => (
          <Card key={tm.id}>
            <CardBody>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="w-7 h-7 rounded-full bg-[#3730A3] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {tm.milestone?.weekNumber}
                    </span>
                    <h3 className="font-semibold text-[#111827]">{tm.milestone?.title}</h3>
                    <MilestoneStatusBadge status={tm.status} />
                  </div>
                  <p className="text-sm text-[#4B5563]">{tm.milestone?.description}</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">Due: {tm.milestone && formatDate(tm.milestone.dueDate)}</p>

                  {tm.submissionNote && (
                    <div className="mt-3 bg-[#F9FAFB] rounded-md px-3 py-2">
                      <p className="text-xs font-medium text-[#6B7280] mb-1">Team's submission note:</p>
                      <p className="text-sm text-[#374151]">{tm.submissionNote}</p>
                    </div>
                  )}
                  {tm.facilitatorNote && (
                    <div className={`mt-3 rounded-md px-3 py-2 ${tm.status === 'APPROVED' ? 'bg-green-50' : 'bg-red-50'}`}>
                      <p className="text-xs font-medium text-[#6B7280] mb-1">Facilitator note:</p>
                      <p className="text-sm text-[#374151]">{tm.facilitatorNote}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {canSubmit && (tm.status === 'NOT_STARTED' || tm.status === 'IN_PROGRESS' || tm.status === 'FLAGGED') && (
                    <Button
                      size="sm"
                      onClick={() => openSubmit(tm.milestoneId, tm.milestone?.weekNumber ?? 0, tm.milestone?.title ?? '')}
                    >
                      Submit
                    </Button>
                  )}
                  {canReview && tm.status === 'SUBMITTED' && (
                    <Button size="sm" variant="outline" onClick={() => setReviewModal({ open: true, tm })}>
                      Review
                    </Button>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Submit Questionnaire Modal */}
      {submitModal?.open && (() => {
        const questions = WEEK_QUESTIONS[submitModal.weekNumber] ?? [];
        const q = questions[currentQ] ?? '';
        const isLast = currentQ === questions.length - 1;
        const allAnswered = questions.every((_, i) => (answers[String(i)] ?? '').trim().length > 0);

        return (
          <Modal
            open
            onClose={() => setSubmitModal(null)}
            title={`Week ${submitModal.weekNumber}: ${submitModal.title}`}
          >
            <div className="space-y-5">
              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1.5">
                  <span>Question {currentQ + 1} of {questions.length}</span>
                  <span>{Math.round(((currentQ + 1) / questions.length) * 100)}%</span>
                </div>
                <div className="w-full bg-[#F3F4F6] rounded-full h-1.5">
                  <div
                    className="bg-[#3730A3] h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question */}
              <div className="question-step animate-fade-in" key={currentQ}>
                <p className="text-sm font-semibold text-gray-800 mb-3 leading-relaxed">{q}</p>
                <textarea
                  className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#374151] resize-none focus:border-primary"
                  rows={4}
                  placeholder="Type your answer here..."
                  value={answers[String(currentQ)] ?? ''}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [String(currentQ)]: e.target.value }))}
                  autoFocus
                />
              </div>

              {/* Quick answer overview dots */}
              <div className="flex items-center gap-1.5">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentQ(i)}
                    className={`h-2 rounded-full transition-all duration-200 ${
                      i === currentQ
                        ? 'w-5 bg-[#3730A3]'
                        : (answers[String(i)] ?? '').trim()
                          ? 'w-2 bg-sky-300'
                          : 'w-2 bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
                  disabled={currentQ === 0}
                >
                  ← Back
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSubmitModal(null)}>Cancel</Button>
                  {!isLast ? (
                    <Button
                      size="sm"
                      onClick={() => setCurrentQ((q) => Math.min(questions.length - 1, q + 1))}
                      disabled={!(answers[String(currentQ)] ?? '').trim()}
                    >
                      Next →
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => submitMilestone.mutate()}
                      loading={submitMilestone.isPending}
                      disabled={!allAnswered}
                    >
                      Submit Milestone
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* Review Modal */}
      <Modal
        open={!!reviewModal?.open}
        onClose={() => setReviewModal(null)}
        title={`Review: ${reviewModal?.tm.milestone?.title}`}
        size="lg"
      >
        <div className="space-y-4">
          {reviewModal?.tm.answers && typeof reviewModal.tm.answers === 'object' && (() => {
            const weekNum = reviewModal.tm.milestone?.weekNumber ?? 0;
            const questions = WEEK_QUESTIONS[weekNum] ?? [];
            const ans = reviewModal.tm.answers as Record<string, string>;
            if (questions.length === 0) return null;
            return (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {questions.map((q, i) => (
                  <div key={i} className="bg-[#F9FAFB] rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold text-[#3730A3] mb-1">Q{i + 1}: {q}</p>
                    <p className="text-sm text-[#374151] whitespace-pre-wrap">{ans[String(i)] ?? '—'}</p>
                  </div>
                ))}
              </div>
            );
          })()}
          {(!reviewModal?.tm.answers) && reviewModal?.tm.submissionNote && (
            <div className="bg-[#F9FAFB] rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-[#6B7280] mb-1">Team's submission:</p>
              <p className="text-sm text-[#374151] whitespace-pre-wrap">{reviewModal.tm.submissionNote}</p>
            </div>
          )}
          <Textarea
            label="Facilitator note (optional)"
            rows={3}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            placeholder="Provide feedback to the team..."
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setReviewModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => reviewMilestone.mutate('FLAGGED')} loading={reviewMilestone.isPending}>
              Flag
            </Button>
            <Button onClick={() => reviewMilestone.mutate('APPROVED')} loading={reviewMilestone.isPending}>
              Approve
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function TeamFeed({ teamId }: { teamId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [page, setPage] = useState(1);

  const { data } = useQuery({
    queryKey: ['posts', teamId, page],
    queryFn: () => postsApi.list(teamId, page),
  });

  const posts = data?.data.data ?? [];
  const meta = data?.data.meta;

  const createPost = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('content', content);
      if (file) fd.append('attachment', file);
      return postsApi.create(teamId, fd);
    },
    onSuccess: () => {
      toast.success('Posted!');
      qc.invalidateQueries({ queryKey: ['posts', teamId] });
      setContent('');
      setFile(null);
    },
    onError: () => toast.error('Failed to post'),
  });

  const deletePost = useMutation({
    mutationFn: (postId: string) => postsApi.delete(teamId, postId),
    onSuccess: () => {
      toast.success('Post deleted');
      qc.invalidateQueries({ queryKey: ['posts', teamId] });
    },
  });

  return (
    <div className="space-y-4">
      {/* Compose */}
      <Card>
        <CardBody>
          <Textarea
            placeholder="Share an update with your team..."
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex items-center justify-between mt-3">
            <label className="flex items-center gap-2 text-sm text-[#6B7280] cursor-pointer hover:text-[#374151]">
              <Paperclip size={14} />
              {file ? file.name : 'Attach file'}
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
            <Button
              size="sm"
              onClick={() => createPost.mutate()}
              loading={createPost.isPending}
              disabled={!content.trim()}
            >
              <Send size={14} /> Post
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Posts */}
      {posts.map((post) => (
        <Card key={post.id}>
          <CardBody>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                <span className="text-[#3730A3] text-xs font-semibold">
                  {initials(post.author?.firstName ?? '', post.author?.lastName ?? '')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-[#111827]">
                    {post.author?.firstName} {post.author?.lastName}
                  </p>
                  {post.membership && (
                    <Badge variant="secondary" className="text-xs">
                      {post.membership.isTeamLead ? '🏆 Lead · ' : ''}
                      {functionalRoleLabel(post.membership.functionalRole)}
                    </Badge>
                  )}
                  <span className="text-xs text-[#9CA3AF]">{timeAgo(post.createdAt)}</span>
                </div>
                <p className="text-sm text-[#374151] mt-1 whitespace-pre-wrap">{post.content}</p>
                {post.attachmentUrl && (
                  <a href={post.attachmentUrl} target="_blank" rel="noreferrer" className="text-xs text-[#3730A3] underline mt-1 flex items-center gap-1">
                    <Paperclip size={12} /> Attachment
                  </a>
                )}
              </div>
              {(post.authorId === user?.id || user?.role === 'SUPER_ADMIN') && (
                <button
                  onClick={() => deletePost.mutate(post.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </CardBody>
        </Card>
      ))}

      {meta && meta.total > meta.limit && (
        <div className="flex justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page * meta.limit >= meta.total} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
