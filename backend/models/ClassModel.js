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
    // Enhanced Fee-related fields
    baseFee: {
      type: Number,
      default: 0,
      min: 0
    },
    lateFeePerDay: {
      type: Number,
      default: 0,
      min: 0
    },
    feeDueDate: {
      type: Date,
      default: null
    },
    // New fields for enhanced fee management
    feeHistory: [{
      academicYear: {
        type: String,
        required: true
      },
      baseFee: {
        type: Number,
        required: true
      },
      lateFeePerDay: {
        type: Number,
        required: true
      },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        required: true
      },
      updatedAt: {
        type: Date,
        default: Date.now
      },
      reason: {
        type: String,
        trim: true
      }
    }],
    currentAcademicYear: {
      type: String,
      default: () => new Date().getFullYear().toString()
    },
    feeSettings: {
      monthlyFeeCalculation: {
        type: String,
        enum: ["baseFee", "custom"],
        default: "baseFee"
      },
      customMonthlyFee: {
        type: Number,
        default: 0
      },
      feeFrequency: {
        type: String,
        enum: ["monthly", "quarterly", "annually"],
        default: "monthly"
      },
      gracePeriod: {
        type: Number,
        default: 5, // days
        min: 0
      },
      autoGenerateFees: {
        type: Boolean,
        default: true
      }
    },
    classStrength: {
      type: Number,
      required: true,
      min: 1
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject"
      }
    ],
    students: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student"
    }],
    teachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher"
      }
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

// Add method to calculate monthly fee
classSchema.methods.calculateMonthlyFee = function() {
  if (this.feeSettings.monthlyFeeCalculation === 'custom') {
    return this.feeSettings.customMonthlyFee;
  }
  return this.baseFee / 12;
};

// Add method to update fee history
classSchema.methods.updateFeeHistory = function(adminId, reason = '') {
  this.feeHistory.push({
    academicYear: this.currentAcademicYear,
    baseFee: this.baseFee,
    lateFeePerDay: this.lateFeePerDay,
    updatedBy: adminId,
    reason: reason
  });
};

// Drop any existing indexes
classSchema.indexes().forEach(index => {
  classSchema.index(index[0], { unique: false });
});

// Create the compound unique index
classSchema.index({ className: 1, section: 1 }, { unique: true });

module.exports = mongoose.model("Class", classSchema);
