import mongoose from "mongoose";
import { ATTENDEE_STATUS, MEETING_STATUS } from "../../config/constants.js";

const attendeeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: Object.values(ATTENDEE_STATUS),
      default: ATTENDEE_STATUS.INVITED,
    },
  },
  { _id: false },
);

const meetingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "MeetingRoom", required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(MEETING_STATUS),
      default: MEETING_STATUS.SCHEDULED,
    },
    attendees: { type: [attendeeSchema], default: [] },
    cancelledAt: { type: Date },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cancelReason: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true, toJSON: { versionKey: false } },
);

meetingSchema.index({ room: 1, startAt: 1, endAt: 1 });
meetingSchema.index({ organizer: 1, startAt: 1 });
meetingSchema.index({ "attendees.user": 1, startAt: 1 });
meetingSchema.index({ status: 1, endAt: 1 });

export const Meeting = mongoose.model("Meeting", meetingSchema, "meetings");
