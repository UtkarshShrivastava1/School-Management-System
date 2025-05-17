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
  updateStudentInfo
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
      console.log(`Created upload directory: ${uploadDir}`);
    }
    
    console.log(`Saving student photo to: ${uploadDir}`);
    cb(null, uploadDir); // Store files in "uploads/Student" folder
  },
  filename: (req, file, cb) => {
    // Generate a unique filename based on current timestamp
    const filename = Date.now() + path.extname(file.originalname);
    console.log(`Generated student photo filename: ${filename}`);
    cb(null, filename);
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
router.get("/studentprofile", verifyStudentToken, getStudentProfile);

//------------------------------------------------------------------------------------------------
// Route: Update student info using PUT "/api/student/auth/updatestudentinfo"
//------------------------------------------------------------------------------------------------
router.put(
  "/updatestudentinfo",
  verifyStudentToken, // Middleware to verify student token
  upload.single("photo"), // Middleware to handle photo upload
  [
    body("studentID").notEmpty().withMessage("Student ID is required"),
    body("studentEmail").optional().isEmail().withMessage("Invalid email format"),
    body("studentPhone")
      .optional()
      .isLength({ min: 10, max: 10 })
      .withMessage("Phone number must be 10 digits"),
    body("studentName")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Name cannot be empty"),
    body("studentAddress").optional().trim(),
  ],
  handleValidationErrors, // Middleware to handle validation errors
  updateStudentInfo
);

//------------------------------------------------------------------------------------------------
// Route: Update/change student password using PUT "/api/student/auth/changestudentpassword"
//------------------------------------------------------------------------------------------------
router.put(
  "/changestudentpassword",
  verifyStudentToken,
  [
    body("studentID").notEmpty().withMessage("Student ID is required"),
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
      console.log("Password change request received:", { 
        studentID: req.body.studentID,
        passwordLength: req.body.newPassword?.length,
        confirmMatch: req.body.newPassword === req.body.confirmNewPassword
      });

      const { studentID, newPassword } = req.body;

      // Fetch the student document using studentID
      console.log("Fetching student from DB with studentID:", studentID);
      const student = await Student.findOne({ studentID });
      if (!student) {
        console.log("Student not found for studentID:", studentID); // Log if student is not found
        return res.status(404).json({ message: "Student not found" });
      }

      console.log("Student found:", { 
        id: student._id, 
        studentID: student.studentID,
        name: student.studentName
      });

      // Hash the new password and update it
      console.log("Generating salt for password hashing...");
      const salt = await bcrypt.genSalt(10);
      console.log("Salt generated");

      console.log("Hashing new password...");
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      console.log("Password hashed successfully");
      
      // Update password in the database - IMPORTANT: using studentPassword field
      student.studentPassword = hashedPassword;

      console.log("Saving updated student document...");
      await student.save();

      // Validate the password was saved correctly by checking if it can be verified
      const verifyPasswordUpdate = await bcrypt.compare(newPassword, student.studentPassword);
      console.log("Password verification check:", verifyPasswordUpdate ? "Success" : "Failed");

      if (!verifyPasswordUpdate) {
        return res.status(500).json({ message: "Password update failed verification" });
      }

      // Respond with a success message
      console.log("Password updated successfully for studentID:", studentID);
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error); // Log the error details
      res.status(500).json({ error: "An unexpected error occurred" });
    }
  }
);

//------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------

// Export the router
module.exports = router;
