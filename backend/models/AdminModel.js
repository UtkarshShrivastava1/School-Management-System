const mongoose = require("mongoose");
//admin model
const AdminSchema = new mongoose.Schema(
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
      match: [/^\d{10}$/, "Phone number must be 10 digits"],
    },
    designation: { type: String, required: true },
    address: { type: String, required: true },
    dob: { type: Date, required: true },
    gender: { type: String, required: true, enum: ["Male", "Female", "Other"] },
    religion: { type: String, required: false },
    category: { type: String, required: false },
    bloodgroup: { type: String, required: false },
    department: { type: String, required: true },
    role: { type: String, enum: ["admin"], default: "admin" },
    adminID: {
      type: String,
      required: true,
      unique: true,
      match: /^ADM\d{4}$/,
    },
    password: { type: String, required: true },
    photo: { type: String },
    emergencyContact: {
      name: String,
      relation: String,
      phone: {
        type: String,
        match: [/^\d{10}$/, "Phone number must be 10 digits"],
      },
    },
    experience: { type: Number },
    highestQualification: { type: String },
    AADHARnumber: { type: String },
    lastLogin: { type: Date },
    loginHistory: [{ type: Date }],
    actionHistory: [{ type: String }], // e.g., "Created Student"
    salary: { type: Number },
    bankDetails: {
      accountNumber: String,
      bankName: String,
      ifscCode: String,
    },
    feedbackScore: { type: Number },

    // New field to track who created this admin
    registeredBy: {
      adminID: { type: String, required: true },
      name: { type: String, required: true },
    },
  },
  { timestamps: true }
);

// Export the model
const Admin = mongoose.models.Admin || mongoose.model("Admin", AdminSchema);
module.exports = Admin;

// Additional fields for tracking admin activities
