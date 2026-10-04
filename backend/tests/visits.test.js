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

async function walkIn(overrides = {}) {
  const res = await ctx.as("receptionist").post("/api/v1/visits/walk-in").send({
    visitorDetails: sampleVisitor(),
    hostEmployee: String(ctx.users.employee._id),
    purpose: "Interview",
    ...overrides,
  });
  return res;
}

async function expectedVisit() {
  const appointment = await ctx.as("employee").post("/api/v1/appointments").send({
    visitorDetails: sampleVisitor(),
    purpose: "Contract signing",
    scheduledStartAt: tomorrowAt(10).toISOString(),
    scheduledEndAt: tomorrowAt(11).toISOString(),
  });
  expect(appointment.status).toBe(201);
  return ctx.models.Visit.findOne({ appointment: appointment.body.data._id });
}

describe("Visit lifecycle", () => {
  test("walk-in registers the visitor, checks in, notifies the host and issues a pass", async () => {
    const res = await walkIn();
    expect(res.status).toBe(201);

    const { visit, pass } = res.body.data;
    expect(visit.visitType).toBe("walk_in");
    expect(visit.status).toBe("checked_in");
    expect(visit.checkInAt).toBeDefined();
    expect(visit.checkInBy.name).toBe("Receptionist User");
    expect(pass.passNumber).toMatch(/^VP-\d{8}-[A-F0-9]{6}$/);
    expect(pass.qrCode).toMatch(/^data:image\/png;base64,/);

    const notification = await ctx.models.Notification.findOne({ recipient: ctx.users.employee._id });
    expect(notification.type).toBe("visitor_arrived");
    expect(String(notification.relatedVisit)).toBe(visit._id);
  });

  test("walk-in can reuse an existing visitor and skip the pass", async () => {
    const visitor = await ctx.models.Visitor.create(sampleVisitor());
    const res = await walkIn({ visitorDetails: undefined, visitor: String(visitor._id), issuePass: false });
    expect(res.status).toBe(201);
    expect(res.body.data.pass).toBeNull();
    expect(await ctx.models.Visitor.countDocuments()).toBe(1);
  });

  test("walk-in requires an active host employee", async () => {
    await ctx.models.User.updateOne({ _id: ctx.users.employee._id }, { isActive: false });
    const res = await walkIn();
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("USER_INACTIVE");
  });

  test("checks in an expected appointment visit and prevents duplicate check-in", async () => {
    const visit = await expectedVisit();

    const first = await ctx.as("security").post(`/api/v1/visits/${visit._id}/check-in`).send({ issuePass: true });
    expect(first.status).toBe(200);
    expect(first.body.data.visit.status).toBe("checked_in");
    expect(first.body.data.pass.status).toBe("active");

    const duplicate = await ctx.as("receptionist").post(`/api/v1/visits/${visit._id}/check-in`);
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe("VISIT_ALREADY_CHECKED_IN");

    const arrivals = await ctx.models.Notification.countDocuments({ type: "visitor_arrived" });
    expect(arrivals).toBe(1);
  });

  test("concurrent check-ins only succeed once", async () => {
    const visit = await expectedVisit();
    const results = await Promise.all(
      [1, 2, 3].map(() => ctx.as("receptionist").post(`/api/v1/visits/${visit._id}/check-in`)),
    );
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([200, 409, 409]);
  });

  test("cannot check in a visit whose appointment is not approved", async () => {
    const visit = await expectedVisit();
    await ctx.models.Appointment.updateOne({ _id: visit.appointment }, { status: "pending" });
    const res = await ctx.as("receptionist").post(`/api/v1/visits/${visit._id}/check-in`);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("APPOINTMENT_NOT_APPROVED");
  });

  test("checks out: sets checkout fields, completes the appointment and expires the pass", async () => {
    const visit = await expectedVisit();
    const checkIn = await ctx.as("receptionist").post(`/api/v1/visits/${visit._id}/check-in`).send({ issuePass: true });
    const passId = checkIn.body.data.pass._id;

    const res = await ctx.as("security").post(`/api/v1/visits/${visit._id}/check-out`).send({ notes: "Left via main gate" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("checked_out");
    expect(res.body.data.checkOutAt).toBeDefined();
    expect(res.body.data.checkOutBy.name).toBe("Security User");

    const appointment = await ctx.models.Appointment.findById(visit.appointment);
    expect(appointment.status).toBe("completed");

    const pass = await ctx.models.VisitorPass.findById(passId);
    expect(pass.status).toBe("expired");

    // The completed visit is preserved for history.
    expect(await ctx.models.Visit.countDocuments({ status: "checked_out" })).toBe(1);
  });

  test("invalid check-out handling", async () => {
    const visit = await expectedVisit();
    const notCheckedIn = await ctx.as("receptionist").post(`/api/v1/visits/${visit._id}/check-out`);
    expect(notCheckedIn.status).toBe(409);
    expect(notCheckedIn.body.error.code).toBe("VISIT_NOT_CHECKED_IN");

    await ctx.as("receptionist").post(`/api/v1/visits/${visit._id}/check-in`);
    expect((await ctx.as("receptionist").post(`/api/v1/visits/${visit._id}/check-out`)).status).toBe(200);

    const twice = await ctx.as("receptionist").post(`/api/v1/visits/${visit._id}/check-out`);
    expect(twice.status).toBe(409);
    expect(twice.body.error.code).toBe("VISIT_ALREADY_CHECKED_OUT");

    const missing = await ctx.as("receptionist").post("/api/v1/visits/64b000000000000000000000/check-out");
    expect(missing.status).toBe(404);
  });

  test("active visitors are exactly the checked-in visits", async () => {
    const a = await walkIn({ issuePass: false });
    await walkIn({
      issuePass: false,
      visitorDetails: sampleVisitor({ fullName: "Other", phone: "+8801999999999", email: "o@o.com", identityNumber: "ZZ1" }),
    });
    await ctx.as("receptionist").post(`/api/v1/visits/${a.body.data.visit._id}/check-out`);
    await expectedVisit();

    const res = await ctx.as("security").get("/api/v1/visits/active");
    expect(res.status).toBe(200);
    expect(res.body.meta.count).toBe(1);
    expect(res.body.data[0].visitor.fullName).toBe("Other");
  });

  test("today's visits include check-ins and expected visits; employees see only their own", async () => {
    await walkIn({ issuePass: false });
    await walkIn({
      issuePass: false,
      hostEmployee: String(ctx.users.employee2._id),
      visitorDetails: sampleVisitor({ fullName: "Other", phone: "+8801999999999", email: "o@o.com", identityNumber: "ZZ1" }),
    });

    const staff = await ctx.as("receptionist").get("/api/v1/visits/today");
    expect(staff.body.meta.count).toBe(2);

    const employee = await ctx.as("employee").get("/api/v1/visits/today");
    expect(employee.body.meta.count).toBe(1);
  });

  test("lists visits with filters and returns the pass for a visit", async () => {
    const res = await walkIn();
    const visitId = res.body.data.visit._id;

    const list = await ctx.as("management").get("/api/v1/visits?visitType=walk_in&status=checked_in");
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);

    const pass = await ctx.as("employee").get(`/api/v1/visits/${visitId}/pass`);
    expect(pass.status).toBe(200);
    expect(pass.body.data.passNumber).toBe(res.body.data.pass.passNumber);

    expect((await ctx.as("employee2").get(`/api/v1/visits/${visitId}`)).status).toBe(403);
    expect((await ctx.as("employee2").get(`/api/v1/visits/${visitId}/pass`)).status).toBe(403);
  });

  test("marks expected visits as no-show after the appointment window", async () => {
    const visit = await expectedVisit();
    await ctx.models.Appointment.updateOne(
      { _id: visit.appointment },
      { scheduledStartAt: new Date(Date.now() - 2 * 3600_000), scheduledEndAt: new Date(Date.now() - 3600_000) },
    );
    const { markNoShows } = await import("../src/modules/visits/visit.service.js");
    expect(await markNoShows()).toBe(1);

    expect((await ctx.models.Visit.findById(visit._id)).status).toBe("no_show");
    expect((await ctx.models.Appointment.findById(visit.appointment)).status).toBe("no_show");
  });
});
