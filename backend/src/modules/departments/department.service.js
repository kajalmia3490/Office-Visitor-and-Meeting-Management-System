import { Department } from "./department.model.js";
import { User } from "../users/user.model.js";
import { recordAudit } from "../auditLogs/auditLog.service.js";
import { AUDIT_ACTIONS, AUDIT_MODULES } from "../../config/constants.js";
import { ApiError } from "../../utils/ApiError.js";
import { paginate } from "../../utils/pagination.js";
import { escapeRegex } from "../../utils/validators.js";

const HEAD_POPULATE = { path: "head", select: "name email role employeeId" };

async function ensureHead(headId) {
  if (!headId) return;
  const head = await User.findById(headId);
  if (!head) throw ApiError.badRequest("Department head not found", "USER_NOT_FOUND");
  if (!head.isActive) throw ApiError.badRequest("Department head is inactive", "USER_INACTIVE");
}

export async function getDepartmentOrThrow(id) {
  const department = await Department.findById(id).populate(HEAD_POPULATE);
  if (!department) throw ApiError.notFound("Department not found", "DEPARTMENT_NOT_FOUND");
  return department;
}

export async function listDepartments(query, pagination) {
  const filter = {};
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.q) {
    const regex = new RegExp(escapeRegex(query.q), "i");
    filter.$or = [{ name: regex }, { code: regex }];
  }
  return paginate(Department, filter, pagination, { sort: { name: 1 }, populate: HEAD_POPULATE });
}

export async function createDepartment(req, data) {
  await ensureHead(data.head);
  const department = await Department.create(data);

  await recordAudit(req, {
    action: AUDIT_ACTIONS.DEPARTMENT_CREATED,
    module: AUDIT_MODULES.DEPARTMENTS,
    targetId: department._id,
    description: `Department ${department.code} created`,
  });

  return getDepartmentOrThrow(department._id);
}

export async function updateDepartment(req, id, data) {
  const department = await getDepartmentOrThrow(id);
  if (data.head) await ensureHead(data.head);

  Object.assign(department, data);
  await department.save();

  await recordAudit(req, {
    action: AUDIT_ACTIONS.DEPARTMENT_UPDATED,
    module: AUDIT_MODULES.DEPARTMENTS,
    targetId: department._id,
    description: `Department ${department.code} updated`,
    metadata: { fields: Object.keys(data) },
  });

  return getDepartmentOrThrow(department._id);
}

export async function deleteDepartment(req, id) {
  const department = await getDepartmentOrThrow(id);

  if (await User.exists({ department: id })) {
    throw ApiError.conflict(
      "Department has assigned users; reassign them or deactivate the department instead",
      "DEPARTMENT_IN_USE",
    );
  }

  await department.deleteOne();

  await recordAudit(req, {
    action: AUDIT_ACTIONS.DEPARTMENT_DELETED,
    module: AUDIT_MODULES.DEPARTMENTS,
    targetId: department._id,
    description: `Department ${department.code} deleted`,
  });
}
