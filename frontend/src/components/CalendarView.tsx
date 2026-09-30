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
  Calendar as CalendarIcon,
  SunMedium,
  Umbrella,
  Briefcase,
  Users
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

  // Preview Cards from the Sage template
  const upcomingMeeting = meetings.find(m => m.MeetingType === 'Meeting') || meetings[0];
  const upcomingWorkshop = meetings.find(m => m.MeetingType === 'Workshop');
  const upcomingHoliday = meetings.find(m => m.MeetingType === 'Holiday');
  const upcomingLeave = meetings.find(m => m.MeetingType === 'Leave');

  // Days in month simulation
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // 35-cell grid simulation for August/October calendar
  const calendarCells = [
    { day: 28, isPrevMonth: true, items: [] },
    { day: 29, isPrevMonth: true, items: [] },
    { 
      day: 30, 
      isPrevMonth: true, 
      items: [
        { title: '10:00A - Marketing Review', color: 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300' },
        { title: '10:40A - Creative UI Handover', color: 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300' },
        { title: 'Birth... Sarah Conner', color: 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300' }
      ] 
    },
    { day: 31, isPrevMonth: true, items: [] },
    { 
      day: 1, 
      items: [
        { title: '12:40P - Marketing Sync', color: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300' },
        { title: '2:30 P - Client Pitch', color: 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300' }
      ] 
    },
    { day: 2, items: [] },
    { day: 3, items: [] },
    { 
      day: 4, 
      items: [
        { title: '🏖️ Holiday - Independence', color: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300' }
      ] 
    },
    { 
      day: 5, 
      items: [
        { title: '1:00 P - Client Onboarding', color: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300' },
        { title: '2:30 P - Front Desk Sync', color: 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300' },
        { title: '4:30 P - Workshop Kickoff', color: 'bg-cyan-50 border-cyan-200 text-cyan-700 dark:bg-cyan-950/40 dark:border-cyan-800 dark:text-cyan-300' }
      ] 
    },
    { day: 6, items: [] },
    { 
      day: 7, 
      items: [
        { title: '🌴 Leave - Alex M.', color: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300' },
        { title: '🌴 Leave - Barbara G.', color: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300' },
        { title: '3:30 P - Product Demo', color: 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300' }
      ] 
    },
    { day: 8, items: [] },
    { day: 9, items: [] },
    { day: 10, items: [] },
    { day: 11, items: [] },
    { day: 12, items: [] },
    { day: 13, items: [] },
    { day: 14, items: [] },
    { day: 15, items: [] },
    { day: 16, items: [] },
    { day: 17, items: [] },
  ];

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
            Creative UI Workshop
          </h3>
          <p className="text-xs text-slate-400 mt-1">20th. August 2026</p>
          
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>1 Day Off</span>
          </div>
        </div>

        {/* Card 3: Upcoming Event */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-3">
            <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-base">📅</span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Upcoming Event</span>
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
            Executive Briefing
          </h3>
          <p className="text-xs text-slate-400 mt-1">10:40AM - 12:05PM (4th. Oct)</p>
          
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 truncate">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span className="truncate">775 Rolling Green Rd.</span>
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
              alt="Barbara" 
              className="w-5 h-5 rounded-full object-cover" 
            />
            <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
              Barbara Gordon
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">6th. October 2026</p>
          
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Full Day Leave</span>
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
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* View Switchers & Date Picker */}
        <div className="flex items-center gap-3 self-end md:self-auto">
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
            <span>24. October 2026</span>
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
          {calendarCells.map((cell, idx) => (
            <div
              key={idx}
              className={`min-h-[110px] p-2.5 flex flex-col justify-between transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40 ${
                cell.isPrevMonth ? 'bg-slate-50/30 dark:bg-slate-900/40 opacity-60' : ''
              }`}
            >
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {cell.day}
              </div>

              {/* Badges / Events inside cell */}
              <div className="space-y-1 my-1">
                {cell.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-lg border truncate shadow-2xs ${item.color}`}
                  >
                    {item.title}
                  </div>
                ))}
                {cell.items.length > 2 && (
                  <button className="text-[10px] font-semibold text-slate-400 hover:text-blue-600 text-center w-full py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                    More
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
