import * as service from "./meeting.service.js";
import { getPagination } from "../../utils/pagination.js";
import { sendCreated, sendSuccess } from "../../utils/response.js";

export async function list(req, res) {
  const { items, meta } = await service.listMeetings(req.user, req.query, getPagination(req.query));
  return sendSuccess(res, { message: "Meetings retrieved successfully", data: items, meta });
}

export async function upcoming(req, res) {
  const meetings = await service.listUpcomingMeetings(req.user, req.query);
  return sendSuccess(res, { message: "Upcoming meetings retrieved successfully", data: meetings });
}

export async function myMeetings(req, res) {
  const { items, meta } = await service.listMyMeetings(req.user, req.query, getPagination(req.query));
  return sendSuccess(res, { message: "Your meetings retrieved successfully", data: items, meta });
}

export async function getById(req, res) {
  const meeting = await service.getMeeting(req.user, req.params.id);
  return sendSuccess(res, { message: "Meeting retrieved successfully", data: meeting });
}

export async function create(req, res) {
  const meeting = await service.createMeeting(req, req.body);
  return sendCreated(res, "Meeting created successfully", meeting);
}

export async function update(req, res) {
  const meeting = await service.updateMeeting(req, req.params.id, req.body);
  return sendSuccess(res, { message: "Meeting updated successfully", data: meeting });
}

export async function cancel(req, res) {
  const meeting = await service.cancelMeeting(req, req.params.id, req.body?.reason);
  return sendSuccess(res, { message: "Meeting cancelled successfully", data: meeting });
}
