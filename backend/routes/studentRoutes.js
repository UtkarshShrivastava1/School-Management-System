const express = require("express");
const router = express.Router();
const multer = require("multer");
const { body, validationResult } = require("express-validator");
const path = require("path");
const fs = require("fs");
const {
  createStudent,
  studentLogin,
  getAllStudents,
  assignStudentToClass,
  searchStudents,
  getStudentProfile,
  updateStudentProfile,
  changeStudentPassword
} = require("../controllers/studentController");
const { verifyStudentToken } = require("../middleware/authMiddleware");
const Student = require("../models/StudentModel");
const bcrypt = require("bcrypt");

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
    const uploadDir = "uploads/Student/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
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

// Route for student login
router.post(
  "/auth/login",
  [
    body("studentID").trim().notEmpty().withMessage("Student ID is required"),
    body("password").trim().notEmpty().withMessage("Password is required"),
  ],
  handleValidationErrors,
  studentLogin
);

// Get student profile
router.get(
  "/auth/studentprofile",
  verifyStudentToken,
  getStudentProfile
);

// Update student profile - Fix for multipart boundary issue
router.put(
  "/auth/studentprofile", 
  verifyStudentToken,
  (req, res, next) => {
    console.log("Student profile update request received");
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
    body("studentID").notEmpty().withMessage("Student ID is required"),
    body("studentEmail").optional().isEmail().withMessage("Invalid email format"),
    body("studentPhone").optional().isLength({ min: 10, max: 10 }).withMessage("Phone number must be 10 digits"),
    body("studentName").optional().trim().notEmpty().withMessage("Name cannot be empty"),
    body("studentAddress").optional().trim(),
    body("studentDOB").optional().isISO8601().toDate().withMessage("Invalid DOB"),
    body("studentGender").optional().isIn(['Male', 'Female', 'Other']).withMessage("Gender must be Male, Female, or Other"),
    body("religion").optional().isString().withMessage("Religion must be a string"),
    body("category").optional().isString().withMessage("Category must be a string"),
    body("bloodgroup").optional().isString().withMessage("Blood group must be a string"),
    body("studentFatherName").optional().trim(),
    body("studentMotherName").optional().trim(),
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
  updateStudentProfile
);

// Change student password
router.put("/auth/changestudentpassword", verifyStudentToken, [
  body("studentID").notEmpty().withMessage("Student ID is required"),
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
], handleValidationErrors, changeStudentPassword);

// Admin routes
router.post("/", createStudent);
router.get("/", getAllStudents);
router.put("/:id/assign-class", assignStudentToClass);
router.get("/search", searchStudents);

module.exports = router;
