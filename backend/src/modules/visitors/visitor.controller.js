import * as service from "./visitor.service.js";
import { getPagination } from "../../utils/pagination.js";
import {
  sendCreated,
  sendNoContent,
  sendSuccess,
} from "../../utils/response.js";

const serializeAll = (visitors, user) =>
  visitors.map((v) => service.serializeVisitor(v, user));

export async function list(req, res) {
  const { items, meta } = await service.listVisitors(
    req.query,
    getPagination(req.query),
  );
  return sendSuccess(res, {
    message: "Visitors retrieved successfully",
    data: serializeAll(items, req.user),
    meta,
  });
}

export async function search(req, res) {
  const visitors = await service.searchVisitors(req.query.q, req.query.limit);
  return sendSuccess(res, {
    message: "Visitor search results",
    data: serializeAll(visitors, req.user),
  });
}

export async function getById(req, res) {
  const visitor = await service.getVisitorOrThrow(req.params.id);
  return sendSuccess(res, {
    message: "Visitor retrieved successfully",
    data: service.serializeVisitor(visitor, req.user),
  });
}

export async function history(req, res) {
  const { meta, ...data } = await service.getVisitorHistory(
    req.user,
    req.params.id,
    getPagination(req.query),
  );
  return sendSuccess(res, {
    message: "Visitor history retrieved successfully",
    data,
    meta,
  });
}

export async function create(req, res) {
  const visitor = await service.createVisitor(req, req.body);
  return sendCreated(res, "Visitor created successfully", visitor);
}

export async function update(req, res) {
  const visitor = await service.updateVisitor(req, req.params.id, req.body);
  return sendSuccess(res, {
    message: "Visitor updated successfully",
    data: visitor,
  });
}

export async function remove(req, res) {
  await service.deleteVisitor(req, req.params.id);
  return sendNoContent(res);
}
