"use client";

import { AuthProvider } from "../lib/auth/auth-context";
import { AuthGate } from "../components/dashboard/auth-gate";
import { DashboardShell } from "../components/dashboard/shell";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AuthGate>
        <DashboardShell>{children}</DashboardShell>
      </AuthGate>
    </AuthProvider>
  );
}
