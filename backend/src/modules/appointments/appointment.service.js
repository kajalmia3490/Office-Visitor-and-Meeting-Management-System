import { Appointment } from "./appointment.model.js";
import { Visit } from "../visits/visit.model.js";
import { Meeting } from "../meetings/meeting.model.js";
import { ensureActiveUser } from "../users/user.service.js";
import { resolveVisitor, VISITOR_SUMMARY_FIELDS } from "../visitors/visitor.service.js";
import { notify, notifyMany } from "../notifications/notification.service.js";
import { recordAudit } from "../auditLogs/auditLog.service.js";
import {
  APPOINTMENT_STATUS,
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  MEETING_STATUS,
  NOTIFICATION_TYPES,
  ROLES,
  VISIT_STATUS,
  VISIT_TYPE,
} from "../../config/constants.js";
import { ApiError } from "../../utils/ApiError.js";
import { paginate } from "../../utils/pagination.js";

export const APPOINTMENT_POPULATE = [
  { path: "visitor", select: VISITOR_SUMMARY_FIELDS },
  { path: "hostEmployee", select: "name email employeeId" },
  { path: "createdBy", select: "name email role" },
  { path: "meeting", select: "title startAt endAt status" },
];

const idOf = (ref) => String(ref?._id ?? ref);
const isAdmin = (user) => user.role === ROLES.ADMIN;
const isHost = (user, appointment) => idOf(appointment.hostEmployee) === String(user._id);
const isCreator = (user, appointment) => idOf(appointment.createdBy) === String(user._id);

function assertCanView(user, appointment) {
  if (user.role !== ROLES.EMPLOYEE) return;
  if (!isHost(user, appointment) && !isCreator(user, appointment)) {
    throw ApiError.forbidden("You can only access your own appointments");
  }
}

function assertCanEdit(user, appointment) {
  const allowed =
    isAdmin(user) || user.role === ROLES.RECEPTIONIST || isHost(user, appointment) || isCreator(user, appointment);
  if (!allowed) throw ApiError.forbidden("You cannot modify this appointment");
}

function assertCanDecide(user, appointment) {
  if (!isAdmin(user) && !isHost(user, appointment)) {
    throw ApiError.forbidden("Only the host employee or an admin can approve or reject this appointment");
  }
}

async function ensureMeeting(meetingId) {
  if (!meetingId) return;
  const meeting = await Meeting.findById(meetingId).select("status");
  if (!meeting) throw ApiError.badRequest("Meeting not found", "MEETING_NOT_FOUND");
  if (meeting.status === MEETING_STATUS.CANCELLED) {
    throw ApiError.badRequest("Cannot link a cancelled meeting", "MEETING_CANCELLED");
  }
}

export async function getAppointmentOrThrow(id) {
  const appointment = await Appointment.findById(id).populate(APPOINTMENT_POPULATE);
  if (!appointment) throw ApiError.notFound("Appointment not found", "APPOINTMENT_NOT_FOUND");
  return appointment;
}

export async function getAppointment(user, id) {
  const appointment = await getAppointmentOrThrow(id);
  assertCanView(user, appointment);
  return appointment;
}

export async function listAppointments(user, query, pagination) {
  const filter = {};
  if (user.role === ROLES.EMPLOYEE) {
    filter.$or = [{ hostEmployee: user._id }, { createdBy: user._id }];
  }
  if (query.status) filter.status = query.status;
  if (query.hostEmployee) filter.hostEmployee = query.hostEmployee;
  if (query.visitor) filter.visitor = query.visitor;
  if (query.from || query.to) {
    filter.scheduledStartAt = {};
    if (query.from) filter.scheduledStartAt.$gte = query.from;
    if (query.to) filter.scheduledStartAt.$lte = query.to;
  }

  return paginate(Appointment, filter, pagination, {
    sort: { scheduledStartAt: 1 },
    populate: APPOINTMENT_POPULATE,
  });
}

