const mongoose = require("mongoose");

const AcademicClassSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicSession",
      required: true,
      index: true,
    },
    classTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassTemplate",
      required: true,
      index: true,
    },

    // denormalized for fast filters
    grade: { type: String, required: true, uppercase: true, trim: true }, // "C11"
    displayName: { type: String, required: true, trim: true }, // "Class 11 | 2024-25"

    // per-session fee rules
    feeSettings: {
      baseFee: { type: Number, default: 0, min: 0 },
      lateFeePerDay: { type: Number, default: 0, min: 0 },
      feeFrequency: {
        type: String,
        enum: ["monthly", "quarterly", "annually"],
        default: "monthly",
      },
      gracePeriod: { type: Number, default: 5, min: 0 },
      autoGenerateFees: { type: Boolean, default: true },
    },
    feeHistory: [
      {
        baseFee: { type: Number, required: true, min: 0 },
        lateFeePerDay: { type: Number, required: true, min: 0 },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Admin",
          required: true,
        },
        updatedAt: { type: Date, default: Date.now },
        reason: { type: String, trim: true },
      },
    ],

    // subjects for this academic class (teacher links are in TeachingAssignment)
    subjectIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

AcademicClassSchema.index(
  { sessionId: 1, classTemplateId: 1 },
  { unique: true }
);
AcademicClassSchema.index({ sessionId: 1, grade: 1 });

module.exports = mongoose.model("AcademicClass", AcademicClassSchema);
