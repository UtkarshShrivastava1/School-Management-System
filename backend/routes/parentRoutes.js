const express = require("express");
const router = express.Router();
const multer = require("multer");
const { body, validationResult } = require("express-validator");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const { 
  parentLogin, 
  getParentProfile, 
  updateParentInfo,
  changeParentPassword 
} = require("../controllers/parentController"); // Import all controller functions
const Parent = require("../models/ParentModel"); // Importing Parent model
const { verifyParentToken } = require("../middleware/authMiddleware");
const mongoose = require("mongoose"); // Ensure mongoose is imported

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
    const uploadDir = "uploads/Parent/";

    // Ensure the 'uploads' directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`Created parent upload directory: ${uploadDir}`);
    }
    
    console.log(`Saving parent photo to: ${uploadDir}`);
    cb(null, uploadDir); // Store files in "uploads/Parent" folder
  },
  filename: (req, file, cb) => {
    // Generate a unique filename based on current timestamp
    const filename = Date.now() + path.extname(file.originalname);
    console.log(`Generated parent photo filename: ${filename}`);
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

// Route for parent login
router.post(
  "/login",
  [
    body("parentID").trim().notEmpty().withMessage("Parent ID is required"),
    body("password").trim().notEmpty().withMessage("Password is required"),
  ],
  handleValidationErrors, // Handle validation errors
  parentLogin // Delegate to parent login controller
);

//------------------------------------------------------------------------------------------------
// Route: Get parent profile using GET "/api/parent/auth/parentprofile"
router.get(
  "/parentprofile", 
  verifyParentToken, 
  getParentProfile
);

//------------------------------------------------------------------------------------------------
// Route: Update parent info using PUT "/api/parent/auth/updateparentinfo"
//------------------------------------------------------------------------------------------------
router.put(
  "/updateparentinfo",
  verifyParentToken, // Middleware to verify parent token
  upload.single("photo"), // Middleware to handle photo upload
  [
    body("parentID").notEmpty().withMessage("Parent ID is required"),
    body("parentEmail").optional().isEmail().withMessage("Invalid email format"),
    body("parentContactNumber")
      .optional()
      .isLength({ min: 10, max: 10 })
      .withMessage("Phone number must be 10 digits"),
    body("parentName")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Name cannot be empty"),
    body("occupation").optional().trim(),
    body("relationship").optional().trim(),
    body("address").optional().trim(),
  ],
  handleValidationErrors, // Middleware to handle validation errors
  updateParentInfo
);

//------------------------------------------------------------------------------------------------
// Route: Update/change parent password using PUT "/api/parent/auth/changeparentpassword"
//------------------------------------------------------------------------------------------------
router.put(
  "/changeparentpassword",
  verifyParentToken,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/\d/)
      .withMessage("Password must contain at least one number")
      .matches(/[!@#$%^&*]/)
      .withMessage("Password must contain at least one special character"),
  ],
  handleValidationErrors,
  changeParentPassword
);

// Export the router
module.exports = router;
