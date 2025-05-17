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
const Parent = require("../models/ParentModel");
const bcrypt = require("bcryptjs");

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

// Set up multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/Parent/";
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

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpg|jpeg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      return cb(new Error("Only image files are allowed"));
    }
  },
});

// Middleware for handling Multer errors
const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

router.use(multerErrorHandler);

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

// Update parent profile - Fix for multipart boundary issue
router.put(
  "/parentprofile", 
  verifyParentToken,
  (req, res, next) => {
    console.log("Parent profile update request received");
    console.log("Content-Type:", req.headers['content-type']);
    
    // Check if the content type is multipart/form-data
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
      console.log("Processing as multipart form data");
      upload.single("photo")(req, res, (err) => {
        if (err) {
          console.error("Multer error:", err);
          return res.status(400).json({ message: err.message });
        }
        console.log("File upload processed successfully");
        next();
      });
    } else {
      // If not multipart, just continue
      console.log("Not multipart, continuing with regular processing");
      next();
    }
  },
  [
    body("parentID").notEmpty().withMessage("Parent ID is required"),
    body("parentEmail").optional().isEmail().withMessage("Invalid email format"),
    body("parentContactNumber").optional().isLength({ min: 10, max: 10 }).withMessage("Phone number must be 10 digits"),
    body("parentName").optional().trim().notEmpty().withMessage("Name cannot be empty"),
    body("parentAddress").optional().trim(),
    body("parentOccupation").optional().trim(),
    body("parentIncome").optional().isNumeric().withMessage("Income must be numeric"),
    body("parentEducation").optional().trim(),
    // Modified emergencyContact validation to handle both string and object
    body("emergencyContact").optional().custom((value, { req }) => {
      // If it's a string, try to parse it as JSON
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (typeof parsed === 'object' && parsed !== null) {
            return true;
          }
        } catch (e) {
          throw new Error('Emergency contact must be a valid JSON object');
        }
      } 
      // If it's already an object, it's valid
      else if (typeof value === 'object' && value !== null) {
        return true;
      }
      throw new Error('Emergency contact must be an object');
    }),
    body("emergencyContact.name").optional().notEmpty().withMessage("Emergency contact name cannot be empty"),
    body("emergencyContact.relation").optional().notEmpty().withMessage("Emergency contact relation cannot be empty"),
    body("emergencyContact.phone").optional().isLength({ min: 10, max: 10 }).withMessage("Emergency contact phone must be 10 digits"),
  ], 
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error("Validation errors:", errors.array());
      return res.status(400).json({
        message: "Validation error",
        errors: errors.array(),
      });
    }
    console.log("Validation passed, proceeding to update profile");
    next();
  },
  async (req, res) => {
    try {
      const { parentID } = req.body;
      if (!parentID) {
        return res.status(400).json({ message: "Parent ID is required" });
      }

      console.log("Looking for parent with ID:", parentID);
      const parent = await Parent.findOne({ parentID });
      if (!parent) {
        console.log("Parent not found with ID:", parentID);
        return res.status(404).json({ message: "Parent not found" });
      }
      
      console.log("Parent found:", parent.parentID);

      const {
        parentEmail,
        parentContactNumber,
        parentName,
        parentAddress,
        parentOccupation,
        parentIncome,
        parentEducation,
        emergencyContact,
      } = req.body;
      const photo = req.file ? req.file.filename : null;
      console.log("Photo received:", photo);

      // Update fields if provided
      if (parentEmail) parent.parentEmail = parentEmail;
      if (parentContactNumber) parent.parentContactNumber = parentContactNumber;
      if (parentName) parent.parentName = parentName;
      if (parentAddress) parent.parentAddress = parentAddress;
      if (parentOccupation) parent.parentOccupation = parentOccupation;
      if (parentIncome) parent.parentIncome = parentIncome;
      if (parentEducation) parent.parentEducation = parentEducation;
      if (emergencyContact) {
        try {
          // If emergencyContact is a string (JSON), parse it
          const contactData = typeof emergencyContact === 'string' 
            ? JSON.parse(emergencyContact) 
            : emergencyContact;
            
          parent.emergencyContact = {
            name: contactData.name || parent.emergencyContact?.name || "",
            relation: contactData.relation || parent.emergencyContact?.relation || "",
            phone: contactData.phone || parent.emergencyContact?.phone || "",
          };
        } catch (err) {
          console.error("Error processing emergencyContact:", err);
        }
      }
      if (photo) parent.photo = photo;

      // Add to action history
      if (!parent.actionHistory) {
        parent.actionHistory = [];
      }
      parent.actionHistory.push("Profile updated");

      console.log("Saving updated parent data...");
      await parent.save();
      console.log("Parent data saved successfully");

      // Remove sensitive data
      const { parentPassword, ...parentData } = parent.toObject();

      // Fetch the updated parent data with populated children
      const updatedParent = await Parent.findOne({ parentID })
        .populate({
          path: 'children.student',
          select: 'studentName studentID studentEmail studentPhone studentGender studentDOB photo',
          model: 'Student'
        })
        .select('-parentPassword');

      // Send the populated parent data in the response
      res.json({
        message: "Profile updated successfully",
        parent: updatedParent
      });
    } catch (error) {
      console.error("Error updating parent profile:", error);
      res.status(500).json({ 
        message: "Server error",
        error: error.message 
      });
    }
  }
);

// Change parent password
router.put("/changeparentpassword", verifyParentToken, [
  body("parentID").notEmpty().withMessage("Parent ID is required"),
  body("currentPassword").trim().notEmpty().withMessage("Current password is required"),
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
], handleValidationErrors, async (req, res) => {
  try {
    const { parentID, currentPassword, newPassword } = req.body;
    
    if (!parentID) {
      return res.status(400).json({ message: "Parent ID is required" });
    }

    // Find parent by parentID, not by _id
    const parent = await Parent.findOne({ parentID });
    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }

    // Check if the password field exists
    if (!parent.parentPassword) {
      return res.status(500).json({ message: "Password not set for this account" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, parent.parentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    parent.parentPassword = await bcrypt.hash(newPassword, salt);

    // Add to action history
    if (!parent.actionHistory) {
      parent.actionHistory = [];
    }
    parent.actionHistory.push("Password changed on " + new Date().toISOString());

    await parent.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
});

module.exports = router;
