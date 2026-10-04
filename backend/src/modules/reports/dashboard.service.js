import { User } from "../users/user.model.js";
import { Department } from "../departments/department.model.js";
import { MeetingRoom } from "../meetingRooms/meetingRoom.model.js";
import { Visitor } from "../visitors/visitor.model.js";
import { Visit } from "../visits/visit.model.js";
import { Appointment } from "../appointments/appointment.model.js";
import { Meeting } from "../meetings/meeting.model.js";
import { Notification } from "../notifications/notification.model.js";
import { VISIT_POPULATE } from "../visits/visit.service.js";
import { APPOINTMENT_POPULATE } from "../appointments/appointment.service.js";
import { MEETING_POPULATE, syncMeetingStatuses } from "../meetings/meeting.service.js";
import { findAvailableRooms } from "../meetingRooms/meetingRoom.service.js";
import { roomUtilizationReport, visitorReport } from "./report.service.js";
import {
  APPOINTMENT_STATUS,
  MEETING_STATUS,
  ROOM_STATUS,
  VISIT_STATUS,
  VISIT_TYPE,
} from "../../config/constants.js";
import { addDays, addHours, startOfDayUTC, todayRange } from "../../utils/dateTime.js";

const ACTIVE_MEETING_STATUSES = [MEETING_STATUS.SCHEDULED, MEETING_STATUS.ONGOING];

async function visitTrend(days, extraMatch = {}) {
  const from = startOfDayUTC(addDays(new Date(), -(days - 1)));
  return Visit.aggregate([
    { $match: { ...extraMatch, createdAt: { $gte: from } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: "$_id", count: 1 } },
  ]);
}

export async function adminDashboard() {
  await syncMeetingStatuses();
  const { from, to } = todayRange();
  const now = new Date();

  const [
    activeUsers,
    totalUsers,
    departments,
    rooms,
    totalVisitors,
    todayVisits,
    activeVisitors,
    completedVisitsToday,
    pendingAppointments,
    todayAppointments,
    meetingsToday,
    upcomingMeetings,
    trend,
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    User.countDocuments(),
    Department.countDocuments({ isActive: true }),
    MeetingRoom.countDocuments({ isActive: true }),
    Visitor.countDocuments(),
    Visit.countDocuments({ checkInAt: { $gte: from, $lte: to } }),
    Visit.countDocuments({ status: VISIT_STATUS.CHECKED_IN }),
    Visit.countDocuments({ status: VISIT_STATUS.CHECKED_OUT, checkOutAt: { $gte: from, $lte: to } }),
    Appointment.countDocuments({ status: APPOINTMENT_STATUS.PENDING, scheduledEndAt: { $gt: now } }),
    Appointment.countDocuments({ scheduledStartAt: { $gte: from, $lte: to } }),
    Meeting.countDocuments({ status: { $ne: MEETING_STATUS.CANCELLED }, startAt: { $gte: from, $lte: to } }),
    Meeting.countDocuments({ status: MEETING_STATUS.SCHEDULED, startAt: { $gt: now } }),
    visitTrend(7),
  ]);

  return {
    users: { total: totalUsers, active: activeUsers },
    departments,
    meetingRooms: rooms,
    visitors: { total: totalVisitors },
    visits: { today: todayVisits, active: activeVisitors, completedToday: completedVisitsToday },
    appointments: { pending: pendingAppointments, today: todayAppointments },
    meetings: { today: meetingsToday, upcoming: upcomingMeetings },
    visitTrend: trend,
  };
}

export async function receptionDashboard() {
  const { from, to } = todayRange();

  const todaysAppointmentIds = await Appointment.distinct("_id", {
    status: APPOINTMENT_STATUS.APPROVED,
    scheduledStartAt: { $lte: to },
    scheduledEndAt: { $gte: from },
  });

  const [
    expectedArrivals,
    activeVisits,
    checkedInToday,
    checkedOutToday,
    walkInsToday,
    pendingAppointmentsToday,
  ] = await Promise.all([
    Visit.find({ appointment: { $in: todaysAppointmentIds }, status: VISIT_STATUS.EXPECTED })
      .populate(VISIT_POPULATE)
      .limit(50),
    Visit.find({ status: VISIT_STATUS.CHECKED_IN }).sort({ checkInAt: -1 }).populate(VISIT_POPULATE).limit(50),
    Visit.countDocuments({ checkInAt: { $gte: from, $lte: to } }),
    Visit.countDocuments({ checkOutAt: { $gte: from, $lte: to } }),
    Visit.countDocuments({ visitType: VISIT_TYPE.WALK_IN, checkInAt: { $gte: from, $lte: to } }),
    Appointment.countDocuments({ status: APPOINTMENT_STATUS.PENDING, scheduledStartAt: { $gte: from, $lte: to } }),
  ]);

  expectedArrivals.sort((a, b) => a.appointment?.scheduledStartAt - b.appointment?.scheduledStartAt);

  return {
    counts: {
      expectedToday: expectedArrivals.length,
      activeVisitors: activeVisits.length,
      checkedInToday,
      checkedOutToday,
      walkInsToday,
      pendingAppointmentsToday,
    },
    expectedArrivals,
    activeVisitors: activeVisits,
  };
}

