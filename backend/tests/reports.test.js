import { afterAll, beforeAll, beforeEach, describe, expect, test } from "@jest/globals";
import { setupTestApp } from "./helpers/setup.js";

let ctx;
let roomA;
let roomB;

const daysAgo = (days, hour = 10) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
};

beforeAll(async () => {
  ctx = await setupTestApp();
});

beforeEach(async () => {
  await ctx.reset();
  const { Visitor, Visit, Meeting, MeetingRoom } = ctx.models;

  const [acme, globex] = await Visitor.insertMany([
    { fullName: "Acme Person", phone: "+8801700000001", organization: "Acme" },
    { fullName: "Globex Person", phone: "+8801700000002", organization: "Globex" },
  ]);

  const host = ctx.users.employee._id;
  await Visit.insertMany([
    { visitor: acme._id, hostEmployee: host, purpose: "A", visitType: "walk_in", status: "checked_out", checkInAt: daysAgo(2), checkOutAt: daysAgo(2, 11), createdAt: daysAgo(2) },
    { visitor: acme._id, hostEmployee: host, purpose: "B", visitType: "appointment", status: "checked_out", checkInAt: daysAgo(1), checkOutAt: daysAgo(1, 12), createdAt: daysAgo(1) },
    { visitor: globex._id, hostEmployee: ctx.users.employee2._id, purpose: "C", visitType: "walk_in", status: "checked_in", checkInAt: new Date(), createdAt: new Date() },
    // Outside the filtered range below.
    { visitor: globex._id, hostEmployee: host, purpose: "Old", visitType: "walk_in", status: "checked_out", checkInAt: daysAgo(60), checkOutAt: daysAgo(60, 11), createdAt: daysAgo(60) },
  ]);

  [roomA, roomB] = await MeetingRoom.insertMany([
    { name: "Room A", roomNumber: "A1", capacity: 6 },
    { name: "Room B", roomNumber: "B1", capacity: 10 },
  ]);

  await Meeting.insertMany([
    { title: "M1", organizer: host, room: roomA._id, startAt: daysAgo(1, 9), endAt: daysAgo(1, 11), status: "completed" },
    { title: "M2", organizer: host, room: roomA._id, startAt: daysAgo(2, 9), endAt: daysAgo(2, 10), status: "completed" },
    { title: "M3", organizer: ctx.users.employee2._id, room: roomB._id, startAt: daysAgo(1, 14), endAt: daysAgo(1, 15), status: "cancelled" },
  ]);
});

afterAll(async () => {
  await ctx.teardown();
});

