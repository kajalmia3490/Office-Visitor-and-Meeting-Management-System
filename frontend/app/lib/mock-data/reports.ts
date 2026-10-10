export const mockReportCards = [
  {
    id: "visitors",
    title: "Visitor reports",
    description: "Arrivals, trends, and visit types for a date range.",
    endpoint: "/reports/visitors",
  },
  {
    id: "meetings",
    title: "Meeting reports",
    description: "Scheduled meetings and utilization summaries.",
    endpoint: "/reports/meetings",
  },
  {
    id: "rooms",
    title: "Room utilization",
    description: "Occupancy and booking patterns by room.",
    endpoint: "/reports/rooms",
  },
  {
    id: "active",
    title: "Active visitors",
    description: "Who is currently checked in on site.",
    endpoint: "/reports/active-visitors",
  },
];

export const mockReportRows = [
  {
    label: "Total visits",
    value: "284",
    period: "Last 30 days",
  },
  {
    label: "Unique visitors",
    value: "156",
    period: "Last 30 days",
  },
  {
    label: "Average visit duration",
    value: "1h 24m",
    period: "Last 30 days",
  },
];
