import mongoose from "mongoose";
import { APPOINTMENT_STATUS } from "../../config/constants.js";

const appointmentSchema = new mongoose.Schema(
  {
    visitor: { type: mongoose.Schema.Types.ObjectId, ref: "Visitor", required: true },
    hostEmployee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    meeting: { type: mongoose.Schema.Types.ObjectId, ref: "Meeting", default: null },
    purpose: { type: String, required: true, trim: true, maxlength: 500 },
    scheduledStartAt: { type: Date, required: true },
    scheduledEndAt: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(APPOINTMENT_STATUS),
      default: APPOINTMENT_STATUS.PENDING,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    notes: { type: String, trim: true, maxlength: 1000 },
    decisionReason: { type: String, trim: true, maxlength: 500 },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    decidedAt: { type: Date },
  },
  { timestamps: true, toJSON: { versionKey: false } },
);

appointmentSchema.index({ scheduledStartAt: 1, scheduledEndAt: 1 });
appointmentSchema.index({ hostEmployee: 1, scheduledStartAt: 1 });
appointmentSchema.index({ visitor: 1, scheduledStartAt: -1 });
appointmentSchema.index({ status: 1, scheduledStartAt: 1 });

export const Appointment = mongoose.model("Appointment", appointmentSchema, "appointments");
