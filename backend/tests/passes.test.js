import { afterAll, beforeAll, beforeEach, describe, expect, test } from "@jest/globals";
import { sampleVisitor, setupTestApp } from "./helpers/setup.js";

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

async function checkedInVisit() {
  const res = await ctx.as("receptionist").post("/api/v1/visits/walk-in").send({
    visitorDetails: sampleVisitor(),
    hostEmployee: String(ctx.users.employee._id),
    purpose: "Audit",
    issuePass: false,
  });
  expect(res.status).toBe(201);
  return res.body.data.visit;
}

async function issue(visitId, extra = {}) {
  return ctx.as("receptionist").post("/api/v1/visitor-passes").send({ visit: visitId, ...extra });
}

describe("Visitor passes", () => {
  test("issues a pass for a checked-in visit", async () => {
    const visit = await checkedInVisit();
    const res = await issue(visit._id, { validHours: 2 });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("active");
    expect(res.body.data.issuedBy.name).toBe("Receptionist User");
    const hours = (new Date(res.body.data.expiresAt) - Date.now()) / 3600_000;
    expect(hours).toBeGreaterThan(1.9);
    expect(hours).toBeLessThanOrEqual(2);
  });

  test("only one active pass per visit", async () => {
    const visit = await checkedInVisit();
    expect((await issue(visit._id)).status).toBe(201);
    const duplicate = await issue(visit._id);
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe("PASS_ALREADY_ACTIVE");
  });

  test("cannot issue a pass for a visit that is not checked in", async () => {
    const visit = await checkedInVisit();
    await ctx.as("receptionist").post(`/api/v1/visits/${visit._id}/check-out`);
    const res = await issue(visit._id);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("VISIT_NOT_CHECKED_IN");
  });

  test("verifies a valid pass (security)", async () => {
    const visit = await checkedInVisit();
    const pass = (await issue(visit._id)).body.data;

    const res = await ctx.as("security").get(`/api/v1/visitor-passes/verify/${pass.passNumber}`);
    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(true);
    expect(res.body.data.reason).toBe("VALID");
    expect(res.body.data.pass.visit.visitor.fullName).toBe("Jane Visitor");

    expect((await ctx.as("receptionist").get(`/api/v1/visitor-passes/verify/${pass.passNumber}`)).status).toBe(403);
  });

  test("expired passes fail verification and are marked expired", async () => {
    const visit = await checkedInVisit();
    const pass = (await issue(visit._id)).body.data;
    await ctx.models.VisitorPass.updateOne({ _id: pass._id }, { expiresAt: new Date(Date.now() - 60_000) });

    const res = await ctx.as("security").get(`/api/v1/visitor-passes/verify/${pass.passNumber}`);
    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(false);
    expect(res.body.data.reason).toBe("EXPIRED");
    expect((await ctx.models.VisitorPass.findById(pass._id)).status).toBe("expired");

    // A new pass can be issued once the previous one has expired.
    expect((await issue(visit._id)).status).toBe(201);
  });

  test("revoked passes fail verification", async () => {
    const visit = await checkedInVisit();
    const pass = (await issue(visit._id)).body.data;

    const revoke = await ctx.as("security").patch(`/api/v1/visitor-passes/${pass._id}/revoke`).send({ reason: "Lost badge" });
    expect(revoke.status).toBe(200);
    expect(revoke.body.data.status).toBe("revoked");
    expect(revoke.body.data.revokeReason).toBe("Lost badge");

    const verify = await ctx.as("security").get(`/api/v1/visitor-passes/verify/${pass.passNumber}`);
    expect(verify.body.data.valid).toBe(false);
    expect(verify.body.data.reason).toBe("REVOKED");

    const again = await ctx.as("security").patch(`/api/v1/visitor-passes/${pass._id}/revoke`);
    expect(again.status).toBe(409);
  });

  test("pass for a checked-out visit is not valid", async () => {
    const visit = await checkedInVisit();
    const pass = (await issue(visit._id)).body.data;
    await ctx.as("receptionist").post(`/api/v1/visits/${visit._id}/check-out`);

    const verify = await ctx.as("security").get(`/api/v1/visitor-passes/verify/${pass.passNumber}`);
    expect(verify.body.data.valid).toBe(false);
  });

  test("validates pass number format and unknown passes", async () => {
    expect((await ctx.as("security").get("/api/v1/visitor-passes/verify/BAD")).status).toBe(422);
    expect((await ctx.as("security").get("/api/v1/visitor-passes/verify/VP-20260101-ABCDEF")).status).toBe(404);
  });
});
