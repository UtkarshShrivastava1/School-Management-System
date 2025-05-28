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
    // Fee-related fields
    baseFee: {
      type: Number,
      default: 0
    },
    lateFeePerDay: {
      type: Number,
      default: 0
    },
    feeDueDate: {
      type: Date,
      default: null
    },
    // ✅ Change subjects to store ObjectId references
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      unique: true // Ensure each student appears only once in a class
    }],
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

// Add a pre-save middleware to ensure unique students
classSchema.pre('save', async function(next) {
  if (this.isModified('students')) {
    // Remove any duplicate student IDs
    this.students = [...new Set(this.students.map(id => id.toString()))];
  }
  next();
});

// Virtual property for classStrength
classSchema.virtual("classStrength").get(function () {
  return this.students.length;
});

module.exports = mongoose.model("Class", classSchema);
