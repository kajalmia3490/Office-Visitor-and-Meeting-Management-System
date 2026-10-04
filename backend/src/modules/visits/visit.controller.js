import * as service from "./visit.service.js";
import { getPassForVisit } from "../visitorPasses/visitorPass.service.js";
import { getPagination } from "../../utils/pagination.js";
import { sendCreated, sendSuccess } from "../../utils/response.js";

export async function list(req, res) {
  const { items, meta } = await service.listVisits(
    req.user,
    req.query,
    getPagination(req.query),
  );
  return sendSuccess(res, {
    message: "Visits retrieved successfully",
    data: items,
    meta,
  });
}

export async function active(req, res) {
  const visits = await service.listActiveVisits(req.user);
  return sendSuccess(res, {
    message: "Active visitors retrieved successfully",
    data: visits,
    meta: { count: visits.length },
  });
}

export async function today(req, res) {
  const visits = await service.listTodayVisits(req.user);
  return sendSuccess(res, {
    message: "Today's visits retrieved successfully",
    data: visits,
    meta: { count: visits.length },
  });
}

export async function getById(req, res) {
  const visit = await service.getVisit(req.user, req.params.id);
  return sendSuccess(res, {
    message: "Visit retrieved successfully",
    data: visit,
  });
}

export async function walkIn(req, res) {
  const result = await service.registerWalkIn(req, req.body);
  return sendCreated(res, "Walk-in visitor checked in successfully", result);
}

export async function checkIn(req, res) {
  const result = await service.checkIn(req, req.params.id, req.body);
  return sendSuccess(res, {
    message: "Visitor checked in successfully",
    data: result,
  });
}

export async function checkOut(req, res) {
  const visit = await service.checkOut(req, req.params.id, req.body);
  return sendSuccess(res, {
    message: "Visitor checked out successfully",
    data: visit,
  });
}

export async function pass(req, res) {
  const visitorPass = await getPassForVisit(req.user, req.params.id);
  return sendSuccess(res, {
    message: "Visitor pass retrieved successfully",
    data: visitorPass,
  });
}
