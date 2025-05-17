const mongoose = require("mongoose");

const parentSchema = new mongoose.Schema(
  {
    parentName: { type: String, required: true },
    parentContactNumber: { type: String, required: true },
    parentEmail: { type: String, required: true, unique: false },
    parentID: {
      type: String,
      required: true,
      unique: true,
      match: /^PRNT\d{5}$/, // Parent ID format (e.g., PRNT12345)
    },
    parentPassword: { type: String, required: true }, // Hashed password for security
    // Additional fields for profile
    address: { type: String, default: "" },
    occupation: { type: String, default: "" },
    relationship: { type: String, default: "Parent" },
    photo: { type: String, default: "" },
    children: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" }, // Reference to the Student
        relationship: {
          type: String,
          required: true,
        },
      },
    ], // Array of references to Student with relationship type
    photo: { type: String }, // Path to profile photo
    parentAddress: { type: String },
    parentOccupation: { type: String },
    parentIncome: { type: Number },
    parentEducation: { type: String },
    emergencyContact: {
      name: { type: String },
      relation: { type: String },
      phone: { type: String }
    },
    actionHistory: [{ type: String }], // Array to track user actions
    lastLogin: { type: Date },
    loginHistory: [{ type: Date }],
  },
  { timestamps: true }
);

const Parent = mongoose.models.Parent || mongoose.model("Parent", parentSchema);

module.exports = Parent;
