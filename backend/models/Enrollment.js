const mongoose = require("mongoose");

const EnrollmentSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicSession",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    academicClassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicClass",
      required: true,
      index: true,
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      default: null,
      index: true,
    },

    // enrollment lifecycle
    status: {
      type: String,
      enum: ["enrolled", "waitlisted", "transferred", "withdrawn"],
      default: "enrolled",
      index: true,
    },
    admissionType: {
      type: String,
      enum: ["new", "promoted", "repeat", "compartment", "transfer"],
      default: "new",
    },

    // rollNumber per section (string so you can pad like "01")
    rollNumber: { type: String, default: null },

    // NEW: elective subjects chosen by student for this session
    electives: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],

    // meta & audit
    notes: { type: String },
    audit: {
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
      movedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
      movedAt: { type: Date },
      history: [
        {
          action: String,
          by: mongoose.Schema.Types.ObjectId,
          at: Date,
          meta: mongoose.Schema.Types.Mixed,
        },
      ],
    },
  },
  { timestamps: true }
);

// prevent duplicate enrollment for same student+session
EnrollmentSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", EnrollmentSchema);
