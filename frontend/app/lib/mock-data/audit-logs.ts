export const mockAuditLogs = [
  {
    _id: "demo-audit-1",
    createdAt: "2026-10-08T09:15:00.000Z",
    user: { name: "Sarah Chen", email: "sarah.chen@acme.com" },
    action: "create",
    module: "visitor",
    description: "Registered visitor Olivia Martin",
    ip: "192.168.1.42",
  },
  {
    _id: "demo-audit-2",
    createdAt: "2026-10-08T08:45:00.000Z",
    user: { name: "Jordan Davis", email: "demo@example.com" },
    action: "update",
    module: "meeting",
    description: "Updated meeting Q4 Product Planning",
    ip: "10.0.0.12",
  },
  {
    _id: "demo-audit-3",
    createdAt: "2026-10-07T16:20:00.000Z",
    user: { name: "James Wilson", email: "james.wilson@acme.com" },
    action: "login",
    module: "auth",
    description: "User signed in",
    ip: "203.0.113.8",
  },
];
