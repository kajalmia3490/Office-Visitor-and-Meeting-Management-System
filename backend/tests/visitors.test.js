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

async function createVisitor(overrides) {
  const res = await ctx.as("receptionist").post("/api/v1/visitors").send(sampleVisitor(overrides));
  expect(res.status).toBe(201);
  return res.body.data;
}

describe("Visitors", () => {
  test("creates a visitor with the standard success response", async () => {
    const res = await ctx.as("receptionist").post("/api/v1/visitors").send(sampleVisitor());
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      success: true,
      message: "Visitor created successfully",
      data: { fullName: "Jane Visitor", email: "jane@visitor.com" },
    });
  });

  test("validates the payload (422)", async () => {
    const res = await ctx
      .as("receptionist")
      .post("/api/v1/visitors")
      .send({ fullName: "J", phone: "abc", email: "not-an-email", identityType: "unknown" });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    const paths = res.body.error.details.map((d) => d.path);
    expect(paths).toEqual(expect.arrayContaining(["fullName", "phone", "email", "identityType"]));
  });

  test("rejects malformed ids with 422", async () => {
    const res = await ctx.as("receptionist").get("/api/v1/visitors/not-an-id");
    expect(res.status).toBe(422);
  });

  test("searches visitors by name, phone, organization and identity number", async () => {
    await createVisitor();
    await createVisitor({ fullName: "Bob Builder", phone: "+8801800000002", email: "bob@build.com", organization: "BuildCo", identityNumber: "PP998877" });

    const byName = await ctx.as("receptionist").get("/api/v1/visitors/search?q=jane");
    expect(byName.status).toBe(200);
    expect(byName.body.data).toHaveLength(1);

    const byPhone = await ctx.as("receptionist").get("/api/v1/visitors/search?q=01800000002");
    expect(byPhone.body.data[0].fullName).toBe("Bob Builder");

    const byOrg = await ctx.as("security").get("/api/v1/visitors/search?q=buildco");
    expect(byOrg.body.data).toHaveLength(1);

    const byIdentity = await ctx.as("receptionist").get("/api/v1/visitors/search?q=PP9988");
    expect(byIdentity.body.data).toHaveLength(1);

    const regexSafe = await ctx.as("receptionist").get(`/api/v1/visitors/search?q=${encodeURIComponent(".*")}`);
    expect(regexSafe.body.data).toHaveLength(0);
  });

  test("masks identity details for employees", async () => {
    await createVisitor();
    const res = await ctx.as("employee").get("/api/v1/visitors/search?q=jane");
    expect(res.status).toBe(200);
    expect(res.body.data[0].identityNumber).toBe("********6789");

    const staff = await ctx.as("security").get("/api/v1/visitors/search?q=jane");
    expect(staff.body.data[0].identityNumber).toBe("NID123456789");
  });

  test("updates a visitor", async () => {
    const visitor = await createVisitor();
    const res = await ctx.as("receptionist").patch(`/api/v1/visitors/${visitor._id}`).send({ organization: "New Org" });
    expect(res.status).toBe(200);
    expect(res.body.data.organization).toBe("New Org");
  });

  test("lists visitors with pagination metadata", async () => {
    await createVisitor();
    await createVisitor({ fullName: "Second Person", phone: "+8801900000003", email: "second@x.com" });
    const res = await ctx.as("management").get("/api/v1/visitors?limit=1&page=2");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toEqual({ page: 2, limit: 1, total: 2, totalPages: 2 });
  });

  test("returns visitor history, limited to hosted visits for employees", async () => {
    const visitor = await createVisitor();
    for (const host of ["employee", "employee2"]) {
      const res = await ctx.as("receptionist").post("/api/v1/visits/walk-in").send({
        visitor: visitor._id,
        hostEmployee: String(ctx.users[host]._id),
        purpose: `Meet ${host}`,
        issuePass: false,
      });
      expect(res.status).toBe(201);
    }

    const full = await ctx.as("receptionist").get(`/api/v1/visitors/${visitor._id}/history`);
    expect(full.status).toBe(200);
    expect(full.body.data.visits).toHaveLength(2);
    expect(full.body.meta.total).toBe(2);

    const limited = await ctx.as("employee").get(`/api/v1/visitors/${visitor._id}/history`);
    expect(limited.status).toBe(200);
    expect(limited.body.data.visits).toHaveLength(1);
    expect(limited.body.data.visits[0].purpose).toBe("Meet employee");
  });

  test("prevents deleting visitors with history", async () => {
    const visitor = await createVisitor();
    await ctx.as("receptionist").post("/api/v1/visits/walk-in").send({
      visitor: visitor._id,
      hostEmployee: String(ctx.users.employee._id),
      purpose: "Meeting",
      issuePass: false,
    });
    const res = await ctx.as("admin").delete(`/api/v1/visitors/${visitor._id}`);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("VISITOR_IN_USE");

    const fresh = await createVisitor({ phone: "+8801500000009", email: "fresh@x.com", identityNumber: "X1234" });
    expect((await ctx.as("admin").delete(`/api/v1/visitors/${fresh._id}`)).status).toBe(204);
  });
});
