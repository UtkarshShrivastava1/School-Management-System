const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    subjectName: { type: String, required: true, trim: true },

    subjectId: { type: String, required: true, unique: true }, // e.g. SUB_MATH101
    subjectCode: { type: String, required: true, unique: true }, // e.g. MATH101

    // Optional: quick link to teachers (real mapping is in TeachingAssignment)
    assignedTeachers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subject", subjectSchema);
