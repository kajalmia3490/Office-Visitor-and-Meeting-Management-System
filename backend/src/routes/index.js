import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";

import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/users/user.routes.js";
import departmentRoutes from "../modules/departments/department.routes.js";
import visitorRoutes from "../modules/visitors/visitor.routes.js";
import appointmentRoutes from "../modules/appointments/appointment.routes.js";
import meetingRoutes from "../modules/meetings/meeting.routes.js";
import meetingRoomRoutes from "../modules/meetingRooms/meetingRoom.routes.js";
import visitRoutes from "../modules/visits/visit.routes.js";
import notificationRoutes from "../modules/notifications/notification.routes.js";
import visitorPassRoutes from "../modules/visitorPasses/visitorPass.routes.js";
import auditLogRoutes from "../modules/auditLogs/auditLog.routes.js";
import { dashboardRouter, reportRouter } from "../modules/reports/report.routes.js";

const router = Router();

router.use("/auth", authRoutes);

// Every route below requires an authenticated application user.
router.use(authenticate);

router.use("/users", userRoutes);
router.use("/departments", departmentRoutes);
router.use("/visitors", visitorRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/meetings", meetingRoutes);
router.use("/meeting-rooms", meetingRoomRoutes);
router.use("/visits", visitRoutes);
router.use("/notifications", notificationRoutes);
router.use("/visitor-passes", visitorPassRoutes);
router.use("/dashboard", dashboardRouter);
router.use("/reports", reportRouter);
router.use("/audit-logs", auditLogRoutes);

export default router;
