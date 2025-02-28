const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, "Please use a valid email address"],
    },
    phone: {
      type: String,
      required: true,
      unique: true, // Added uniqueness constraint for phone numbers
      match: [/^\d{10}$/, "Phone number must be 10 digits"],
    },
    designation: { type: String, required: true },
    address: { type: String, required: true },
    dob: { type: Date, required: true },
    gender: { type: String, required: true, enum: ["Male", "Female", "Other"] },
    religion: { type: String, default: null },
    category: { type: String, default: null },
    bloodgroup: { type: String, default: null },
    department: { type: String, required: true },
    role: { type: String, enum: ["teacher"], default: "teacher" },
    teacherID: {
      type: String,
      required: true,
      unique: true, // Ensures teacher IDs are unique
      match: [/^TCHR\d+$/, "Teacher ID must follow the pattern TCHR1234"],
    },
    password: { type: String, required: true },
    photo: { type: String, default: null },
    emergencyContact: {
      name: { type: String, default: null },
      relation: { type: String, default: null },
      phone: {
        type: String,
        match: [/^\d{10}$/, "Phone number must be 10 digits"],
      },
    },
    experience: { type: Number, default: 0 },
    highestQualification: { type: String, default: null },
    AADHARnumber: { type: String, unique: true, sparse: true }, // Allow null but ensure uniqueness when provided
    lastLogin: { type: Date, default: null },
    loginHistory: [{ type: Date }], // Records login timestamps
    actionHistory: [{ type: String }], // Records actions performed by the teacher
    salary: { type: Number, required: true },
    bankDetails: {
      accountNumber: { type: String, default: null },
      bankName: { type: String, default: null },
      ifscCode: { type: String, default: null },
    },
    feedbackScore: { type: Number, default: null },

    // Tracks which admin registered this teacher
    registeredBy: {
      adminID: { type: String, required: true },
      name: { type: String, required: true },
    },

    assignedSubjects: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    ],
    assignedClasses: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Class" }, // Changed field name from `classes` to `assignedClasses` for clarity
    ],
  },
  { timestamps: true } // Includes createdAt and updatedAt timestamps
);

const Teacher =
  mongoose.models.Teacher || mongoose.model("Teacher", teacherSchema);

module.exports = Teacher;
