import { Visit } from "../visits/visit.model.js";
import { Visitor } from "../visitors/visitor.model.js";
import { Meeting } from "../meetings/meeting.model.js";
import { MeetingRoom } from "../meetingRooms/meetingRoom.model.js";
import { VISIT_POPULATE } from "../visits/visit.service.js";
import { MEETING_POPULATE, syncMeetingStatuses } from "../meetings/meeting.service.js";
import { MEETING_STATUS, VISIT_STATUS, WORKING_HOURS_PER_DAY } from "../../config/constants.js";
import { daysInRange, minutesBetween, resolveDateRange } from "../../utils/dateTime.js";
import { buildPaginationMeta } from "../../utils/pagination.js";
import { escapeRegex } from "../../utils/validators.js";

const toCountMap = (rows) => rows.map(({ _id, count }) => ({ key: _id, count }));

function dailySeries(field, extraMatch = {}) {
  return [
    { $match: extraMatch },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: `$${field}`, timezone: "UTC" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: "$_id", count: 1 } },
  ];
}

export async function visitorReport(query) {
  const { from, to } = resolveDateRange(query);
  const match = { createdAt: { $gte: from, $lte: to } };

  const [summary] = await Visit.aggregate([
    { $match: match },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              totalVisits: { $sum: 1 },
              uniqueVisitors: { $addToSet: "$visitor" },
              completedVisits: {
                $sum: { $cond: [{ $eq: ["$status", VISIT_STATUS.CHECKED_OUT] }, 1, 0] },
              },
              averageDurationMs: {
                $avg: {
                  $cond: [
                    { $and: ["$checkInAt", "$checkOutAt"] },
                    { $subtract: ["$checkOutAt", "$checkInAt"] },
                    null,
                  ],
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              totalVisits: 1,
              completedVisits: 1,
              uniqueVisitors: { $size: "$uniqueVisitors" },
              averageVisitMinutes: {
                $cond: [{ $ifNull: ["$averageDurationMs", false] }, { $round: [{ $divide: ["$averageDurationMs", 60000] }, 1] }, null],
              },
            },
          },
        ],
        byType: [{ $group: { _id: "$visitType", count: { $sum: 1 } } }, { $sort: { count: -1 } }],
        byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }, { $sort: { count: -1 } }],
        byDate: dailySeries("createdAt"),
        topOrganizations: [
          { $lookup: { from: "visitors", localField: "visitor", foreignField: "_id", as: "visitorDoc" } },
          { $unwind: "$visitorDoc" },
          { $group: { _id: { $ifNull: ["$visitorDoc.organization", "Unspecified"] }, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ],
        topHosts: [
          { $group: { _id: "$hostEmployee", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
          { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "host" } },
          { $unwind: "$host" },
          { $project: { _id: 0, hostEmployee: "$_id", name: "$host.name", email: "$host.email", count: 1 } },
        ],
      },
    },
  ]);

  const newVisitors = await Visitor.countDocuments(match);

  return {
    range: { from, to },
    summary: {
      totalVisits: 0,
      completedVisits: 0,
      uniqueVisitors: 0,
      averageVisitMinutes: null,
      ...summary.totals[0],
      newVisitorsRegistered: newVisitors,
    },
    byType: toCountMap(summary.byType),
    byStatus: toCountMap(summary.byStatus),
    byDate: summary.byDate,
    topOrganizations: toCountMap(summary.topOrganizations),
    topHosts: summary.topHosts,
  };
}

