import crypto from "node:crypto";
import QRCode from "qrcode";

import { VisitorPass } from "./visitorPass.model.js";
import { Visit } from "../visits/visit.model.js";
import { VISITOR_SUMMARY_FIELDS } from "../visitors/visitor.service.js";
import { recordAudit } from "../auditLogs/auditLog.service.js";
import { AUDIT_ACTIONS, AUDIT_MODULES, PASS_STATUS, ROLES, VISIT_STATUS } from "../../config/constants.js";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";
import { addHours, formatDateKey } from "../../utils/dateTime.js";

const MAX_VALIDITY_HOURS = 72;

export const PASS_POPULATE = [
  {
    path: "visit",
    select: "visitor hostEmployee purpose visitType status checkInAt checkOutAt",
    populate: [
      { path: "visitor", select: VISITOR_SUMMARY_FIELDS },
      { path: "hostEmployee", select: "name email employeeId" },
    ],
  },
  { path: "issuedBy", select: "name email role" },
  { path: "revokedBy", select: "name email role" },
];

const idOf = (ref) => String(ref?._id ?? ref);

function generatePassNumber(now = new Date()) {
  return `VP-${formatDateKey(now)}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

function resolveExpiry({ expiresAt, validHours }) {
  const now = new Date();
  const expiry = expiresAt ?? addHours(now, validHours ?? env.PASS_DEFAULT_VALIDITY_HOURS);
  if (expiry <= now) throw ApiError.validation("Pass expiry must be in the future");
  if (expiry > addHours(now, MAX_VALIDITY_HOURS)) {
    throw ApiError.validation(`A pass cannot be valid for more than ${MAX_VALIDITY_HOURS} hours`);
  }
  return expiry;
}

async function expireIfOverdue(pass) {
  if (pass.status === PASS_STATUS.ACTIVE && pass.expiresAt <= new Date()) {
    pass.status = PASS_STATUS.EXPIRED;
    await pass.save();
  }
  return pass;
}

export async function getPassOrThrow(id) {
  const pass = await VisitorPass.findById(id).populate(PASS_POPULATE);
  if (!pass) throw ApiError.notFound("Visitor pass not found", "PASS_NOT_FOUND");
  return expireIfOverdue(pass);
}

/** Latest pass for a visit (employees may only see passes of visits they host). */
export async function getPassForVisit(user, visitId) {
  const visit = await Visit.findById(visitId).select("hostEmployee");
  if (!visit) throw ApiError.notFound("Visit not found", "VISIT_NOT_FOUND");
  if (user.role === ROLES.EMPLOYEE && idOf(visit.hostEmployee) !== String(user._id)) {
    throw ApiError.forbidden("You can only access passes for your own visitors");
  }

  const pass = await VisitorPass.findOne({ visit: visitId }).sort({ issuedAt: -1 }).populate(PASS_POPULATE);
  if (!pass) throw ApiError.notFound("No pass has been issued for this visit", "PASS_NOT_FOUND");
  return expireIfOverdue(pass);
}

export async function issuePass(req, { visit: visitId, expiresAt, validHours }) {
  const visit = await Visit.findById(visitId);
  if (!visit) throw ApiError.notFound("Visit not found", "VISIT_NOT_FOUND");
  if (visit.status !== VISIT_STATUS.CHECKED_IN) {
    throw ApiError.conflict("A pass can only be issued for a checked-in visit", "VISIT_NOT_CHECKED_IN");
  }

  const active = await VisitorPass.findOne({ visit: visitId, status: PASS_STATUS.ACTIVE });
  if (active) {
    await expireIfOverdue(active);
    if (active.status === PASS_STATUS.ACTIVE) {
      throw ApiError.conflict("This visit already has an active pass", "PASS_ALREADY_ACTIVE");
    }
  }

  const expiry = resolveExpiry({ expiresAt, validHours });

  let pass;
  for (let attempt = 0; attempt < 5 && !pass; attempt += 1) {
    const passNumber = generatePassNumber();
    const qrCode = await QRCode.toDataURL(passNumber, { errorCorrectionLevel: "M", margin: 1, width: 240 });
    try {
      pass = await VisitorPass.create({
        visit: visitId,
        passNumber,
        qrCode,
        issuedBy: req.user._id,
        issuedAt: new Date(),
        expiresAt: expiry,
      });
    } catch (err) {
      if (err?.code !== 11000) throw err;
      if (err.keyPattern?.visit) {
        throw ApiError.conflict("This visit already has an active pass", "PASS_ALREADY_ACTIVE");
      }
      // passNumber collision: retry with a new number
    }
  }
  if (!pass) throw new ApiError(500, "Could not generate a unique pass number", "PASS_GENERATION_FAILED");

  await recordAudit(req, {
    action: AUDIT_ACTIONS.PASS_ISSUED,
    module: AUDIT_MODULES.VISITOR_PASSES,
    targetId: pass._id,
    description: `Visitor pass ${pass.passNumber} issued`,
    metadata: { visit: visitId },
  });

  return getPassOrThrow(pass._id);
}

/**
 * Checks whether a pass is currently valid. Returns the pass with a `valid`
 * flag and reason instead of throwing, so security can see why it failed.
 */
export async function verifyPass(passNumber) {
  const pass = await VisitorPass.findOne({ passNumber: passNumber.trim().toUpperCase() }).populate(PASS_POPULATE);
  if (!pass) throw ApiError.notFound("Visitor pass not found", "PASS_NOT_FOUND");

  await expireIfOverdue(pass);

  let valid = false;
  let reason;
  if (pass.status === PASS_STATUS.REVOKED) reason = "REVOKED";
  else if (pass.status === PASS_STATUS.EXPIRED) reason = "EXPIRED";
  else if (pass.visit?.status !== VISIT_STATUS.CHECKED_IN) reason = "VISIT_NOT_ACTIVE";
  else {
    valid = true;
    reason = "VALID";
  }

  return { valid, reason, pass };
}

export async function revokePass(req, id, reason) {
  const pass = await getPassOrThrow(id);
  if (pass.status !== PASS_STATUS.ACTIVE) {
    throw ApiError.conflict(`Only active passes can be revoked (current: ${pass.status})`, "PASS_NOT_ACTIVE");
  }

  pass.status = PASS_STATUS.REVOKED;
  pass.revokedAt = new Date();
  pass.revokedBy = req.user._id;
  pass.revokeReason = reason;
  await pass.save();

  await recordAudit(req, {
    action: AUDIT_ACTIONS.PASS_REVOKED,
    module: AUDIT_MODULES.VISITOR_PASSES,
    targetId: pass._id,
    description: `Visitor pass ${pass.passNumber} revoked`,
    metadata: reason ? { reason } : undefined,
  });

  return getPassOrThrow(pass._id);
}

/** Called on check-out: active passes for the visit stop being valid. */
export async function expirePassesForVisit(visitId) {
  await VisitorPass.updateMany(
    { visit: visitId, status: PASS_STATUS.ACTIVE },
    { $set: { status: PASS_STATUS.EXPIRED, expiresAt: new Date() } },
  );
}

export async function expireOverduePasses(now = new Date()) {
  const result = await VisitorPass.updateMany(
    { status: PASS_STATUS.ACTIVE, expiresAt: { $lte: now } },
    { $set: { status: PASS_STATUS.EXPIRED } },
  );
  return result.modifiedCount;
}
