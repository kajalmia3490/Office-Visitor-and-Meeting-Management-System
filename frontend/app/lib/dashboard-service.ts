import { apiRequest } from "./api-client";

export type DashboardStat = {
  label: string;
  value: string;
  change: string;
  trend: string;
  icon: string;
  tone: string;
};

export type DashboardData = {
  stats: DashboardStat[];
  recentVisitors: {
    name: string;
    company: string;
    host: string;
    time: string;
    status: string;
    initials: string;
  }[];
  upcomingMeetings: {
    title: string;
    time: string;
    room: string;
    people: string;
    color: string;
  }[];
};

type Role = "admin" | "reception" | "security" | "employee" | "management";
type RecordValue = Record<string, unknown>;

function record(value: unknown): RecordValue {
  return value && typeof value === "object" ? (value as RecordValue) : {};
}

function text(value: unknown, fallback = "—") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function dateTime(value: unknown) {
  if (!value) return "Time not set";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime())
    ? "Time not set"
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function personName(value: unknown, fallback = "Visitor") {
  const person = record(value);
  return text(
    person.name ??
      person.fullName ??
      [person.firstName, person.lastName].filter(Boolean).join(" "),
    fallback,
  );
}

function visitorRow(value: unknown) {
  const visit = record(value);
  const visitor = record(visit.visitor);
  const name = personName(visitor, personName(visit, "Visitor"));
  const status = text(visit.status, "Expected")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  return {
    name,
    company: text(visitor.company ?? visitor.organization, "External visitor"),
    host: personName(visit.hostEmployee, "Host not assigned"),
    time: dateTime(visit.checkInAt ?? visit.createdAt),
    status,
    initials: name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
  };
}

function meetingRow(value: unknown, index: number) {
  const meeting = record(value);
  const room = record(meeting.room);
  const attendees = Array.isArray(meeting.attendees) ? meeting.attendees.length : 0;
  return {
    title: text(meeting.title ?? meeting.name, "Untitled meeting"),
    time: `${dateTime(meeting.startAt)} – ${dateTime(meeting.endAt)}`,
    room: text(room.name, "Room not assigned"),
    people: `${attendees} attendee${attendees === 1 ? "" : "s"}`,
    color: ["blue", "violet", "orange"][index % 3],
  };
}

function stat(
  label: string,
  value: unknown,
  icon: string,
  tone: string,
  change = "Live data",
): DashboardStat {
  return { label, value: String(value ?? 0), change, trend: "neutral", icon, tone };
}

function normalize(role: Role, payload: unknown): DashboardData {
  const data = record(payload);
  const counts = record(data.counts);
  const visitors = record(data.visitors);
  const visits = record(data.visits);
  const meetings = record(data.meetings);
  const upcoming = Array.isArray(data.upcomingMeetings)
    ? data.upcomingMeetings
    : Array.isArray(meetings.upcoming)
      ? meetings.upcoming
      : [];
  const visitorList = Array.isArray(data.activeVisitors)
    ? data.activeVisitors
    : Array.isArray(data.expectedArrivals)
      ? data.expectedArrivals
      : [];

  if (role === "admin") {
    return {
      stats: [
        stat("Total visitors", visitors.total, "♙", "blue"),
        stat("Today’s visits", visits.today, "▣", "violet"),
        stat("Active visitors", visits.active, "◉", "green"),
        stat("Today’s meetings", meetings.today, "▤", "orange"),
      ],
      recentVisitors: visitorList.map(visitorRow),
      upcomingMeetings: upcoming.map(meetingRow),
    };
  }

  if (role === "management") {
    const summary = record(data.visitors).summary;
    const summaryRecord = record(summary);
    return {
      stats: [
        stat("Total visitors", summaryRecord.total ?? visitors.total, "♙", "blue"),
        stat("Monthly visits", summaryRecord.total ?? 0, "▣", "violet"),
        stat("Active visitors", data.activeVisitors, "◉", "green"),
        stat("Upcoming meetings", meetings.upcoming, "▤", "orange"),
      ],
      recentVisitors: [],
      upcomingMeetings: upcoming.map(meetingRow),
    };
  }

  if (role === "employee") {
    return {
      stats: [
        stat("Today’s meetings", counts.meetingsToday, "▤", "blue"),
        stat("Visitors today", counts.visitorsToday, "♙", "violet"),
        stat("Visitors waiting", counts.activeVisitors, "◉", "green"),
        stat("Pending approvals", counts.pendingApprovals, "▣", "orange"),
      ],
      recentVisitors: visitorList.map(visitorRow),
      upcomingMeetings: upcoming.map(meetingRow),
    };
  }

  return {
    stats: [
      stat("Expected today", counts.expectedToday, "♙", "blue"),
      stat("Currently checked in", counts.activeVisitors, "◉", "green"),
      stat("Checked in today", counts.checkedInToday, "▣", "violet"),
      stat("Walk-ins today", counts.walkInsToday, "▤", "orange"),
    ],
    recentVisitors: visitorList.map(visitorRow),
    upcomingMeetings: [],
  };
}

export const dashboardService = {
  async get(role: Role) {
    const endpoint = role === "security" ? "reception" : role;
    const payload = await apiRequest<unknown>(`/dashboard/${endpoint}`);
    return normalize(role, payload);
  },
};
