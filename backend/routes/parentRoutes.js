const express = require("express");
const router = express.Router();
const multer = require("multer");
const { body, validationResult } = require("express-validator");
const path = require("path");
const fs = require("fs");
const { parentLogin } = require("../controllers/parentController"); // Parent login controller
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
    }
    cb(null, uploadDir); // Store files in "uploads/Parent" folder
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

// Route for parent login
router.post(
  "/auth/login",
  [
    body("parentID").trim().notEmpty().withMessage("Parent ID is required"),
    body("password").trim().notEmpty().withMessage("Password is required"),
  ],
  handleValidationErrors, // Handle validation errors
  parentLogin // Delegate to parent login controller
);

//------------------------------------------------------------------------------------------------
// Route: Get parent profile using GET "/api/parent/auth/parentprofile"
router.get("/auth/parentprofile", verifyParentToken, async (req, res) => {
  try {
    const parentID = req.parent?.id; // Ensure `parent` object is available in the request
    if (!parentID) {
      return res.status(400).json({ message: "Parent ID is missing in token" });
    }

    // Validate parentID format (optional but recommended)
    if (!mongoose.Types.ObjectId.isValid(parentID)) {
      return res.status(400).json({ message: "Invalid parent ID format" });
    }

    // Fetch parent profile from the database using the parent ID
    const parent = await Parent.findById(parentID).lean();
    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }

    // Remove sensitive data (e.g., password) from the response
    const { password, ...parentData } = parent;

    // Return the parent profile data
    res.status(200).json({ parent: parentData });
  } catch (error) {
    console.error("Error fetching parent profile:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Export the router
module.exports = router;
