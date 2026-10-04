import { afterAll, beforeAll, beforeEach, describe, expect, test } from "@jest/globals";
import { setupTestApp, tomorrowAt } from "./helpers/setup.js";

let ctx;
let room101;

beforeAll(async () => {
  ctx = await setupTestApp();
});

beforeEach(async () => {
  await ctx.reset();
  room101 = await ctx.models.MeetingRoom.create({ name: "Room-101", roomNumber: "101", capacity: 4 });
});

afterAll(async () => {
  await ctx.teardown();
});

function meetingBody(overrides = {}) {
  return {
    title: "Meeting A",
    room: String(room101._id),
    startAt: tomorrowAt(10).toISOString(),
    endAt: tomorrowAt(11).toISOString(),
    ...overrides,
  };
}

describe("Meetings", () => {
  test("creates a meeting and notifies attendees", async () => {
    const res = await ctx
      .as("employee")
      .post("/api/v1/meetings")
      .send(meetingBody({ attendees: [String(ctx.users.employee2._id), String(ctx.users.employee._id)] }));

    expect(res.status).toBe(201);
    expect(res.body.data.organizer.email).toBe("employee@test.com");
    expect(res.body.data.room.roomNumber).toBe("101");
    // The organizer is removed from the attendee list.
    expect(res.body.data.attendees).toHaveLength(1);
    expect(res.body.data.status).toBe("scheduled");

    const notifications = await ctx.models.Notification.find({ recipient: ctx.users.employee2._id });
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe("meeting_invitation");
  });

  describe("critical integration test: room conflict prevention", () => {
    test("rejects Meeting B (10:30-11:30) overlapping Meeting A (10:00-11:00) in Room-101", async () => {
      const meetingA = await ctx.as("employee").post("/api/v1/meetings").send(meetingBody());
      expect(meetingA.status).toBe(201);

      const meetingB = await ctx
        .as("employee2")
        .post("/api/v1/meetings")
        .send(meetingBody({ title: "Meeting B", startAt: tomorrowAt(10, 30).toISOString(), endAt: tomorrowAt(11, 30).toISOString() }));

      expect(meetingB.status).toBe(409);
      expect(meetingB.body).toMatchObject({
        success: false,
        message: "Meeting room is already booked",
        error: { code: "ROOM_CONFLICT" },
      });
      expect(await ctx.models.Meeting.countDocuments()).toBe(1);
    });
  });

  test("detects every overlap shape but allows back-to-back meetings", async () => {
    await ctx.as("employee").post("/api/v1/meetings").send(meetingBody());

    const overlapping = [
      [tomorrowAt(9, 30), tomorrowAt(10, 30)],
      [tomorrowAt(10, 15), tomorrowAt(10, 45)],
      [tomorrowAt(9), tomorrowAt(12)],
      [tomorrowAt(10), tomorrowAt(11)],
    ];
    for (const [startAt, endAt] of overlapping) {
      const res = await ctx.as("employee2").post("/api/v1/meetings").send(meetingBody({ startAt, endAt }));
      expect(res.status).toBe(409);
    }

    const adjacent = await ctx
      .as("employee2")
      .post("/api/v1/meetings")
      .send(meetingBody({ startAt: tomorrowAt(11), endAt: tomorrowAt(12) }));
    expect(adjacent.status).toBe(201);
  });

  test("checks conflicts on update and allows rebooking after cancellation", async () => {
    const a = await ctx.as("employee").post("/api/v1/meetings").send(meetingBody());
    const b = await ctx
      .as("employee2")
      .post("/api/v1/meetings")
      .send(meetingBody({ title: "Meeting B", startAt: tomorrowAt(13), endAt: tomorrowAt(14) }));
    expect(b.status).toBe(201);

    const conflict = await ctx
      .as("employee2")
      .patch(`/api/v1/meetings/${b.body.data._id}`)
      .send({ startAt: tomorrowAt(10, 30), endAt: tomorrowAt(11, 30) });
    expect(conflict.status).toBe(409);
    expect(conflict.body.error.code).toBe("ROOM_CONFLICT");

    // Updating a meeting does not conflict with itself.
    const selfUpdate = await ctx
      .as("employee")
      .patch(`/api/v1/meetings/${a.body.data._id}`)
      .send({ endAt: tomorrowAt(11, 15) });
    expect(selfUpdate.status).toBe(200);

    const cancel = await ctx.as("employee").patch(`/api/v1/meetings/${a.body.data._id}/cancel`).send({ reason: "Not needed" });
    expect(cancel.status).toBe(200);
    expect(cancel.body.data.status).toBe("cancelled");

    const rebook = await ctx
      .as("employee2")
      .patch(`/api/v1/meetings/${b.body.data._id}`)
      .send({ startAt: tomorrowAt(10, 30), endAt: tomorrowAt(11, 30) });
    expect(rebook.status).toBe(200);
  });

  test("only the organizer or an admin can update or cancel", async () => {
    const a = await ctx.as("employee").post("/api/v1/meetings").send(meetingBody());
    const id = a.body.data._id;

    expect((await ctx.as("employee2").patch(`/api/v1/meetings/${id}`).send({ title: "Hijack" })).status).toBe(403);
    expect((await ctx.as("employee2").patch(`/api/v1/meetings/${id}/cancel`)).status).toBe(403);
    expect((await ctx.as("admin").patch(`/api/v1/meetings/${id}`).send({ title: "Renamed" })).status).toBe(200);

    const cancelled = await ctx.as("admin").patch(`/api/v1/meetings/${id}/cancel`);
    expect(cancelled.status).toBe(200);
    const again = await ctx.as("admin").patch(`/api/v1/meetings/${id}/cancel`);
    expect(again.status).toBe(409);
  });

  test("validates times and room capacity/status", async () => {
    const backwards = await ctx
      .as("employee")
      .post("/api/v1/meetings")
      .send(meetingBody({ startAt: tomorrowAt(11), endAt: tomorrowAt(10) }));
    expect(backwards.status).toBe(422);

    const past = await ctx
      .as("employee")
      .post("/api/v1/meetings")
      .send(meetingBody({ startAt: new Date(Date.now() - 3 * 3600_000), endAt: new Date(Date.now() - 2 * 3600_000) }));
    expect(past.status).toBe(422);

    const extra = await ctx.models.User.insertMany(
      [1, 2, 3, 4].map((i) => ({ name: `Extra ${i}`, email: `extra${i}@test.com`, role: "employee" })),
    );
    const tooMany = await ctx
      .as("employee")
      .post("/api/v1/meetings")
      .send(meetingBody({ attendees: extra.map((u) => String(u._id)) }));
    expect(tooMany.status).toBe(409);
    expect(tooMany.body.error.code).toBe("ROOM_CAPACITY_EXCEEDED");

    await ctx.models.MeetingRoom.updateOne({ _id: room101._id }, { status: "maintenance" });
    const maintenance = await ctx.as("employee").post("/api/v1/meetings").send(meetingBody());
    expect(maintenance.status).toBe(409);
    expect(maintenance.body.error.code).toBe("ROOM_UNAVAILABLE");
  });

  test("room availability excludes booked rooms", async () => {
    const room102 = await ctx.models.MeetingRoom.create({ name: "Room-102", roomNumber: "102", capacity: 10 });
    await ctx.as("employee").post("/api/v1/meetings").send(meetingBody());

    const res = await ctx
      .as("employee")
      .get(`/api/v1/meeting-rooms/availability?startAt=${tomorrowAt(10, 30).toISOString()}&endAt=${tomorrowAt(11, 30).toISOString()}`);
    expect(res.status).toBe(200);
    expect(res.body.data.map((r) => r._id)).toEqual([String(room102._id)]);

    const later = await ctx
      .as("employee")
      .get(`/api/v1/meeting-rooms/availability?startAt=${tomorrowAt(14).toISOString()}&endAt=${tomorrowAt(15).toISOString()}&capacity=5`);
    expect(later.body.data.map((r) => r.roomNumber)).toEqual(["102"]);
  });

  test("lists my meetings and upcoming meetings scoped to participants", async () => {
    await ctx.as("employee").post("/api/v1/meetings").send(meetingBody({ attendees: [String(ctx.users.employee2._id)] }));
    await ctx.as("admin").post("/api/v1/meetings").send(meetingBody({ title: "Admin only", startAt: tomorrowAt(15), endAt: tomorrowAt(16) }));

    const mine = await ctx.as("employee2").get("/api/v1/meetings/my-meetings");
    expect(mine.status).toBe(200);
    expect(mine.body.data).toHaveLength(1);

    const upcoming = await ctx.as("employee2").get("/api/v1/meetings/upcoming?days=3");
    expect(upcoming.body.data).toHaveLength(1);

    const all = await ctx.as("management").get("/api/v1/meetings");
    expect(all.body.data).toHaveLength(2);

    const notParticipant = await ctx.as("receptionist").get("/api/v1/meetings");
    expect(notParticipant.body.data).toHaveLength(0);
  });

  test("meeting statuses progress with time", async () => {
    const meeting = await ctx.models.Meeting.create({
      title: "Past",
      organizer: ctx.users.employee._id,
      room: room101._id,
      startAt: new Date(Date.now() - 2 * 3600_000),
      endAt: new Date(Date.now() - 3600_000),
    });
    await ctx.as("employee").get("/api/v1/meetings/my-meetings");
    const updated = await ctx.models.Meeting.findById(meeting._id);
    expect(updated.status).toBe("completed");
  });
});
