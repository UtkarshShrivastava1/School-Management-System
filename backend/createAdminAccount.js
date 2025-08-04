console.log("Starting admin account creation script...");
console.log("Current directory:", __dirname);
console.log(
  "Environment variables:",
  process.env.MONGO_ATLAS_URI ? "MongoDB URI is set" : "MongoDB URI is NOT set"
);

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/AdminModel");

// Connect to MongoDB
console.log("Connecting to MongoDB...");
mongoose
  .connect(
    process.env.MONGO_ATLAS_URI ||
      "mongodb://localhost:27017/schoolManagementSystem"
  )
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

async function createAdminAccount() {
  try {
    console.log("Checking if admin account exists...");
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ adminID: "ADM1234" });

    if (existingAdmin) {
      console.log("\n===== ADMIN ACCOUNT ALREADY EXISTS =====");
      console.log("Admin account already exists with ID: ADM1234");
      console.log("Admin Details:");
      console.log("Name:", existingAdmin.name);
      console.log("Email:", existingAdmin.email);
      console.log("AdminID:", existingAdmin.adminID);
      console.log("Password: admin@123 (default)");
      console.log("=======================================\n");
      mongoose.connection.close();
      return;
    }

    console.log("Creating new admin account...");
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin@123", salt);

    // Create admin document
    const admin = new Admin({
      name: "Admin User",
      email: "admin@school.com",
      phone: "9876543210",
      designation: "System Administrator",
      address: "123 School Street, City",
      dob: new Date("1990-01-01"),
      gender: "Male",
      religion: "Hindu",
      category: "General",
      bloodgroup: "O+",
      department: "Administration",
      role: "admin",
      adminID: "ADM1234",
      password: hashedPassword,
      photo: "", // No photo initially
      emergencyContact: {
        name: "Emergency Contact",
        relation: "Relative",
        phone: "9876543211",
      },
      experience: 5,
      highestQualification: "M.Tech",
      AADHARnumber: "123456789012",
      lastLogin: new Date(),
      loginHistory: [new Date()],
      actionHistory: ["Account created"],
      salary: 75000,
      bankDetails: {
        accountNumber: "1234567890",
        bankName: "State Bank of India",
        ifscCode: "SBIN0001234",
      },
      feedbackScore: 5,
      registeredBy: {
        adminID: "SYSTEM",
        name: "System",
      },
    });

    console.log("Saving admin to database...");
    const savedAdmin = await admin.save();

    console.log("\n===== ADMIN ACCOUNT CREATED SUCCESSFULLY =====");
    console.log("Admin Details:");
    console.log("ID:", savedAdmin.adminID);
    console.log("Email:", savedAdmin.email);
    console.log("Password: admin@123");
    console.log("MongoDB ID:", savedAdmin._id);
    console.log("=======================================\n");

    mongoose.connection.close();
    console.log("MongoDB connection closed");
  } catch (error) {
    console.error("Error creating admin account:", error);
    mongoose.connection.close();
    process.exit(1);
  }
}

createAdminAccount();
