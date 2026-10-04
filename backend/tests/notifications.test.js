import { afterAll, beforeAll, beforeEach, describe, expect, test } from "@jest/globals";
import { sampleVisitor, setupTestApp } from "./helpers/setup.js";

let ctx;

beforeAll(async () => {
  ctx = await setupTestApp();
});

beforeEach(async () => {
  await ctx.reset();
  for (const [i, name] of ["One", "Two"].entries()) {
    const res = await ctx.as("receptionist").post("/api/v1/visits/walk-in").send({
      visitorDetails: sampleVisitor({ fullName: `Visitor ${name}`, phone: `+88017000000${i}0`, email: `${name}@v.com`, identityNumber: `ID-${name}` }),
      hostEmployee: String(ctx.users.employee._id),
      purpose: "Meeting",
      issuePass: false,
    });
    expect(res.status).toBe(201);
  }
});

afterAll(async () => {
  await ctx.teardown();
});

describe("Notifications", () => {
  test("check-in generates a notification for the host", async () => {
    const res = await ctx.as("employee").get("/api/v1/notifications");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.every((n) => n.type === "visitor_arrived")).toBe(true);

    const other = await ctx.as("employee2").get("/api/v1/notifications");
    expect(other.body.data).toHaveLength(0);
  });

  test("tracks read/unread state", async () => {
    const unread = await ctx.as("employee").get("/api/v1/notifications/unread");
    expect(unread.body.meta.unreadCount).toBe(2);

    const id = unread.body.data[0]._id;
    const read = await ctx.as("employee").patch(`/api/v1/notifications/${id}/read`);
    expect(read.status).toBe(200);
    expect(read.body.data.isRead).toBe(true);
    expect(read.body.data.readAt).toBeDefined();

    const after = await ctx.as("employee").get("/api/v1/notifications/unread");
    expect(after.body.meta.unreadCount).toBe(1);

    const filtered = await ctx.as("employee").get("/api/v1/notifications?isRead=true");
    expect(filtered.body.data).toHaveLength(1);

    const all = await ctx.as("employee").patch("/api/v1/notifications/read-all");
    expect(all.body.data.updated).toBe(1);
    expect((await ctx.as("employee").get("/api/v1/notifications/unread")).body.meta.unreadCount).toBe(0);
  });

  test("users cannot mark other users' notifications", async () => {
    const notification = await ctx.models.Notification.findOne({ recipient: ctx.users.employee._id });
    const res = await ctx.as("employee2").patch(`/api/v1/notifications/${notification._id}/read`);
    expect(res.status).toBe(404);
  });
});
