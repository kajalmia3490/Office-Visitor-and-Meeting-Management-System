import * as service from "./meetingRoom.service.js";
import { getPagination } from "../../utils/pagination.js";
import {
  sendCreated,
  sendNoContent,
  sendSuccess,
} from "../../utils/response.js";

export async function list(req, res) {
  const { items, meta } = await service.listRooms(
    req.query,
    getPagination(req.query),
  );
  return sendSuccess(res, {
    message: "Meeting rooms retrieved successfully",
    data: items,
    meta,
  });
}

export async function availability(req, res) {
  const rooms = await service.findAvailableRooms(req.query);
  return sendSuccess(res, {
    message: "Available meeting rooms retrieved successfully",
    data: rooms,
  });
}

export async function getById(req, res) {
  const room = await service.getRoomOrThrow(req.params.id);
  return sendSuccess(res, {
    message: "Meeting room retrieved successfully",
    data: room,
  });
}

export async function create(req, res) {
  const room = await service.createRoom(req, req.body);
  return sendCreated(res, "Meeting room created successfully", room);
}

export async function update(req, res) {
  const room = await service.updateRoom(req, req.params.id, req.body);
  return sendSuccess(res, {
    message: "Meeting room updated successfully",
    data: room,
  });
}

export async function remove(req, res) {
  await service.deleteRoom(req, req.params.id);
  return sendNoContent(res);
}
