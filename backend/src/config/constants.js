export const ROLES = Object.freeze({
  ADMIN: "admin",
  RECEPTIONIST: "receptionist",
  SECURITY: "security",
  EMPLOYEE: "employee",
  MANAGEMENT: "management",
});

export const ROLE_VALUES = Object.values(ROLES);

export const IDENTITY_TYPES = ["national_id", "passport", "driving_license", "other"];

export const APPOINTMENT_STATUS = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
  NO_SHOW: "no_show",
});

export const ROOM_STATUS = Object.freeze({
  AVAILABLE: "available",
  MAINTENANCE: "maintenance",
  INACTIVE: "inactive",
});

export const MEETING_STATUS = Object.freeze({
  SCHEDULED: "scheduled",
  ONGOING: "ongoing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
});

export const ATTENDEE_STATUS = Object.freeze({
  INVITED: "invited",
  ACCEPTED: "accepted",
  DECLINED: "declined",
});

export const VISIT_TYPE = Object.freeze({
  APPOINTMENT: "appointment",
  WALK_IN: "walk_in",
});

export const VISIT_STATUS = Object.freeze({
  EXPECTED: "expected",
  CHECKED_IN: "checked_in",
  CHECKED_OUT: "checked_out",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
});

export const PASS_STATUS = Object.freeze({
  ACTIVE: "active",
  EXPIRED: "expired",
  REVOKED: "revoked",
});

export const NOTIFICATION_TYPES = Object.freeze({
  VISITOR_ARRIVED: "visitor_arrived",
  VISITOR_CHECKED_OUT: "visitor_checked_out",
  APPOINTMENT_REQUESTED: "appointment_requested",
  APPOINTMENT_APPROVED: "appointment_approved",
  APPOINTMENT_REJECTED: "appointment_rejected",
  APPOINTMENT_CANCELLED: "appointment_cancelled",
  MEETING_INVITATION: "meeting_invitation",
  MEETING_UPDATED: "meeting_updated",
  MEETING_CANCELLED: "meeting_cancelled",
});

export const AUDIT_MODULES = Object.freeze({
  USERS: "USERS",
  DEPARTMENTS: "DEPARTMENTS",
  VISITORS: "VISITORS",
  APPOINTMENTS: "APPOINTMENTS",
  MEETINGS: "MEETINGS",
  MEETING_ROOMS: "MEETING_ROOMS",
  VISITS: "VISITS",
  VISITOR_PASSES: "VISITOR_PASSES",
});

export const AUDIT_ACTIONS = Object.freeze({
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED",
  USER_DELETED: "USER_DELETED",
  USER_ACTIVATED: "USER_ACTIVATED",
  USER_DEACTIVATED: "USER_DEACTIVATED",

  DEPARTMENT_CREATED: "DEPARTMENT_CREATED",
  DEPARTMENT_UPDATED: "DEPARTMENT_UPDATED",
  DEPARTMENT_DELETED: "DEPARTMENT_DELETED",

  ROOM_CREATED: "ROOM_CREATED",
  ROOM_UPDATED: "ROOM_UPDATED",
  ROOM_DELETED: "ROOM_DELETED",

  VISITOR_CREATED: "VISITOR_CREATED",
  VISITOR_UPDATED: "VISITOR_UPDATED",
  VISITOR_DELETED: "VISITOR_DELETED",

  APPOINTMENT_CREATED: "APPOINTMENT_CREATED",
  APPOINTMENT_UPDATED: "APPOINTMENT_UPDATED",
  APPOINTMENT_APPROVED: "APPOINTMENT_APPROVED",
  APPOINTMENT_REJECTED: "APPOINTMENT_REJECTED",
  APPOINTMENT_CANCELLED: "APPOINTMENT_CANCELLED",

  MEETING_CREATED: "MEETING_CREATED",
  MEETING_UPDATED: "MEETING_UPDATED",
  MEETING_CANCELLED: "MEETING_CANCELLED",

  WALK_IN_REGISTERED: "WALK_IN_REGISTERED",
  VISITOR_CHECKED_IN: "VISITOR_CHECKED_IN",
  VISITOR_CHECKED_OUT: "VISITOR_CHECKED_OUT",

  PASS_ISSUED: "PASS_ISSUED",
  PASS_REVOKED: "PASS_REVOKED",
});

export const WORKING_HOURS_PER_DAY = 8;

export const STAFF_ROLES = [ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.SECURITY];