export async function meetingReport(query) {
  await syncMeetingStatuses();
  const { from, to } = resolveDateRange(query);

  const [summary] = await Meeting.aggregate([
    { $match: { startAt: { $gte: from, $lte: to } } },
    {
      $facet: {
        total: [{ $count: "count" }],
        byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }, { $sort: { count: -1 } }],
        byDate: dailySeries("startAt"),
        byRoom: [
          { $group: { _id: "$room", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $lookup: { from: "meeting_rooms", localField: "_id", foreignField: "_id", as: "room" } },
          { $unwind: "$room" },
          { $project: { _id: 0, room: "$_id", name: "$room.name", roomNumber: "$room.roomNumber", count: 1 } },
        ],
        byOrganizer: [
          { $group: { _id: "$organizer", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
          { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
          { $unwind: "$user" },
          { $project: { _id: 0, organizer: "$_id", name: "$user.name", email: "$user.email", count: 1 } },
        ],
        averageAttendees: [{ $group: { _id: null, value: { $avg: { $size: "$attendees" } } } }],
      },
    },
  ]);

  return {
    range: { from, to },
    summary: {
      totalMeetings: summary.total[0]?.count ?? 0,
      averageAttendees: summary.averageAttendees[0] ? Number(summary.averageAttendees[0].value.toFixed(1)) : 0,
    },
    byStatus: toCountMap(summary.byStatus),
    byDate: summary.byDate,
    byRoom: summary.byRoom,
    byOrganizer: summary.byOrganizer,
  };
}

/**
 * Room utilization: booked minutes of non-cancelled meetings overlapping the
 * range, compared to available working hours in that range.
 */
export async function roomUtilizationReport(query) {
  const { from, to } = resolveDateRange(query);
  const availableMinutes = daysInRange(from, to) * WORKING_HOURS_PER_DAY * 60;

  const usage = await Meeting.aggregate([
    {
      $match: {
        status: { $ne: MEETING_STATUS.CANCELLED },
        startAt: { $lt: to },
        endAt: { $gt: from },
      },
    },
    {
      $project: {
        room: 1,
        bookedMs: {
          $subtract: [{ $min: ["$endAt", to] }, { $max: ["$startAt", from] }],
        },
      },
    },
    { $group: { _id: "$room", meetingCount: { $sum: 1 }, bookedMs: { $sum: "$bookedMs" } } },
  ]);

  const usageByRoom = new Map(usage.map((row) => [String(row._id), row]));
  const rooms = await MeetingRoom.find({}).sort({ roomNumber: 1 });

  const items = rooms.map((room) => {
    const row = usageByRoom.get(String(room._id));
    const bookedMinutes = row ? Math.round(row.bookedMs / 60000) : 0;
    return {
      room: room._id,
      name: room.name,
      roomNumber: room.roomNumber,
      capacity: room.capacity,
      status: room.status,
      isActive: room.isActive,
      meetingCount: row?.meetingCount ?? 0,
      bookedMinutes,
      utilizationPercent: Number(((bookedMinutes / availableMinutes) * 100).toFixed(2)),
    };
  });

  const totalBooked = items.reduce((sum, r) => sum + r.bookedMinutes, 0);
  const activeRooms = items.filter((r) => r.isActive).length || 1;

  return {
    range: { from, to },
    assumptions: { workingHoursPerDay: WORKING_HOURS_PER_DAY, availableMinutesPerRoom: availableMinutes },
    summary: {
      totalRooms: items.length,
      totalMeetings: items.reduce((sum, r) => sum + r.meetingCount, 0),
      totalBookedMinutes: totalBooked,
      averageUtilizationPercent: Number(((totalBooked / (availableMinutes * activeRooms)) * 100).toFixed(2)),
    },
    rooms: items,
  };
}

export async function activeVisitorsReport() {
  const visits = await Visit.find({ status: VISIT_STATUS.CHECKED_IN })
    .sort({ checkInAt: 1 })
    .populate(VISIT_POPULATE);

  const now = new Date();
  const items = visits.map((visit) => ({
    ...visit.toJSON(),
    minutesOnSite: visit.checkInAt ? minutesBetween(visit.checkInAt, now) : null,
  }));

  const byHost = new Map();
  for (const visit of visits) {
    const key = String(visit.hostEmployee?._id ?? visit.hostEmployee);
    const entry = byHost.get(key) ?? { hostEmployee: key, name: visit.hostEmployee?.name, count: 0 };
    entry.count += 1;
    byHost.set(key, entry);
  }

  return {
    generatedAt: now,
    count: items.length,
    byHost: [...byHost.values()].sort((a, b) => b.count - a.count),
    visits: items,
  };
}

export async function visitorHistoryReport(query, { page, limit, skip }) {
  const { from, to } = resolveDateRange(query, 90);
  const filter = { createdAt: { $gte: from, $lte: to } };
  if (query.visitor) filter.visitor = query.visitor;
  if (query.hostEmployee) filter.hostEmployee = query.hostEmployee;
  if (query.q) {
    const regex = new RegExp(escapeRegex(query.q), "i");
    const visitorIds = await Visitor.distinct("_id", {
      $or: [{ fullName: regex }, { phone: regex }, { email: regex }, { organization: regex }],
    });
    filter.visitor = query.visitor ? query.visitor : { $in: visitorIds };
  }

  const [items, total] = await Promise.all([
    Visit.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate(VISIT_POPULATE),
    Visit.countDocuments(filter),
  ]);

  return { range: { from, to }, items, meta: buildPaginationMeta({ page, limit, total }) };
}

export async function meetingHistoryReport(query, { page, limit, skip }) {
  await syncMeetingStatuses();
  const { from, to } = resolveDateRange(query, 90);
  const filter = {
    startAt: { $gte: from, $lte: to },
    status: query.status ?? { $in: [MEETING_STATUS.COMPLETED, MEETING_STATUS.CANCELLED] },
  };
  if (query.organizer) filter.organizer = query.organizer;
  if (query.room) filter.room = query.room;

  const [items, total] = await Promise.all([
    Meeting.find(filter).sort({ startAt: -1 }).skip(skip).limit(limit).populate(MEETING_POPULATE),
    Meeting.countDocuments(filter),
  ]);

  return { range: { from, to }, items, meta: buildPaginationMeta({ page, limit, total }) };
}
