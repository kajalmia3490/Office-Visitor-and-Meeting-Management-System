import * as reports from "./report.service.js";
import * as dashboards from "./dashboard.service.js";
import { getPagination } from "../../utils/pagination.js";
import { sendSuccess } from "../../utils/response.js";

export async function visitors(req, res) {
  const data = await reports.visitorReport(req.query);
  return sendSuccess(res, { message: "Visitor report generated", data });
}

export async function meetings(req, res) {
  const data = await reports.meetingReport(req.query);
  return sendSuccess(res, { message: "Meeting report generated", data });
}

export async function rooms(req, res) {
  const data = await reports.roomUtilizationReport(req.query);
  return sendSuccess(res, { message: "Room utilization report generated", data });
}

export async function activeVisitors(req, res) {
  const data = await reports.activeVisitorsReport();
  return sendSuccess(res, { message: "Active visitors report generated", data });
}

export async function visitorHistory(req, res) {
  const { items, meta, range } = await reports.visitorHistoryReport(req.query, getPagination(req.query));
  return sendSuccess(res, { message: "Visitor history report generated", data: { range, items }, meta });
}

export async function meetingHistory(req, res) {
  const { items, meta, range } = await reports.meetingHistoryReport(req.query, getPagination(req.query));
  return sendSuccess(res, { message: "Meeting history report generated", data: { range, items }, meta });
}

export async function adminDashboard(req, res) {
  const data = await dashboards.adminDashboard();
  return sendSuccess(res, { message: "Admin dashboard data", data });
}

export async function receptionDashboard(req, res) {
  const data = await dashboards.receptionDashboard();
  return sendSuccess(res, { message: "Reception dashboard data", data });
}

export async function employeeDashboard(req, res) {
  const data = await dashboards.employeeDashboard(req.user);
  return sendSuccess(res, { message: "Employee dashboard data", data });
}

export async function managementDashboard(req, res) {
  const data = await dashboards.managementDashboard();
  return sendSuccess(res, { message: "Management dashboard data", data });
}
