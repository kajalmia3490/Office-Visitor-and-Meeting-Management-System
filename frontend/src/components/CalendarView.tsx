import React, { useState } from 'react';
import { 
  Plus, 
  Video, 
  MapPin, 
  Clock, 
  ListFilter, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon
} from 'lucide-react';
import { Meeting } from '../types';

interface CalendarViewProps {
  meetings: Meeting[];
  onOpenCreateModal: () => void;
  onSelectMeeting: (meeting: Meeting) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  meetings,
  onOpenCreateModal,
  onSelectMeeting
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'upcoming' | 'complete'>('list');
  const [viewMode, setViewMode] = useState<'Monthly' | 'Weekly' | 'Daily'>('Monthly');
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleDate, setVisibleDate] = useState(new Date());

  // Preview Cards from the Sage template
  const upcomingMeeting = meetings.find(m => m.MeetingType === 'Meeting') || meetings[0];
  const upcomingWorkshop = meetings.find(m => m.MeetingType === 'Workshop');
  const upcomingHoliday = meetings.find(m => m.MeetingType === 'Holiday');
  const upcomingLeave = meetings.find(m => m.MeetingType === 'Leave');

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const filteredMeetings = meetings.filter((meeting) => {
    const matchesSearch = `${meeting.Title} ${meeting.HostName || ''} ${meeting.RoomName || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
    const start = new Date(meeting.StartTime);
    const isComplete = meeting.Status === 'Completed' || start < new Date();
    return matchesSearch && (activeSubTab === 'list' || (activeSubTab === 'upcoming' && !isComplete) || (activeSubTab === 'complete' && isComplete));
  });
  const monthStart = new Date(visibleDate.getFullYear(), visibleDate.getMonth(), 1);
  const firstCell = new Date(monthStart);
  firstCell.setDate(1 - monthStart.getDay());
  const calendarCells = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstCell);
    date.setDate(firstCell.getDate() + index);
    const dayMeetings = filteredMeetings.filter((meeting) => {
      const start = new Date(meeting.StartTime);
      return start.getFullYear() === date.getFullYear() && start.getMonth() === date.getMonth() && start.getDate() === date.getDate();
    });
    return { date, dayMeetings, isCurrentMonth: date.getMonth() === visibleDate.getMonth() };
  });
  const formatDate = (value: Date) => value.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const meetingColor = (type: Meeting['MeetingType']) => type === 'Holiday' ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300' : type === 'Leave' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300' : 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Title & Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Calendar</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Here you can see your upcoming events and visitor meetings</p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Create +</span>
        </button>
      </div>

      {/* 4 Feature/Event Preview Cards matching Sage Template exactly */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Upcoming Meeting */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-3">
            <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-base">👨‍💼</span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Upcoming Meeting</span>
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
            {upcomingMeeting ? upcomingMeeting.Title : 'Marketing Meeting'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">10:00AM - 10:30AM (Today)</p>
          
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
              <Video className="w-3.5 h-3.5" />
              <span>Zoom Meeting</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950/50" />
          </div>
        </div>

        {/* Card 2: Upcoming Holiday */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-3">
            <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-base">🎉</span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Upcoming Holiday</span>
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
            {upcomingHoliday?.Title || 'No upcoming holiday'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">{upcomingHoliday ? formatDate(new Date(upcomingHoliday.StartTime)) : 'Schedule is clear'}</p>
          
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{upcomingHoliday ? upcomingHoliday.Status : 'No holiday scheduled'}</span>
          </div>
        </div>

        {/* Card 3: Upcoming Event */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-3">
            <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-base">📅</span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Upcoming Event</span>
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
            {upcomingWorkshop?.Title || 'No upcoming event'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">{upcomingWorkshop ? formatDate(new Date(upcomingWorkshop.StartTime)) : 'Schedule is clear'}</p>
          
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 truncate">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{upcomingWorkshop?.RoomLocation || 'No room assigned'}</span>
          </div>
        </div>

        {/* Card 4: Upcoming Leave */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-3">
            <span className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-base">🏖️</span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Upcoming Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <img 
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" 
              alt={upcomingLeave?.HostName || 'Employee'} 
              className="w-5 h-5 rounded-full object-cover" 
            />
            <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
              {upcomingLeave?.HostName || 'No leave scheduled'}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">{upcomingLeave ? formatDate(new Date(upcomingLeave.StartTime)) : 'Schedule is clear'}</p>
          
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{upcomingLeave ? upcomingLeave.Status : 'No leave scheduled'}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar & Sub Navigation */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        {/* Search input in toolbar */}
        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="Search anything ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* View Switchers & Date Picker */}
        <div className="flex items-center gap-2 self-end md:self-auto">
        <button type="button" onClick={() => setVisibleDate(new Date())} className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold">Today</button>
        <button type="button" aria-label="Previous month" onClick={() => setVisibleDate(new Date(visibleDate.getFullYear(), visibleDate.getMonth() - 1, 1))} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronLeft className="w-4 h-4" /></button>
        <button type="button" aria-label="Next month" onClick={() => setVisibleDate(new Date(visibleDate.getFullYear(), visibleDate.getMonth() + 1, 1))} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronRight className="w-4 h-4" /></button>
          {/* Monthly Dropdown */}
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none cursor-pointer"
          >
            <option value="Monthly">Monthly ▾</option>
            <option value="Weekly">Weekly ▾</option>
            <option value="Daily">Daily ▾</option>
          </select>

          {/* Date Indicator Pill */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>{formatDate(visibleDate)}</span>
          </div>
        </div>
      </div>

      {/* Calendar Sub-Tabs: List / Upcoming / Complete */}
      <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800 px-2 pb-1">
        <button
          onClick={() => setActiveSubTab('list')}
          className={`flex items-center gap-2 text-sm font-semibold pb-2 border-b-2 transition-all ${
            activeSubTab === 'list'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <ListFilter className="w-4 h-4" />
          <span>List</span>
        </button>

        <button
          onClick={() => setActiveSubTab('upcoming')}
          className={`flex items-center gap-2 text-sm font-semibold pb-2 border-b-2 transition-all ${
            activeSubTab === 'upcoming'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Upcoming</span>
        </button>

        <button
          onClick={() => setActiveSubTab('complete')}
          className={`flex items-center gap-2 text-sm font-semibold pb-2 border-b-2 transition-all ${
            activeSubTab === 'complete'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Complete</span>
        </button>
      </div>

      {/* Main Calendar Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 text-center text-xs font-bold text-slate-700 dark:text-slate-300 py-3 bg-slate-50/50 dark:bg-slate-800/30">
          {daysOfWeek.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* 7-column Calendar Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800">
          {calendarCells.map((cell) => (
            <div
              key={cell.date.toISOString()}
              className={`min-h-[110px] p-2.5 flex flex-col justify-between transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40 ${
                !cell.isCurrentMonth ? 'bg-slate-50/30 dark:bg-slate-900/40 opacity-60' : ''
              }`}
            >
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {cell.date.getDate()}
              </div>

              {/* Badges / Events inside cell */}
              <div className="space-y-1 my-1">
                {cell.dayMeetings.slice(0, 3).map((meeting) => (
                  <button
                    type="button"
                    key={meeting.MeetingId}
                    onClick={() => onSelectMeeting(meeting)}
                    className={`w-full text-left text-[10px] font-medium px-2 py-0.5 rounded-lg border truncate shadow-2xs ${meetingColor(meeting.MeetingType)}`}
                  >
                    {new Date(meeting.StartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {meeting.Title}
                  </button>
                ))}
                {cell.dayMeetings.length > 3 && (
                  <button type="button" onClick={() => onSelectMeeting(cell.dayMeetings[3])} className="text-[10px] font-semibold text-slate-400 hover:text-blue-600 text-center w-full py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                    +{cell.dayMeetings.length - 3} more
                  </button>
                )}
              </div>

              <div />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
