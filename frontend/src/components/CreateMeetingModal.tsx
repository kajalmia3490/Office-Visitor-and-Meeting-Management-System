import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Building, Video, User, Plus } from 'lucide-react';
import { Visitor, Room, User as UserType } from '../types';
import { api, getApiErrorMessage } from '../services/api';
import { Meeting } from '../types';

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  visitors: Visitor[];
  rooms: Room[];
  users: UserType[];
  initialRoomId?: number;
  editingMeeting?: Meeting | null;
  onError?: (message: string) => void;
}

export const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  visitors,
  rooms,
  users,
  initialRoomId,
  editingMeeting,
  onError,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingType, setMeetingType] = useState<Meeting['MeetingType']>('Meeting');
  const [hostId, setHostId] = useState<number>(users[0]?.UserId || 1);
  const [roomId, setRoomId] = useState<number>(initialRoomId || rooms[0]?.RoomId || 1);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [selectedVisitorIds, setSelectedVisitorIds] = useState<number[]>([]);
  const [videoCallUrl, setVideoCallUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingMeeting) {
      const start = new Date(editingMeeting.StartTime);
      const end = new Date(editingMeeting.EndTime);
      setTitle(editingMeeting.Title);
      setDescription(editingMeeting.Description || '');
      setMeetingType(editingMeeting.MeetingType);
      setHostId(editingMeeting.HostId);
      setRoomId(editingMeeting.RoomId || rooms[0]?.RoomId || 1);
      setStartDate(start.toISOString().slice(0, 10));
      setStartTime(start.toTimeString().slice(0, 5));
      setEndTime(end.toTimeString().slice(0, 5));
      setVideoCallUrl(editingMeeting.VideoCallUrl || '');
      setSelectedVisitorIds(editingMeeting.Attendees?.map((attendee) => attendee.VisitorId) || []);
    } else if (initialRoomId) {
      setRoomId(initialRoomId);
    }
  }, [editingMeeting, initialRoomId, rooms]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const startDateTime = new Date(`${startDate}T${startTime}:00`).toISOString();
    const endDateTime = new Date(`${startDate}T${endTime}:00`).toISOString();

    const data = {
      Title: title,
      Description: description,
      MeetingType: meetingType,
      HostId: Number(hostId),
      RoomId: Number(roomId),
      StartTime: startDateTime,
      EndTime: endDateTime,
      VideoCallUrl: videoCallUrl || 'https://zoom.us/j/meeting-link',
      VisitorIds: selectedVisitorIds,
      Status: 'Scheduled' as const
    };
    try {
      if (editingMeeting) await api.updateMeeting(editingMeeting.MeetingId, data);
      else await api.createMeeting(data);
      onSuccess();
      onClose();
    } catch (error) {
      onError?.(getApiErrorMessage(error, 'Unable to save meeting.'));
    } finally {
      setLoading(false);
    }
  };

  const toggleVisitor = (vid: number) => {
    if (selectedVisitorIds.includes(vid)) {
      setSelectedVisitorIds(selectedVisitorIds.filter(id => id !== vid));
    } else {
      setSelectedVisitorIds([...selectedVisitorIds, vid]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-over Panel from Right Side */}
      <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
        <div className="w-screen max-w-md md:max-w-lg bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{editingMeeting ? 'Edit Meeting / Event' : 'Schedule Meeting / Event'}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Fill in the details below to book room & generate digital passes
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form id="meeting-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Meeting Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Meeting Title *
              </label>
              <input
                type="text"
                required
                placeholder="Enter meeting title (e.g. Quarterly Product Strategy Review)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Description / Agenda
              </label>
              <textarea
                rows={2}
                placeholder="Enter meeting description / agenda details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
            </div>

            {/* Category & Host */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Event Category
                </label>
                <select
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value as Meeting['MeetingType'])}
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="Meeting">Meeting (Client/Guest)</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Event">Office Event</option>
                  <option value="Holiday">Company Holiday</option>
                  <option value="Leave">Staff Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Meeting Host
                </label>
                <select
                  value={hostId}
                  onChange={(e) => setHostId(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                >
                  {users.map(u => (
                    <option key={u.UserId} value={u.UserId}>{u.FullName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Meeting Date
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Start Time
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  End Time
                </label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Room & Video Link */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Conference Room
                </label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white"
                >
                  {rooms.map(r => (
                    <option key={r.RoomId} value={r.RoomId}>{r.RoomName} ({r.Location})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Video Call URL
                </label>
                <input
                  type="url"
                  value={videoCallUrl}
                  onChange={(e) => setVideoCallUrl(e.target.value)}
                  placeholder="Enter video call URL (e.g. https://zoom.us/j/984218321)"
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>
            </div>

            {/* Invite Visitors */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Invite Visitors (Digital passes will be issued)
              </label>
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 max-h-36 overflow-y-auto space-y-2">
                {visitors.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2 text-center">No registered visitors found</p>
                ) : (
                  visitors.map(v => (
                    <label key={v.VisitorId} className="flex items-center gap-2.5 cursor-pointer text-xs p-1 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedVisitorIds.includes(v.VisitorId)}
                        onChange={() => toggleVisitor(v.VisitorId)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{v.FullName}</span>
                      <span className="text-slate-400">({v.Company || v.Email})</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </form>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              form="meeting-form"
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Creating...' : 'Schedule & Issue Passes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
