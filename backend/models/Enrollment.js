const mongoose = require("mongoose");
const EnrollmentSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicSession",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    academicClassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicClass",
      required: true,
    },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Section" }, // can be null until placed
    status: {
      type: String,
      enum: ["enrolled", "waitlisted", "transferred", "withdrawn"],
      default: "enrolled",
    },
    admissionType: {
      type: String,
      enum: ["new", "promoted", "repeat", "compartment"],
      default: "new",
    },
    rollNumber: String,
    house: String,
    electiveSubjectIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    ],
    audit: {
      movedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
      movedAt: Date,
    },
  },
  { timestamps: true }
);

EnrollmentSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });
EnrollmentSchema.index({ academicClassId: 1, sectionId: 1, status: 1 });

module.exports = mongoose.model("Enrollment", EnrollmentSchema);
