import { User } from "./user.model.js";
import { Department } from "../departments/department.model.js";
import { Visit } from "../visits/visit.model.js";
import { Meeting } from "../meetings/meeting.model.js";
import { Appointment } from "../appointments/appointment.model.js";
import { recordAudit } from "../auditLogs/auditLog.service.js";
import { AUDIT_ACTIONS, AUDIT_MODULES, ROLES } from "../../config/constants.js";
import { ApiError } from "../../utils/ApiError.js";
import { paginate } from "../../utils/pagination.js";
import { escapeRegex } from "../../utils/validators.js";

const DIRECTORY_FIELDS = "name email role department employeeId profileImage";
const FULL_ACCESS_ROLES = [ROLES.ADMIN, ROLES.MANAGEMENT];

async function ensureDepartment(departmentId) {
  if (!departmentId) return;
  const exists = await Department.exists({ _id: departmentId });
  if (!exists) throw ApiError.badRequest("Department not found", "DEPARTMENT_NOT_FOUND");
}

export async function getUserOrThrow(id) {
  const user = await User.findById(id).populate("department", "name code");
  if (!user) throw ApiError.notFound("User not found", "USER_NOT_FOUND");
  return user;
}

/** Ensures the referenced user exists and is active (used for hosts/attendees). */
export async function ensureActiveUser(id, label = "User") {
  const user = await User.findById(id);
  if (!user) throw ApiError.badRequest(`${label} not found`, "USER_NOT_FOUND");
  if (!user.isActive) throw ApiError.badRequest(`${label} is inactive`, "USER_INACTIVE");
  return user;
}

/**
 * Admin and management see full profiles. Other staff get a read-only
 * directory of active users (needed to choose hosts and meeting attendees).
 */
export async function listUsers(currentUser, query, pagination) {
  const filter = {};
  const fullAccess = FULL_ACCESS_ROLES.includes(currentUser.role);

  if (query.role) filter.role = query.role;
  if (query.department) filter.department = query.department;
  if (fullAccess) {
    if (query.isActive !== undefined) filter.isActive = query.isActive;
  } else {
    filter.isActive = true;
  }
  if (query.q) {
    const regex = new RegExp(escapeRegex(query.q), "i");
    filter.$or = [{ name: regex }, { email: regex }, { employeeId: regex }];
  }

  return paginate(User, filter, pagination, {
    sort: { name: 1 },
    select: fullAccess ? undefined : DIRECTORY_FIELDS,
    populate: { path: "department", select: "name code" },
  });
}

export async function getUser(currentUser, id) {
  const isSelf = String(currentUser._id) === String(id);
  if (!isSelf && !FULL_ACCESS_ROLES.includes(currentUser.role)) throw ApiError.forbidden();
  return getUserOrThrow(id);
}

export async function createUser(req, data) {
  await ensureDepartment(data.department);
  const user = await User.create(data);

  await recordAudit(req, {
    action: AUDIT_ACTIONS.USER_CREATED,
    module: AUDIT_MODULES.USERS,
    targetId: user._id,
    description: `User ${user.email} created with role ${user.role}`,
  });

  return getUserOrThrow(user._id);
}

export async function updateUser(req, id, data) {
  const user = await getUserOrThrow(id);
  const isSelf = String(req.user._id) === String(id);

  if (isSelf && data.role && data.role !== ROLES.ADMIN) {
    throw ApiError.badRequest("You cannot remove your own admin role", "SELF_ROLE_CHANGE");
  }
  if (data.department) await ensureDepartment(data.department);

  const previousRole = user.role;
  Object.assign(user, data);
  await user.save();

  await recordAudit(req, {
    action: AUDIT_ACTIONS.USER_UPDATED,
    module: AUDIT_MODULES.USERS,
    targetId: user._id,
    description: `User ${user.email} updated`,
    metadata: { fields: Object.keys(data), ...(data.role && { previousRole, newRole: data.role }) },
  });

  return getUserOrThrow(user._id);
}

export async function setUserStatus(req, id, isActive) {
  if (String(req.user._id) === String(id) && !isActive) {
    throw ApiError.badRequest("You cannot deactivate your own account", "SELF_DEACTIVATION");
  }

  const user = await getUserOrThrow(id);
  user.isActive = isActive;
  await user.save();

  await recordAudit(req, {
    action: isActive ? AUDIT_ACTIONS.USER_ACTIVATED : AUDIT_ACTIONS.USER_DEACTIVATED,
    module: AUDIT_MODULES.USERS,
    targetId: user._id,
    description: `User ${user.email} ${isActive ? "activated" : "deactivated"}`,
  });

  return user;
}

export async function deleteUser(req, id) {
  if (String(req.user._id) === String(id)) {
    throw ApiError.badRequest("You cannot delete your own account", "SELF_DELETION");
  }

  const user = await getUserOrThrow(id);

  const [visits, meetings, appointments, headOf] = await Promise.all([
    Visit.exists({ $or: [{ hostEmployee: id }, { checkInBy: id }, { checkOutBy: id }] }),
    Meeting.exists({ $or: [{ organizer: id }, { "attendees.user": id }] }),
    Appointment.exists({ $or: [{ hostEmployee: id }, { createdBy: id }] }),
    Department.exists({ head: id }),
  ]);

  if (visits || meetings || appointments || headOf) {
    throw ApiError.conflict(
      "User is referenced by existing records; deactivate the user instead",
      "USER_IN_USE",
    );
  }

  await user.deleteOne();

  await recordAudit(req, {
    action: AUDIT_ACTIONS.USER_DELETED,
    module: AUDIT_MODULES.USERS,
    targetId: user._id,
    description: `User ${user.email} deleted`,
  });
}
