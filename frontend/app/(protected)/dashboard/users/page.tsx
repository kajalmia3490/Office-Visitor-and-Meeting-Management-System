"use client";

import { SimpleListPanel, userColumns } from "../../../components/dashboard/simple-list-panel";
import { mockUsers } from "../../../lib/mock-data/users";

export default function UsersPage() {
  return (
    <SimpleListPanel
      title="Users"
      description="Application users and roles."
      apiPath="/users?limit=100"
      mockItems={mockUsers}
      columns={userColumns()}
    />
  );
}
