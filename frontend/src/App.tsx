import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { CalendarView } from './components/CalendarView';
import { FastCheckInView } from './components/FastCheckInView';
import { VisitorsDesk } from './components/VisitorsDesk';
import { RoomsDesk } from './components/RoomsDesk';
import { CreateMeetingModal } from './components/CreateMeetingModal';
import { api } from './services/api';
import { Meeting, Visitor, Room, User, NotificationItem } from './types';
import { 
  Users, 
  Calendar as CalendarIcon, 
  DoorOpen, 
  CheckCircle2, 
  Clock, 
  Building2,
  FileText,
  ShieldCheck,
  TrendingUp,
  Search,
  X
} from 'lucide-react';

export function App() {
  const [isDark, setIsDark] = useState(false);
  const [currentTab, setCurrentTab] = useState('calendar');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState({
    total_meetings: 4,
    active_checked_in_visitors: 1,
    total_visitors: 3,
    total_rooms: 4,
    upcoming_meetings: 3
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Apply dark mode class to root
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Keyboard shortcut listener ⌘ + S / Ctrl + S for Quick Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setIsQuickSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsQuickSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadData = async () => {
    await api.seedDb();
    const [m, v, r, u, notifs, st] = await Promise.all([
      api.getMeetings(),
      api.getVisitors(),
      api.getRooms(),
      api.getUsers(),
      api.getNotifications(1),
      api.getStats()
    ]);
    setMeetings(m);
    setVisitors(v);
    setRooms(r);
    setUsers(u);
    setNotifications(notifs);
    setStats(st);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkRead = async (id: number) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.NotificationId === id ? { ...n, IsRead: true } : n));
  };

  // Render Dashboard Overview
  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Executive Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Real-time overview of office visitors, room occupancies, and scheduled host meetings.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scheduled Meetings</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
              <CalendarIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{stats.total_meetings}</div>
          <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+12% vs last week</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Checked-In Guests</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{stats.active_checked_in_visitors}</div>
          <div className="text-xs text-slate-400 mt-1">Currently on premises</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Registered Visitors</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{visitors.length}</div>
          <div className="text-xs text-slate-400 mt-1">Pre-cleared guests</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Conference Rooms</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl">
              <DoorOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{rooms.length}</div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">All rooms operational</div>
        </div>
      </div>

      {/* Activity & Quick Schedule Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Today's Agenda & Meetings</h3>
            <button
              onClick={() => setCurrentTab('calendar')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View Full Calendar →
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
            {meetings.slice(0, 3).map((m) => (
              <div key={m.MeetingId} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 font-bold text-xs">
                    {new Date(m.StartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{m.Title}</h4>
                    <p className="text-xs text-slate-400">Host: {m.HostName} • Room: {m.RoomName}</p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {m.MeetingType}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* System Architecture & Scope Status */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Project Scope & Modules</span>
            </div>

            <ul className="mt-4 space-y-2.5 text-xs">
              <li className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>1. Requirement Analysis & Use Cases</span>
              </li>
              <li className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>2. UML & System Planning</span>
              </li>
              <li className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>3. MS SQL Server Database & Sage UI</span>
              </li>
              <li className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>4. Visitor Registration & Check-In Desk</span>
              </li>
              <li className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>5. Automated Test Cases & API Docs</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            Database Server: <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold">SERVER\KAJAL</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onOpenQuickSearch={() => setIsQuickSearchOpen(true)}
          isDark={isDark}
          onToggleTheme={() => setIsDark(!isDark)}
        />

        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && renderDashboard()}
          {currentTab === 'calendar' && (
            <CalendarView
              meetings={meetings}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
              onSelectMeeting={(m) => alert(`Selected meeting: ${m.Title}`)}
            />
          )}
          {currentTab === 'visitors' && (
            <VisitorsDesk visitors={visitors} onRefresh={loadData} />
          )}
          {currentTab === 'checkin' && <FastCheckInView />}
          {currentTab === 'rooms' && (
            <RoomsDesk rooms={rooms} onRefresh={loadData} />
          )}
          {(currentTab === 'company' || currentTab === 'activities' || currentTab === 'job_management' || currentTab === 'payroll' || currentTab === 'settings') && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center py-16">
              <FileText className="w-12 h-12 text-blue-500 mx-auto mb-3 opacity-80" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize">{currentTab.replace('_', ' ')} Module</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Configured for Sage Enterprise. Use the Calendar and Visitors Desk for core workflow actions.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Schedule Meeting Drawer */}
      <CreateMeetingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadData}
        visitors={visitors}
        rooms={rooms}
        users={users}
      />

      {/* Quick Search Modal (⌘ + S) */}
      {isQuickSearchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type a command or search meetings, guests, rooms..."
                className="w-full bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none"
              />
              <button onClick={() => setIsQuickSearchOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3 space-y-1 max-h-80 overflow-y-auto text-xs">
              <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase">Meetings</div>
              {meetings
                .filter(m => m.Title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(m => (
                  <div
                    key={m.MeetingId}
                    onClick={() => { setCurrentTab('calendar'); setIsQuickSearchOpen(false); }}
                    className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{m.Title}</span>
                    <span className="text-slate-400">{m.MeetingType}</span>
                  </div>
                ))}

              <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase pt-2">Visitors</div>
              {visitors
                .filter(v => v.FullName.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(v => (
                  <div
                    key={v.VisitorId}
                    onClick={() => { setCurrentTab('visitors'); setIsQuickSearchOpen(false); }}
                    className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{v.FullName}</span>
                    <span className="text-slate-400">{v.Company}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
