const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },
    subjectId: {
      type: String,
      required: true,
      unique: true,
    },
    subjectCode: {
      type: String,
      required: true,
      unique: true,
    },
    assignedTeachers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
    ], // Ensure this field is an array,
    classes: [
      {
        type: String, // Storing classId as a string instead of ObjectId
      },
    ],
    enrolledStudents: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
        },
        marks: {
          type: Number,
        },
        attendance: {
          type: Boolean,
        },
        status: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subject", subjectSchema);
