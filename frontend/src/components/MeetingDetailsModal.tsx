import React, { useState } from 'react';
import { Calendar, Clock, MapPin, User, Video, X, Pencil, Trash2 } from 'lucide-react';
import { Meeting } from '../types';

interface MeetingDetailsModalProps {
  meeting: Meeting;
  onClose: () => void;
  onEdit: (meeting: Meeting) => void;
  onDelete: (meeting: Meeting) => Promise<void>;
}

export const MeetingDetailsModal: React.FC<MeetingDetailsModalProps> = ({ meeting, onClose, onEdit, onDelete }) => {
  const [deleting, setDeleting] = useState(false);
  const start = new Date(meeting.StartTime);
  const end = new Date(meeting.EndTime);
  const handleDelete = async () => {
    if (!window.confirm(`Delete "${meeting.Title}"?`)) return;
    setDeleting(true);
    await onDelete(meeting);
    setDeleting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400">{meeting.MeetingType}</span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{meeting.Title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{meeting.Description || 'No agenda provided.'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close meeting details" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4 text-sm">
          <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-blue-500" /><span>{start.toLocaleDateString()} · {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
          <div className="flex items-center gap-3"><User className="w-4 h-4 text-blue-500" /><span>Host: {meeting.HostName || 'Unknown'}</span></div>
          <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-blue-500" /><span>{meeting.RoomName || 'Virtual / Custom Location'}{meeting.RoomLocation ? ` · ${meeting.RoomLocation}` : ''}</span></div>
          {meeting.VideoCallUrl && <a href={meeting.VideoCallUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-blue-600 hover:underline"><Video className="w-4 h-4" />Join video meeting</a>}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <h3 className="font-semibold mb-2">Visitors ({meeting.Attendees?.length || 0})</h3>
            {meeting.Attendees?.length ? <ul className="space-y-2">{meeting.Attendees.map((attendee) => <li key={attendee.AttendeeId} className="flex justify-between text-xs"><span>{attendee.VisitorName} · {attendee.VisitorCompany || 'Independent'}</span><span className="text-slate-400">{attendee.Status}</span></li>)}</ul> : <p className="text-xs text-slate-400">No visitors invited.</p>}
          </div>
        </div>
        <div className="flex justify-end gap-2 p-6 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={() => onEdit(meeting)} className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 text-xs font-semibold flex items-center gap-1.5"><Pencil className="w-3.5 h-3.5" />Edit</button>
          <button type="button" disabled={deleting} onClick={handleDelete} className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 text-xs font-semibold flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" />{deleting ? 'Deleting...' : 'Delete'}</button>
        </div>
      </div>
    </div>
  );
};
