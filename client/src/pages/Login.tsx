import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { authApi, configApi } from '@/api/endpoints';
import { authStore } from '@/store/authStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

function Logo({ size = 40 }: { size?: number }) {
  const [err, setErr] = useState(false);
  if (!err) {
    return (
      <img src="/logo.png" alt="Skillyme"
        style={{ width: size, height: size }}
        className="object-contain rounded-lg"
        onError={() => setErr(true)} />
    );
  }
  return (
    <div style={{ width: size, height: size }}
      className="bg-[#3730A3] rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
      <span className="text-white font-bold text-lg font-heading">S</span>
    </div>
  );
}

export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: () => configApi.get(),
    staleTime: Infinity,
  });

  if (user) return <Navigate to="/dashboard" replace />;

  const programName = config?.data.programName ?? 'Skillyme Africa';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      authStore.setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Login failed. Check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Left: city / brand panel ── */}
      <div className="city-bg relative lg:w-[52%] flex flex-col justify-between px-10 py-12 min-h-[300px] lg:min-h-screen">
        <div className="relative z-10">
          {/* Logo + name */}
          <div className="flex items-center gap-3 mb-14">
            <Logo size={36} />
            <div>
              <p className="text-white font-semibold text-sm tracking-wide">
                {programName.split('—')[0].trim()}
              </p>
              <p className="text-[#F59E0B] text-[10px] uppercase tracking-widest font-semibold">
                Cohort 2 · Build Track
              </p>
            </div>
          </div>

          <div className="accent-bar mb-5" />
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-[3.5rem] text-white leading-[1.1]">
            Build something<br />
            <span className="text-[#FCD34D]">that matters.</span>
          </h1>
          <p className="mt-5 text-white/60 text-sm leading-relaxed max-w-xs">
            A six-week, outcome-based accelerator. Every team ships a validated MVP and closes a first paying client.
          </p>

          <div className="mt-10 space-y-5">
            {[
              { label: 'Outcome-based', desc: 'Teams judged on real traction, not slides.' },
              { label: 'You keep 100% IP', desc: 'Skillyme takes no equity and no IP.' },
              { label: 'Led by operators', desc: 'Learn from people actively building.' },
            ].map((f) => (
              <div key={f.label} className="flex gap-3 items-start">
                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-[#F59E0B] flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-semibold">{f.label}</p>
                  <p className="text-white/50 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/30 text-[10px] uppercase tracking-[0.2em]">
          Nairobi · Kenya · 2026
        </p>
      </div>

      {/* ── Right: login form ── */}
      <div className="flex-1 bg-[#F8F7FF] flex items-center justify-center px-6 py-14 lg:py-0">
        <div className="w-full max-w-sm animate-fade-in">

          {/* Mobile logo — hidden on lg */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <Logo size={32} />
            <div>
              <p className="text-[#111827] font-semibold text-sm">{programName.split('—')[0].trim()}</p>
              <p className="text-[#F59E0B] text-[10px] uppercase tracking-widest font-semibold">Cohort 2</p>
            </div>
          </div>

          <div className="mb-8">
            <p className="label-tag mb-2">Member Portal</p>
            <h2 className="font-heading text-3xl text-[#111827]">Welcome back</h2>
            <p className="text-sm text-[#6B7280] mt-1.5">Sign in to your dashboard and team workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />

            {error && (
              <div className="bg-[#FEF2F2] border border-[#DC2626]/20 rounded-md px-4 py-3 text-sm text-[#DC2626]">
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" loading={loading} className="w-full" size="lg">
              Sign in
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#3730A3]/08">
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Forgot your password?{' '}
              <span className="text-[#3730A3] font-semibold">
                Contact {config?.data.adminEmail ?? 'your admin'} to reset it.
              </span>
            </p>
            <p className="text-xs text-[#6B7280] mt-2.5">
              Not a member yet?{' '}
              <a href="/apply" className="text-[#3730A3] font-semibold hover:underline">
                Apply to Cohort 2 →
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
