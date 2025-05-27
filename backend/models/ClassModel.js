const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
      trim: true,
      enum: [
        "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
        "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
        "Class 11", "Class 12"
      ]
    },
    section: {
      type: String,
      required: true,
      enum: ["A", "B", "C", "D", "E"]
    },
    classId: {
      type: String,
      required: true,
      unique: true,
    },
    classStrength: {
      type: Number,
      required: true,
      min: 1
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
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

// Drop any existing indexes
classSchema.indexes().forEach(index => {
  classSchema.index(index[0], { unique: false });
});

// Create the compound unique index
classSchema.index({ className: 1, section: 1 }, { unique: true });

module.exports = mongoose.model("Class", classSchema);
