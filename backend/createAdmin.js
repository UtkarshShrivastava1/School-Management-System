require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/AdminModel");

async function createDefaultAdmin() {
  try {
    console.log("Starting admin account creation...");

    const env = process.env.NODE_ENV || "development";
    console.log("Environment:", env);

    // Select the appropriate MongoDB URI based on environment
    let mongoURI = "";

    if (env === "production") {
      mongoURI = process.env.MONGO_ATLAS_URI;
    } else {
      mongoURI =
        process.env.MONGO_LOCAL_URI ||
        "mongodb://localhost:27017/schoolManagementSystem";
    }

    console.log("MongoDB URI:", mongoURI ? "Configured" : "Not Configured");

    // Connect to MongoDB with options
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Check for existing admin
    const adminExists = await Admin.findOne({ adminID: "ADM1234" });
    if (adminExists) {
      console.log("Admin already exists with ID:", adminExists.adminID);
      console.log("Email:", adminExists.email);
      return;
    }

    // Create new admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin@123", salt);

    const newAdmin = new Admin({
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
    });

    const savedAdmin = await newAdmin.save();
    console.log("\n=== Admin Created Successfully ===");
    console.log("Admin ID:", savedAdmin.adminID);
    console.log("Email:", savedAdmin.email);
    console.log("Password: admin@123");
    console.log("================================\n");
  } catch (error) {
    console.error("Error creating admin:", error.message);
    if (error.name === "ValidationError") {
      console.error("Validation Errors:", Object.keys(error.errors));
    }
  } finally {
    try {
      await mongoose.connection.close();
      console.log("MongoDB connection closed");
    } catch (err) {
      console.error("Error closing MongoDB connection:", err);
    }
    process.exit(0);
  }
}

// Execute the function
createDefaultAdmin();
