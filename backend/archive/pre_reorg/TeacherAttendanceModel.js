const mongoose = require("mongoose");

const teacherAttendanceSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Present", "Absent", "Leave"],
      required: true,
    },
    remarks: {
      type: String,
      default: null,
    },
    markedBy: {
      adminID: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
  },
  { timestamps: true }
);

// Creating the TeacherAttendance model
const TeacherAttendance =
  mongoose.models.TeacherAttendance ||
  mongoose.model("TeacherAttendance", teacherAttendanceSchema);

module.exports = TeacherAttendance;
