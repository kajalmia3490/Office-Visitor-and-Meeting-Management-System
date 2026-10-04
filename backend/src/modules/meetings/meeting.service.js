import { Meeting } from "./meeting.model.js";
import { MAX_MEETING_HOURS } from "./meeting.validation.js";
import { User } from "../users/user.model.js";
import { ensureActiveUser } from "../users/user.service.js";
import { getRoomOrThrow, isRoomBookable } from "../meetingRooms/meetingRoom.service.js";
import { notifyMany } from "../notifications/notification.service.js";
import { recordAudit } from "../auditLogs/auditLog.service.js";
import {
  ATTENDEE_STATUS,
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  MEETING_STATUS,
  NOTIFICATION_TYPES,
  ROLES,
} from "../../config/constants.js";
import { ApiError } from "../../utils/ApiError.js";
import { addDays } from "../../utils/dateTime.js";
import { paginate } from "../../utils/pagination.js";

const FULL_ACCESS_ROLES = [ROLES.ADMIN, ROLES.MANAGEMENT];

export const MEETING_POPULATE = [
  { path: "organizer", select: "name email employeeId" },
  { path: "room", select: "name roomNumber location capacity" },
  { path: "attendees.user", select: "name email employeeId" },
];

const idOf = (ref) => String(ref?._id ?? ref);

function participantFilter(userId) {
  return { $or: [{ organizer: userId }, { "attendees.user": userId }] };
}

function isParticipant(meeting, userId) {
  const id = String(userId);
  return idOf(meeting.organizer) === id || meeting.attendees.some((a) => idOf(a.user) === id);
}

function canManageMeeting(user, meeting) {
  return user.role === ROLES.ADMIN || idOf(meeting.organizer) === String(user._id);
}

/**
 * Double-booking guard: a room is booked when a non-cancelled meeting satisfies
 * existing.startAt < new.endAt AND existing.endAt > new.startAt.
 */
export async function assertRoomAvailable({ roomId, startAt, endAt, excludeMeetingId }) {
  const filter = {
    room: roomId,
    status: { $ne: MEETING_STATUS.CANCELLED },
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
  };
  if (excludeMeetingId) filter._id = { $ne: excludeMeetingId };

  const conflict = await Meeting.findOne(filter).select("_id title startAt endAt");
  if (conflict) {
    throw ApiError.conflict("Meeting room is already booked", "ROOM_CONFLICT", {
      conflictingMeeting: {
        id: conflict._id,
        title: conflict.title,
        startAt: conflict.startAt,
        endAt: conflict.endAt,
      },
    });
  }
}

async function assertRoomUsable(roomId, participantCount) {
  const room = await getRoomOrThrow(roomId);
  if (!isRoomBookable(room)) {
    throw ApiError.conflict(`Meeting room is not available (status: ${room.status})`, "ROOM_UNAVAILABLE");
  }
  if (participantCount > room.capacity) {
    throw ApiError.conflict(
      `Meeting room capacity (${room.capacity}) is less than the number of participants (${participantCount})`,
      "ROOM_CAPACITY_EXCEEDED",
    );
  }
  return room;
}

async function normalizeAttendees(attendeeIds = [], organizerId) {
  const unique = [...new Set(attendeeIds.map(String))].filter((id) => id !== String(organizerId));
  if (!unique.length) return [];

  const users = await User.find({ _id: { $in: unique }, isActive: true }).select("_id");
  if (users.length !== unique.length) {
    throw ApiError.badRequest("One or more attendees were not found or are inactive", "INVALID_ATTENDEES");
  }
  return unique;
}

export async function getMeetingOrThrow(id) {
  const meeting = await Meeting.findById(id).populate(MEETING_POPULATE);
  if (!meeting) throw ApiError.notFound("Meeting not found", "MEETING_NOT_FOUND");
  return meeting;
}

export async function getMeeting(user, id) {
  const meeting = await getMeetingOrThrow(id);
  if (!FULL_ACCESS_ROLES.includes(user.role) && !isParticipant(meeting, user._id)) {
    throw ApiError.forbidden("You are not a participant of this meeting");
  }
  return meeting;
}

