// routes/adminAuth.js
const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const path = require("path");
const Admin = require("../models/AdminModel"); // Ensure this import is correct
// Import verifyAdminToken middleware
const { verifyAdminToken } = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");
// Import controller functions
const { createAdmin, loginAdmin } = require("../controllers/adminController");

// Set up multer for file storage (handling file uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/Admin/";
    const fs = require("fs");

    // Ensure the 'uploads' directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir); // Store files in "uploads" folder
  },
  filename: (req, file, cb) => {
    // Generate a unique filename based on current timestamp
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// Configure multer to handle file type validation
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpg|jpeg|png|gif/; // Allowed file types
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    // Only allow images with specific file extensions and MIME types
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      return cb(new Error("Only image files are allowed"));
    }
  },
});

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation error",
      errors: errors.array(),
    });
  }
  next();
};
//------------------------------------------------------------------------------------------------
// Route: Create an admin using POST "/api/admin/auth/createadmin"
router.post(
  "/createadmin",
  upload.single("photo"), // Handle file upload for admin's photo
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("phone")
      .isLength({ min: 10, max: 10 })
      .withMessage("Phone must be 10 digits"),
    body("designation").notEmpty().withMessage("Designation is required"),
    body("address").notEmpty().withMessage("Address is required"),
    body("dob").notEmpty().withMessage("Date of Birth is required"),
    body("gender").notEmpty().withMessage("Gender is required"),
    body("department").notEmpty().withMessage("Department is required"),
  ],
  handleValidationErrors, // Handle validation errors
  createAdmin // Call the controller function for admin creation
);
//------------------------------------------------------------------------------------------------
// Route: Admin login using POST "/api/admin/auth/login"
router.post(
  "/login",
  [
    body("adminID").trim().notEmpty().withMessage("Admin ID is required"),
    body("password").trim().notEmpty().withMessage("Password is required"),
  ],
  handleValidationErrors, // Handle validation errors
  loginAdmin // Delegate to login controller
);

// Route: Validate the admin token (verify token in request header)
router.post("/validate", verifyAdminToken, async (req, res) => {
  try {
    const user = req.admin; // The admin info attached to the request
    if (user) {
      // Return user details from the decoded token
      res.status(200).json({ name: user.name });
    } else {
      res.status(401).json({ error: "Invalid token" });
    }
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});
//------------------------------------------------------------------------------------------------
// Route: Get admin profile using GET "/api/admin/auth/adminprofile"
router.get("/adminprofile", verifyAdminToken, async (req, res) => {
  try {
    const adminID = req.admin?.id; // Ensure `admin` object is available in the request
    if (!adminID) {
      return res.status(400).json({ message: "Admin ID is missing in token" });
    }

    // Fetch admin profile from the database using the admin ID
    const admin = await Admin.findById(adminID);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Return the admin profile data
    res.status(200).json({ admin });
    console.log(admin);
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    res.status(500).json({ error: "Server error" });
  }
});

//------------------------------------------------------------------------------------------------
// Route: Update admin info using PUT "/api/admin/auth/updateadmininfo"
router.put(
  "/updateadmininfo",
  verifyAdminToken, // Middleware to verify admin token
  upload.single("photo"), // Middleware to handle photo upload
  [
    body("adminID").notEmpty().withMessage("Admin ID is required"),
    body("email").optional().isEmail().withMessage("Invalid email format"),
    body("phone")
      .optional()
      .isLength({ min: 10, max: 10 })
      .withMessage("Phone number must be 10 digits"),
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Name cannot be empty"),
    body("designation").optional().trim(),
    body("department").optional().trim(),
    body("address").optional().trim(),
  ],
  handleValidationErrors, // Middleware to handle validation errors
  async (req, res) => {
    try {
      const { adminID, email, phone, name, designation, department, address } =
        req.body;
      const photo = req.file ? req.file.filename : null; // Handle uploaded photo

      // Fetch the admin document using adminID
      const admin = await Admin.findOne({ adminID });
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      // Update the fields if provided
      if (email) admin.email = email;
      if (phone) admin.phone = phone;
      if (name) admin.name = name;
      if (designation) admin.designation = designation;
      if (department) admin.department = department;
      if (address) admin.address = address;
      if (photo) admin.photo = photo; // Update photo if provided

      // Save the updated admin document
      const updatedAdmin = await admin.save();

      // Respond with the updated admin data
      res.status(200).json({
        message: "Admin information updated successfully",
        admin: updatedAdmin,
      });
    } catch (error) {
      console.error("Error updating admin info:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);
//----------------------------------------------------------------
// Route: Update/change admin password using PUT "/api/admin/auth/changeadminpassword"
router.put(
  "/changeadminpassword",
  verifyAdminToken,
  [
    body("adminID").notEmpty().withMessage("Admin ID is required"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/\d/)
      .withMessage("Password must contain at least one number")
      .matches(/[!@#$%^&*]/)
      .withMessage("Password must contain at least one special character"),
    body("confirmNewPassword")
      .custom((value, { req }) => value === req.body.newPassword)
      .withMessage("Passwords do not match"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      console.log("Request received:", req.body); // Log incoming request body

      const { adminID, newPassword } = req.body;

      // Fetch the admin document using adminID
      console.log("Fetching admin from DB with adminID:", adminID);
      const admin = await Admin.findOne({ adminID });
      if (!admin) {
        console.log("Admin not found for adminID:", adminID); // Log if admin is not found
        return res.status(404).json({ message: "Admin not found" });
      }

      console.log("Admin found:", admin); // Log the admin document

      // Hash the new password and update it
      console.log("Generating salt for password hashing...");
      const salt = await bcrypt.genSalt(10);
      console.log("Salt generated:", salt);

      console.log("Hashing new password...");
      admin.password = await bcrypt.hash(newPassword, salt);

      console.log("Saving updated admin document...");
      await admin.save();

      // Respond with a success message
      console.log("Password updated successfully for adminID:", adminID);
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error); // Log the error details
      res.status(500).json({ error: "An unexpected error occurred" });
    }
  }
);

module.exports = router;