/** Approves an appointment and creates the expected visit for reception. */
async function approve(req, appointment) {
  appointment.status = APPOINTMENT_STATUS.APPROVED;
  appointment.decidedBy = req.user._id;
  appointment.decidedAt = new Date();
  await appointment.save();

  await Visit.updateOne(
    { appointment: appointment._id },
    {
      $setOnInsert: {
        visitor: idOf(appointment.visitor),
        appointment: appointment._id,
        hostEmployee: idOf(appointment.hostEmployee),
        purpose: appointment.purpose,
        visitType: VISIT_TYPE.APPOINTMENT,
        status: VISIT_STATUS.EXPECTED,
      },
    },
    { upsert: true },
  );

  await recordAudit(req, {
    action: AUDIT_ACTIONS.APPOINTMENT_APPROVED,
    module: AUDIT_MODULES.APPOINTMENTS,
    targetId: appointment._id,
    description: "Appointment approved",
  });
}

export async function createAppointment(req, data) {
  const user = req.user;
  let hostId = data.hostEmployee;

  if (user.role === ROLES.EMPLOYEE) {
    if (hostId && hostId !== String(user._id)) {
      throw ApiError.forbidden("Employees can only create appointments they host");
    }
    hostId = String(user._id);
  }
  if (!hostId) throw ApiError.validation("hostEmployee is required");

  await ensureActiveUser(hostId, "Host employee");
  await ensureMeeting(data.meeting);
  const visitor = await resolveVisitor(req, data);

  const appointment = await Appointment.create({
    visitor: visitor._id,
    hostEmployee: hostId,
    meeting: data.meeting ?? null,
    purpose: data.purpose,
    scheduledStartAt: data.scheduledStartAt,
    scheduledEndAt: data.scheduledEndAt,
    notes: data.notes,
    createdBy: user._id,
  });

  await recordAudit(req, {
    action: AUDIT_ACTIONS.APPOINTMENT_CREATED,
    module: AUDIT_MODULES.APPOINTMENTS,
    targetId: appointment._id,
    description: `Appointment created for visitor ${visitor.fullName}`,
  });

  // A host inviting their own visitor does not need to approve it again.
  if (hostId === String(user._id)) {
    await approve(req, appointment);
  } else {
    await notify({
      recipient: hostId,
      type: NOTIFICATION_TYPES.APPOINTMENT_REQUESTED,
      title: "New appointment request",
      message: `${visitor.fullName} has requested an appointment: ${appointment.purpose}`,
      relatedAppointment: appointment._id,
    });
  }

  return getAppointmentOrThrow(appointment._id);
}

export async function updateAppointment(req, id, data) {
  const appointment = await getAppointmentOrThrow(id);
  assertCanEdit(req.user, appointment);

  if (![APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.APPROVED].includes(appointment.status)) {
    throw ApiError.conflict(`A ${appointment.status} appointment cannot be updated`, "APPOINTMENT_NOT_EDITABLE");
  }

  if (data.hostEmployee && data.hostEmployee !== idOf(appointment.hostEmployee)) {
    if (![ROLES.ADMIN, ROLES.RECEPTIONIST].includes(req.user.role)) {
      throw ApiError.forbidden("Only an admin or receptionist can change the host employee");
    }
    await ensureActiveUser(data.hostEmployee, "Host employee");
  }
  if (data.meeting) await ensureMeeting(data.meeting);

  const start = data.scheduledStartAt ?? appointment.scheduledStartAt;
  const end = data.scheduledEndAt ?? appointment.scheduledEndAt;
  if (end <= start) throw ApiError.validation("scheduledEndAt must be after scheduledStartAt");
  if ((data.scheduledStartAt || data.scheduledEndAt) && end <= new Date()) {
    throw ApiError.validation("scheduledEndAt must be in the future");
  }

  Object.assign(appointment, data);
  await appointment.save();

  if (appointment.status === APPOINTMENT_STATUS.APPROVED && (data.hostEmployee || data.purpose)) {
    await Visit.updateOne(
      { appointment: appointment._id, status: VISIT_STATUS.EXPECTED },
      { $set: { hostEmployee: idOf(appointment.hostEmployee), purpose: appointment.purpose } },
    );
  }

  await recordAudit(req, {
    action: AUDIT_ACTIONS.APPOINTMENT_UPDATED,
    module: AUDIT_MODULES.APPOINTMENTS,
    targetId: appointment._id,
    description: "Appointment updated",
    metadata: { fields: Object.keys(data) },
  });

  return getAppointmentOrThrow(appointment._id);
}

