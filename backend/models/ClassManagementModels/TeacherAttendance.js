const mongoose = require("mongoose");

const TeacherAttendanceSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, index: true },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["Present", "Absent", "Leave", "Late"],
      required: true,
    },
    remarks: { type: String, trim: true },

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    }, // who logged this
  },
  { timestamps: true }
);

// unique: one teacher’s record per date
TeacherAttendanceSchema.index({ teacherId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("TeacherAttendance", TeacherAttendanceSchema);
