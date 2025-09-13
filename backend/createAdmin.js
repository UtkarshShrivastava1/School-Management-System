// createAdmin.js
require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("./models/AdminModel");

async function createDefaultAdmin() {
  console.log("Starting admin account creation...");

  const env = process.env.NODE_ENV || "development";
  console.log("Environment:", env);

  // Choose URI from env
  const mongoURI =
    env === "production"
      ? process.env.MONGO_ATLAS_URI
      : process.env.MONGO_LOCAL_URI ||
        "mongodb://localhost:27017/schoolManagementSystem";

  if (!mongoURI) {
    console.error(
      "❌ MongoDB URI not configured. Set MONGO_LOCAL_URI or MONGO_ATLAS_URI in .env"
    );
    process.exit(1);
  }

  console.log("MongoDB URI:", "Configured");

  try {
    await mongoose.connect(mongoURI); // Mongoose 8: no extra options needed
    console.log("✅ Connected to MongoDB");

    // Make sure indexes are ready (unique checks)
    await Admin.init();

    const DEFAULTS = {
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
      // IMPORTANT: give PLAIN password; model pre-save will hash it
      password: "admin@123",
      emergencyContact: {
        name: "Emergency Contact",
        relation: "Relative",
        phone: "9876543211",
      },
      experience: 5,
      highestQualification: "M.Tech",
      AADHARnumber: "123456789012",
      actionHistory: ["Account created"],
      registeredBy: {
        adminID: "SYSTEM",
        name: "System",
      },
    };

    // Check if admin exists by id or email
    const existing = await Admin.findOne({
      $or: [{ adminID: DEFAULTS.adminID }, { email: DEFAULTS.email }],
    }).lean();

    if (existing) {
      console.log("ℹ️ Admin already exists:");
      console.log("  Admin ID:", existing.adminID);
      console.log("  Email   :", existing.email);
      return;
    }

    const admin = new Admin(DEFAULTS);
    const saved = await admin.save();

    console.log("\n=== Admin Created Successfully ===");
    console.log("Admin ID :", saved.adminID);
    console.log("Email    :", saved.email);
    console.log("Password : admin@123  (change after first login)");
    console.log("==================================\n");
  } catch (err) {
    console.error("❌ Error creating admin:", err.message);
    if (err.name === "ValidationError") {
      console.error("Validation fields:", Object.keys(err.errors));
    }
  } finally {
    try {
      await mongoose.connection.close();
      console.log("🔌 MongoDB connection closed");
    } catch (closeErr) {
      console.error("Error closing MongoDB connection:", closeErr);
    }
    process.exit(0);
  }
}

createDefaultAdmin();
