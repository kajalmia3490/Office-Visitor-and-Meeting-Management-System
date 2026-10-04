import { afterAll, beforeAll, beforeEach, describe, expect, test } from "@jest/globals";
import { sampleVisitor, setupTestApp, tomorrowAt } from "./helpers/setup.js";

let ctx;

beforeAll(async () => {
  ctx = await setupTestApp();
});

beforeEach(async () => {
  await ctx.reset();
});

afterAll(async () => {
  await ctx.teardown();
});

const actions = async () => (await ctx.models.AuditLog.find().sort({ createdAt: 1 })).map((log) => log.action);

describe("Audit logs", () => {
  test("user management actions are audited", async () => {
    const created = await ctx.as("admin").post("/api/v1/users").send({ name: "Audit Me", email: "audit@test.com", role: "employee" });
    await ctx.as("admin").patch(`/api/v1/users/${created.body.data._id}`).send({ role: "security" });
    await ctx.as("admin").patch(`/api/v1/users/${created.body.data._id}/status`).send({ isActive: false });

    expect(await actions()).toEqual(["USER_CREATED", "USER_UPDATED", "USER_DEACTIVATED"]);

    const log = await ctx.models.AuditLog.findOne({ action: "USER_UPDATED" });
    expect(String(log.user)).toBe(String(ctx.users.admin._id));
    expect(log.module).toBe("USERS");
    expect(log.metadata).toMatchObject({ previousRole: "employee", newRole: "security" });
    expect(log.ipAddress).toBeDefined();
  });

  test("the visit lifecycle is audited", async () => {
    const walkIn = await ctx.as("receptionist").post("/api/v1/visits/walk-in").send({
      visitorDetails: sampleVisitor(),
      hostEmployee: String(ctx.users.employee._id),
      purpose: "Audit flow",
    });
    const { visit, pass } = walkIn.body.data;
    await ctx.as("security").patch(`/api/v1/visitor-passes/${pass._id}/revoke`).send({ reason: "Test" });
    await ctx.as("security").post(`/api/v1/visits/${visit._id}/check-out`);

    expect(await actions()).toEqual([
      "VISITOR_CREATED",
      "WALK_IN_REGISTERED",
      "VISITOR_CHECKED_IN",
      "PASS_ISSUED",
      "PASS_REVOKED",
      "VISITOR_CHECKED_OUT",
    ]);

    const checkIn = await ctx.models.AuditLog.findOne({ action: "VISITOR_CHECKED_IN" });
    expect(String(checkIn.targetId)).toBe(visit._id);
    expect(checkIn.module).toBe("VISITS");
  });

  test("appointment and meeting actions are audited", async () => {
    const room = await ctx.models.MeetingRoom.create({ name: "R", roomNumber: "1", capacity: 4 });
    const meeting = await ctx.as("employee").post("/api/v1/meetings").send({
      title: "Audit meeting",
      room: String(room._id),
      startAt: tomorrowAt(10),
      endAt: tomorrowAt(11),
    });
    await ctx.as("employee").patch(`/api/v1/meetings/${meeting.body.data._id}/cancel`);

    const appointment = await ctx.as("receptionist").post("/api/v1/appointments").send({
      visitorDetails: sampleVisitor(),
      hostEmployee: String(ctx.users.employee._id),
      purpose: "Audit",
      scheduledStartAt: tomorrowAt(12),
      scheduledEndAt: tomorrowAt(13),
    });
    await ctx.as("employee").patch(`/api/v1/appointments/${appointment.body.data._id}/reject`);

    expect(await actions()).toEqual(
      expect.arrayContaining([
        "MEETING_CREATED",
        "MEETING_CANCELLED",
        "APPOINTMENT_CREATED",
        "APPOINTMENT_REJECTED",
      ]),
    );
  });

  test("admins can filter audit logs", async () => {
    await ctx.as("admin").post("/api/v1/departments").send({ name: "Ops", code: "OPS" });
    await ctx.as("admin").post("/api/v1/meeting-rooms").send({ name: "R", roomNumber: "9", capacity: 2 });

    const res = await ctx.as("admin").get("/api/v1/audit-logs?module=DEPARTMENTS");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].action).toBe("DEPARTMENT_CREATED");
    expect(res.body.data[0].user.email).toBe("admin@test.com");
  });
});
