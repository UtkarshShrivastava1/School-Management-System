//controllers/adminControllers.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const Admin = require("../models/AdminModel"); // Correct the casing of the file name
const generateToken = require("../config/generateToken"); // Assuming you have a helper for JWT token generation

// Function to generate a unique adminID
const generateAdminID = async () => {
  let newID;
  let existingAdmin;
  do {
    newID = `ADM${Math.floor(Math.random() * 10000)}`;
    existingAdmin = await Admin.findOne({ adminID: newID });
  } while (existingAdmin);
  return newID;
};

//-----------------------------------------------------------------------------------------------
// Public API functions
// Controller for creating a new admin
exports.createAdmin = async (req, res, next) => {
  const {
    name,
    email,
    phone,
    designation,
    address,
    dob,
    gender,
    department,
    role,
  } = req.body;
  const photo = req.file ? req.file.filename : null;

  // Validate if required fields are present
  if (!name || !email || !phone) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Check if an admin already exists with the same email
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ message: "Admin with this email already exists" });
    }

    // Generate a unique adminID
    const adminID = await generateAdminID();

    // Set a default password and hash it
    const defaultPassword = "admin123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Create the new admin record
    const newAdmin = await Admin.create({
      name,
      email,
      phone,
      designation,
      address,
      dob,
      gender,
      department,
      role: role || "admin", // Default to 'admin' if no role provided
      adminID,
      password: hashedPassword,
      photo,
    });

    // Generate a JWT token for the newly created admin
    const token = generateToken(newAdmin._id);

    // Send the response back with the created admin's details
    res.status(201).json({
      message: "Admin created successfully",
      token,
      data: {
        adminID: newAdmin.adminID,
        name: newAdmin.name,
        email: newAdmin.email,
        phone: newAdmin.phone,
        role: newAdmin.role,
        department: newAdmin.department,
        designation: newAdmin.designation,
        dob: newAdmin.dob,
        photo: newAdmin.photo,
        createdAt: newAdmin.createdAt,
        gender: newAdmin.gender,
        defaultPassword, // Include the default password
        token, // Include the token in the response
      },
    });
  } catch (error) {
    next(error); // Use a global error handler middleware
  }
};

//-----------------------------------------------------------------------------------------------

// Controller for logging in an admin
exports.loginAdmin = async (req, res) => {
  const { adminID, password } = req.body;

  try {
    // Find the admin by adminID
    const admin = await Admin.findOne({ adminID });
    if (!admin) {
      return res.status(400).json({ message: "Admin not found" });
    }

    // Compare the password with the stored hashed password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Generate a JWT token using the admin._id
    const token = generateToken(admin._id); // Use admin._id for the token

    // Log the generated token (for debugging purposes)
    console.log("Generated JWT Token:", token);

    // Respond with success, including the token and all the admin data
    res.status(200).json({
      message: "Login successful",
      token,
      data: {
        adminID: admin.adminID,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        designation: admin.designation,
        department: admin.department,
        address: admin.address,
        photo: admin.photo,
        dob: admin.dob,
        gender: admin.gender,
        role: admin.role, // Include the role in the response
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

//-----------------------------------------------------------------------------------------------