export async function employeeDashboard(user) {
  await syncMeetingStatuses();
  const { from, to } = todayRange();
  const now = new Date();
  const participant = { $or: [{ organizer: user._id }, { "attendees.user": user._id }] };

  const [
    upcomingMeetings,
    meetingsToday,
    visitorsToday,
    activeVisitors,
    pendingApprovals,
    upcomingAppointments,
    unreadNotifications,
  ] = await Promise.all([
    Meeting.find({ ...participant, status: { $in: ACTIVE_MEETING_STATUSES }, endAt: { $gt: now } })
      .sort({ startAt: 1 })
      .limit(5)
      .populate(MEETING_POPULATE),
    Meeting.countDocuments({
      ...participant,
      status: { $ne: MEETING_STATUS.CANCELLED },
      startAt: { $gte: from, $lte: to },
    }),
    Visit.countDocuments({
      hostEmployee: user._id,
      $or: [{ checkInAt: { $gte: from, $lte: to } }, { createdAt: { $gte: from, $lte: to } }],
    }),
    Visit.find({ hostEmployee: user._id, status: VISIT_STATUS.CHECKED_IN }).populate(VISIT_POPULATE),
    Appointment.find({ hostEmployee: user._id, status: APPOINTMENT_STATUS.PENDING, scheduledEndAt: { $gt: now } })
      .sort({ scheduledStartAt: 1 })
      .limit(20)
      .populate(APPOINTMENT_POPULATE),
    Appointment.find({
      hostEmployee: user._id,
      status: APPOINTMENT_STATUS.APPROVED,
      scheduledStartAt: { $gte: now, $lte: addHours(now, 7 * 24) },
    })
      .sort({ scheduledStartAt: 1 })
      .limit(10)
      .populate(APPOINTMENT_POPULATE),
    Notification.countDocuments({ recipient: user._id, isRead: false }),
  ]);

  return {
    counts: {
      meetingsToday,
      visitorsToday,
      activeVisitors: activeVisitors.length,
      pendingApprovals: pendingApprovals.length,
      unreadNotifications,
    },
    upcomingMeetings,
    activeVisitors,
    pendingApprovals,
    upcomingAppointments,
  };
}

export async function managementDashboard() {
  await syncMeetingStatuses();
  const now = new Date();
  const range = { from: startOfDayUTC(addDays(now, -29)), to: now };

  const [visitors, rooms, activeVisitors, upcomingMeetings, roomsAvailableNow, roomsInMaintenance, trend] =
    await Promise.all([
      visitorReport(range),
      roomUtilizationReport(range),
      Visit.countDocuments({ status: VISIT_STATUS.CHECKED_IN }),
      Meeting.countDocuments({ status: MEETING_STATUS.SCHEDULED, startAt: { $gt: now } }),
      findAvailableRooms({ startAt: now, endAt: addHours(now, 1) }),
      MeetingRoom.countDocuments({ status: ROOM_STATUS.MAINTENANCE }),
      visitTrend(30),
    ]);

  const meetingsByStatus = await Meeting.aggregate([
    { $match: { startAt: { $gte: range.from, $lte: range.to } } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  return {
    range,
    visitors: visitors.summary,
    visitsByType: visitors.byType,
    topOrganizations: visitors.topOrganizations,
    activeVisitors,
    meetings: {
      upcoming: upcomingMeetings,
      byStatus: meetingsByStatus.map(({ _id, count }) => ({ key: _id, count })),
    },
    rooms: {
      availableNow: roomsAvailableNow.length,
      inMaintenance: roomsInMaintenance,
      averageUtilizationPercent: rooms.summary.averageUtilizationPercent,
      utilization: rooms.rooms,
    },
    visitTrend: trend,
  };
}
