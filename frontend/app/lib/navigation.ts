export type NavItem = {
  label: string;
  href: string;
  icon: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "▦" },
      { label: "Visitors", href: "/dashboard/visitors", icon: "♙" },
      { label: "Appointments", href: "/dashboard/appointments", icon: "▣" },
      { label: "Active visitors", href: "/dashboard/active-visitors", icon: "◉" },
    ],
  },
  {
    label: "Meetings",
    items: [
      { label: "Meetings", href: "/dashboard/meetings", icon: "▤" },
      { label: "Meeting rooms", href: "/dashboard/meeting-rooms", icon: "⌗" },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Notifications", href: "/dashboard/notifications", icon: "♢" },
      { label: "Reports", href: "/dashboard/reports", icon: "⌁" },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Users", href: "/dashboard/users", icon: "♙" },
      { label: "Departments", href: "/dashboard/departments", icon: "⊞" },
      { label: "Audit logs", href: "/dashboard/audit-logs", icon: "≡" },
    ],
  },
];

export const SETTINGS_HREF = "/dashboard/settings";

export function pageTitleFromPath(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard";
  for (const group of NAV_GROUPS) {
    const match = group.items.find((item) => item.href === pathname);
    if (match) return match.label;
  }
  if (pathname === SETTINGS_HREF) return "Settings";
  return "Workspace";
}
