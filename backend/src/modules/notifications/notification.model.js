import mongoose from "mongoose";
import { NOTIFICATION_TYPES } from "../../config/constants.js";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: Object.values(NOTIFICATION_TYPES), required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    relatedVisit: { type: mongoose.Schema.Types.ObjectId, ref: "Visit", default: null },
    relatedMeeting: { type: mongoose.Schema.Types.ObjectId, ref: "Meeting", default: null },
    relatedAppointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", default: null },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { versionKey: false },
  },
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema, "notifications");