export async function approveAppointment(req, id) {
  const appointment = await getAppointmentOrThrow(id);
  assertCanDecide(req.user, appointment);

  if (appointment.status !== APPOINTMENT_STATUS.PENDING) {
    throw ApiError.conflict(`Only pending appointments can be approved (current: ${appointment.status})`, "INVALID_APPOINTMENT_STATUS");
  }
  if (appointment.scheduledEndAt <= new Date()) {
    throw ApiError.conflict("Appointment time has already passed", "APPOINTMENT_EXPIRED");
  }

  await approve(req, appointment);

  if (!isCreator(req.user, appointment)) {
    await notify({
      recipient: idOf(appointment.createdBy),
      type: NOTIFICATION_TYPES.APPOINTMENT_APPROVED,
      title: "Appointment approved",
      message: `The appointment with ${appointment.visitor.fullName} has been approved`,
      relatedAppointment: appointment._id,
    });
  }

  return getAppointmentOrThrow(appointment._id);
}

export async function rejectAppointment(req, id, reason) {
  const appointment = await getAppointmentOrThrow(id);
  assertCanDecide(req.user, appointment);

  if (appointment.status !== APPOINTMENT_STATUS.PENDING) {
    throw ApiError.conflict(`Only pending appointments can be rejected (current: ${appointment.status})`, "INVALID_APPOINTMENT_STATUS");
  }

  appointment.status = APPOINTMENT_STATUS.REJECTED;
  appointment.decidedBy = req.user._id;
  appointment.decidedAt = new Date();
  appointment.decisionReason = reason;
  await appointment.save();

  await recordAudit(req, {
    action: AUDIT_ACTIONS.APPOINTMENT_REJECTED,
    module: AUDIT_MODULES.APPOINTMENTS,
    targetId: appointment._id,
    description: "Appointment rejected",
    metadata: reason ? { reason } : undefined,
  });

  if (!isCreator(req.user, appointment)) {
    await notify({
      recipient: idOf(appointment.createdBy),
      type: NOTIFICATION_TYPES.APPOINTMENT_REJECTED,
      title: "Appointment rejected",
      message: `The appointment with ${appointment.visitor.fullName} has been rejected${reason ? `: ${reason}` : ""}`,
      relatedAppointment: appointment._id,
    });
  }

  return getAppointmentOrThrow(appointment._id);
}

export async function cancelAppointment(req, id, reason) {
  const appointment = await getAppointmentOrThrow(id);
  assertCanEdit(req.user, appointment);

  if (![APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.APPROVED].includes(appointment.status)) {
    throw ApiError.conflict(`A ${appointment.status} appointment cannot be cancelled`, "INVALID_APPOINTMENT_STATUS");
  }

  const visit = await Visit.findOne({ appointment: appointment._id });
  if (visit && visit.status !== VISIT_STATUS.EXPECTED) {
    throw ApiError.conflict("The visitor has already checked in for this appointment", "VISIT_IN_PROGRESS");
  }

  appointment.status = APPOINTMENT_STATUS.CANCELLED;
  appointment.decisionReason = reason ?? appointment.decisionReason;
  await appointment.save();

  if (visit) {
    visit.status = VISIT_STATUS.CANCELLED;
    await visit.save();
  }

  await recordAudit(req, {
    action: AUDIT_ACTIONS.APPOINTMENT_CANCELLED,
    module: AUDIT_MODULES.APPOINTMENTS,
    targetId: appointment._id,
    description: "Appointment cancelled",
    metadata: reason ? { reason } : undefined,
  });

  const recipients = [idOf(appointment.hostEmployee), idOf(appointment.createdBy)].filter(
    (uid) => uid !== String(req.user._id),
  );
  await notifyMany(recipients, {
    type: NOTIFICATION_TYPES.APPOINTMENT_CANCELLED,
    title: "Appointment cancelled",
    message: `The appointment with ${appointment.visitor.fullName} on ${appointment.scheduledStartAt.toISOString()} has been cancelled`,
    relatedAppointment: appointment._id,
  });

  return getAppointmentOrThrow(appointment._id);
}
