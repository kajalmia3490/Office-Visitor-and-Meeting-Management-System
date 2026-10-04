import { Visit } from "./visit.model.js";
import { Appointment } from "../appointments/appointment.model.js";
import { ensureActiveUser } from "../users/user.service.js";
import { resolveVisitor, VISITOR_SUMMARY_FIELDS } from "../visitors/visitor.service.js";
import { expirePassesForVisit, issuePass } from "../visitorPasses/visitorPass.service.js";
import { notify } from "../notifications/notification.service.js";
import { recordAudit } from "../auditLogs/auditLog.service.js";
import {
  APPOINTMENT_STATUS,
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  NOTIFICATION_TYPES,
  ROLES,
  VISIT_STATUS,
  VISIT_TYPE,
} from "../../config/constants.js";
import { ApiError } from "../../utils/ApiError.js";
import { todayRange } from "../../utils/dateTime.js";
import { paginate } from "../../utils/pagination.js";

export const VISIT_POPULATE = [
  { path: "visitor", select: VISITOR_SUMMARY_FIELDS },
  { path: "hostEmployee", select: "name email employeeId department" },
  { path: "appointment", select: "purpose scheduledStartAt scheduledEndAt status" },
  { path: "checkInBy", select: "name role" },
  { path: "checkOutBy", select: "name role" },
];

const idOf = (ref) => String(ref?._id ?? ref);

function scopeFilter(user) {
  return user.role === ROLES.EMPLOYEE ? { hostEmployee: user._id } : {};
}

function assertCanView(user, visit) {
  if (user.role === ROLES.EMPLOYEE && idOf(visit.hostEmployee) !== String(user._id)) {
    throw ApiError.forbidden("You can only access visits you host");
  }
}

export async function getVisitOrThrow(id) {
  const visit = await Visit.findById(id).populate(VISIT_POPULATE);
  if (!visit) throw ApiError.notFound("Visit not found", "VISIT_NOT_FOUND");
  return visit;
}

export async function getVisit(user, id) {
  const visit = await getVisitOrThrow(id);
  assertCanView(user, visit);
  return visit;
}

export async function listVisits(user, query, pagination) {
  const filter = scopeFilter(user);
  if (query.status) filter.status = query.status;
  if (query.visitType) filter.visitType = query.visitType;
  if (query.visitor) filter.visitor = query.visitor;
  if (query.hostEmployee && user.role !== ROLES.EMPLOYEE) filter.hostEmployee = query.hostEmployee;
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = query.from;
    if (query.to) filter.createdAt.$lte = query.to;
  }

  return paginate(Visit, filter, pagination, { populate: VISIT_POPULATE });
}

/** Active visitors are exactly the visits with status `checked_in`. */
export async function listActiveVisits(user) {
  return Visit.find({ ...scopeFilter(user), status: VISIT_STATUS.CHECKED_IN })
    .sort({ checkInAt: -1 })
    .populate(VISIT_POPULATE);
}

/** Visits checked in today, created today, or expected from an appointment scheduled today. */
export async function listTodayVisits(user) {
  const { from, to } = todayRange();
  const todaysAppointments = await Appointment.distinct("_id", {
    scheduledStartAt: { $lte: to },
    scheduledEndAt: { $gte: from },
  });

  return Visit.find({
    ...scopeFilter(user),
    $or: [
      { checkInAt: { $gte: from, $lte: to } },
      { createdAt: { $gte: from, $lte: to } },
      { appointment: { $in: todaysAppointments } },
    ],
  })
    .sort({ checkInAt: -1, createdAt: -1 })
    .populate(VISIT_POPULATE);
}

async function afterCheckIn(req, visit, { issuePass: shouldIssuePass, pass: passOptions } = {}) {
  const populated = await getVisitOrThrow(visit._id);
  const visitorName = populated.visitor?.fullName ?? "Your visitor";

  await Promise.all([
    recordAudit(req, {
      action: AUDIT_ACTIONS.VISITOR_CHECKED_IN,
      module: AUDIT_MODULES.VISITS,
      targetId: visit._id,
      description: `${visitorName} checked in`,
    }),
    notify({
      recipient: idOf(populated.hostEmployee),
      type: NOTIFICATION_TYPES.VISITOR_ARRIVED,
      title: "Your visitor has arrived",
      message: `${visitorName} has checked in at reception. Purpose: ${populated.purpose}`,
      relatedVisit: visit._id,
    }),
  ]);

  const pass = shouldIssuePass ? await issuePass(req, { visit: visit._id, ...passOptions }) : null;
  return { visit: populated, pass };
}

export async function registerWalkIn(req, data) {
  await ensureActiveUser(data.hostEmployee, "Host employee");
  const visitor = await resolveVisitor(req, data);

  const visit = await Visit.create({
    visitor: visitor._id,
    hostEmployee: data.hostEmployee,
    purpose: data.purpose,
    notes: data.notes,
    visitType: VISIT_TYPE.WALK_IN,
    status: VISIT_STATUS.CHECKED_IN,
    checkInAt: new Date(),
    checkInBy: req.user._id,
  });

  await recordAudit(req, {
    action: AUDIT_ACTIONS.WALK_IN_REGISTERED,
    module: AUDIT_MODULES.VISITS,
    targetId: visit._id,
    description: `Walk-in visit registered for ${visitor.fullName}`,
  });

  return afterCheckIn(req, visit, { issuePass: data.issuePass ?? true, pass: data.pass });
}

