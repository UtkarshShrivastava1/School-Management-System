const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      enum: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12']
    },
    classId: {
      type: String,
      required: true,
      unique: true,
    },
    // ✅ Change subjects to store ObjectId references
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject", // 🔥 Now references the Subject model
      },
    ],
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    teachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
      },
    ],
    attendanceHistory: [
      {
        date: {
          type: Date,
          required: true,
        },
        records: [
          {
            studentId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Student",
              required: true,
            },
            status: {
              type: String,
              enum: ["Present", "Absent"],
              required: true,
            },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

// Virtual property for classStrength
classSchema.virtual("classStrength").get(function () {
  return this.students.length;
});

module.exports = mongoose.model("Class", classSchema);
