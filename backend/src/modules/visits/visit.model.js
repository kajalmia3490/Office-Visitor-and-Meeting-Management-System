import mongoose from "mongoose";
import { VISIT_STATUS, VISIT_TYPE } from "../../config/constants.js";

const visitSchema = new mongoose.Schema(
  {
    visitor: { type: mongoose.Schema.Types.ObjectId, ref: "Visitor", required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", default: null },
    hostEmployee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    purpose: { type: String, required: true, trim: true, maxlength: 500 },
    visitType: { type: String, enum: Object.values(VISIT_TYPE), required: true },
    status: { type: String, enum: Object.values(VISIT_STATUS), default: VISIT_STATUS.EXPECTED },
    checkInAt: { type: Date },
    checkOutAt: { type: Date },
    checkInBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    checkOutBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true, toJSON: { versionKey: false } },
);

visitSchema.index({ status: 1 });
visitSchema.index({ visitor: 1, createdAt: -1 });
visitSchema.index({ hostEmployee: 1, createdAt: -1 });
visitSchema.index({ checkInAt: -1 });
// An appointment becomes at most one visit.
visitSchema.index(
  { appointment: 1 },
  { unique: true, partialFilterExpression: { appointment: { $type: "objectId" } } },
);

export const Visit = mongoose.model("Visit", visitSchema, "visits");
