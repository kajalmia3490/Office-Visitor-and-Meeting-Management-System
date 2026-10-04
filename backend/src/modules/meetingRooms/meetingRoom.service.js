import { MeetingRoom } from "./meetingRoom.model.js";
import { Meeting } from "../meetings/meeting.model.js";
import { recordAudit } from "../auditLogs/auditLog.service.js";
import {
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  MEETING_STATUS,
  ROOM_STATUS,
} from "../../config/constants.js";
import { ApiError } from "../../utils/ApiError.js";
import { paginate } from "../../utils/pagination.js";
import { escapeRegex } from "../../utils/validators.js";

export async function getRoomOrThrow(id) {
  const room = await MeetingRoom.findById(id);
  if (!room)
    throw ApiError.notFound("Meeting room not found", "ROOM_NOT_FOUND");
  return room;
}

export function isRoomBookable(room) {
  return room.isActive && room.status === ROOM_STATUS.AVAILABLE;
}

export async function listRooms(query, pagination) {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.minCapacity) filter.capacity = { $gte: query.minCapacity };
  if (query.q) {
    const regex = new RegExp(escapeRegex(query.q), "i");
    filter.$or = [{ name: regex }, { roomNumber: regex }, { location: regex }];
  }
  return paginate(MeetingRoom, filter, pagination, { sort: { roomNumber: 1 } });
}

/** Rooms that are bookable and have no overlapping non-cancelled meeting. */
export async function findAvailableRooms({ startAt, endAt, capacity }) {
  const busyRoomIds = await Meeting.distinct("room", {
    status: { $ne: MEETING_STATUS.CANCELLED },
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
  });

  const filter = {
    _id: { $nin: busyRoomIds },
    isActive: true,
    status: ROOM_STATUS.AVAILABLE,
  };
  if (capacity) filter.capacity = { $gte: capacity };

  return MeetingRoom.find(filter).sort({ capacity: 1, roomNumber: 1 });
}

export async function createRoom(req, data) {
  const room = await MeetingRoom.create(data);

  await recordAudit(req, {
    action: AUDIT_ACTIONS.ROOM_CREATED,
    module: AUDIT_MODULES.MEETING_ROOMS,
    targetId: room._id,
    description: `Meeting room ${room.roomNumber} created`,
  });

  return room;
}

export async function updateRoom(req, id, data) {
  const room = await getRoomOrThrow(id);
  Object.assign(room, data);
  await room.save();

  await recordAudit(req, {
    action: AUDIT_ACTIONS.ROOM_UPDATED,
    module: AUDIT_MODULES.MEETING_ROOMS,
    targetId: room._id,
    description: `Meeting room ${room.roomNumber} updated`,
    metadata: { fields: Object.keys(data) },
  });

  return room;
}

export async function deleteRoom(req, id) {
  const room = await getRoomOrThrow(id);

  if (await Meeting.exists({ room: id })) {
    throw ApiError.conflict(
      "Meeting room has meeting history; set it to inactive instead",
      "ROOM_IN_USE",
    );
  }

  await room.deleteOne();

  await recordAudit(req, {
    action: AUDIT_ACTIONS.ROOM_DELETED,
    module: AUDIT_MODULES.MEETING_ROOMS,
    targetId: room._id,
    description: `Meeting room ${room.roomNumber} deleted`,
  });
}