describe("Reports", () => {
  test("visitor report aggregates visits within the date range", async () => {
    const res = await ctx.as("management").get(`/api/v1/reports/visitors?from=${daysAgo(7, 0).toISOString()}`);
    expect(res.status).toBe(200);

    const { summary, byType, topOrganizations, byDate } = res.body.data;
    expect(summary.totalVisits).toBe(3);
    expect(summary.uniqueVisitors).toBe(2);
    expect(summary.completedVisits).toBe(2);
    expect(summary.averageVisitMinutes).toBe(90);
    expect(byType).toEqual(expect.arrayContaining([{ key: "walk_in", count: 2 }, { key: "appointment", count: 1 }]));
    expect(topOrganizations[0]).toEqual({ key: "Acme", count: 2 });
    expect(byDate).toHaveLength(3);
  });

  test("date filters include older data when requested", async () => {
    const res = await ctx.as("admin").get(`/api/v1/reports/visitors?from=${daysAgo(90, 0).toISOString()}`);
    expect(res.body.data.summary.totalVisits).toBe(4);

    const invalid = await ctx.as("admin").get(`/api/v1/reports/visitors?from=${daysAgo(1).toISOString()}&to=${daysAgo(5).toISOString()}`);
    expect(invalid.status).toBe(422);
  });

  test("meeting report groups by status, room and organizer", async () => {
    const res = await ctx.as("management").get("/api/v1/reports/meetings");
    expect(res.status).toBe(200);
    expect(res.body.data.summary.totalMeetings).toBe(3);
    expect(res.body.data.byStatus).toEqual(expect.arrayContaining([{ key: "completed", count: 2 }, { key: "cancelled", count: 1 }]));
    expect(res.body.data.byRoom[0]).toMatchObject({ roomNumber: "A1", count: 2 });
    expect(res.body.data.byOrganizer[0]).toMatchObject({ email: "employee@test.com", count: 2 });
  });

  test("room utilization counts booked minutes of non-cancelled meetings", async () => {
    const res = await ctx.as("admin").get(`/api/v1/reports/rooms?from=${daysAgo(6, 0).toISOString()}`);
    expect(res.status).toBe(200);

    const a = res.body.data.rooms.find((r) => r.roomNumber === "A1");
    const b = res.body.data.rooms.find((r) => r.roomNumber === "B1");
    expect(a.meetingCount).toBe(2);
    expect(a.bookedMinutes).toBe(180);
    expect(b.meetingCount).toBe(0);
    expect(b.bookedMinutes).toBe(0);
    // 7 days x 8 working hours = 3360 minutes available per room.
    expect(res.body.data.assumptions.availableMinutesPerRoom).toBe(3360);
    expect(a.utilizationPercent).toBeCloseTo((180 / 3360) * 100, 2);
  });

  test("active visitors report lists checked-in visits", async () => {
    const res = await ctx.as("security").get("/api/v1/reports/active-visitors");
    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(1);
    expect(res.body.data.visits[0].visitor.fullName).toBe("Globex Person");
    expect(res.body.data.byHost[0].count).toBe(1);
  });

  test("visitor history report supports search and pagination", async () => {
    const res = await ctx.as("receptionist").get(`/api/v1/reports/visitor-history?q=acme&limit=1`);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.meta.total).toBe(2);
  });

  test("meeting history report returns completed and cancelled meetings", async () => {
    const res = await ctx.as("management").get("/api/v1/reports/meeting-history");
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(3);

    const cancelled = await ctx.as("management").get("/api/v1/reports/meeting-history?status=cancelled");
    expect(cancelled.body.data.items).toHaveLength(1);
  });
});

describe("Dashboards", () => {
  test("admin dashboard returns live counters", async () => {
    const res = await ctx.as("admin").get("/api/v1/dashboard/admin");
    expect(res.status).toBe(200);
    expect(res.body.data.visits.active).toBe(1);
    expect(res.body.data.visitors.total).toBe(2);
    expect(res.body.data.users.active).toBe(6);
    expect(res.body.data.meetingRooms).toBe(2);
    expect(res.body.data.visitTrend.length).toBeGreaterThan(0);
  });

  test("reception dashboard lists active visitors", async () => {
    const res = await ctx.as("receptionist").get("/api/v1/dashboard/reception");
    expect(res.status).toBe(200);
    expect(res.body.data.counts.activeVisitors).toBe(1);
    expect(res.body.data.counts.walkInsToday).toBe(1);
  });

  test("employee dashboard is personal", async () => {
    const res = await ctx.as("employee2").get("/api/v1/dashboard/employee");
    expect(res.status).toBe(200);
    expect(res.body.data.counts.activeVisitors).toBe(1);

    const other = await ctx.as("employee").get("/api/v1/dashboard/employee");
    expect(other.body.data.counts.activeVisitors).toBe(0);
  });

  test("management dashboard summarises visitors, meetings and rooms", async () => {
    const res = await ctx.as("management").get("/api/v1/dashboard/management");
    expect(res.status).toBe(200);
    expect(res.body.data.visitors.totalVisits).toBe(3);
    expect(res.body.data.rooms.utilization).toHaveLength(2);
    expect(res.body.data.rooms.availableNow).toBe(2);
  });
});
