import React from 'react';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Building2, 
  Activity, 
  Briefcase, 
  CreditCard, 
  Settings, 
  Grid, 
  Sun, 
  Moon,
  Users,
  QrCode,
  DoorOpen
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, isDark, setIsDark }) => {
  const mainNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'visitors', label: 'Visitors Desk', icon: Users },
    { id: 'checkin', label: 'Fast Check-In', icon: QrCode },
    { id: 'rooms', label: 'Meeting Rooms', icon: DoorOpen },
    { id: 'company', label: 'Company', icon: Building2, hasSub: true },
    { id: 'activities', label: 'Activities', icon: Activity, hasSub: true },
    { id: 'job_management', label: 'Job Management', icon: Briefcase, hasSub: true },
    { id: 'payroll', label: 'Payroll', icon: CreditCard },
  ];

  return (
    <aside className="w-64 min-h-screen bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between p-4 select-none shrink-0 transition-colors duration-200">
      <div>
        {/* Brand Logo matching Sage template */}
        <div className="flex items-center gap-2.5 px-3 py-4 mb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-500/20">
            S
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Sage</span>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.hasSub && (
                  <span className="text-slate-400 text-xs">›</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions & Theme Switcher */}
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <button 
            onClick={() => setCurrentTab('settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
              currentTab === 'settings'
                ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings</span>
          </button>
          <button 
            onClick={() => setCurrentTab('integration')}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
          >
            <Grid className="w-4 h-4 text-slate-400" />
            <span>Integration</span>
          </button>
        </div>

        {/* Theme Toggle Pill */}
        <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
          <button
            onClick={() => setIsDark(false)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all ${
              !isDark ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold' : 'hover:text-slate-900'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Light</span>
          </button>
          <button
            onClick={() => setIsDark(true)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all ${
              isDark ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold' : 'hover:text-slate-900'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-blue-400" />
            <span>Dark</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
