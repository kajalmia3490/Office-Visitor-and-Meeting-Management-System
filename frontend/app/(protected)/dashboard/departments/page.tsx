"use client";

import {
  SimpleListPanel,
  departmentColumns,
} from "../../../components/dashboard/simple-list-panel";
import { mockDepartments } from "../../../lib/mock-data/departments";

export default function DepartmentsPage() {
  return (
    <SimpleListPanel
      title="Departments"
      description="Organizational units and department heads."
      apiPath="/departments?limit=100"
      mockItems={mockDepartments}
      columns={departmentColumns()}
    />
  );
}
