import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementsApi, adminTeamsApi } from '@/api/endpoints';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Plus, Edit, Trash2, Megaphone } from 'lucide-react';
import { formatDateTime, initials } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import type { Announcement } from '@/types';

export default function AnnouncementsAdminPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [createModal, setCreateModal] = useState(false);
  const [editAnn, setEditAnn] = useState<Announcement | null>(null);

  const { data } = useQuery({ queryKey: ['announcements'], queryFn: () => announcementsApi.list() });
  const { data: teamsData } = useQuery({ queryKey: ['admin-teams'], queryFn: () => adminTeamsApi.list() });

  const teams = teamsData?.data ?? [];
  const announcements = data?.data ?? [];

  const deleteAnn = useMutation({
    mutationFn: (id: string) => announcementsApi.delete(id),
    onSuccess: () => { toast.success('Announcement deleted'); qc.invalidateQueries({ queryKey: ['announcements'] }); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#111827]">Announcements</h1>
        <Button size="sm" onClick={() => setCreateModal(true)}>
          <Plus size={14} /> Post Announcement
        </Button>
      </div>

      {announcements.length === 0 && (
        <div className="flex flex-col items-center py-20 text-[#9CA3AF]">
          <Megaphone size={40} className="mb-3 opacity-30" />
          <p className="text-sm">No announcements yet</p>
        </div>
      )}

      <div className="space-y-4">
        {announcements.map((ann) => (
          <Card key={ann.id}>
            <CardBody>
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-700">
                  {ann.postedBy ? initials(ann.postedBy.firstName, ann.postedBy.lastName) : '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-[#111827]">{ann.title}</h3>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">
                        {ann.postedBy?.firstName} {ann.postedBy?.lastName} · {formatDateTime(ann.createdAt)}
                        {ann.targetAudience === 'SPECIFIC_TEAM' && ann.team && (
                          <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{ann.team.name}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {(user?.role === 'SUPER_ADMIN' || ann.postedById === user?.id) && (
                        <>
                          <button onClick={() => setEditAnn(ann)} className="p-1.5 hover:bg-[#F3F4F6] rounded text-[#9CA3AF] hover:text-[#374151]">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => { if (confirm('Delete this announcement?')) deleteAnn.mutate(ann.id); }} className="p-1.5 hover:bg-[#F3F4F6] rounded text-[#9CA3AF] hover:text-red-600">
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-[#374151] mt-2 whitespace-pre-wrap">{ann.body}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <AnnouncementFormModal
        open={createModal}
        onClose={() => setCreateModal(false)}
        teamOptions={teams.map((t) => ({ value: t.id, label: t.name }))}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ['announcements'] }); setCreateModal(false); }}
      />

      {editAnn && (
        <AnnouncementFormModal
          open={true}
          announcement={editAnn}
          teamOptions={teams.map((t) => ({ value: t.id, label: t.name }))}
          onClose={() => setEditAnn(null)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ['announcements'] }); setEditAnn(null); }}
        />
      )}
    </div>
  );
}

function AnnouncementFormModal({
  open, onClose, announcement, teamOptions, onSuccess,
}: {
  open: boolean; onClose: () => void; announcement?: Announcement;
  teamOptions: Array<{ value: string; label: string }>; onSuccess: () => void;
}) {
  const [title, setTitle] = useState(announcement?.title ?? '');
  const [body, setBody] = useState(announcement?.body ?? '');
  const [targetAudience, setTargetAudience] = useState<'ALL' | 'SPECIFIC_TEAM'>(announcement?.targetAudience ?? 'ALL');
  const [teamId, setTeamId] = useState(announcement?.teamId ?? '');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (announcement) {
      setTitle(announcement.title);
      setBody(announcement.body);
      setTargetAudience(announcement.targetAudience);
      setTeamId(announcement.teamId ?? '');
    }
  }, [announcement]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { title, body, targetAudience, teamId: targetAudience === 'SPECIFIC_TEAM' ? teamId : undefined };
      if (announcement) {
        await announcementsApi.update(announcement.id, payload);
        toast.success('Announcement updated');
      } else {
        await announcementsApi.create(payload);
        toast.success('Announcement posted');
      }
      onSuccess();
    } catch {
      toast.error('Failed to post announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={announcement ? 'Edit Announcement' : 'Post Announcement'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <Textarea label="Message" rows={6} value={body} onChange={(e) => setBody(e.target.value)} required />
        <Select
          label="Audience"
          options={[{ value: 'ALL', label: 'All participants' }, { value: 'SPECIFIC_TEAM', label: 'Specific team' }]}
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value as 'ALL' | 'SPECIFIC_TEAM')}
        />
        {targetAudience === 'SPECIFIC_TEAM' && (
          <Select
            label="Team"
            options={teamOptions}
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            placeholder="Select team"
          />
        )}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{announcement ? 'Update' : 'Post'} Announcement</Button>
        </div>
      </form>
    </Modal>
  );
}
