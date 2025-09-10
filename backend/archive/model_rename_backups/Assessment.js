const mongoose = require("mongoose");

const AssessmentSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicSession",
      required: true,
      index: true,
    },
    academicClassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicClass",
      required: true,
      index: true,
    },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Section" }, // optional
    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },

    // assessment meta
    examType: {
      type: String,
      enum: ["unit", "midterm", "final", "practical", "other"],
      default: "other",
      index: true,
    },
    maxMarks: { type: Number, required: true },
    marks: { type: Number, required: true, min: 0 },
    grade: { type: String }, // optional letter grade
    attempt: { type: Number, default: 1 }, // for compartment/retest attempts
  },
  { timestamps: true }
);

AssessmentSchema.index(
  { enrollmentId: 1, subjectId: 1, examType: 1, attempt: 1 },
  { unique: true }
);

module.exports = mongoose.model("Assessment", AssessmentSchema);
