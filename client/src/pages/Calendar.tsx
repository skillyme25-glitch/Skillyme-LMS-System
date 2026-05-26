import React, { useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarApi } from '@/api/endpoints';
import { useAuth } from '@/hooks/useAuth';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Download, Edit, Trash2, Plus, ExternalLink } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { CalendarEvent, EventType } from '@/types';

const EVENT_COLORS: Record<string, string> = {
  SESSION: '#0284C7',
  MILESTONE_DEADLINE: '#DC2626',
  TEAM_EVENT: '#2563EB',
  PROGRAM_EVENT: '#7C3AED',
};

export default function CalendarPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const calRef = useRef<FullCalendar>(null);

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState<CalendarEvent | null>(null);

  const { data } = useQuery({
    queryKey: ['calendar'],
    queryFn: () => calendarApi.list(),
  });

  const events = (data?.data ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    start: e.startTime,
    end: e.endTime,
    backgroundColor: EVENT_COLORS[e.eventType] ?? '#6B7280',
    borderColor: EVENT_COLORS[e.eventType] ?? '#6B7280',
    extendedProps: e,
  }));

  const deleteEvent = useMutation({
    mutationFn: (id: string) => calendarApi.delete(id),
    onSuccess: () => {
      toast.success('Event deleted');
      qc.invalidateQueries({ queryKey: ['calendar'] });
      setSelectedEvent(null);
    },
  });

  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'FACILITATOR';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Calendar</h1>
        {canManage && (
          <Button onClick={() => setCreateModal(true)} size="sm">
            <Plus size={14} /> Create Event
          </Button>
        )}
      </div>

      <div className="bg-[#0F1328] rounded-xl border border-white/[0.06] shadow-md p-4">
        <FullCalendar
          ref={calRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek',
          }}
          events={events}
          eventClick={(info) => setSelectedEvent(info.event.extendedProps as CalendarEvent)}
          height="auto"
          eventDisplay="block"
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-[#D9E2F2]">
        {Object.entries(EVENT_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            {type.replace('_', ' ')}
          </div>
        ))}
      </div>

      {/* Event Detail Modal */}
      <Modal open={!!selectedEvent} onClose={() => setSelectedEvent(null)} title={selectedEvent?.title}>
        {selectedEvent && (
          <div className="space-y-4">
            {selectedEvent.description && (
              <p className="text-sm text-[#374151] whitespace-pre-wrap">{selectedEvent.description}</p>
            )}
            <div className="text-sm space-y-1 text-[#4B5563]">
              <p><span className="font-medium">Start:</span> {formatDateTime(selectedEvent.startTime)}</p>
              <p><span className="font-medium">End:</span> {formatDateTime(selectedEvent.endTime)}</p>
              <p><span className="font-medium">Type:</span> {selectedEvent.eventType.replace('_', ' ')}</p>
              {selectedEvent.team && <p><span className="font-medium">Team:</span> {selectedEvent.team.name}</p>}
            </div>

            {selectedEvent.googleCalendarLink && (
              <a href={selectedEvent.googleCalendarLink} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                <ExternalLink size={14} /> Open in Google Calendar
              </a>
            )}

            <div className="flex items-center gap-3 pt-2">
              <a href={calendarApi.icsUrl(selectedEvent.id)} download className="flex items-center gap-2 text-sm text-[#3730A3] hover:underline">
                <Download size={14} /> Add to my calendar (.ics)
              </a>
              {canManage && (
                <>
                  <Button size="sm" variant="outline" onClick={() => { setEditModal(selectedEvent); setSelectedEvent(null); }}>
                    <Edit size={12} /> Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => deleteEvent.mutate(selectedEvent.id)}>
                    <Trash2 size={12} /> Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <EventFormModal
        open={createModal}
        onClose={() => setCreateModal(false)}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ['calendar'] }); setCreateModal(false); }}
      />

      {/* Edit Modal */}
      <EventFormModal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        event={editModal ?? undefined}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ['calendar'] }); setEditModal(null); }}
      />
    </div>
  );
}

function EventFormModal({
  open, onClose, event, onSuccess,
}: {
  open: boolean; onClose: () => void; event?: CalendarEvent; onSuccess: () => void;
}) {
  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [startTime, setStartTime] = useState(event?.startTime?.slice(0, 16) ?? '');
  const [endTime, setEndTime] = useState(event?.endTime?.slice(0, 16) ?? '');
  const [eventType, setEventType] = useState(event?.eventType ?? 'SESSION');
  const [isAllTeams, setIsAllTeams] = useState(event?.isAllTeams ?? true);
  const [googleCalendarLink, setGoogleCalendarLink] = useState(event?.googleCalendarLink ?? '');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (event) {
      setTitle(event.title ?? '');
      setDescription(event.description ?? '');
      setStartTime(event.startTime?.slice(0, 16) ?? '');
      setEndTime(event.endTime?.slice(0, 16) ?? '');
      setEventType(event.eventType ?? 'SESSION');
      setIsAllTeams(event.isAllTeams ?? true);
      setGoogleCalendarLink(event.googleCalendarLink ?? '');
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = { title, description, startTime: new Date(startTime).toISOString(), endTime: new Date(endTime).toISOString(), eventType, isAllTeams, googleCalendarLink: googleCalendarLink || undefined };
      if (event) {
        await calendarApi.update(event.id, body);
        toast.success('Event updated');
      } else {
        await calendarApi.create(body);
        toast.success('Event created');
      }
      onSuccess();
    } catch {
      toast.error('Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={event ? 'Edit Event' : 'Create Event'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <Textarea label="Description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Start time" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
          <Input label="End time" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
        </div>
        <Select
          label="Event type"
          options={[
            { value: 'SESSION', label: 'Session' },
            { value: 'MILESTONE_DEADLINE', label: 'Milestone Deadline' },
            { value: 'TEAM_EVENT', label: 'Team Event' },
            { value: 'PROGRAM_EVENT', label: 'Program Event' },
          ]}
          value={eventType}
          onChange={(e) => setEventType(e.target.value as EventType)}
        />
        <label className="flex items-center gap-2 text-sm text-[#374151]">
          <input type="checkbox" checked={isAllTeams} onChange={(e) => setIsAllTeams(e.target.checked)} className="rounded" />
          Visible to all teams
        </label>
        <Input label="Google Calendar link (optional)" type="url" value={googleCalendarLink} onChange={(e) => setGoogleCalendarLink(e.target.value)} />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{event ? 'Update' : 'Create'} Event</Button>
        </div>
      </form>
    </Modal>
  );
}