export async function checkIn(req, id, options = {}) {
  const visit = await Visit.findById(id);
  if (!visit) throw ApiError.notFound("Visit not found", "VISIT_NOT_FOUND");

  if (visit.status === VISIT_STATUS.CHECKED_IN) {
    throw ApiError.conflict("Visitor is already checked in", "VISIT_ALREADY_CHECKED_IN");
  }
  if (visit.status !== VISIT_STATUS.EXPECTED) {
    throw ApiError.conflict(`A ${visit.status} visit cannot be checked in`, "INVALID_VISIT_STATUS");
  }

  if (visit.appointment) {
    const appointment = await Appointment.findById(visit.appointment).select("status");
    if (appointment?.status !== APPOINTMENT_STATUS.APPROVED) {
      throw ApiError.conflict("The appointment for this visit is not approved", "APPOINTMENT_NOT_APPROVED");
    }
  }

  const update = {
    status: VISIT_STATUS.CHECKED_IN,
    checkInAt: new Date(),
    checkInBy: req.user._id,
  };
  if (options.notes) update.notes = options.notes;

  // Conditional update so two concurrent check-ins cannot both succeed.
  const updated = await Visit.findOneAndUpdate(
    { _id: id, status: VISIT_STATUS.EXPECTED },
    { $set: update },
    { returnDocument: "after" },
  );
  if (!updated) throw ApiError.conflict("Visitor is already checked in", "VISIT_ALREADY_CHECKED_IN");

  return afterCheckIn(req, updated, options);
}

export async function checkOut(req, id, { notes } = {}) {
  const visit = await Visit.findById(id);
  if (!visit) throw ApiError.notFound("Visit not found", "VISIT_NOT_FOUND");

  if (visit.status === VISIT_STATUS.CHECKED_OUT) {
    throw ApiError.conflict("Visitor has already checked out", "VISIT_ALREADY_CHECKED_OUT");
  }
  if (visit.status !== VISIT_STATUS.CHECKED_IN) {
    throw ApiError.conflict(`A ${visit.status} visit cannot be checked out`, "VISIT_NOT_CHECKED_IN");
  }

  const update = {
    status: VISIT_STATUS.CHECKED_OUT,
    checkOutAt: new Date(),
    checkOutBy: req.user._id,
  };
  if (notes) update.notes = notes;

  const updated = await Visit.findOneAndUpdate(
    { _id: id, status: VISIT_STATUS.CHECKED_IN },
    { $set: update },
    { returnDocument: "after" },
  );
  if (!updated) throw ApiError.conflict("Visitor has already checked out", "VISIT_ALREADY_CHECKED_OUT");

  await Promise.all([
    expirePassesForVisit(updated._id),
    updated.appointment &&
      Appointment.updateOne(
        { _id: updated.appointment, status: APPOINTMENT_STATUS.APPROVED },
        { $set: { status: APPOINTMENT_STATUS.COMPLETED } },
      ),
  ]);

  const populated = await getVisitOrThrow(updated._id);
  const visitorName = populated.visitor?.fullName ?? "Visitor";

  await Promise.all([
    recordAudit(req, {
      action: AUDIT_ACTIONS.VISITOR_CHECKED_OUT,
      module: AUDIT_MODULES.VISITS,
      targetId: updated._id,
      description: `${visitorName} checked out`,
    }),
    notify({
      recipient: idOf(populated.hostEmployee),
      type: NOTIFICATION_TYPES.VISITOR_CHECKED_OUT,
      title: "Your visitor has left",
      message: `${visitorName} has checked out`,
      relatedVisit: updated._id,
    }),
  ]);

  return populated;
}

/**
 * Marks expected appointment visits as no-show once the appointment window
 * has passed without a check-in.
 */
export async function markNoShows(now = new Date()) {
  const overdueAppointments = await Appointment.distinct("_id", {
    status: APPOINTMENT_STATUS.APPROVED,
    scheduledEndAt: { $lt: now },
  });
  if (!overdueAppointments.length) return 0;

  const noShowAppointmentIds = await Visit.distinct("appointment", {
    appointment: { $in: overdueAppointments },
    status: VISIT_STATUS.EXPECTED,
  });
  if (!noShowAppointmentIds.length) return 0;

  await Promise.all([
    Visit.updateMany(
      { appointment: { $in: noShowAppointmentIds }, status: VISIT_STATUS.EXPECTED },
      { $set: { status: VISIT_STATUS.NO_SHOW } },
    ),
    Appointment.updateMany(
      { _id: { $in: noShowAppointmentIds }, status: APPOINTMENT_STATUS.APPROVED },
      { $set: { status: APPOINTMENT_STATUS.NO_SHOW } },
    ),
  ]);

  return noShowAppointmentIds.length;
}
