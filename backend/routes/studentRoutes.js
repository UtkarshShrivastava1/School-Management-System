const express = require("express");
const router = express.Router();
const multer = require("multer");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const path = require("path");

const mongoose = require("mongoose"); // Ensure mongoose is imported
const fs = require("fs");
const {
  studentLogin,
  getStudentProfile,
} = require("../controllers/studentController");
const { verifyStudentToken } = require("../middleware/authMiddleware");
const Student = require("../models/StudentModel"); // Importing student model

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

// Set up multer for file storage (handling file uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/Student/";

    // Ensure the 'uploads' directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir); // Store files in "uploads/Student" folder
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

// Middleware for handling Multer errors
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

// Route for student login
router.post(
  "/login",
  [
    body("studentID").trim().notEmpty().withMessage("Student ID is required"),
    body("password").trim().notEmpty().withMessage("Password is required"),
  ],
  handleValidationErrors, // Handle validation errors
  studentLogin // Delegate to login controller
);

//------------------------------------------------------------------------------------------------
// Route: Get student profile using GET "/api/student/auth/studentprofile"
//------------------------------------------------------------------------------------------------
router.get("/studentprofile", verifyStudentToken, async (req, res) => {
  try {
    const studentID = req.student?.id; // Ensure `student` object is available in the request
    if (!studentID) {
      return res
        .status(400)
        .json({ message: "Student ID is missing in token" });
    }

    // Validate studentID format (optional but recommended)
    if (!mongoose.Types.ObjectId.isValid(studentID)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    // Fetch student profile from the database using the student ID
    const student = await Student.findById(studentID).lean();
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Remove sensitive data (e.g., password) from the response
    const { password, ...studentData } = student;

    // Return the student profile data
    res.status(200).json({ student: studentData });
  } catch (error) {
    console.error("Error fetching student profile:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

//------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------

// Export the router
module.exports = router;
