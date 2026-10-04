import { Router } from "express";
import { authorize } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ROLES } from "../../config/constants.js";
import * as controller from "./report.controller.js";
import * as schemas from "./report.validation.js";

const { ADMIN, RECEPTIONIST, SECURITY, MANAGEMENT } = ROLES;

// Admin and management get every report; reception and security get the
// visitor-focused ("limited") reports only.
const fullReports = authorize(ADMIN, MANAGEMENT);
const visitorReports = authorize(ADMIN, MANAGEMENT, RECEPTIONIST, SECURITY);

export const reportRouter = Router();

reportRouter.get(
  "/visitors",
  visitorReports,
  validate(schemas.dateRangeSchema),
  asyncHandler(controller.visitors),
);
reportRouter.get(
  "/active-visitors",
  visitorReports,
  asyncHandler(controller.activeVisitors),
);
reportRouter.get(
  "/visitor-history",
  visitorReports,
  validate(schemas.visitorHistoryReportSchema),
  asyncHandler(controller.visitorHistory),
);
reportRouter.get(
  "/meetings",
  fullReports,
  validate(schemas.dateRangeSchema),
  asyncHandler(controller.meetings),
);
reportRouter.get(
  "/rooms",
  fullReports,
  validate(schemas.dateRangeSchema),
  asyncHandler(controller.rooms),
);
reportRouter.get(
  "/meeting-history",
  fullReports,
  validate(schemas.meetingHistoryReportSchema),
  asyncHandler(controller.meetingHistory),
);

export const dashboardRouter = Router();

dashboardRouter.get(
  "/admin",
  authorize(ADMIN),
  asyncHandler(controller.adminDashboard),
);
dashboardRouter.get(
  "/reception",
  authorize(ADMIN, RECEPTIONIST, SECURITY),
  asyncHandler(controller.receptionDashboard),
);
dashboardRouter.get("/employee", asyncHandler(controller.employeeDashboard));
dashboardRouter.get(
  "/management",
  authorize(ADMIN, MANAGEMENT),
  asyncHandler(controller.managementDashboard),
);
