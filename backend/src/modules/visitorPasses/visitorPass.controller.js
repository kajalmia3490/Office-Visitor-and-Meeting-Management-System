import * as service from "./visitorPass.service.js";
import { sendCreated, sendSuccess } from "../../utils/response.js";

export async function issue(req, res) {
  const pass = await service.issuePass(req, req.body);
  return sendCreated(res, "Visitor pass issued successfully", pass);
}

export async function getById(req, res) {
  const pass = await service.getPassOrThrow(req.params.id);
  return sendSuccess(res, { message: "Visitor pass retrieved successfully", data: pass });
}

export async function verify(req, res) {
  const result = await service.verifyPass(req.params.passNumber);
  return sendSuccess(res, {
    message: result.valid ? "Visitor pass is valid" : `Visitor pass is not valid (${result.reason})`,
    data: result,
  });
}

export async function revoke(req, res) {
  const pass = await service.revokePass(req, req.params.id, req.body?.reason);
  return sendSuccess(res, { message: "Visitor pass revoked successfully", data: pass });
}
