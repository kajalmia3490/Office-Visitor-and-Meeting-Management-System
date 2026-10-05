"use client";

import { useEffect, useMemo, useState } from "react";
import { dashboardService, type DashboardData } from "../lib/dashboard-service";

type Role = "admin" | "reception" | "security" | "employee" | "management";

const roleLabels: Record<Role, string> = {
  admin: "Administrator",
  reception: "Reception",
  security: "Security",
  employee: "Employee",
  management: "Management",
};

const navGroups = [
  {
    label: "Workspace",
    items: [
      ["Dashboard", "▦"],
      ["Visitors", "♙"],
      ["Appointments", "▣"],
      ["Active visitors", "◉"],
    ],
  },
  {
    label: "Meetings",
    items: [
      ["Meetings", "▤"],
      ["Meeting rooms", "⌗"],
    ],
  },
  {
    label: "Insights",
    items: [
      ["Notifications", "♢"],
      ["Reports", "⌁"],
    ],
  },
  {
    label: "Administration",
    items: [
      ["Users", "♙"],
      ["Departments", "⊞"],
      ["Audit logs", "≡"],
    ],
  },
];

const fallbackData: DashboardData = {
  stats: [
    {
      label: "Total visitors",
      value: "1,284",
      change: "+12.5%",
      trend: "up",
      icon: "♙",
      tone: "blue",
    },
    {
      label: "Today’s visits",
      value: "48",
      change: "+8.2%",
      trend: "up",
      icon: "▣",
      tone: "violet",
    },
    {
      label: "Active visitors",
      value: "12",
      change: "3 waiting",
      trend: "neutral",
      icon: "◉",
      tone: "green",
    },
    {
      label: "Today’s meetings",
      value: "24",
      change: "6 upcoming",
      trend: "neutral",
      icon: "▤",
      tone: "orange",
    },
  ],
  recentVisitors: [
    {
      name: "Olivia Martin",
      company: "Acme Corporation",
      host: "James Wilson",
      time: "09:15 AM",
      status: "Checked in",
      initials: "OM",
    },
    {
      name: "Ethan Miller",
      company: "Vertex Labs",
      host: "Sarah Chen",
      time: "10:00 AM",
      status: "Expected",
      initials: "EM",
    },
    {
      name: "Sophia Davis",
      company: "Northstar Inc.",
      host: "Michael Brown",
      time: "10:30 AM",
      status: "Checked in",
      initials: "SD",
    },
    {
      name: "Noah Williams",
      company: "Pioneer Group",
      host: "Emily Johnson",
      time: "11:45 AM",
      status: "Expected",
      initials: "NW",
    },
  ],
  upcomingMeetings: [
    {
      title: "Q4 Product Planning",
      time: "10:30 AM – 11:30 AM",
      room: "Atlas · 3rd floor",
      people: "8 attendees",
      color: "blue",
    },
    {
      title: "Design review",
      time: "01:00 PM – 02:00 PM",
      room: "Focus room 2",
      people: "4 attendees",
      color: "violet",
    },
    {
      title: "Partner sync",
      time: "03:30 PM – 04:00 PM",
      room: "Boardroom",
      people: "6 attendees",
      color: "orange",
    },
  ],
};

function Badge({ children }: { children: string }) {
  return (
    <span className={`badge badge-${children.toLowerCase().replace(" ", "-")}`}>
      <i />
      {children}
    </span>
  );
}

