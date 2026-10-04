import mongoose from "mongoose";
import { IDENTITY_TYPES } from "../../config/constants.js";

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    relationship: { type: String, trim: true },
  },
  { _id: false },
);

const visitorSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 150 },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    organization: { type: String, trim: true, maxlength: 150 },
    address: { type: String, trim: true, maxlength: 300 },
    identityType: { type: String, enum: IDENTITY_TYPES },
    identityNumber: { type: String, trim: true },
    photo: { type: String, trim: true },
    emergencyContact: { type: semergencyContactSchema },
  },
  { timestamps: true, toJSON: { versionKey: false } },
);

visitorSchema.index({ phone: 1 });
visitorSchema.index({ identityNumber: 1 });
visitorSchema.index({ fullName: 1 });
visitorSchema.index({ email: 1 });

export const Visitor = mongoose.model("Visitor", visitorSchema, "visitors");
