const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true, // Ensures email is stored in lowercase
      trim: true, // Removes leading and trailing spaces
      match: [/\S+@\S+\.\S+/, "Please use a valid email address"], // Regular expression for email validation
    },
    phone: {
      type: String,
      required: true,
      match: [/^\d{10}$/, "Phone number must be 10 digits"], // Regex to validate phone number length
    },
    designation: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    dob: {
      type: Date, // Date type is more appropriate for Date of Birth
      required: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Other"], // You can define possible values for gender
    },
    department: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin"], // You can add more roles like 'teacher', 'student', etc.
      default: "admin",
    },
    adminID: {
      type: String,
      required: true,
      unique: true,
      match: /^ADM\d{4}$/, // Ensures the format is "ADM" followed by 4 digits
    },
    password: {
      type: String,
      required: true,
    },
    photo: {
      type: String,
      required: false, // If the photo is optional, set it to false
    },
  },
  { timestamps: true } // This will add createdAt and updatedAt automatically
);

// Avoid model redefinition if it already exists
const Admin = mongoose.models.Admin || mongoose.model("Admin", AdminSchema);

module.exports = Admin;
