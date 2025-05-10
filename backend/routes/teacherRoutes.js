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
  "/auth/login",
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
// Route: Get teacher profile using GET "/api/teacher/auth/teacherprofile"
router.get("/auth/teacherprofile", verifyTeacherToken, async (req, res) => {
  try {
    const teacherID = req.teacher?.id; // Extract teacher ID from middleware

    if (!teacherID) {
      return res
        .status(400)
        .json({ message: "Teacher ID is missing in token" });
    }

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

    res.status(200).json({ teacher: teacherData });
  } catch (error) {
    console.error("Error fetching teacher profile:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

//------------------------------------------------------------------------------------------------
// Route: Update teacher info using PUT "/api/teacher/auth/teacherprofile"
router.put(
  "/auth/teacherprofile",
  verifyTeacherToken,
  upload.single("photo"),
  [
    body("name").optional().trim(),
    body("email").optional().isEmail().withMessage("Invalid email format"),
    body("phone").optional().isLength({ min: 10, max: 10 }).withMessage("Phone must be 10 digits"),
    body("designation").optional().trim(),
    body("department").optional().trim(),
    body("address").optional().trim(),
    body("religion").optional().trim(),
    body("category").optional().trim(),
    body("bloodgroup").optional().trim(),
    body("emergencyContact").optional().isObject().withMessage("Emergency contact must be an object"),
    body("emergencyContact.name").optional().trim(),
    body("emergencyContact.relation").optional().trim(),
    body("emergencyContact.phone").optional().isLength({ min: 10, max: 10 }).withMessage("Emergency contact phone must be 10 digits"),
    body("experience").optional().isNumeric().withMessage("Experience must be a numeric value"),
    body("highestQualification").optional().trim()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const teacherID = req.teacher?.id;
      if (!teacherID) {
        return res.status(401).json({ message: "Unauthorized - Invalid token" });
      }

      const teacher = await Teacher.findById(teacherID);
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }

      // Log the request body for debugging
      console.log("Update request body:", req.body);

      const {
        name,
        email,
        phone,
        designation,
        department,
        address,
        religion,
        category,
        bloodgroup,
        emergencyContact,
        experience,
        highestQualification
      } = req.body;

      // Update fields if provided
      if (name) teacher.name = name;
      if (email) teacher.email = email;
      if (phone) teacher.phone = phone;
      if (designation) teacher.designation = designation;
      if (department) teacher.department = department;
      if (address) teacher.address = address;
      if (religion) teacher.religion = religion;
      if (category) teacher.category = category;
      if (bloodgroup) teacher.bloodgroup = bloodgroup;
      if (emergencyContact) {
        try {
          // Parse emergencyContact if it's a string
          const contactData = typeof emergencyContact === 'string'
            ? JSON.parse(emergencyContact)
            : emergencyContact;
            
          teacher.emergencyContact = {
            name: contactData.name || teacher.emergencyContact?.name || "",
            relation: contactData.relation || teacher.emergencyContact?.relation || "",
            phone: contactData.phone || teacher.emergencyContact?.phone || "",
          };
        } catch (err) {
          console.error("Error processing emergencyContact:", err);
        }
      }
      
      // Handle numeric fields
      if (experience !== undefined && experience !== null) {
        // Ensure experience is stored as a number
        teacher.experience = Number(experience);
        console.log(`Setting experience to: ${typeof teacher.experience} - ${teacher.experience}`);
      }
      
      if (highestQualification) {
        teacher.highestQualification = highestQualification;
      }

      // Handle photo upload if present
      if (req.file) {
        teacher.photo = req.file.filename; // Store just the filename, not the full path
        console.log("New photo set:", teacher.photo);
      }

      // Add to action history
      if (!teacher.actionHistory) {
        teacher.actionHistory = [];
      }
      teacher.actionHistory.push("Profile updated on " + new Date().toISOString());

      console.log("Saving teacher updates:", {
        name: teacher.name,
        email: teacher.email,
        experience: teacher.experience,
        updatedFields: req.body
      });
      
      await teacher.save();
      console.log("Teacher saved successfully");

      // Remove sensitive data
      const { password, ...teacherData } = teacher.toObject();

      res.json({
        message: "Profile updated successfully",
        teacher: teacherData
      });
    } catch (error) {
      console.error("Error updating teacher profile:", error);
      res.status(500).json({ 
        message: "Server error",
        error: error.message 
      });
    }
  }
);

//----------------------------------------------------------------
// Route: Change teacher password using PUT "/api/teacher/auth/changeteacherpassword"
router.put(
  "/auth/changeteacherpassword",
  verifyTeacherToken,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/\d/)
      .withMessage("Password must contain at least one number")
      .matches(/[!@#$%^&*]/)
      .withMessage("Password must contain at least one special character"),
    body("confirmNewPassword")
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error("Passwords do not match");
        }
        return true;
      })
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      // Log the request body for debugging
      console.log("Password change request body:", req.body);

      const teacherID = req.teacher?.id;
      if (!teacherID) {
        return res.status(401).json({ message: "Unauthorized - Invalid token" });
      }

      const { currentPassword, newPassword } = req.body;

      const teacher = await Teacher.findById(teacherID);
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, teacher.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      teacher.password = await bcrypt.hash(newPassword, salt);

      // Add to action history
      teacher.actionHistory.push("Password changed");

      await teacher.save();

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ 
        message: "Server error",
        error: error.message 
      });
    }
  }
);

