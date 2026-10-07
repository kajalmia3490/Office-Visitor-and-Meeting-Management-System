import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { CalendarView } from './components/CalendarView';
import { FastCheckInView } from './components/FastCheckInView';
import { VisitorsDesk } from './components/VisitorsDesk';
import { RoomsDesk } from './components/RoomsDesk';
import { CreateMeetingModal } from './components/CreateMeetingModal';
import { MeetingDetailsModal } from './components/MeetingDetailsModal';
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
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [reservedRoomId, setReservedRoomId] = useState<number | undefined>();

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
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.NotificationId === id ? { ...n, IsRead: true } : n));
    } catch {
      setToast({ type: 'error', message: 'Unable to mark notification as read.' });
    }
  };

  const handleDeleteMeeting = async (meeting: Meeting) => {
    try {
      await api.deleteMeeting(meeting.MeetingId);
      setSelectedMeeting(null);
      await loadData();
      setToast({ type: 'success', message: 'Meeting deleted successfully.' });
    } catch (error) {
      setToast({ type: 'error', message: error instanceof Error ? error.message : 'Unable to delete meeting.' });
    }
  };

  // Render Dashboard Overview (Full bleed, border-connected, zero extra margins)
  const renderDashboard = () => (
    <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 animate-in fade-in">
      {/* 4 Top Metric Stats: Connected edge-to-edge & divided by borders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800">
        {/* Stat 1 */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Scheduled Meetings</span>
            <div className="p-1.5 text-blue-600 dark:text-blue-400">
              <CalendarIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{stats.total_meetings}</div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+12% vs last week</span>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active Checked-In Guests</span>
            <div className="p-1.5 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{stats.active_checked_in_visitors}</div>
          <div className="text-xs text-slate-400 mt-1">Currently on premises</div>
        </div>

        {/* Stat 3 */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Registered Visitors</span>
            <div className="p-1.5 text-purple-600 dark:text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{visitors.length}</div>
          <div className="text-xs text-slate-400 mt-1">Pre-cleared guests</div>
        </div>

        {/* Stat 4 */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Conference Rooms</span>
            <div className="p-1.5 text-amber-600 dark:text-amber-400">
              <DoorOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{rooms.length}</div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">All rooms operational</div>
        </div>
      </div>

      {/* Middle Section: Visualizations / Charts (Visitor Trends, Room Utilization, Status Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800">
        {/* Chart 1: Weekly Visitor & Meeting Volume Bar Chart (7 cols) */}
        <div className="lg:col-span-7 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Weekly Visitor & Meeting Traffic</h3>
              <p className="text-xs text-slate-400">Total volume of scheduled meetings vs checked-in visitors across 7 days</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Meetings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Visitors</span>
              </div>
            </div>
          </div>

          {/* Bar Visualization */}
          <div className="pt-4 flex items-end justify-between gap-3 h-44 border-b border-slate-100 dark:border-slate-800 pb-2">
            {[
              { day: 'Mon', meetings: 40, visitors: 30, mCount: 4, vCount: 3 },
              { day: 'Tue', meetings: 65, visitors: 55, mCount: 7, vCount: 6 },
              { day: 'Wed', meetings: 90, visitors: 80, mCount: 9, vCount: 8 },
              { day: 'Thu', meetings: 75, visitors: 65, mCount: 8, vCount: 7 },
              { day: 'Fri', meetings: 85, visitors: 95, mCount: 9, vCount: 10 },
              { day: 'Sat', meetings: 30, visitors: 20, mCount: 3, vCount: 2 },
              { day: 'Sun', meetings: 15, visitors: 10, mCount: 1, vCount: 1 },
            ].map((bar) => (
              <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-1.5 h-full">
                  {/* Meeting Bar */}
                  <div
                    style={{ height: `${bar.meetings}%` }}
                    className="w-full max-w-[14px] bg-blue-600 dark:bg-blue-500 rounded-t-sm transition-all group-hover:opacity-85 relative"
                    title={`Meetings: ${bar.mCount}`}
                  />
                  {/* Visitor Bar */}
                  <div
                    style={{ height: `${bar.visitors}%` }}
                    className="w-full max-w-[14px] bg-emerald-500 dark:bg-emerald-400 rounded-t-sm transition-all group-hover:opacity-85 relative"
                    title={`Visitors: ${bar.vCount}`}
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{bar.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Room Occupancy & Status Progress Breakdown (5 cols) */}
        <div className="lg:col-span-5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Room Capacity & Utilization</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              Live Feed
            </span>
          </div>

          <div className="space-y-3.5 pt-1">
            {[
              { room: 'Zoom Innovation Lab', percent: 75, status: 'In Use (9/12)', color: 'bg-blue-600' },
              { room: 'Boardroom 775', percent: 85, status: 'In Use (17/20)', color: 'bg-indigo-600' },
              { room: 'Creative UI Studio', percent: 40, status: 'Available (3/8)', color: 'bg-emerald-500' },
              { room: 'Focus Room A', percent: 25, status: 'Available (1/4)', color: 'bg-amber-500' },
            ].map((item) => (
              <div key={item.room} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.room}</span>
                  <span className="text-slate-400 text-[11px] font-medium">{item.status}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${item.percent}%` }}
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content: Agenda and Scope connected directly underneath */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
        {/* Left Column: Today's Agenda & Meetings */}
        <div className="lg:col-span-8 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Today's Agenda & Meetings</h3>
            <button
              onClick={() => setCurrentTab('calendar')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View Full Calendar →
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {meetings.slice(0, 4).map((m) => (
              <div key={m.MeetingId} className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-lg transition-colors">
                <div className="flex items-center gap-4">
                  <div className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono w-16">
                    {new Date(m.StartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{m.Title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Host: {m.HostName} • Room: {m.RoomName}</p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {m.MeetingType}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Project Scope & Modules */}
        <div className="lg:col-span-4 p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Project Scope & Modules</span>
            </div>

            <ul className="mt-4 space-y-3 text-xs">
              <li className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>1. Requirement Analysis & Use Cases</span>
              </li>
              <li className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>2. UML & System Planning</span>
              </li>
              <li className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>3. MS SQL Server Database & TinyOffice UI</span>
              </li>
              <li className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>4. Visitor Registration & Check-In Desk</span>
              </li>
              <li className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>5. Automated Test Cases & API Docs</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            Database Server: <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold">SERVER\KAJAL</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Fixed Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />

      {/* Main Content Area (Independent Scrollable Container) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onOpenQuickSearch={() => setIsQuickSearchOpen(true)}
          isDark={isDark}
          onToggleTheme={() => setIsDark(!isDark)}
        />

        <main className={`flex-1 w-full overflow-y-auto ${currentTab === 'dashboard' ? 'p-0' : 'p-6 sm:p-8 max-w-7xl mx-auto'}`}>
          {currentTab === 'dashboard' && renderDashboard()}
          {currentTab === 'calendar' && (
            <CalendarView
              meetings={meetings}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
              onSelectMeeting={(m) => setSelectedMeeting(m)}
            />
          )}
          {currentTab === 'visitors' && (
            <VisitorsDesk visitors={visitors} meetings={meetings} onRefresh={loadData} onError={(message) => setToast({ type: 'error', message })} />
          )}
          {currentTab === 'checkin' && <FastCheckInView onSuccess={(message) => setToast({ type: 'success', message })} onError={(message) => setToast({ type: 'error', message })} onRefresh={loadData} />}
          {currentTab === 'rooms' && (
            <RoomsDesk rooms={rooms} onRefresh={loadData} onReserveRoom={(room) => { setReservedRoomId(room.RoomId); setIsCreateModalOpen(true); }} />
          )}
          {(currentTab === 'company' || currentTab === 'activities' || currentTab === 'job_management' || currentTab === 'payroll' || currentTab === 'settings') && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center py-16">
              <FileText className="w-12 h-12 text-blue-500 mx-auto mb-3 opacity-80" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize">{currentTab.replace('_', ' ')} Module</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Configured for TinyOffice Enterprise. Use the Calendar and Visitors Desk for core workflow actions.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Schedule Meeting Drawer */}
      <CreateMeetingModal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); setReservedRoomId(undefined); setEditingMeeting(null); }}
        onSuccess={async () => { await loadData(); setToast({ type: 'success', message: editingMeeting ? 'Meeting updated successfully.' : 'Meeting scheduled successfully.' }); }}
        onError={(message) => setToast({ type: 'error', message })}
        visitors={visitors}
        rooms={rooms}
        users={users}
        initialRoomId={reservedRoomId}
        editingMeeting={editingMeeting}
      />

      {selectedMeeting && (
        <MeetingDetailsModal
          meeting={selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
          onEdit={(meeting) => { setSelectedMeeting(null); setEditingMeeting(meeting); setIsCreateModalOpen(true); }}
          onDelete={handleDeleteMeeting}
        />
      )}

      {toast && (
        <div role="status" className={`fixed bottom-6 right-6 z-[60] max-w-sm rounded-xl px-4 py-3 text-sm font-medium text-white shadow-xl ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {toast.message}
        </div>
      )}

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