/** Moves meetings to ongoing/completed based on the current time. */
export async function syncMeetingStatuses(now = new Date()) {
  await Promise.all([
    Meeting.updateMany(
      { status: { $in: [MEETING_STATUS.SCHEDULED, MEETING_STATUS.ONGOING] }, endAt: { $lte: now } },
      { $set: { status: MEETING_STATUS.COMPLETED } },
    ),
    Meeting.updateMany(
      { status: MEETING_STATUS.SCHEDULED, startAt: { $lte: now }, endAt: { $gt: now } },
      { $set: { status: MEETING_STATUS.ONGOING } },
    ),
  ]);
}

export async function listMeetings(user, query, pagination) {
  await syncMeetingStatuses();

  const filter = FULL_ACCESS_ROLES.includes(user.role) ? {} : participantFilter(user._id);
  if (query.status) filter.status = query.status;
  if (query.room) filter.room = query.room;
  if (query.organizer) filter.organizer = query.organizer;
  if (query.from || query.to) {
    filter.startAt = {};
    if (query.from) filter.startAt.$gte = query.from;
    if (query.to) filter.startAt.$lte = query.to;
  }

  return paginate(Meeting, filter, pagination, { sort: { startAt: 1 }, populate: MEETING_POPULATE });
}

export async function listUpcomingMeetings(user, { days = 7, limit = 20 } = {}) {
  await syncMeetingStatuses();
  const now = new Date();

  const filter = {
    ...(FULL_ACCESS_ROLES.includes(user.role) ? {} : participantFilter(user._id)),
    status: { $in: [MEETING_STATUS.SCHEDULED, MEETING_STATUS.ONGOING] },
    endAt: { $gt: now },
    startAt: { $lte: addDays(now, days) },
  };

  return Meeting.find(filter).sort({ startAt: 1 }).limit(limit).populate(MEETING_POPULATE);
}

export async function listMyMeetings(user, query, pagination) {
  await syncMeetingStatuses();

  const filter = participantFilter(user._id);
  if (query.status) filter.status = query.status;
  if (query.from || query.to) {
    filter.startAt = {};
    if (query.from) filter.startAt.$gte = query.from;
    if (query.to) filter.startAt.$lte = query.to;
  }

  return paginate(Meeting, filter, pagination, { sort: { startAt: 1 }, populate: MEETING_POPULATE });
}

export async function createMeeting(req, data) {
  const organizerId = req.user.role === ROLES.ADMIN && data.organizer ? data.organizer : req.user._id;
  if (String(organizerId) !== String(req.user._id)) await ensureActiveUser(organizerId, "Organizer");

  const attendeeIds = await normalizeAttendees(data.attendees, organizerId);
  await assertRoomUsable(data.room, attendeeIds.length + 1);
  await assertRoomAvailable({ roomId: data.room, startAt: data.startAt, endAt: data.endAt });

  const meeting = await Meeting.create({
    title: data.title,
    description: data.description,
    organizer: organizerId,
    room: data.room,
    startAt: data.startAt,
    endAt: data.endAt,
    attendees: attendeeIds.map((user) => ({ user, status: ATTENDEE_STATUS.INVITED })),
  });

  await Promise.all([
    recordAudit(req, {
      action: AUDIT_ACTIONS.MEETING_CREATED,
      module: AUDIT_MODULES.MEETINGS,
      targetId: meeting._id,
      description: `Meeting "${meeting.title}" created`,
    }),
    notifyMany(attendeeIds, {
      type: NOTIFICATION_TYPES.MEETING_INVITATION,
      title: "New meeting invitation",
      message: `You have been invited to "${meeting.title}" on ${meeting.startAt.toISOString()}`,
      relatedMeeting: meeting._id,
    }),
  ]);

  return getMeetingOrThrow(meeting._id);
}

