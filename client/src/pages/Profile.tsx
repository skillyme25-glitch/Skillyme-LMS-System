import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '@/api/endpoints';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Camera, Linkedin, Phone } from 'lucide-react';
import { initials, roleLabel, functionalRoleLabel } from '@/lib/utils';
import { authStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['profile'], queryFn: () => profileApi.get() });
  const user = data?.data;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName ?? '');
      setPhone(user.phone ?? '');
      setLinkedinUrl(user.linkedinUrl ?? '');
    }
  }, [user]);

  const updateProfile = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('firstName', firstName);
      fd.append('lastName', lastName);
      fd.append('phone', phone);
      fd.append('linkedinUrl', linkedinUrl);
      if (photoFile) fd.append('photo', photoFile);
      return profileApi.update(fd);
    },
    onSuccess: (res) => {
      toast.success('Profile updated');
      qc.invalidateQueries({ queryKey: ['profile'] });
      authStore.setUser(res.data as typeof res.data & { teams?: [] });
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const changePassword = useMutation({
    mutationFn: () => profileApi.changePassword({ currentPassword: currentPw, newPassword: newPw }),
    onSuccess: () => {
      toast.success('Password changed');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    },
    onError: () => toast.error('Incorrect current password'),
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { setPwError('Passwords do not match'); return; }
    if (newPw.length < 8 || !/\d/.test(newPw)) { setPwError('Min 8 chars, include a number'); return; }
    setPwError('');
    changePassword.mutate();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setPhotoFile(f);
      setPreviewUrl(URL.createObjectURL(f));
    }
  };

  if (!user) return <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-[#3730A3]/600 border-t-transparent rounded-full" /></div>;

  const displayPhoto = previewUrl ?? user.photoUrl;
  const membership = user.teamMemberships?.[0];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">My Profile</h1>

      <Card>
        <CardBody>
          <div className="flex items-start gap-6 flex-wrap">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-sky-100 flex items-center justify-center overflow-hidden">
                {displayPhoto ? (
                  <img src={displayPhoto} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[#3730A3] text-2xl font-bold">{initials(firstName, lastName)}</span>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-[#E5E7EB] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#F9FAFB] shadow">
                <Camera size={12} className="text-[#4B5563]" />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-xl font-bold text-[#111827]">{user.firstName} {user.lastName}</p>
                <Badge variant="info">{roleLabel(user.role)}</Badge>
                {membership && <Badge variant="secondary">{functionalRoleLabel(membership.functionalRole)}</Badge>}
              </div>
              <p className="text-sm text-[#6B7280] mt-1">{user.email}</p>
              {membership?.team && <p className="text-sm text-[#3730A3] mt-0.5">Team: {membership.team.name}</p>}
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold text-[#111827]">Edit Profile</h2></CardHeader>
        <CardBody>
          <form
            onSubmit={(e) => { e.preventDefault(); updateProfile.mutate(); }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
            <Input label="Email" value={user.email} readOnly className="bg-[#F9FAFB] cursor-not-allowed" />
            <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254..." />
            <div className="flex items-center gap-2">
              <Linkedin size={14} className="text-[#9CA3AF] flex-shrink-0" />
              <Input label="" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/..." className="flex-1" />
            </div>
            <div className="flex justify-end">
              <Button type="submit" loading={updateProfile.isPending}>Save Changes</Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold text-[#111827]">Change Password</h2></CardHeader>
        <CardBody>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input label="Current password" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required />
            <Input label="New password" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required placeholder="Min 8 chars, include a number" />
            <Input label="Confirm new password" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required />
            {pwError && <p className="text-xs text-red-600">{pwError}</p>}
            <div className="flex justify-end">
              <Button type="submit" loading={changePassword.isPending}>Update Password</Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