// Route to fetch assigned classes for the logged-in teacher
router.get("/auth/assigned-classes", verifyTeacherToken, getAssignedClasses);

// Teacher Profile Routes
router.get("/teacherprofile", verifyTeacherToken, async (req, res) => {
  try {
    const teacherID = req.teacher?.id;
    if (!teacherID) {
      return res.status(400).json({ message: "Teacher ID is missing in token" });
    }

    const teacher = await Teacher.findById(teacherID);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.status(200).json({ teacher });
  } catch (error) {
    console.error("Error fetching teacher profile:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update teacher profile
router.put("/teacherprofile", verifyTeacherToken, upload.single("photo"), [
  body("teacherID").notEmpty().withMessage("Teacher ID is required"),
  body("email").optional().isEmail().withMessage("Invalid email format"),
  body("phone").optional().isLength({ min: 10, max: 10 }).withMessage("Phone number must be 10 digits"),
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("designation").optional().trim(),
  body("department").optional().trim(),
  body("address").optional().trim(),
  body("dob").optional().isISO8601().toDate().withMessage("Invalid DOB"),
  body("gender").optional().isString().withMessage("Gender must be a string"),
  body("religion").optional().isString().withMessage("Religion must be a string"),
  body("category").optional().isString().withMessage("Category must be a string"),
  body("bloodgroup").optional().isString().withMessage("Blood group must be a string"),
  body("emergencyContact").optional().isObject(),
  body("emergencyContact.name").optional().notEmpty().withMessage("Emergency contact name cannot be empty"),
  body("emergencyContact.relation").optional().notEmpty().withMessage("Emergency contact relation cannot be empty"),
  body("emergencyContact.phone").optional().isLength({ min: 10, max: 10 }).withMessage("Emergency contact phone must be 10 digits"),
  body("experience").optional().isNumeric().withMessage("Experience must be numeric"),
  body("highestQualification").optional().notEmpty().withMessage("Highest qualification cannot be empty"),
  body("AADHARnumber").optional().isLength({ min: 12, max: 12 }).withMessage("AADHAR number must be 12 digits"),
  body("salary").optional().isNumeric().withMessage("Salary must be numeric"),
  body("bankDetails").optional().isObject(),
  body("bankDetails.accountNumber").optional().notEmpty().withMessage("Bank account number cannot be empty"),
  body("bankDetails.bankName").optional().notEmpty().withMessage("Bank name cannot be empty"),
  body("bankDetails.ifscCode").optional().notEmpty().withMessage("IFSC code cannot be empty"),
], handleValidationErrors, async (req, res) => {
  try {
    const { teacherID } = req.body;
    if (!teacherID) {
      return res.status(400).json({ message: "Teacher ID is required" });
    }

    const teacher = await Teacher.findOne({ teacherID });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const {
      email,
      phone,
      name,
      designation,
      department,
      address,
      dob,
      gender,
      religion,
      category,
      bloodgroup,
      emergencyContact,
      experience,
      highestQualification,
      AADHARnumber,
      salary,
      bankDetails,
    } = req.body;
    const photo = req.file ? req.file.filename : null;

    // Update fields if provided
    if (email) teacher.email = email;
    if (phone) teacher.phone = phone;
    if (name) teacher.name = name;
    if (designation) teacher.designation = designation;
    if (department) teacher.department = department;
    if (address) teacher.address = address;
    if (dob) teacher.dob = new Date(dob);
    if (gender) teacher.gender = gender;
    if (religion) teacher.religion = religion;
    if (category) teacher.category = category;
    if (bloodgroup) teacher.bloodgroup = bloodgroup;
    if (emergencyContact) {
      teacher.emergencyContact = {
        name: emergencyContact.name || teacher.emergencyContact?.name || "",
        relation: emergencyContact.relation || teacher.emergencyContact?.relation || "",
        phone: emergencyContact.phone || teacher.emergencyContact?.phone || "",
      };
    }
    if (experience) teacher.experience = experience;
    if (highestQualification) teacher.highestQualification = highestQualification;
    if (AADHARnumber) teacher.AADHARnumber = AADHARnumber;
    if (salary) teacher.salary = salary;
    if (bankDetails) {
      teacher.bankDetails = {
        accountNumber: bankDetails.accountNumber || teacher.bankDetails?.accountNumber || "",
        bankName: bankDetails.bankName || teacher.bankDetails?.bankName || "",
        ifscCode: bankDetails.ifscCode || teacher.bankDetails?.ifscCode || "",
      };
    }
    if (photo) teacher.photo = photo;

    // Add to action history
    teacher.actionHistory.push("Profile updated");

    await teacher.save();

    // Remove sensitive data
    const { password, ...teacherData } = teacher.toObject();

    res.json({
      message: "Profile updated successfully",
      teacher: teacherData
    });
  } catch (error) {
    console.error("Error updating teacher profile:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
});

// Change teacher password
router.put("/changeteacherpassword", verifyTeacherToken, [
  body("teacherID").notEmpty().withMessage("Teacher ID is required"),
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
    const { teacherID, currentPassword, newPassword } = req.body;
    if (!teacherID) {
      return res.status(400).json({ message: "Teacher ID is required" });
    }

    const teacher = await Teacher.findOne({ teacherID });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, teacher.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    teacher.password = await bcrypt.hash(newPassword, salt);

    // Add to action history
    teacher.actionHistory.push("Password changed");

    await teacher.save();

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
