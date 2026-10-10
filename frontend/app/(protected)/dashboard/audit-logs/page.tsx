"use client";

import { SimpleListPanel, auditColumns } from "../../../components/dashboard/simple-list-panel";
import { mockAuditLogs } from "../../../lib/mock-data/audit-logs";

export default function AuditLogsPage() {
  return (
    <SimpleListPanel
      title="Audit logs"
      description="Read-only system activity records."
      apiPath="/audit-logs?limit=100"
      mockItems={mockAuditLogs}
      columns={auditColumns()}
    />
  );
}
