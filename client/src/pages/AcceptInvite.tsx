import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '@/api/endpoints';
import { authStore } from '@/store/authStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { configApi } from '@/api/endpoints';

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: () => configApi.get(),
    staleTime: Infinity,
  });

  const { data: tokenData, isLoading: validating, isError } = useQuery({
    queryKey: ['validate-token', token],
    queryFn: () => authApi.validateToken(token),
    enabled: !!token,
    retry: false,
  });

  // Pre-fill name if backend returns it
  useEffect(() => {
    if (tokenData?.data.user) {
      setFirstName(tokenData.data.user.firstName ?? '');
      setLastName(tokenData.data.user.lastName ?? '');
    }
  }, [tokenData]);

  if (!token) {
    return <ErrorState message="No invitation token found in this link." adminEmail={config?.data.adminEmail} />;
  }

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-[#3730A3]/600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isError || !tokenData?.data.valid) {
    return (
      <ErrorState
        message="This invitation link is invalid or has expired."
        adminEmail={config?.data.adminEmail}
      />
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8 || !/\d/.test(password)) {
      setError('Password must be at least 8 characters and include a number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await authApi.acceptInvite({ token, password, firstName, lastName });
      authStore.setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Could not complete registration.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#3730A3] flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-[#111827]">Confirm your place</h1>
          <p className="text-[#6B7280] text-sm mt-1">
            {config?.data.programName ?? 'Skillyme Africa'} — Cohort 2
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-8">
          <div className="flex items-center gap-2 mb-6 text-green-700 bg-green-50 rounded-lg px-4 py-3">
            <CheckCircle size={16} />
            <p className="text-sm font-medium">Your invitation is valid. Set a password to activate your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 chars, include a number"
              required
            />
            <Input
              label="Confirm password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your password"
              required
            />

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Activate my account
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message, adminEmail }: { message: string; adminEmail?: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={28} className="text-red-600" />
        </div>
        <h1 className="text-xl font-bold text-[#111827] mb-2">Invalid invitation link</h1>
        <p className="text-[#6B7280] text-sm">{message}</p>
        {adminEmail && (
          <p className="text-sm text-[#6B7280] mt-4">
            Contact <a href={`mailto:${adminEmail}`} className="text-[#3730A3] underline">{adminEmail}</a> for a new link.
          </p>
        )}
      </div>
    </div>
  );
}
