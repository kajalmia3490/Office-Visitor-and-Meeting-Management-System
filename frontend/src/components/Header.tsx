import React, { useState, useEffect } from 'react';
import { Search, Bell, Sun, Moon, Clock, CheckCircle } from 'lucide-react';
import { NotificationItem } from '../types';

interface HeaderProps {
  notifications: NotificationItem[];
  onMarkRead: (id: number) => void;
  onOpenQuickSearch: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  notifications, 
  onMarkRead, 
  onOpenQuickSearch,
  isDark,
  onToggleTheme
}) => {
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const unreadCount = notifications.filter((n) => !n.IsRead).length;

  // Real-time ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format Date: e.g. "Wed, 30 Sep 2026"
  const formattedDate = currentTime.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // Format Time: e.g. "10:09:45 PM"
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return (
    <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Compact Search Button (Clean, No border) */}
      <div className="flex items-center">
        <button
          onClick={onOpenQuickSearch}
          aria-label="Quick Search"
          title="Search (⌘ + S)"
          className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-2 group active:scale-95"
        >
          <Search className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-400">
            <span>⌘S</span>
          </div>
        </button>
      </div>

      {/* Right Controls: Live Date/Time, Theme Switcher Icon, Notification, Profile */}
      <div className="flex items-center gap-2">
        {/* Live Date and Time Pill (Clean, No background, No border) */}
        <div className="hidden lg:flex items-center gap-2 mr-2 text-xs font-medium text-slate-700 dark:text-slate-300">
          <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
          <span className="text-slate-500 dark:text-slate-400">{formattedDate}</span>
          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
          <span className="font-mono font-semibold text-slate-900 dark:text-white tracking-wide">{formattedTime}</span>
        </div>

        {/* Icon-Only Theme Toggle (Clean, No border, No shadow) */}
        <button
          onClick={onToggleTheme}
          aria-label="Toggle Theme"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-5 h-5 text-slate-700 dark:text-slate-300 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Notifications Dropdown (Clean, No border, No shadow) */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            aria-label="Notifications"
            title="Notifications"
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all relative active:scale-95"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Notifications</h3>
                <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                  {unreadCount} unread
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto mt-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No new notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.NotificationId}
                      onClick={() => onMarkRead(n.NotificationId)}
                      className={`py-3 px-2 flex items-start gap-3 rounded-xl cursor-pointer transition-colors ${
                        !n.IsRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shrink-0">
                        {n.NotificationType === 'VisitorArrival' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{n.Title}</div>
                        <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{n.Message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill matching Sage mockup */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
            alt="Washi Mazumder"
            className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/20 shadow-xs"
          />
          <div className="hidden sm:block text-left">
            <div className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">Washi Mazumder</div>
            <div className="text-xs text-slate-400">Lead Product Manager</div>
          </div>
        </div>
      </div>
    </header>
  );
};
