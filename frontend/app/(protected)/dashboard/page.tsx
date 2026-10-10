"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PreviewNotice } from "../../components/dashboard/preview-notice";
import { StatusBadge } from "../../components/dashboard/status-badge";
import { dashboardService, type DashboardData } from "../../lib/dashboard-service";
import { mockDashboardData } from "../../lib/mock-data/dashboard";

type Role = "admin" | "reception" | "security" | "employee" | "management";

const roleLabels: Record<Role, string> = {
  admin: "Administrator",
  reception: "Reception",
  security: "Security",
  employee: "Employee",
  management: "Management",
};

export default function DashboardHomePage() {
  const [role, setRole] = useState<Role>("admin");
  const [data, setData] = useState<DashboardData | null>(null);
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [usingPreview, setUsingPreview] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      dashboardService.get(role).then((result) => {
        if (!cancelled) {
          setData(result.data);
          setUsingPreview(result.source === "mock");
          setStatus("ready");
        }
      });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [role]);

  const dashboard = useMemo(() => data ?? mockDashboardData, [data]);
  const title =
    role === "admin" ? "Good morning, Jordan" : `${roleLabels[role]} dashboard`;

  return (
    <>
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
          <Link className="button primary" href="/dashboard/meetings">
            ＋ <span>Quick action</span>
          </Link>
        </div>
      </div>
      <PreviewNotice show={usingPreview} />
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
                        <stop offset="0%" stopColor="#2563eb" stopOpacity=".18" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
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
                <Link className="text-button" href="/dashboard/meetings">View all →</Link>
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
                    <button className="row-menu" type="button">•••</button>
                  </div>
                ))}
              </div>
              <Link className="add-button" href="/dashboard/meetings">
                ＋ Schedule a meeting
              </Link>
            </article>
          </section>
          <section className="panel table-panel">
            <div className="panel-heading">
              <div>
                <h2>Recent visitors</h2>
                <p>People who visited your office recently</p>
              </div>
              <div className="table-actions">
                <button className="button secondary" type="button">Filter</button>
                <Link className="text-button" href="/dashboard/visitors">View all →</Link>
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
                          <span className="visitor-avatar">{visitor.initials}</span>
                          <span>
                            <b>{visitor.name}</b>
                            <small>{visitor.company}</small>
                          </span>
                        </div>
                      </td>
                      <td>{visitor.host}</td>
                      <td>{visitor.time}</td>
                      <td>
                        <StatusBadge>{visitor.status}</StatusBadge>
                      </td>
                      <td>
                        <button className="row-menu" type="button">•••</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
