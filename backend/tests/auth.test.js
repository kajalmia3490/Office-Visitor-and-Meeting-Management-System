import { afterAll, beforeAll, beforeEach, describe, expect, test } from "@jest/globals";
import { setupTestApp } from "./helpers/setup.js";

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

describe("Authentication boundary", () => {
  test("rejects requests without a session with 401", async () => {
    const res = await ctx.request.get("/api/v1/auth/me");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      success: false,
      message: "Authentication required",
      error: { code: "UNAUTHENTICATED" },
    });
  });

  test("protects business endpoints", async () => {
    const res = await ctx.request.get("/api/v1/visitors");
    expect(res.status).toBe(401);
  });

  test("returns the current application user for a valid session", async () => {
    const res = await ctx.as("admin").get("/api/v1/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe("admin@test.com");
    expect(res.body.data.user.role).toBe("admin");
    expect(res.body.data.user.authUserId).toBeUndefined();
    expect(res.body.data.session.id).toBeDefined();
  });

  test("links the Better Auth user to the existing profile and records last login", async () => {
    await ctx.as("employee").get("/api/v1/auth/me");
    const user = await ctx.models.User.findOne({ email: "employee@test.com" });
    expect(user.authUserId).toBe("auth-employee@test.com");
    expect(user.lastLoginAt).toBeInstanceOf(Date);
  });

  test("provisions first-time users with the employee role", async () => {
    const res = await ctx.as("newcomer@test.com").get("/api/v1/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe("employee");
    expect(await ctx.models.User.countDocuments({ email: "newcomer@test.com" })).toBe(1);
  });

  test("blocks inactive users with 403", async () => {
    await ctx.models.User.updateOne({ email: "employee@test.com" }, { isActive: false });
    const res = await ctx.as("employee").get("/api/v1/auth/me");
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("ACCOUNT_INACTIVE");
  });

  test("logout forwards Better Auth cookie-clearing headers", async () => {
    const res = await ctx.as("employee").post("/api/v1/auth/logout");
    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"].join(";")).toContain("better-auth.session_token=");
  });

  test("unknown routes return a 404 in the standard error format", async () => {
    const res = await ctx.as("admin").get("/api/v1/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("ROUTE_NOT_FOUND");
  });
});
