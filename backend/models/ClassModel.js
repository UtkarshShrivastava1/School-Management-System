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
    // Subjects associated with the class
    subjects: [
      {
        type: String, // Storing subjectId as a string instead of ObjectId
      },
    ],
    // Students enrolled in the class
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    // Teachers assigned to the class
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
