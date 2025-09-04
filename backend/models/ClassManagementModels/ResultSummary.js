const mongoose = require("mongoose");

const ResultSummarySchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicSession",
      required: true,
      index: true,
    },
    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
      unique: true,
    },
    overallStatus: {
      type: String,
      enum: ["pass", "fail", "compartment"],
      required: true,
    },
    subjects: [
      {
        subjectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Subject",
          required: true,
        },
        total: { type: Number, required: true }, // computed total considered for result
        max: { type: Number, required: true },
        status: {
          type: String,
          enum: ["pass", "fail", "compartment"],
          required: true,
        },
      },
    ],
    remarks: String,
  },
  { timestamps: true }
);

ResultSummarySchema.index({ sessionId: 1, overallStatus: 1 });

module.exports = mongoose.model("ResultSummary", ResultSummarySchema);
