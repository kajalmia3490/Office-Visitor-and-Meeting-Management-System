import mongoose from "mongoose";
import { ROOM_STATUS } from "../../config/constants.js";

const meetingRoomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    roomNumber: { type: String, required: true, trim: true, maxlength: 30 },
    location: { type: String, trim: true, maxlength: 200 },
    capacity: { type: Number, required: true, min: 1 },
    facilities: { type: [String], default: [] },
    status: {
      type: String,
      enum: Object.values(ROOM_STATUS),
      default: ROOM_STATUS.AVAILABLE,
    },
    description: { type: String, trim: true, maxlength: 1000 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { versionKey: false } },
);

meetingRoomSchema.index({ roomNumber: 1 }, { unique: true });
meetingRoomSchema.index({ status: 1, isActive: 1, capacity: 1 });

export const MeetingRoom = mongoose.model(
  "MeetingRoom",
  meetingRoomSchema,
  "meeting_rooms",
);
