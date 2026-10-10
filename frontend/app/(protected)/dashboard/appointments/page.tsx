"use client";

import {
  SimpleListPanel,
  appointmentColumns,
} from "../../../components/dashboard/simple-list-panel";
import { mockAppointments } from "../../../lib/mock-data/appointments";

export default function AppointmentsPage() {
  return (
    <SimpleListPanel
      title="Appointments"
      description="Scheduled visits and approval status."
      apiPath="/appointments?limit=100"
      mockItems={mockAppointments}
      columns={appointmentColumns()}
    />
  );
}
