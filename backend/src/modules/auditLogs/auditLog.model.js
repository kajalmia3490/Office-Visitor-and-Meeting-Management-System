import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    action: { type: String, required: true },
    module: { type: String, required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
    description: { type: String, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { versionKey: false },
  },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ module: 1, action: 1, createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ targetId: 1 });

export const AuditLog = mongoose.model("AuditLog", auditLogSchema, "audit_logs");
