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

function appointmentBody(overrides = {}) {
  return {
    visitorDetails: sampleVisitor(),
    hostEmployee: String(ctx.users.employee._id),
    purpose: "Project discussion",
    scheduledStartAt: tomorrowAt(10).toISOString(),
    scheduledEndAt: tomorrowAt(11).toISOString(),
    ...overrides,
  };
}

async function createPending() {
  const res = await ctx.as("receptionist").post("/api/v1/appointments").send(appointmentBody());
  expect(res.status).toBe(201);
  return res.body.data;
}

describe("Appointments", () => {
  test("receptionist creates a pending appointment and the host is notified", async () => {
    const appointment = await createPending();
    expect(appointment.status).toBe("pending");
    expect(appointment.visitor.fullName).toBe("Jane Visitor");
    expect(appointment.hostEmployee.email).toBe("employee@test.com");

    const notification = await ctx.models.Notification.findOne({ recipient: ctx.users.employee._id });
    expect(notification.type).toBe("appointment_requested");
    expect(await ctx.models.Visit.countDocuments()).toBe(0);
  });

  test("reuses an existing visitor matched by identity/phone/email", async () => {
    await createPending();
    await ctx.as("receptionist").post("/api/v1/appointments").send(appointmentBody({ purpose: "Second visit" }));
    expect(await ctx.models.Visitor.countDocuments()).toBe(1);
  });

  test("requires exactly one of visitor or visitorDetails and a valid schedule", async () => {
    const neither = await ctx.as("receptionist").post("/api/v1/appointments").send(appointmentBody({ visitorDetails: undefined }));
    expect(neither.status).toBe(422);

    const backwards = await ctx
      .as("receptionist")
      .post("/api/v1/appointments")
      .send(appointmentBody({ scheduledStartAt: tomorrowAt(12).toISOString() }));
    expect(backwards.status).toBe(422);
  });

  test("host approves: status becomes approved and an expected visit is created", async () => {
    const appointment = await createPending();
    const res = await ctx.as("employee").patch(`/api/v1/appointments/${appointment._id}/approve`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("approved");

    const visit = await ctx.models.Visit.findOne({ appointment: appointment._id });
    expect(visit).not.toBeNull();
    expect(visit.status).toBe("expected");
    expect(visit.visitType).toBe("appointment");

    const again = await ctx.as("employee").patch(`/api/v1/appointments/${appointment._id}/approve`);
    expect(again.status).toBe(409);
  });

  test("only the host or an admin can approve or reject", async () => {
    const appointment = await createPending();
    expect((await ctx.as("employee2").patch(`/api/v1/appointments/${appointment._id}/approve`)).status).toBe(403);
    expect((await ctx.as("receptionist").patch(`/api/v1/appointments/${appointment._id}/approve`)).status).toBe(403);
    expect((await ctx.as("admin").patch(`/api/v1/appointments/${appointment._id}/approve`)).status).toBe(200);
  });

  test("host rejects with a reason and the creator is notified", async () => {
    const appointment = await createPending();
    const res = await ctx
      .as("employee")
      .patch(`/api/v1/appointments/${appointment._id}/reject`)
      .send({ reason: "Out of office" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("rejected");
    expect(res.body.data.decisionReason).toBe("Out of office");

    const notification = await ctx.models.Notification.findOne({ recipient: ctx.users.receptionist._id });
    expect(notification.type).toBe("appointment_rejected");
  });

  test("cancelling an approved appointment cancels its expected visit", async () => {
    const appointment = await createPending();
    await ctx.as("employee").patch(`/api/v1/appointments/${appointment._id}/approve`);

    const res = await ctx.as("receptionist").patch(`/api/v1/appointments/${appointment._id}/cancel`).send({ reason: "Rescheduled" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("cancelled");

    const visit = await ctx.models.Visit.findOne({ appointment: appointment._id });
    expect(visit.status).toBe("cancelled");

    const again = await ctx.as("receptionist").patch(`/api/v1/appointments/${appointment._id}/cancel`);
    expect(again.status).toBe(409);
  });

  test("cannot cancel after the visitor checked in", async () => {
    const appointment = await createPending();
    await ctx.as("employee").patch(`/api/v1/appointments/${appointment._id}/approve`);
    const visit = await ctx.models.Visit.findOne({ appointment: appointment._id });
    expect((await ctx.as("receptionist").post(`/api/v1/visits/${visit._id}/check-in`)).status).toBe(200);

    const res = await ctx.as("receptionist").patch(`/api/v1/appointments/${appointment._id}/cancel`);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("VISIT_IN_PROGRESS");
  });

  test("employee inviting their own visitor is auto-approved", async () => {
    const res = await ctx
      .as("employee")
      .post("/api/v1/appointments")
      .send(appointmentBody({ hostEmployee: undefined }));
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("approved");
    expect(await ctx.models.Visit.countDocuments({ status: "expected" })).toBe(1);
  });

  test("employees cannot create appointments hosted by someone else", async () => {
    const res = await ctx
      .as("employee")
      .post("/api/v1/appointments")
      .send(appointmentBody({ hostEmployee: String(ctx.users.employee2._id) }));
    expect(res.status).toBe(403);
  });

  test("employees only see their own appointments", async () => {
    await createPending();
    await ctx.as("receptionist").post("/api/v1/appointments").send(
      appointmentBody({ hostEmployee: String(ctx.users.employee2._id), visitorDetails: sampleVisitor({ phone: "+8801711111111", email: "o@x.com", identityNumber: "OTHER1" }) }),
    );

    const mine = await ctx.as("employee").get("/api/v1/appointments");
    expect(mine.body.data).toHaveLength(1);
    const all = await ctx.as("receptionist").get("/api/v1/appointments?status=pending");
    expect(all.body.data).toHaveLength(2);

    const otherId = all.body.data.find((a) => a.hostEmployee.email === "employee2@test.com")._id;
    expect((await ctx.as("employee").get(`/api/v1/appointments/${otherId}`)).status).toBe(403);
  });

  test("updates an appointment and validates the schedule", async () => {
    const appointment = await createPending();
    const res = await ctx
      .as("receptionist")
      .patch(`/api/v1/appointments/${appointment._id}`)
      .send({ purpose: "Updated purpose", scheduledEndAt: tomorrowAt(12).toISOString() });
    expect(res.status).toBe(200);
    expect(res.body.data.purpose).toBe("Updated purpose");

    const invalid = await ctx
      .as("receptionist")
      .patch(`/api/v1/appointments/${appointment._id}`)
      .send({ scheduledEndAt: tomorrowAt(9).toISOString() });
    expect(invalid.status).toBe(422);
  });
});
