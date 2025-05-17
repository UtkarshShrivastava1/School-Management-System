const express = require("express");
const router = express.Router();
const multer = require("multer");
const { body } = require("express-validator");
const {
  teacherLogin,
  getAssignedClasses,
} = require("../controllers/teacherController");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const { verifyTeacherToken } = require("../middleware/authMiddleware");
const mongoose = require("mongoose"); // Ensure mongoose is imported

const Teacher = require("../models/TeacherModel"); // Importing Teacher model
const path = require("path");
const fs = require("fs");
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
const teacherStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/Teacher/";

    try {
      // Ensure the 'uploads/Teacher' directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true }); // Create the directory recursively
      }
      cb(null, uploadDir); // Store files in the "uploads/Teacher" folder
    } catch (err) {
      cb(new Error("Could not create upload directory"));
    }
  },
  filename: (req, file, cb) => {
    // Generate a unique filename based on current timestamp
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, uniqueSuffix);
  },
});

// Configure multer to handle file type validation
const upload = multer({
  storage: teacherStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpg|jpeg|png|gif/; // Allowed file types
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    // Only allow images with specific file extensions and MIME types
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024, // Optional: Set a file size limit (e.g., 2 MB)
  },
});
// Route for teacher login
router.post(
  "/login",
  [
    body("teacherID").trim().notEmpty().withMessage("Teacher ID is required"),
    body("password").trim().notEmpty().withMessage("Password is required"),
  ],
  handleValidationErrors, // Handle validation errors
  teacherLogin // Delegate to login controller
);
//================================================================================================
// Route: Validate the admin token (verify token in request header)
router.post("/validate", verifyTeacherToken, async (req, res) => {
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
//================================================================================================
//------------------------------------------------------------------------------------------------
// Route: Get teacher profile using GET "/api/teacher/auth/teacherprofile"
router.get("/teacherprofile", verifyTeacherToken, async (req, res) => {
  try {
    // Get teacherID from middleware, first try _id then id
    const teacherID = req.teacher?._id || req.teacher?.id;

    if (!teacherID) {
      console.error("Teacher ID missing in token:", req.teacher);
      return res
        .status(400)
        .json({ message: "Teacher ID is missing in token" });
    }

    console.log("Fetching teacher profile with ID:", teacherID);

    // Validate teacherID format
    if (!mongoose.Types.ObjectId.isValid(teacherID)) {
      return res.status(400).json({ message: "Invalid teacher ID format" });
    }

    // Fetch teacher profile
    const teacher = await Teacher.findById(teacherID).lean();
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Remove sensitive data (e.g., password)
    const { password, ...teacherData } = teacher;

    console.log("Teacher data retrieved:", {
      teacherID: teacherData.teacherID,
      name: teacherData.name
    });

    res.status(200).json({ teacher: teacherData });
  } catch (error) {
    console.error("Error fetching teacher profile:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

//------------------------------------------------------------------------------------------------
// Route: Update teacher info using PUT "/api/teacher/auth/updateteacherinfo"
router.put(
  "/updateteacherinfo",
  verifyTeacherToken, // Middleware to verify teacher token
  upload.single("photo"), // Middleware to handle photo upload
  [
    body("teacherID").notEmpty().withMessage("Teacher ID is required"),
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
    body("experience").optional().isNumeric().withMessage("Experience must be a number"),
  ],
  handleValidationErrors, // Middleware to handle validation errors
  async (req, res) => {
    try {
      const {
        teacherID,
        email,
        phone,
        name,
        designation,
        department,
        address,
        experience,
        subjects,
      } = req.body;
      
      console.log("Update request received for teacher:", { 
        teacherID, 
        name, 
        email,
        phone,
        experience,
        hasPhoto: !!req.file
      });
      
      const photo = req.file ? req.file.filename : null; // Handle uploaded photo

      // First try to find by req.body.teacherID
      let teacher = await Teacher.findOne({ teacherID });
      
      // If not found, try to find by ID from token
      if (!teacher && req.teacher) {
        const tokenID = req.teacher._id || req.teacher.id;
        if (tokenID) {
          console.log("Teacher not found by teacherID, trying token ID:", tokenID);
          teacher = await Teacher.findById(tokenID);
        }
      }
      
      if (!teacher) {
        console.error("Teacher not found for ID:", teacherID);
        return res.status(404).json({ message: "Teacher not found" });
      }

      console.log("Teacher found:", { 
        id: teacher._id, 
        teacherID: teacher.teacherID, 
        name: teacher.name 
      });

      // Update the fields if provided
      if (email) teacher.email = email;
      if (phone) teacher.phone = phone;
      if (name) teacher.name = name;
      if (designation) teacher.designation = designation;
      if (department) teacher.department = department;
      if (address) teacher.address = address;
      if (experience !== undefined) teacher.experience = experience;
      if (subjects) teacher.subjects = subjects;
      if (photo) teacher.photo = photo; // Update photo if provided

      // Save the updated teacher document
      const updatedTeacher = await teacher.save();
      console.log("Teacher updated successfully:", { 
        id: updatedTeacher._id, 
        teacherID: updatedTeacher.teacherID,
        updatedFields: {
          email: !!email,
          phone: !!phone,
          name: !!name,
          designation: !!designation,
          department: !!department,
          address: !!address,
          experience: experience !== undefined,
          subjects: !!subjects,
          photo: !!photo
        }
      });

      // Respond with the updated teacher data
      res.status(200).json({
        message: "Teacher information updated successfully",
        teacher: updatedTeacher,
      });
    } catch (error) {
      console.error("Error updating teacher info:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

//----------------------------------------------------------------
// Route: Update/change teacher password using PUT "/api/teacher/auth/changeteacherpassword"
router.put(
  "/changeteacherpassword",
  verifyTeacherToken,
  [
    body("teacherID").notEmpty().withMessage("Teacher ID is required"),
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
        teacherID: req.body.teacherID,
        passwordLength: req.body.newPassword?.length,
        confirmMatch: req.body.newPassword === req.body.confirmNewPassword
      });

      const { teacherID, newPassword } = req.body;

      // Fetch the teacher document using teacherID
      console.log("Fetching teacher from DB with teacherID:", teacherID);
      const teacher = await Teacher.findOne({ teacherID });
      if (!teacher) {
        console.log("Teacher not found for teacherID:", teacherID); // Log if teacher is not found
        return res.status(404).json({ message: "Teacher not found" });
      }

      console.log("Teacher found:", { 
        id: teacher._id, 
        teacherID: teacher.teacherID,
        name: teacher.name
      });

      // Hash the new password and update it
      console.log("Generating salt for password hashing...");
      const salt = await bcrypt.genSalt(10);
      console.log("Salt generated");

      console.log("Hashing new password...");
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      console.log("Password hashed successfully");
      
      // Update password in the database
      teacher.password = hashedPassword;

      console.log("Saving updated teacher document...");
      await teacher.save();

      // Validate the password was saved correctly by checking if it can be verified
      const verifyPasswordUpdate = await bcrypt.compare(newPassword, teacher.password);
      console.log("Password verification check:", verifyPasswordUpdate ? "Success" : "Failed");

      if (!verifyPasswordUpdate) {
        return res.status(500).json({ message: "Password update failed verification" });
      }

      // Respond with a success message
      console.log("Password updated successfully for teacherID:", teacherID);
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error); // Log the error details
      res.status(500).json({ error: "An unexpected error occurred" });
    }
  }
);

// Route to fetch assigned classes for the logged-in teacher
router.get("/assigned-classes", verifyTeacherToken, getAssignedClasses);
module.exports = router;
