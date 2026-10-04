import * as service from "./department.service.js";
import { getPagination } from "../../utils/pagination.js";
import {
  sendCreated,
  sendNoContent,
  sendSuccess,
} from "../../utils/response.js";

export async function list(req, res) {
  const { items, meta } = await service.listDepartments(
    req.query,
    getPagination(req.query),
  );
  return sendSuccess(res, {
    message: "Departments retrieved successfully",
    data: items,
    meta,
  });
}

export async function getById(req, res) {
  const department = await service.getDepartmentOrThrow(req.params.id);
  return sendSuccess(res, {
    message: "Department retrieved successfully",
    data: department,
  });
}

export async function create(req, res) {
  const department = await service.createDepartment(req, req.body);
  return sendCreated(res, "Department created successfully", department);
}

export async function update(req, res) {
  const department = await service.updateDepartment(
    req,
    req.params.id,
    req.body,
  );
  return sendSuccess(res, {
    message: "Department updated successfully",
    data: department,
  });
}

export async function remove(req, res) {
  await service.deleteDepartment(req, req.params.id);
  return sendNoContent(res);
}
