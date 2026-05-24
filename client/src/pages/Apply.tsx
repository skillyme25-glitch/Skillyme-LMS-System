import React, { useState } from 'react';
import { applicationsApi } from '@/api/endpoints';
import { Input, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

/* ── Option data ──────────────────────────────────────── */

const EMPLOYMENT_OPTIONS = [
  { value: 'FULL_TIME', label: 'Full-time employed' },
  { value: 'PART_TIME', label: 'Part-time employed / freelance' },
  { value: 'SELF_EMPLOYED', label: 'Self-employed / running a business' },
  { value: 'STUDENT', label: 'Student' },
  { value: 'UNEMPLOYED', label: 'Unemployed / between roles' },
];

const STAGE_OPTIONS = [
  { value: 'IDEA_STAGE', label: 'Idea Stage', desc: "I have an idea but haven't built or validated anything yet" },
  { value: 'EARLY_BUILDER', label: "Early Builder", desc: "I've started building but I'm stuck or stalled" },
  { value: 'EARLY_TRACTION', label: 'Early Traction', desc: 'I have 1–2 clients and want to scale' },
];

const IDEA_OWNERSHIP_OPTIONS = [
  { value: 'OWN_IDEA', label: 'This is entirely my own idea' },
  { value: 'JOINING_TEAM', label: "I'm joining a pre-formed team with an existing idea" },
  { value: 'OPEN_TO_TEAM', label: "I don't have a fixed idea yet — I'm open to joining a team" },
];

const ROLE_OPTIONS = [
  { value: 'BUILDER', label: 'Builder / Technical', desc: 'I can build the MVP' },
  { value: 'COMMERCIAL', label: 'Commercial / Sales & BD', desc: 'I can sell and close clients' },
  { value: 'GROWTH', label: 'Growth / Marketing', desc: 'Acquisition, content, brand' },
  { value: 'PRODUCT', label: 'Product / Operations', desc: 'I run teams and manage delivery' },
  { value: 'DOMAIN_EXPERT', label: 'Domain Expert', desc: 'Deep knowledge of a specific sector' },
  { value: 'DESIGN', label: 'Design / UX', desc: 'User experience and visual design' },
  { value: 'LEGAL', label: 'Legal / Law', desc: 'Legal and regulatory expertise' },
];

const CAN_COMMIT_OPTIONS = [
  { value: 'YES_FULLY', label: 'Yes — fully committed', desc: "I can clear my schedule for the 6 weeks" },
  { value: 'MOSTLY_YES', label: 'Mostly yes', desc: "I have some obligations but can make it work" },
  { value: 'UNCERTAIN', label: "Not 100% sure yet", desc: "I'll confirm once selected" },
];

const SESSION_OPTIONS = [
  { value: 'TUE_6PM', label: 'Tuesday evenings — 6:00–8:00 PM EAT' },
  { value: 'WED_6PM', label: 'Wednesday evenings — 6:00–8:00 PM EAT' },
  { value: 'THU_6PM', label: 'Thursday evenings — 6:00–8:00 PM EAT' },
  { value: 'SAT_MORNING', label: 'Saturday mornings — 9:30 AM–12:00 PM EAT' },
  { value: 'FRI_6PM', label: 'Friday evenings — 6:00–8:00 PM EAT' },
];

const HOURS_OPTIONS = [
  { value: '5_10', label: '5–10 hrs/week' },
  { value: '10_15', label: '10–15 hrs/week' },
  { value: '15_20', label: '15–20 hrs/week' },
  { value: '20_PLUS', label: '20+ hrs/week' },
];

const APPLYING_OPTIONS = [
  { value: 'INDIVIDUAL',     label: 'Individual',           desc: 'Applying on my own' },
  { value: 'PRE_FORMED_TEAM', label: 'Pre-formed team of 5', desc: 'Joining with my full team already assembled' },
  { value: 'HARDSHIP',       label: 'Hardship rate',        desc: 'I would like to apply for a reduced rate' },
];

const REFERRAL_OPTIONS = [
  { value: 'SOCIAL_MEDIA', label: 'Social media (Instagram / X / LinkedIn)' },
  { value: 'WHATSAPP_TELEGRAM', label: 'WhatsApp or Telegram group' },
  { value: 'FRIEND_COLLEAGUE', label: 'Friend or colleague' },
  { value: 'EVENT_MEETUP', label: 'Event or meetup' },
  { value: 'PREVIOUS_COHORT', label: 'Previous Skillyme cohort participant' },
  { value: 'MEDIA_BLOG', label: 'News article or blog post' },
  { value: 'OTHER', label: 'Other' },
];

const SECTIONS = [
  'About You', 'Your Idea', 'Your Role', 'Commitment', 'How You\'re Joining', 'Final Step',
];

/* ── Radio group component ──────────────────────────── */
function RadioGroup({
  label, options, value, onChange, required,
}: {
  label: string;
  options: { value: string; label: string; desc?: string }[];
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest mb-3">
        {label}{required && <span className="text-[#DC2626] ml-1">*</span>}
      </p>
      <div className="space-y-2">
        {options.map((o) => (
          <label key={o.value}
            className={`flex items-start gap-3 px-4 py-3 border cursor-pointer transition-all ${
              value === o.value
                ? 'border-[#3730A3] bg-[#EEF2FF]'
                : 'border-[#111827]/12 bg-white hover:border-[#3730A3]/50 hover:bg-[#F8F7FF]'
            }`}>
            <div className={`mt-0.5 w-4 h-4 border-2 flex items-center justify-center flex-shrink-0 ${
              value === o.value ? 'border-[#3730A3]' : 'border-[#111827]/25'
            }`} style={{ borderRadius: '50%' }}>
              {value === o.value && (
                <div className="w-2 h-2 bg-[#3730A3]" style={{ borderRadius: '50%' }} />
              )}
            </div>
            <div>
              <p className={`text-sm font-semibold ${value === o.value ? 'text-[#111827]' : 'text-[#6B7280]'}`}>
                {o.label}
              </p>
              {o.desc && <p className="text-xs text-[#6B7280]/70 mt-0.5">{o.desc}</p>}
            </div>
            <input type="radio" className="sr-only" value={o.value}
              checked={value === o.value} onChange={() => onChange(o.value)} />
          </label>
        ))}
      </div>
    </div>
  );
}

/* ── Checkbox group (multi-select) ──────────────────── */
function CheckGroup({
  label, options, values, onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (v: string) =>
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  return (
    <div>
      <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest mb-3">{label}</p>
      <div className="space-y-2">
        {options.map((o) => {
          const checked = values.includes(o.value);
          return (
            <label key={o.value}
              className={`flex items-center gap-3 px-4 py-3 border cursor-pointer transition-all ${
                checked
                  ? 'border-[#3730A3] bg-[#EEF2FF]'
                  : 'border-[#111827]/12 bg-white hover:border-[#3730A3]/50 hover:bg-[#F8F7FF]'
              }`}>
              <div className={`w-4 h-4 border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                checked ? 'border-[#3730A3] bg-[#3730A3]' : 'border-[#111827]/25'
              }`}>
                {checked && <span className="text-[#111827] text-[10px] font-bold leading-none">✓</span>}
              </div>
              <span className={`text-sm ${checked ? 'text-[#111827] font-semibold' : 'text-[#6B7280]'}`}>
                {o.label}
              </span>
              <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggle(o.value)} />
            </label>
          );
        })}
      </div>
    </div>
  );
}

/* ── Teammate row ────────────────────────────────────── */
interface TeammateRow { firstName: string; lastName: string; email: string }

/* ── Main component ──────────────────────────────────── */
export default function ApplyPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', location: '',
    employmentStatus: '', workLink: '',
    stageGroup: '', ideaDescription: '', customerInsight: '', ideaOwnership: '',
    primaryRole: '',
    canCommit: '', sessionPreference: [] as string[], hoursPerWeek: '', commitment: '',
    applyingAs: 'INDIVIDUAL', hardshipReason: '', referralSource: '', additionalInfo: '',
    confirmProgram: false, confirmIP: false, confirmAccuracy: false,
    teammates: Array.from({ length: 4 }, () => ({ firstName: '', lastName: '', email: '' })) as TeammateRow[],
  });

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const setTm = (i: number, k: keyof TeammateRow, v: string) =>
    setForm((f) => {
      const t = [...f.teammates];
      t[i] = { ...t[i], [k]: v };
      return { ...f, teammates: t };
    });

  const canNext: Record<number, boolean> = {
    0: !!(form.firstName && form.lastName && form.email && form.employmentStatus),
    1: true,
    2: !!form.primaryRole,
    3: !!(form.canCommit && form.sessionPreference.length && form.hoursPerWeek && form.commitment.trim()),
    4: !!(form.applyingAs && form.referralSource),
    5: !!(form.confirmProgram && form.confirmIP && form.confirmAccuracy),
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        firstName: form.firstName, lastName: form.lastName, email: form.email,
        phone: form.phone || undefined, location: form.location || undefined,
        employmentStatus: form.employmentStatus,
        workLink: form.workLink || undefined,
        stageGroup: form.stageGroup || 'IDEA_STAGE',
        ideaDescription: form.ideaDescription || undefined,
        customerInsight: form.customerInsight || undefined,
        ideaOwnership: form.ideaOwnership || undefined,
        primaryRole: form.primaryRole,
        canCommit: form.canCommit, sessionPreference: form.sessionPreference,
        hoursPerWeek: form.hoursPerWeek, commitment: form.commitment,
        applyingAs: form.applyingAs,
        hardshipReason: form.hardshipReason || undefined,
        referralSource: form.referralSource,
        additionalInfo: form.additionalInfo || undefined,
        confirmedTerms: true,
        teammateInfo: form.applyingAs === 'PRE_FORMED_TEAM'
          ? form.teammates.filter((t) => t.email.trim())
          : undefined,
      };
      await applicationsApi.submit(payload);
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Submission failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ── Success screen ───────────────────────────────── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center p-6">
        <div className="bg-white border border-[#111827]/08 p-10 max-w-md w-full text-center shadow-card">
          <div className="w-14 h-14 bg-[#EEF2FF] flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={28} className="text-[#3730A3]" />
          </div>
          <h2 className="font-heading text-3xl text-[#111827] mb-3">Application Received</h2>
          <p className="text-[#6B7280] text-sm leading-relaxed">
            Thank you for applying to{' '}
            <strong className="text-[#111827]">Skillyme Africa — Cohort 2: Build Track</strong>.
            We will review your application and send your decision email between{' '}
            <strong>18–21 June 2026</strong>.
          </p>
          <p className="text-xs text-[#6B7280]/60 mt-6 uppercase tracking-widest">
            Applications close 17 June 2026
          </p>
        </div>
      </div>
    );
  }

  /* ── Progress bar ─────────────────────────────────── */
  const progress = Math.round(((step + 1) / SECTIONS.length) * 100);

  return (
    <div className="min-h-screen bg-[#F8F7FF]">

      {/* ── Hero header ── */}
      <div className="city-bg px-6 pt-10 pb-14">
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <p className="label-tag mb-3">Cohort 2 · Build Track</p>
          <h1 className="font-heading text-4xl sm:text-5xl text-white leading-tight">
            Apply to Skillyme Africa
          </h1>
          <p className="mt-3 text-[#E8F4F2]/65 text-sm">
            Mon 22 June – Wed 29 July 2026 &nbsp;·&nbsp; Applications close Wed 17 June 2026
          </p>
        </div>
      </div>

      {/* ── Form container ── */}
      <div className="max-w-2xl mx-auto px-4 -mt-8 pb-16">

        {/* Section header chip */}
        <div className="bg-white border border-[#111827]/08 shadow-card px-6 py-4 mb-0.5 flex items-center justify-between">
          <div>
            <p className="label-tag">Section {step + 1} of {SECTIONS.length}</p>
            <p className="font-heading text-xl text-[#111827] mt-0.5">{SECTIONS[step]}</p>
          </div>
          <div className="hidden sm:flex gap-1">
            {SECTIONS.map((_, i) => (
              <div key={i}
                className={`h-1 w-6 transition-colors ${i <= step ? 'bg-[#3730A3]' : 'bg-[#111827]/10'}`} />
            ))}
          </div>
          <div className="sm:hidden text-xs text-[#6B7280]">{progress}%</div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-[#111827]/06 mb-1">
          <div className="h-full bg-[#3730A3] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        {/* Form card */}
        <div className="bg-white border border-[#111827]/08 shadow-card px-6 py-8 space-y-6">

          {/* ── Section 1: About You ── */}
          {step === 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="First name *" value={form.firstName}
                  onChange={(e) => set('firstName', e.target.value)} required />
                <Input label="Last name *" value={form.lastName}
                  onChange={(e) => set('lastName', e.target.value)} required />
              </div>
              <Input label="Email address *" type="email" value={form.email}
                onChange={(e) => set('email', e.target.value)} required
                placeholder="you@example.com" />
              <Input label="Phone number" type="tel" value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+254 700 000 000" />
              <Input label="Location — city / town, country" value={form.location}
                onChange={(e) => set('location', e.target.value)}
                placeholder="e.g. Nairobi, Kenya" />
              <RadioGroup
                label="Employment status *"
                options={EMPLOYMENT_OPTIONS}
                value={form.employmentStatus}
                onChange={(v) => set('employmentStatus', v)}
                required
              />
              <Input
                label="Link to your work (optional)"
                type="url"
                value={form.workLink}
                onChange={(e) => set('workLink', e.target.value)}
                placeholder="LinkedIn, GitHub, portfolio, social profile…"
              />
              <p className="text-xs text-[#6B7280]">
                Share the link that best shows what you can do — LinkedIn, GitHub, a live product, Behance, or any public profile.
              </p>
            </>
          )}

          {/* ── Section 2: Your Idea ── */}
          {step === 1 && (
            <>
              <RadioGroup
                label="Which stage best describes your idea or business?"
                options={STAGE_OPTIONS}
                value={form.stageGroup}
                onChange={(v) => set('stageGroup', v)}
              />
              <Textarea
                label="Describe your idea or business"
                rows={5}
                value={form.ideaDescription}
                onChange={(e) => set('ideaDescription', e.target.value)}
                placeholder="What is the problem you're solving, who has it, and what is your solution? Be specific."
              />
              <Textarea
                label="What has already told you this problem is real?"
                rows={4}
                value={form.customerInsight}
                onChange={(e) => set('customerInsight', e.target.value)}
                placeholder="Describe any customer conversations, research, signups, or revenue you have. If none yet, say so."
              />
              <RadioGroup
                label="Which of these best describes you?"
                options={IDEA_OWNERSHIP_OPTIONS}
                value={form.ideaOwnership}
                onChange={(v) => set('ideaOwnership', v)}
              />
            </>
          )}

          {/* ── Section 3: Your Role ── */}
          {step === 2 && (
            <>
              <div className="bg-[#EEF2FF] border-l-4 border-[#3730A3] px-4 py-3 text-sm text-[#111827]">
                Every team of 5 needs all five functional roles filled. Select the one role you bring most strongly.
              </div>
              <RadioGroup
                label="Primary functional role *"
                options={ROLE_OPTIONS}
                value={form.primaryRole}
                onChange={(v) => set('primaryRole', v)}
                required
              />
            </>
          )}

          {/* ── Section 4: Commitment ── */}
          {step === 3 && (
            <>
              <RadioGroup
                label="Can you fully commit to the 6-week programme? *"
                options={CAN_COMMIT_OPTIONS}
                value={form.canCommit}
                onChange={(v) => set('canCommit', v)}
                required
              />
              <CheckGroup
                label="Which session times work for you? (select all that apply) *"
                options={SESSION_OPTIONS}
                values={form.sessionPreference}
                onChange={(v) => set('sessionPreference', v)}
              />
              <RadioGroup
                label="How many hours per week can you commit? *"
                options={HOURS_OPTIONS}
                value={form.hoursPerWeek}
                onChange={(v) => set('hoursPerWeek', v)}
                required
              />
              <div>
                <Textarea
                  label="What will you ship in six weeks, and why now? *"
                  rows={6}
                  value={form.commitment}
                  onChange={(e) => set('commitment', e.target.value)}
                  placeholder="Be specific. What is the MVP you plan to build? Who will pay for it? What does success look like on Demo Day? Why are you ready to do this now and not six months from now?"
                  required
                />
                <p className="text-xs text-[#6B7280] mt-1.5">
                  This is the most important question. Take your time.
                </p>
              </div>
            </>
          )}

          {/* ── Section 5: How You're Joining ── */}
          {step === 4 && (
            <>
              <RadioGroup
                label="How are you applying? *"
                options={APPLYING_OPTIONS.map((o) => ({ value: o.value, label: o.label, desc: o.desc }))}
                value={form.applyingAs}
                onChange={(v) => set('applyingAs', v)}
                required
              />

              {/* Teammates — shown only for pre-formed teams */}
              {form.applyingAs === 'PRE_FORMED_TEAM' && (
                <div>
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest mb-3">
                    Your 4 teammates
                  </p>
                  <p className="text-xs text-[#6B7280] mb-4">
                    All 5 members of your team will each receive their own login credentials if accepted. Enter the details of your other 4 teammates below.
                  </p>
                  <div className="space-y-4">
                    {form.teammates.map((tm, i) => (
                      <div key={i} className="bg-[#F8F7FF] border border-[#111827]/08 p-4">
                        <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider mb-3">
                          Teammate {i + 2}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input label="First name" value={tm.firstName}
                            onChange={(e) => setTm(i, 'firstName', e.target.value)} />
                          <Input label="Last name" value={tm.lastName}
                            onChange={(e) => setTm(i, 'lastName', e.target.value)} />
                        </div>
                        <div className="mt-3">
                          <Input label="Email address" type="email" value={tm.email}
                            onChange={(e) => setTm(i, 'email', e.target.value)}
                            placeholder="teammate@example.com" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hardship reason */}
              {form.applyingAs === 'HARDSHIP' && (
                <Textarea
                  label="Hardship reason"
                  rows={4}
                  value={form.hardshipReason}
                  onChange={(e) => set('hardshipReason', e.target.value)}
                  placeholder="Briefly explain your financial situation and why the hardship rate applies to you. All responses are confidential."
                />
              )}

              <RadioGroup
                label="How did you hear about Skillyme? *"
                options={REFERRAL_OPTIONS}
                value={form.referralSource}
                onChange={(v) => set('referralSource', v)}
                required
              />
            </>
          )}

          {/* ── Section 6: Final Step ── */}
          {step === 5 && (
            <>
              <Textarea
                label="Anything else you'd like us to know? (optional)"
                rows={4}
                value={form.additionalInfo}
                onChange={(e) => set('additionalInfo', e.target.value)}
                placeholder="Special circumstances, questions for us, anything relevant…"
              />

              <div>
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest mb-3">
                  Confirmations — all three required to submit
                </p>
                <div className="space-y-3">
                  {[
                    {
                      key: 'confirmProgram',
                      checked: form.confirmProgram,
                      text: 'I understand the programme runs Mon 22 June – Wed 29 July 2026 and I commit to attending at least 80% of sessions.',
                    },
                    {
                      key: 'confirmIP',
                      checked: form.confirmIP,
                      text: 'I accept that the Participant Agreement (fee schedule, IP clause, active-participation requirement) will apply once I am accepted.',
                    },
                    {
                      key: 'confirmAccuracy',
                      checked: form.confirmAccuracy,
                      text: 'I confirm all information in this application is accurate and truthful.',
                    },
                  ].map(({ key, checked, text }) => (
                    <label key={key}
                      className={`flex items-start gap-3 px-4 py-3 border cursor-pointer transition-all ${
                        checked
                          ? 'border-[#3730A3] bg-[#EEF2FF]'
                          : 'border-[#111827]/12 bg-white hover:border-[#3730A3]/40'
                      }`}>
                      <div
                        className={`mt-0.5 w-4 h-4 border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          checked ? 'border-[#3730A3] bg-[#3730A3]' : 'border-[#111827]/25'
                        }`}>
                        {checked && <span className="text-[#111827] text-[10px] font-bold leading-none">✓</span>}
                      </div>
                      <span className="text-sm text-[#6B7280] leading-relaxed">{text}</span>
                      <input type="checkbox" className="sr-only"
                        checked={checked} onChange={() => set(key, !checked)} />
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-[#F8F7FF] border border-[#111827]/08 px-4 py-3 text-xs text-[#6B7280] leading-relaxed">
                <strong className="text-[#111827]">What happens next:</strong> We review all applications and send
                decisions by email between 18–21 June 2026. If accepted, you will receive your login credentials
                and onboarding instructions. Accepted participants own 100% of any IP they create — Skillyme takes
                no equity.
              </div>
            </>
          )}

          {/* ── Navigation ── */}
          <div className={`flex pt-2 ${step > 0 ? 'justify-between' : 'justify-end'}`}>
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                ← Back
              </Button>
            )}
            {step < SECTIONS.length - 1 ? (
              <Button
                variant="gold"
                disabled={!canNext[step]}
                onClick={() => setStep((s) => s + 1)}
              >
                Continue <ChevronRight size={14} />
              </Button>
            ) : (
              <Button
                variant="gold"
                disabled={!canNext[5]}
                loading={loading}
                onClick={handleSubmit}
              >
                Submit Application
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-[#6B7280]/60 mt-6 uppercase tracking-widest">
          Applications open 28 May 2026 · Close 17 June 2026 · Decisions 18–21 June
        </p>
      </div>
    </div>
  );
}
