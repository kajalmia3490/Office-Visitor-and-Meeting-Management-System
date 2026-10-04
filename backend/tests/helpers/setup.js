import { fileURLToPath } from "node:url";
import { jest } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import supertest from "supertest";

const sessionModulePath = fileURLToPath(new URL("../../src/modules/auth/auth.session.js", import.meta.url));

export const TEST_USER_HEADER = "x-test-user";
const SESSION_CREATED_AT = new Date("2026-01-01T00:00:00.000Z");

function fakeSession(email) {
  if (!email) return null;
  return {
    user: { id: `auth-${email}`, email, name: email.split("@")[0] },
    session: {
      id: `session-${email}`,
      createdAt: SESSION_CREATED_AT,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  };
}

export const ROLE_EMAILS = {
  admin: "admin@test.com",
  receptionist: "reception@test.com",
  security: "security@test.com",
  employee: "employee@test.com",
  employee2: "employee2@test.com",
  management: "management@test.com",
};

/**
 * Boots the app against an in-memory MongoDB with the Better Auth session
 * boundary replaced: requests authenticate by sending the user's email in the
 * `x-test-user` header.
 */
export async function setupTestApp() {
  process.env.NODE_ENV = "test";
  const mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  process.env.MONGODB_DB_NAME = "office_test";

  jest.unstable_mockModule(sessionModulePath, () => ({
    getSessionFromRequest: async (req) => fakeSession(req.headers[TEST_USER_HEADER]),
    getSessionFromHeaders: async (headers) => fakeSession(headers[TEST_USER_HEADER]),
    signOutRequest: async () =>
      new Response(null, {
        headers: { "set-cookie": "better-auth.session_token=; Max-Age=0; Path=/; HttpOnly" },
      }),
  }));

  const { default: mongoose } = await import("mongoose");
  const { default: app } = await import("../../src/app.js");
  const { connectDB, disconnectDB } = await import("../../src/config/db.js");
  const models = await loadModels();

  await connectDB(process.env.MONGODB_URI);
  await Promise.all(Object.values(mongoose.models).map((model) => model.syncIndexes()));

  const users = {};

  async function seedUsers() {
    const { User } = models;
    const definitions = [
      ["admin", "admin", "EMP-001"],
      ["receptionist", "receptionist", "EMP-002"],
      ["security", "security", "EMP-003"],
      ["employee", "employee", "EMP-004"],
      ["employee2", "employee", "EMP-005"],
      ["management", "management", "EMP-006"],
    ];
    for (const [key, role, employeeId] of definitions) {
      users[key] = await User.create({
        name: `${key[0].toUpperCase()}${key.slice(1)} User`,
        email: ROLE_EMAILS[key],
        role,
        employeeId,
      });
    }
  }

  async function reset() {
    await Promise.all(
      Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})),
    );
    for (const key of Object.keys(users)) delete users[key];
    await seedUsers();
  }

  /** Supertest wrapper authenticated as one of the seeded users (or any email). */
  function as(who) {
    const email = ROLE_EMAILS[who] ?? who;
    const request = supertest(app);
    const wrap = (method) => (url) => request[method](url).set(TEST_USER_HEADER, email);
    return { get: wrap("get"), post: wrap("post"), patch: wrap("patch"), delete: wrap("delete") };
  }

  async function teardown() {
    await disconnectDB();
    await mongo.stop();
  }

  await seedUsers();

  return { app, request: supertest(app), as, users, models, reset, teardown };
}

async function loadModels() {
  const [
    { User },
    { Department },
    { Visitor },
    { Appointment },
    { Meeting },
    { MeetingRoom },
    { Visit },
    { Notification },
    { VisitorPass },
    { AuditLog },
  ] = await Promise.all([
    import("../../src/modules/users/user.model.js"),
    import("../../src/modules/departments/department.model.js"),
    import("../../src/modules/visitors/visitor.model.js"),
    import("../../src/modules/appointments/appointment.model.js"),
    import("../../src/modules/meetings/meeting.model.js"),
    import("../../src/modules/meetingRooms/meetingRoom.model.js"),
    import("../../src/modules/visits/visit.model.js"),
    import("../../src/modules/notifications/notification.model.js"),
    import("../../src/modules/visitorPasses/visitorPass.model.js"),
    import("../../src/modules/auditLogs/auditLog.model.js"),
  ]);
  return { User, Department, Visitor, Appointment, Meeting, MeetingRoom, Visit, Notification, VisitorPass, AuditLog };
}

/** Tomorrow at the given UTC hour/minute. */
export function tomorrowAt(hours, minutes = 0) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 1);
  date.setUTCHours(hours, minutes, 0, 0);
  return date;
}

export const sampleVisitor = (overrides = {}) => ({
  fullName: "Jane Visitor",
  phone: "+8801700000001",
  email: "jane@visitor.com",
  organization: "Acme Ltd",
  identityType: "national_id",
  identityNumber: "NID123456789",
  ...overrides,
});
