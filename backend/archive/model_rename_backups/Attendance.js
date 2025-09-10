const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
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
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true },

    records: [
      {
        enrollmentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Enrollment",
          required: true,
        },
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
          required: true,
        },
        status: {
          type: String,
          enum: ["Present", "Absent", "Late", "Excused"],
          required: true,
        },
        remarks: { type: String, trim: true },
      },
    ],

    takenBy: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" }, // who marked
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }, // if admin entered
  },
  { timestamps: true }
);

AttendanceSchema.index(
  { sessionId: 1, sectionId: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model("Attendance", AttendanceSchema);
