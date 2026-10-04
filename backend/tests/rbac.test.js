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

describe("Role-based access control", () => {
  describe("users", () => {
    test("admin can create users; other roles cannot", async () => {
      const body = { name: "New Person", email: "new.person@test.com", role: "security" };

      const forbidden = await ctx.as("employee").post("/api/v1/users").send(body);
      expect(forbidden.status).toBe(403);
      expect(forbidden.body.error.code).toBe("FORBIDDEN");

      const created = await ctx.as("admin").post("/api/v1/users").send(body);
      expect(created.status).toBe(201);
      expect(created.body.data.role).toBe("security");
    });

    test("management can view full user profiles but not modify them", async () => {
      const list = await ctx.as("management").get("/api/v1/users");
      expect(list.status).toBe(200);
      expect(list.body.data[0]).toHaveProperty("isActive");

      const update = await ctx.as("management").patch(`/api/v1/users/${ctx.users.employee._id}`).send({ name: "X Y" });
      expect(update.status).toBe(403);
    });

    test("receptionists get a directory of active users with limited fields", async () => {
      await ctx.models.User.updateOne({ _id: ctx.users.employee2._id }, { isActive: false });
      const res = await ctx.as("receptionist").get("/api/v1/users?role=employee");
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).not.toHaveProperty("isActive");
      expect(res.body.data[0]).not.toHaveProperty("phone");
    });

    test("users can read their own profile but not others'", async () => {
      const own = await ctx.as("employee").get(`/api/v1/users/${ctx.users.employee._id}`);
      expect(own.status).toBe(200);
      const other = await ctx.as("employee").get(`/api/v1/users/${ctx.users.employee2._id}`);
      expect(other.status).toBe(403);
    });

    test("admin can deactivate a user but not themselves", async () => {
      const self = await ctx.as("admin").patch(`/api/v1/users/${ctx.users.admin._id}/status`).send({ isActive: false });
      expect(self.status).toBe(400);

      const res = await ctx.as("admin").patch(`/api/v1/users/${ctx.users.employee._id}/status`).send({ isActive: false });
      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(false);
    });

    test("role changes cannot be injected through the request", async () => {
      const res = await ctx.as("employee").patch(`/api/v1/users/${ctx.users.employee._id}`).send({ role: "admin" });
      expect(res.status).toBe(403);
      const user = await ctx.models.User.findById(ctx.users.employee._id);
      expect(user.role).toBe("employee");
    });
  });

  describe("departments and rooms", () => {
    test("only admin manages departments; management can view", async () => {
      const body = { name: "Engineering", code: "ENG" };
      expect((await ctx.as("management").post("/api/v1/departments").send(body)).status).toBe(403);
      expect((await ctx.as("admin").post("/api/v1/departments").send(body)).status).toBe(201);
      expect((await ctx.as("management").get("/api/v1/departments")).status).toBe(200);
      expect((await ctx.as("employee").get("/api/v1/departments")).status).toBe(403);
    });

    test("only admin manages rooms; everyone can browse them", async () => {
      const body = { name: "Room 101", roomNumber: "101", capacity: 6 };
      expect((await ctx.as("employee").post("/api/v1/meeting-rooms").send(body)).status).toBe(403);
      expect((await ctx.as("admin").post("/api/v1/meeting-rooms").send(body)).status).toBe(201);
      expect((await ctx.as("employee").get("/api/v1/meeting-rooms")).status).toBe(200);
    });

    test("department head must reference an existing user and code must be unique", async () => {
      const first = await ctx.as("admin").post("/api/v1/departments").send({ name: "HR", code: "HR", head: String(ctx.users.employee._id) });
      expect(first.status).toBe(201);
      expect(first.body.data.head.email).toBe("employee@test.com");

      const duplicate = await ctx.as("admin").post("/api/v1/departments").send({ name: "Human Res", code: "hr" });
      expect(duplicate.status).toBe(409);
      expect(duplicate.body.error.code).toBe("DUPLICATE_KEY");
    });
  });

  describe("visitor operations", () => {
    test("security and employees cannot register visitors", async () => {
      expect((await ctx.as("security").post("/api/v1/visitors").send(sampleVisitor())).status).toBe(403);
      expect((await ctx.as("employee").post("/api/v1/visitors").send(sampleVisitor())).status).toBe(403);
      expect((await ctx.as("receptionist").post("/api/v1/visitors").send(sampleVisitor())).status).toBe(201);
    });

    test("employees and management cannot check visitors in or register walk-ins", async () => {
      const body = { visitorDetails: sampleVisitor(), hostEmployee: String(ctx.users.employee._id), purpose: "Delivery" };
      expect((await ctx.as("employee").post("/api/v1/visits/walk-in").send(body)).status).toBe(403);
      expect((await ctx.as("management").post("/api/v1/visits/walk-in").send(body)).status).toBe(403);
      expect((await ctx.as("security").post("/api/v1/visits/walk-in").send(body)).status).toBe(403);
    });

    test("employees cannot view active visitors", async () => {
      expect((await ctx.as("employee").get("/api/v1/visits/active")).status).toBe(403);
      expect((await ctx.as("security").get("/api/v1/visits/active")).status).toBe(200);
      expect((await ctx.as("management").get("/api/v1/visits/active")).status).toBe(200);
    });
  });

  describe("meetings", () => {
    test("receptionists, security and management cannot create meetings", async () => {
      for (const role of ["receptionist", "security", "management"]) {
        const res = await ctx.as(role).post("/api/v1/meetings").send({});
        expect(res.status).toBe(403);
      }
    });
  });

  describe("reports and dashboards", () => {
    test("reception and security get limited reports only", async () => {
      expect((await ctx.as("receptionist").get("/api/v1/reports/visitors")).status).toBe(200);
      expect((await ctx.as("security").get("/api/v1/reports/active-visitors")).status).toBe(200);
      expect((await ctx.as("receptionist").get("/api/v1/reports/meetings")).status).toBe(403);
      expect((await ctx.as("security").get("/api/v1/reports/rooms")).status).toBe(403);
      expect((await ctx.as("employee").get("/api/v1/reports/visitors")).status).toBe(403);
      expect((await ctx.as("management").get("/api/v1/reports/meeting-history")).status).toBe(200);
    });

    test("each dashboard is restricted to the right roles", async () => {
      expect((await ctx.as("admin").get("/api/v1/dashboard/admin")).status).toBe(200);
      expect((await ctx.as("management").get("/api/v1/dashboard/admin")).status).toBe(403);
      expect((await ctx.as("receptionist").get("/api/v1/dashboard/reception")).status).toBe(200);
      expect((await ctx.as("security").get("/api/v1/dashboard/reception")).status).toBe(200);
      expect((await ctx.as("employee").get("/api/v1/dashboard/reception")).status).toBe(403);
      expect((await ctx.as("employee").get("/api/v1/dashboard/employee")).status).toBe(200);
      expect((await ctx.as("management").get("/api/v1/dashboard/management")).status).toBe(200);
      expect((await ctx.as("employee").get("/api/v1/dashboard/management")).status).toBe(403);
    });

    test("audit logs are admin-only", async () => {
      expect((await ctx.as("management").get("/api/v1/audit-logs")).status).toBe(403);
      expect((await ctx.as("admin").get("/api/v1/audit-logs")).status).toBe(200);
    });
  });
});
