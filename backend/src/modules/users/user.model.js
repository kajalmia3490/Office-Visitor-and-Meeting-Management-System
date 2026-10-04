import mongoose from "mongoose";
import { ROLES, ROLE_VALUES } from "../../config/constants.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    role: { type: String, enum: ROLE_VALUES, default: ROLES.EMPLOYEE, required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", default: null },
    employeeId: { type: String, trim: true },
    profileImage: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    // Better Auth user id linked to this application profile.
    authUserId: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (doc, ret) => {
        delete ret.authUserId;
        return ret;
      },
    },
  },
);

userSchema.index({ email: 1 }, { unique: true });
// Sparse because users provisioned on first sign-in have no employee id yet.
userSchema.index({ employeeId: 1 }, { unique: true, sparse: true });
userSchema.index({ authUserId: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ department: 1 });

export const User = mongoose.model("User", userSchema, "users");
