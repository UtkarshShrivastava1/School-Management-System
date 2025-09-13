const mongoose = require("mongoose");
const TeachingAssignmentSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicSession",
      required: true,
    },
    academicClassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicClass",
      required: true,
    },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Section" }, // optional: null = applies to entire academic class
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    periodsPerWeek: Number,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

TeachingAssignmentSchema.index(
  {
    sessionId: 1,
    academicClassId: 1,
    sectionId: 1,
    subjectId: 1,
    teacherId: 1,
  },
  { unique: true, partialFilterExpression: { isActive: true } }
);

module.exports = mongoose.model("TeachingAssignment", TeachingAssignmentSchema);
