const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    // Basic Information
    studentName: {
      type: String,
      required: true,
    },
    studentID: {
      type: String,
      required: true,
      unique: true,
    },
    studentPassword: {
      type: String,
      required: true,
    },
    studentEmail: {
      type: String,
      required: true,
      unique: true,
    },
    studentPhone: {
      type: String,
      required: true,
    },
    studentAddress: {
      type: String,
      required: true,
    },
    studentDOB: {
      type: Date,
      required: true,
    },
    studentGender: {
      type: String,
      required: true,
    },
    studentDateOfAdmission: {
      type: Date,
      default: Date.now,
    },
    studentFatherName: {
      type: String,
      required: true,
    },
    studentMotherName: {
      type: String,
      required: true,
    },
    religion: String,
    category: String,
    bloodgroup: String,
    photo: String,
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent",
    },
    enrolledClasses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      unique: true // Ensure each class appears only once
    }],
    feeDetails: {
      type: Map,
      of: {
        classFee: Number,
        totalAmount: Number,
        status: {
          type: String,
          enum: ['pending', 'paid', 'overdue'],
          default: 'pending'
        },
        lastUpdated: Date,
        dueDate: Date,
        lateFeePerDay: Number,
        lateFeeAmount: Number,
        paymentDate: Date,
        paymentMethod: String,
        receiptNumber: String
      },
      default: new Map()
    },
    registeredBy: {
      adminID: String,
      name: String,
    },
    // Contact Information
    emergencyContact: {
      // Optional emergency contact information
      name: String, // Name of the emergency contact person
      relation: String, // Relationship with the student
      phone: {
        type: String,
        match: [/^\d{10}$/, "Phone number must be 10 digits"], // Phone validation
      },
    },

    // Academic Information
    studentDateOfAdmission: { type: Date, required: true }, // Admission date
    actionHistory: [{ type: String }], // Array of logged actions performed by the student

    // Family Information
    studentFatherName: { type: String, required: true }, // Father's name
    studentMotherName: { type: String, required: true }, // Mother's name

    // Optional Identification Information
    AADHARnumber: { type: String }, // AADHAR number (optional, for India)

    // Activity Information
    lastLogin: { type: Date }, // Last login timestamp
    loginHistory: [{ type: Date }], // Array of login timestamps

    // Role Information
    role: { type: String, default: "student" }, // Role in the system (default: "student")

    // Attendance Information
    attendance: [
      {
        date: {
          type: Date,
          required: true,
        },
        classId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Class",
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
  { timestamps: true }
);

// Add a pre-save middleware to ensure unique classes
studentSchema.pre('save', async function(next) {
  if (this.isModified('enrolledClasses')) {
    // Remove any duplicate class IDs
    this.enrolledClasses = [...new Set(this.enrolledClasses.map(id => id.toString()))];
  }
  next();
});

module.exports = mongoose.model("Student", studentSchema);