function Sidebar({
  role,
  open,
  onClose,
}: {
  role: Role;
  open: boolean;
  onClose: () => void;
}) {
  const canAdmin = role === "admin";
  return (
    <>
      <div
        className={`sidebar-overlay ${open ? "visible" : ""}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">O</span>
          <span>
            Office<span className="brand-accent">Flow</span>
          </span>
        </div>
        <div className="workspace-switcher">
          <span className="workspace-avatar">AC</span>
          <span>
            <b>Acme Corp.</b>
            <small>HQ workspace</small>
          </span>
          <span className="chevron">⌄</span>
        </div>
        <nav>
          {navGroups.map((group) => {
            if (group.label === "Administration" && !canAdmin) return null;
            return (
              <div className="nav-group" key={group.label}>
                <p>{group.label}</p>
                {group.items.map(([label, icon]) => (
                  <button
                    className={
                      label === "Dashboard" ? "nav-item active" : "nav-item"
                    }
                    key={label}
                    onClick={onClose}
                  >
                    <span className="nav-icon">{icon}</span>
                    {label}
                    <span className="nav-arrow">
                      {label === "Dashboard" ? "→" : ""}
                    </span>
                  </button>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item">
            <span className="nav-icon">⚙</span>Settings
          </button>
          <div className="help-card">
            <span className="help-icon">?</span>
            <div>
              <b>Need help?</b>
              <small>Visit our help center</small>
            </div>
            <span>↗</span>
          </div>
          <div className="user-mini">
            <span className="avatar">JD</span>
            <span>
              <b>Jordan Davis</b>
              <small>{roleLabels[role]}</small>
            </span>
            <span className="more">•••</span>
          </div>
        </div>
      </aside>
    </>
  );
}

export default function Home() {
  const [role, setRole] = useState<Role>("admin");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [usingPreview, setUsingPreview] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    let cancelled = false;
    dashboardService
      .get(role)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setUsingPreview(false);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(fallbackData);
          setUsingPreview(true);
          setStatus("ready");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [role]);

  const dashboard = useMemo(() => data ?? fallbackData, [data]);
  const title =
    role === "admin" ? "Good morning, Jordan" : `${roleLabels[role]} dashboard`;

  return (
    <div className="app-shell">
      <Sidebar
        role={role}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="main-content">
        <header className="topbar">
          <button
            className="mobile-menu"
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <div className="breadcrumb">
            <span>Workspace</span>
            <b>/</b>
            <strong>Dashboard</strong>
          </div>
          <div className="top-actions">
            <label className="search">
              <span>⌕</span>
              <input aria-label="Search" placeholder="Search anything..." />
              <kbd>⌘ K</kbd>
            </label>
            <button
              className="icon-button"
              aria-label="Toggle theme"
              onClick={() => setDark(!dark)}
            >
              {dark ? "☀" : "☾"}
            </button>
            <button
              className="icon-button notification"
              aria-label="Notifications"
            >
              ♢<i />
            </button>
            <div className="top-avatar">JD</div>
          </div>
        </header>
        <div className="page-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">Monday, October 5, 2026</p>
              <h1>{title}</h1>
              <p className="subheading">
                Here&apos;s what&apos;s happening across your office today.
              </p>
            </div>
            <div className="heading-actions">
              <select
                value={role}
                onChange={(e) => {
                  setStatus("loading");
                  setRole(e.target.value as Role);
                }}
                aria-label="Preview role"
              >
                <option value="admin">Admin view</option>
                <option value="reception">Reception view</option>
                <option value="security">Security view</option>
                <option value="employee">Employee view</option>
                <option value="management">Management view</option>
              </select>
              <button className="button primary">
                ＋ <span>Quick action</span>
              </button>
            </div>
          </div>
          {usingPreview && (
            <div className="preview-notice">
              Preview data is shown while the dashboard API is unavailable.
              Connect the backend to load live data.
            </div>
          )}
          {status === "loading" ? (
            <div className="loading-state">
              <span className="spinner" />
              Loading dashboard...
            </div>
          ) : (
            <>
              <section className="stat-grid">
                {dashboard.stats.map((stat) => (
                  <article className="stat-card" key={stat.label}>
                    <div className={`stat-icon ${stat.tone}`}>{stat.icon}</div>
                    <div className="stat-info">
                      <p>{stat.label}</p>
                      <strong>{stat.value}</strong>
                      <small className={stat.trend === "up" ? "positive" : ""}>
                        {stat.trend === "up" && "↗ "}
                        {stat.change} <em>vs last week</em>
                      </small>
                    </div>
                    <span className="card-menu">•••</span>
                  </article>
                ))}
              </section>
              <section className="dashboard-grid">
                <article className="panel activity-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Visitor activity</h2>
                      <p>Visits over the last 7 days</p>
                    </div>
                    <select aria-label="Activity range">
                      <option>Last 7 days</option>
                      <option>Last 30 days</option>
                    </select>
                  </div>
                  <div className="chart">
                    <div className="chart-y">
                      <span>80</span>
                      <span>60</span>
                      <span>40</span>
                      <span>20</span>
                      <span>0</span>
                    </div>
                    <div className="chart-area">
                      <div className="grid-lines">
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                      </div>
                      <svg
                        viewBox="0 0 600 190"
                        preserveAspectRatio="none"
                        role="img"
                        aria-label="Visitor activity chart"
                      >
                        <defs>
                          <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
                            <stop
                              offset="0%"
                              stopColor="#2563eb"
                              stopOpacity=".18"
                            />
                            <stop
                              offset="100%"
                              stopColor="#2563eb"
                              stopOpacity="0"
                            />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0 145 C40 130 55 140 90 110 S145 130 180 95 S230 105 260 80 S320 95 350 60 S410 95 445 70 S500 65 530 40 S575 60 600 20 V190 H0Z"
                          fill="url(#fill)"
                        />
                        <path
                          d="M0 145 C40 130 55 140 90 110 S145 130 180 95 S230 105 260 80 S320 95 350 60 S410 95 445 70 S500 65 530 40 S575 60 600 20"
                          fill="none"
                          stroke="#2563eb"
                          strokeWidth="3"
                        />
                      </svg>
                      <div className="chart-x">
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                        <span>Sun</span>
                      </div>
                    </div>
                  </div>
                </article>
                <article className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Upcoming meetings</h2>
                      <p>Your schedule for today</p>
                    </div>
                    <button className="text-button">View all →</button>
                  </div>
                  <div className="meeting-list">
                    {dashboard.upcomingMeetings.map((meeting) => (
                      <div className="meeting-row" key={meeting.title}>
                        <span className={`meeting-dot ${meeting.color}`} />
                        <div>
                          <b>{meeting.title}</b>
                          <p>{meeting.time}</p>
                          <small>
                            {meeting.room} · {meeting.people}
                          </small>
                        </div>
                        <button className="row-menu">•••</button>
                      </div>
                    ))}
                  </div>
                  <button className="add-button">＋ Schedule a meeting</button>
                </article>
              </section>
              <section className="panel table-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Recent visitors</h2>
                    <p>People who visited your office recently</p>
                  </div>
                  <div className="table-actions">
                    <button className="button secondary">Filter</button>
                    <button className="text-button">View all →</button>
                  </div>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Visitor</th>
                        <th>Host</th>
                        <th>Visit time</th>
                        <th>Status</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.recentVisitors.map((visitor) => (
                        <tr key={visitor.name}>
                          <td>
                            <div className="visitor-cell">
                              <span className="visitor-avatar">
                                {visitor.initials}
                              </span>
                              <span>
                                <b>{visitor.name}</b>
                                <small>{visitor.company}</small>
                              </span>
                            </div>
                          </td>
                          <td>{visitor.host}</td>
                          <td>{visitor.time}</td>
                          <td>
                            <Badge>{visitor.status}</Badge>
                          </td>
                          <td>
                            <button className="row-menu">•••</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
