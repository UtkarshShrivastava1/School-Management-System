const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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
  },
  { timestamps: true }
);

// Virtual property for classStrength
classSchema.virtual("classStrength").get(function () {
  return this.students.length;
});

module.exports = mongoose.model("Class", classSchema);
