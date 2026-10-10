"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth/auth-context";
import {
  NAV_GROUPS,
  SETTINGS_HREF,
  pageTitleFromPath,
} from "../../lib/navigation";

const roleLabels: Record<string, string> = {
  admin: "Administrator",
  reception: "Reception",
  security: "Security",
  employee: "Employee",
  management: "Management",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const role = user?.role ?? "admin";
  const canAdmin = role === "admin";
  const pageTitle = pageTitleFromPath(pathname);
  const displayName = user?.name ?? "User";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="app-shell">
      <div
        className={`sidebar-overlay ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
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
          {NAV_GROUPS.map((group) => {
            if (group.label === "Administration" && !canAdmin) return null;
            return (
              <div className="nav-group" key={group.label}>
                <p>{group.label}</p>
                {group.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <Link
                      className={active ? "nav-item active" : "nav-item"}
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="nav-icon">{item.icon}</span>
                      {item.label}
                      <span className="nav-arrow">
                        {item.href === "/dashboard" ? "→" : ""}
                      </span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <Link
            className={
              pathname === SETTINGS_HREF ? "nav-item active" : "nav-item"
            }
            href={SETTINGS_HREF}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="nav-icon">⚙</span>
            Settings
          </Link>
          <div className="help-card">
            <span className="help-icon">?</span>
            <div>
              <b>Need help?</b>
              <small>Visit our help center</small>
            </div>
            <span>↗</span>
          </div>
          <div className="user-mini user-mini-interactive">
            <span className="avatar">{initials(displayName)}</span>
            <span>
              <b>{displayName}</b>
              <small>{roleLabels[role] ?? role}</small>
            </span>
            <button
              type="button"
              className="more"
              aria-label="User menu"
              onClick={() => setUserMenuOpen((open) => !open)}
            >
              •••
            </button>
            {userMenuOpen && (
              <div className="user-dropdown">
                <button type="button" onClick={handleLogout}>Log out</button>
              </div>
            )}
          </div>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <button
            className="mobile-menu"
            aria-label="Open menu"
            type="button"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <div className="breadcrumb">
            <span>Workspace</span>
            <b>/</b>
            <strong>{pageTitle}</strong>
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
              type="button"
              onClick={() => setDark(!dark)}
            >
              {dark ? "☀" : "☾"}
            </button>
            <Link
              className="icon-button notification"
              aria-label="Notifications"
              href="/dashboard/notifications"
            >
              ♢<i />
            </Link>
            <div className="top-avatar">{initials(displayName)}</div>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
