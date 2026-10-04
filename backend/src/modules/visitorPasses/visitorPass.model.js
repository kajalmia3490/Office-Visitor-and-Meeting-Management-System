import mongoose from "mongoose";
import { PASS_STATUS } from "../../config/constants.js";

const visitorPassSchema = new mongoose.Schema(
  {
    visit: { type: mongoose.Schema.Types.ObjectId, ref: "Visit", required: true },
    passNumber: { type: String, required: true, trim: true },
    qrCode: { type: String },
    issuedAt: { type: Date, default: Date.now },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true },
    status: { type: String, enum: Object.values(PASS_STATUS), default: PASS_STATUS.ACTIVE },
    revokedAt: { type: Date },
    revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    revokeReason: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true, toJSON: { versionKey: false } },
);

visitorPassSchema.index({ passNumber: 1 }, { unique: true });
visitorPassSchema.index({ visit: 1, status: 1 });
visitorPassSchema.index({ status: 1, expiresAt: 1 });
// Only one active pass per visit.
visitorPassSchema.index(
  { visit: 1 },
  { unique: true, partialFilterExpression: { status: PASS_STATUS.ACTIVE }, name: "visit_active_pass_unique" },
);

export const VisitorPass = mongoose.model("VisitorPass", visitorPassSchema, "visitor_passes");
