const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g. "ENROLLMENT_MOVED", "WAITLIST_ALLOCATED"
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }, // optional
  targetType: { type: String }, // e.g., "Enrollment", "TeachingAssignment"
  targetId: { type: mongoose.Schema.Types.ObjectId },
  details: { type: mongoose.Schema.Types.Mixed }, // flexible JSON
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("AuditLog", AuditLogSchema);
