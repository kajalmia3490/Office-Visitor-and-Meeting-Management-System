import { Visitor } from "./visitor.model.js";
import { Visit } from "../visits/visit.model.js";
import { Appointment } from "../appointments/appointment.model.js";
import { recordAudit } from "../auditLogs/auditLog.service.js";
import { AUDIT_ACTIONS, AUDIT_MODULES, ROLES } from "../../config/constants.js";
import { ApiError } from "../../utils/ApiError.js";
import { buildPaginationMeta, paginate } from "../../utils/pagination.js";
import { escapeRegex } from "../../utils/validators.js";

/** Roles allowed to see full visitor identity details. */
const IDENTITY_ROLES = [ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.SECURITY];

/** Fields safe to expose when a visitor is embedded in other resources. */
export const VISITOR_SUMMARY_FIELDS = "fullName phone email organization photo";

export function maskIdentity(value) {
  if (!value) return value;
  const visible = value.slice(-4);
  return `${"*".repeat(Math.max(0, value.length - 4))}${visible}`;
}

export function serializeVisitor(visitor, currentUser) {
  const data =
    typeof visitor.toJSON === "function" ? visitor.toJSON() : { ...visitor };
  if (!IDENTITY_ROLES.includes(currentUser?.role)) {
    data.identityNumber = maskIdentity(data.identityNumber);
    delete data.address;
    delete data.emergencyContact;
  }
  return data;
}

export async function getVisitorOrThrow(id) {
  const visitor = await Visitor.findById(id);
  if (!visitor)
    throw ApiError.notFound("Visitor not found", "VISITOR_NOT_FOUND");
  return visitor;
}

function buildSearchFilter(q) {
  const regex = new RegExp(escapeRegex(q), "i");
  return {
    $or: [
      { fullName: regex },
      { phone: regex },
      { email: regex },
      { identityNumber: regex },
      { organization: regex },
    ],
  };
}

export async function listVisitors(query, pagination) {
  const filter = query.q ? buildSearchFilter(query.q) : {};
  if (query.organization)
    filter.organization = new RegExp(escapeRegex(query.organization), "i");
  return paginate(Visitor, filter, pagination);
}

export async function searchVisitors(q, limit = 20) {
  return Visitor.find(buildSearchFilter(q))
    .sort({ updatedAt: -1 })
    .limit(limit);
}

/**
 * Finds an existing visitor by identity number, phone or email, or registers
 * a new one. Used by walk-in registration and employee invitations.
 */
export async function findOrCreateVisitor(req, details) {
  const matchers = [];
  if (details.identityNumber)
    matchers.push({ identityNumber: details.identityNumber });
  if (details.phone) matchers.push({ phone: details.phone });
  if (details.email) matchers.push({ email: details.email });

  const existing = matchers.length
    ? await Visitor.findOne({ $or: matchers })
    : null;
  if (existing) return existing;

  return createVisitor(req, details);
}

export async function resolveVisitor(req, { visitor, visitorDetails }) {
  if (visitor) return getVisitorOrThrow(visitor);
  if (visitorDetails) return findOrCreateVisitor(req, visitorDetails);
  throw ApiError.validation("Either visitor or visitorDetails is required");
}

export async function createVisitor(req, data) {
  const visitor = await Visitor.create(data);

  await recordAudit(req, {
    action: AUDIT_ACTIONS.VISITOR_CREATED,
    module: AUDIT_MODULES.VISITORS,
    targetId: visitor._id,
    description: `Visitor ${visitor.fullName} registered`,
  });

  return visitor;
}

export async function updateVisitor(req, id, data) {
  const visitor = await getVisitorOrThrow(id);
  Object.assign(visitor, data);
  await visitor.save();

  await recordAudit(req, {
    action: AUDIT_ACTIONS.VISITOR_UPDATED,
    module: AUDIT_MODULES.VISITORS,
    targetId: visitor._id,
    description: `Visitor ${visitor.fullName} updated`,
    metadata: { fields: Object.keys(data) },
  });

  return visitor;
}

export async function deleteVisitor(req, id) {
  const visitor = await getVisitorOrThrow(id);

  const [hasVisits, hasAppointments] = await Promise.all([
    Visit.exists({ visitor: id }),
    Appointment.exists({ visitor: id }),
  ]);
  if (hasVisits || hasAppointments) {
    throw ApiError.conflict(
      "Visitor has visit or appointment history and cannot be deleted",
      "VISITOR_IN_USE",
    );
  }

  await visitor.deleteOne();

  await recordAudit(req, {
    action: AUDIT_ACTIONS.VISITOR_DELETED,
    module: AUDIT_MODULES.VISITORS,
    targetId: visitor._id,
    description: `Visitor ${visitor.fullName} deleted`,
  });
}

/**
 * Visit and appointment history for a visitor. Employees only see the
 * visits/appointments they hosted.
 */
export async function getVisitorHistory(
  currentUser,
  id,
  { page, limit, skip },
) {
  const visitor = await getVisitorOrThrow(id);

  const scope = { visitor: visitor._id };
  if (currentUser.role === ROLES.EMPLOYEE) scope.hostEmployee = currentUser._id;

  const [visits, totalVisits, appointments] = await Promise.all([
    Visit.find(scope)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("hostEmployee", "name email employeeId")
      .populate(
        "appointment",
        "purpose scheduledStartAt scheduledEndAt status",
      ),
    Visit.countDocuments(scope),
    Appointment.find(scope)
      .sort({ scheduledStartAt: -1 })
      .limit(50)
      .populate("hostEmployee", "name email employeeId"),
  ]);

  return {
    visitor: serializeVisitor(visitor, currentUser),
    visits,
    appointments,
    meta: buildPaginationMeta({ page, limit, total: totalVisits }),
  };
}
