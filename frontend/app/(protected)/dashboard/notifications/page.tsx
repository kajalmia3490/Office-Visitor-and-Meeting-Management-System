"use client";

import {
  SimpleListPanel,
  notificationColumns,
} from "../../../components/dashboard/simple-list-panel";
import { mockNotifications } from "../../../lib/mock-data/notifications";

export default function NotificationsPage() {
  return (
    <SimpleListPanel
      title="Notifications"
      description="Updates about visitors, meetings, and appointments."
      apiPath="/notifications?limit=100"
      mockItems={mockNotifications}
      columns={notificationColumns()}
    />
  );
}
