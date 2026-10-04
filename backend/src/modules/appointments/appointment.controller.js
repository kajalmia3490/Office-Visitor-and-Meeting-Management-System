import * as service from "./appointment.service.js";
import { getPagination } from "../../utils/pagination.js";
import { sendCreated, sendSuccess } from "../../utils/response.js";

export async function list(req, res) {
  const { items, meta } = await service.listAppointments(req.user, req.query, getPagination(req.query));
  return sendSuccess(res, { message: "Appointments retrieved successfully", data: items, meta });
}

export async function getById(req, res) {
  const appointment = await service.getAppointment(req.user, req.params.id);
  return sendSuccess(res, { message: "Appointment retrieved successfully", data: appointment });
}

export async function create(req, res) {
  const appointment = await service.createAppointment(req, req.body);
  return sendCreated(res, "Appointment created successfully", appointment);
}

export async function update(req, res) {
  const appointment = await service.updateAppointment(req, req.params.id, req.body);
  return sendSuccess(res, { message: "Appointment updated successfully", data: appointment });
}

export async function approve(req, res) {
  const appointment = await service.approveAppointment(req, req.params.id);
  return sendSuccess(res, { message: "Appointment approved successfully", data: appointment });
}

export async function reject(req, res) {
  const appointment = await service.rejectAppointment(req, req.params.id, req.body?.reason);
  return sendSuccess(res, { message: "Appointment rejected successfully", data: appointment });
}

export async function cancel(req, res) {
  const appointment = await service.cancelAppointment(req, req.params.id, req.body?.reason);
  return sendSuccess(res, { message: "Appointment cancelled successfully", data: appointment });
}