export async function updateMeeting(req, id, data) {
  const meeting = await getMeetingOrThrow(id);
  if (!canManageMeeting(req.user, meeting)) {
    throw ApiError.forbidden("Only the organizer or an admin can update this meeting");
  }
  if (meeting.status !== MEETING_STATUS.SCHEDULED) {
    throw ApiError.conflict(`A ${meeting.status} meeting cannot be updated`, "MEETING_NOT_EDITABLE");
  }

  const startAt = data.startAt ?? meeting.startAt;
  const endAt = data.endAt ?? meeting.endAt;
  const roomId = data.room ?? idOf(meeting.room);

  if (endAt <= startAt) throw ApiError.validation("endAt must be after startAt");
  if (endAt - startAt > MAX_MEETING_HOURS * 60 * 60 * 1000) {
    throw ApiError.validation(`A meeting cannot be longer than ${MAX_MEETING_HOURS} hours`);
  }
  if (data.startAt && data.startAt < new Date()) throw ApiError.validation("startAt cannot be in the past");

  const organizerId = idOf(meeting.organizer);
  const previousAttendeeIds = meeting.attendees.map((a) => idOf(a.user));
  const attendeeIds = data.attendees
    ? await normalizeAttendees(data.attendees, organizerId)
    : previousAttendeeIds;

  const scheduleChanged =
    Boolean(data.room && data.room !== idOf(meeting.room)) ||
    Boolean(data.startAt && +data.startAt !== +meeting.startAt) ||
    Boolean(data.endAt && +data.endAt !== +meeting.endAt);

  if (scheduleChanged || data.attendees) {
    await assertRoomUsable(roomId, attendeeIds.length + 1);
  }
  if (scheduleChanged) {
    await assertRoomAvailable({ roomId, startAt, endAt, excludeMeetingId: meeting._id });
  }

  if (data.title !== undefined) meeting.title = data.title;
  if (data.description !== undefined) meeting.description = data.description;
  meeting.room = roomId;
  meeting.startAt = startAt;
  meeting.endAt = endAt;
  if (data.attendees) {
    const previousStatus = new Map(meeting.attendees.map((a) => [idOf(a.user), a.status]));
    meeting.attendees = attendeeIds.map((user) => ({
      user,
      status: previousStatus.get(user) ?? ATTENDEE_STATUS.INVITED,
    }));
  }
  await meeting.save();

  const newAttendees = attendeeIds.filter((uid) => !previousAttendeeIds.includes(uid));
  const existingAttendees = attendeeIds.filter((uid) => previousAttendeeIds.includes(uid));

  await Promise.all([
    recordAudit(req, {
      action: AUDIT_ACTIONS.MEETING_UPDATED,
      module: AUDIT_MODULES.MEETINGS,
      targetId: meeting._id,
      description: `Meeting "${meeting.title}" updated`,
      metadata: { fields: Object.keys(data) },
    }),
    notifyMany(newAttendees, {
      type: NOTIFICATION_TYPES.MEETING_INVITATION,
      title: "New meeting invitation",
      message: `You have been invited to "${meeting.title}" on ${meeting.startAt.toISOString()}`,
      relatedMeeting: meeting._id,
    }),
    scheduleChanged &&
      notifyMany(existingAttendees, {
        type: NOTIFICATION_TYPES.MEETING_UPDATED,
        title: "Meeting updated",
        message: `"${meeting.title}" has been rescheduled to ${meeting.startAt.toISOString()}`,
        relatedMeeting: meeting._id,
      }),
  ]);

  return getMeetingOrThrow(meeting._id);
}

export async function cancelMeeting(req, id, reason) {
  const meeting = await getMeetingOrThrow(id);
  if (!canManageMeeting(req.user, meeting)) {
    throw ApiError.forbidden("Only the organizer or an admin can cancel this meeting");
  }
  if (![MEETING_STATUS.SCHEDULED, MEETING_STATUS.ONGOING].includes(meeting.status)) {
    throw ApiError.conflict(`A ${meeting.status} meeting cannot be cancelled`, "MEETING_NOT_CANCELLABLE");
  }

  meeting.status = MEETING_STATUS.CANCELLED;
  meeting.cancelledAt = new Date();
  meeting.cancelledBy = req.user._id;
  meeting.cancelReason = reason;
  await meeting.save();

  await Promise.all([
    recordAudit(req, {
      action: AUDIT_ACTIONS.MEETING_CANCELLED,
      module: AUDIT_MODULES.MEETINGS,
      targetId: meeting._id,
      description: `Meeting "${meeting.title}" cancelled`,
      metadata: reason ? { reason } : undefined,
    }),
    notifyMany(
      meeting.attendees.map((a) => idOf(a.user)),
      {
        type: NOTIFICATION_TYPES.MEETING_CANCELLED,
        title: "Meeting cancelled",
        message: `"${meeting.title}" scheduled for ${meeting.startAt.toISOString()} has been cancelled`,
        relatedMeeting: meeting._id,
      },
    ),
  ]);

  return meeting;
}
