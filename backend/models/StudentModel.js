const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    // Basic Information
    studentName: { type: String, required: true }, // Full name of the student
    photo: { type: String }, // Path/URL to the student's photo, optional during creation
    studentGender: {
      type: String,
      required: true,
    },
    studentDOB: { type: Date, required: true }, // Date of Birth
    religion: { type: String, required: false }, // Religion of the student (optional)
    category: { type: String, required: false }, // Category (optional, e.g., General, OBC, SC/ST)
    bloodgroup: { type: String, required: false }, // Blood group of the student (optional)

    // Contact Information
    studentEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, "Please use a valid email address"], // Email validation
    },
    studentPhone: {
      type: String,
      required: true,
      match: [/^\d{10}$/, "Phone number must be 10 digits"], // Phone validation
    },
    studentAddress: { type: String, required: true }, // Full address of the student
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
    studentID: {
      type: String,
      required: true,
      unique: true,
      match: /^STU\d{5}$/, // Student ID format (e.g., STU12345)
    },
    studentPassword: { type: String, required: true }, // Hashed password for authentication
    studentDateOfAdmission: { type: Date, required: true }, // Admission date
    enrolledClasses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
      },
    ],

    // Family Information
    studentFatherName: { type: String, required: true }, // Father's name
    studentMotherName: { type: String, required: true }, // Mother's name

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent",
      required: false, // Reference to Parent document
    },
    // New field to track who created this admin
    registeredBy: {
      adminID: { type: String, required: true },
      name: { type: String, required: true },
    },
    // Optional Identification Information
    AADHARnumber: { type: String }, // AADHAR number (optional, for India)

    // Activity Information
    lastLogin: { type: Date }, // Last login timestamp
    loginHistory: [{ type: Date }], // Array of login timestamps
    actionHistory: [{ type: String }], // Array of logged actions performed by the student

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

  { timestamps: true } // Automatically adds createdAt and updatedAt timestamps
);

const Student =
  mongoose.models.Student || mongoose.model("Student", studentSchema);

module.exports = Student;
