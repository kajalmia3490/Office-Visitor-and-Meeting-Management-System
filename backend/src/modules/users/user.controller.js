import * as service from "./user.service.js";
import { getPagination } from "../../utils/pagination.js";
import {
  sendCreated,
  sendNoContent,
  sendSuccess,
} from "../../utils/response.js";

export async function list(req, res) {
  const { items, meta } = await service.listUsers(
    req.user,
    req.query,
    getPagination(req.query),
  );
  return sendSuccess(res, {
    message: "Users retrieved successfully",
    data: items,
    meta,
  });
}

export async function getById(req, res) {
  const user = await service.getUser(req.user, req.params.id);
  return sendSuccess(res, {
    message: "User retrieved successfully",
    data: user,
  });
}

export async function create(req, res) {
  const user = await service.createUser(req, req.body);
  return sendCreated(res, "User created successfully", user);
}

export async function update(req, res) {
  const user = await service.updateUser(req, req.params.id, req.body);
  return sendSuccess(res, { message: "User updated successfully", data: user });
}

export async function updateStatus(req, res) {
  const user = await service.setUserStatus(
    req,
    req.params.id,
    req.body.isActive,
  );
  return sendSuccess(res, {
    message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
    data: user,
  });
}

export async function remove(req, res) {
  await service.deleteUser(req, req.params.id);
  return sendNoContent(res);
}
