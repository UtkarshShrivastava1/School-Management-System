// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const path = require("path");
const Admin = require("../models/AdminModel");
const Teacher = require("../models/TeacherModel");
const Student = require("../models/StudentModel");
const Parent = require("../models/ParentModel");
const { verifyAdminToken } = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");

// Import controller functions
const {
  getAllClasses,
  getClassDetails,
  updateClass,
  deleteClass,
} = require("../controllers/classEditController");
const { createAdmin, loginAdmin } = require("../controllers/adminController");
const {
  createTeacher,
  getAllTeachers,
  assignTeacherToSubject,
  assignTeacherToClass,
} = require("../controllers/teacherController");
const {
  createStudent,
  getAllStudents,
  assignStudentToClass,
  searchStudents,
} = require("../controllers/studentController");
const {
  createClass,
  assignSubjectsToClass,
} = require("../controllers/classController");
const {
  createSubject,
  getAllSubjects,
} = require("../controllers/subjectController");
const {
  markTeacherAttendance,
  fetchTeacherAttendanceRecords,
} = require("../controllers/TeacherAttendanceController");

// Set up multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine the correct upload directory based on the field name
    let uploadDir = "uploads/Admin/";
    if (file.fieldname === "photo" && req.url.includes("createstudent")) {
      uploadDir = "uploads/Student/";
    } else if (file.fieldname === "photo" && req.url.includes("createteacher")) {
      uploadDir = "uploads/Teacher/";
    } else if (file.fieldname === "parentPhoto") {
      uploadDir = "uploads/Parent/";
    }
    
    const fs = require("fs");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    console.log(`Saving ${file.fieldname} to directory: ${uploadDir}`);
    cb(null, uploadDir); // Store files in appropriate folder
  },
  filename: (req, file, cb) => {
    // Generate a unique filename based on current timestamp
    const fileName = Date.now() + path.extname(file.originalname);
    console.log(`Generated filename: ${fileName} for field: ${file.fieldname}`);
    cb(null, fileName);
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

// Configure multer for multiple file     s
const uploadFields = multer({
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
    console.error('Validation errors:', errors.array());
    return res.status(400).json({
      message: "Validation error",
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Auth Routes
router.post("/login", [
  body("adminID").trim().notEmpty().withMessage("Admin ID is required"),
  body("password").trim().notEmpty().withMessage("Password is required"),
], handleValidationErrors, loginAdmin);

router.post("/validate", verifyAdminToken, async (req, res) => {
  try {
    const user = req.admin;
    if (user) {
      res.status(200).json({ name: user.name });
    } else {
      res.status(401).json({ error: "Invalid token" });
    }
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Admin Profile Routes
router.get("/adminprofile", verifyAdminToken, async (req, res) => {
  try {
    // The admin object is already attached to req by the verifyAdminToken middleware
    const admin = req.admin;
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json({ admin });
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update admin profile
router.put("/adminprofile", verifyAdminToken, upload.single("photo"), [
  body("adminID").notEmpty().withMessage("Admin ID is required"),
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
  body("emergencyContact").optional().custom((value, { req }) => {
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
    else if (typeof value === 'object' && value !== null) {
      return true;
    }
    throw new Error('Emergency contact must be an object');
  }),
  body("emergencyContact.name").optional().notEmpty().withMessage("Emergency contact name cannot be empty"),
  body("emergencyContact.relation").optional().notEmpty().withMessage("Emergency contact relation cannot be empty"),
  body("emergencyContact.phone").optional().isLength({ min: 10, max: 10 }).withMessage("Emergency contact phone must be 10 digits"),
  body("experience").optional().isNumeric().withMessage("Experience must be numeric"),
  body("highestQualification").optional().notEmpty().withMessage("Highest qualification cannot be empty"),
  body("AADHARnumber").optional().isLength({ min: 12, max: 12 }).withMessage("AADHAR number must be 12 digits"),
  body("salary").optional().isNumeric().withMessage("Salary must be numeric"),
  body("bankDetails").optional().custom((value, { req }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed === 'object' && parsed !== null) {
          return true;
        }
      } catch (e) {
        throw new Error('Bank details must be a valid JSON object');
      }
    } 
    else if (typeof value === 'object' && value !== null) {
      return true;
    }
    throw new Error('Bank details must be an object');
  }),
  body("bankDetails.accountNumber").optional().notEmpty().withMessage("Bank account number cannot be empty"),
  body("bankDetails.bankName").optional().notEmpty().withMessage("Bank name cannot be empty"),
  body("bankDetails.ifscCode").optional().notEmpty().withMessage("IFSC code cannot be empty"),
], (req, res, next) => {
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
}, async (req, res) => {
  try {
    console.log("Admin profile update request received:", req.body);
    
    const { adminID } = req.body;
    if (!adminID) {
      console.error("Admin ID is missing in request body");
      return res.status(400).json({ message: "Admin ID is required" });
    }

    console.log("Looking for admin with ID:", adminID);
    const admin = await Admin.findOne({ adminID });
    if (!admin) {
      console.log("Admin not found with ID:", adminID);
      return res.status(404).json({ message: "Admin not found" });
    }
    
    console.log("Admin found:", admin.adminID);

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
    console.log("Photo received:", photo);

    // Update fields if provided
    if (email) admin.email = email;
    if (phone) admin.phone = phone;
    if (name) admin.name = name;
    if (designation) admin.designation = designation;
    if (department) admin.department = department;
    if (address) admin.address = address;
    if (dob) admin.dob = new Date(dob);
    if (gender) admin.gender = gender;
    if (religion) admin.religion = religion;
    if (category) admin.category = category;
    if (bloodgroup) admin.bloodgroup = bloodgroup;
    
    // Handle emergencyContact
    if (emergencyContact) {
      try {
        // If emergencyContact is a string (JSON), parse it
        const contactData = typeof emergencyContact === 'string' 
          ? JSON.parse(emergencyContact) 
          : emergencyContact;
          
        admin.emergencyContact = {
          name: contactData.name || admin.emergencyContact?.name || "",
          relation: contactData.relation || admin.emergencyContact?.relation || "",
          phone: contactData.phone || admin.emergencyContact?.phone || "",
        };
      } catch (err) {
        console.error("Error processing emergencyContact:", err);
      }
    }
    
    if (experience) admin.experience = experience;
    if (highestQualification) admin.highestQualification = highestQualification;
    if (AADHARnumber) admin.AADHARnumber = AADHARnumber;
    if (salary) admin.salary = salary;
    
    // Handle bankDetails
    if (bankDetails) {
      try {
        // If bankDetails is a string (JSON), parse it
        const bankData = typeof bankDetails === 'string' 
          ? JSON.parse(bankDetails) 
          : bankDetails;
          
        admin.bankDetails = {
          accountNumber: bankData.accountNumber || admin.bankDetails?.accountNumber || "",
          bankName: bankData.bankName || admin.bankDetails?.bankName || "",
          ifscCode: bankData.ifscCode || admin.bankDetails?.ifscCode || "",
        };
      } catch (err) {
        console.error("Error processing bankDetails:", err);
      }
    }
    
    if (photo) admin.photo = photo;

    // Add to action history
    if (!admin.actionHistory) {
      admin.actionHistory = [];
    }
    admin.actionHistory.push("Profile updated");

    console.log("Saving updated admin data...");
    await admin.save();
    console.log("Admin data saved successfully");

    // Remove sensitive data
    const { password, ...adminData } = admin.toObject();

    res.json({
      message: "Profile updated successfully",
      admin: adminData
    });
  } catch (error) {
    console.error("Error updating admin profile:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
});

// Change admin password
router.put("/changeadminpassword", verifyAdminToken, [
  body("adminID").notEmpty().withMessage("Admin ID is required"),
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
    const { adminID, currentPassword, newPassword } = req.body;
    if (!adminID) {
      return res.status(400).json({ message: "Admin ID is required" });
    }

    const admin = await Admin.findOne({ adminID });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);

    // Add to action history
    admin.actionHistory.push("Password changed");

    await admin.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
});
//================================================================================================
//================================================================================================

//----------------------------------------------------------------
// Route to create a teacher
// Route: Create an teacher using POST "/api/admin/auth/createteacher"
router.post(
  "/createteacher",
  verifyAdminToken, // Verify teacher token
  upload.single("photo"), // Handle file upload for teacher's photo
  [
    // Existing validations
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
    body("religion")
      .optional()
      .isString()
      .withMessage("Religion must be a string"),
    body("category")
      .optional()
      .isString()
      .withMessage("Category must be a string"),
    body("bloodgroup")
      .optional()
      .isString()
      .withMessage("Blood group must be a string"),
    // Validations for new fields
    body("emergencyContact")
      .optional()
      .isObject()
      .withMessage("Emergency contact must be an object"),
    body("emergencyContact.name")
      .optional()
      .notEmpty()
      .withMessage("Emergency contact name is required"),
    body("emergencyContact.relation")
      .optional()
      .notEmpty()
      .withMessage("Emergency contact relation is required"),
    body("emergencyContact.phone")
      .optional()
      .isLength({ min: 10, max: 10 })
      .withMessage("Emergency contact phone must be 10 digits"),

    body("experience")
      .optional()
      .isNumeric()
      .withMessage("Experience must be a numeric value"),

    body("highestQualification")
      .optional()
      .notEmpty()
      .withMessage("Highest qualification is required"),

    body("AADHARnumber")
      .optional()
      .isLength({ min: 12, max: 12 })
      .withMessage("AADHAR number must be 12 digits"),
    body("salary").optional().isNumeric().withMessage("Salary must be numeric"),
    body("bankDetails")
      .optional()
      .isObject()
      .withMessage("Bank details must be an object"),
    body("bankDetails.accountNumber")
      .optional()
      .notEmpty()
      .withMessage("Bank account number is required"),
    body("bankDetails.bankName")
      .optional()
      .notEmpty()
      .withMessage("Bank name is required"),
    body("bankDetails.ifscCode")
      .optional()
      .notEmpty()
      .withMessage("IFSC code is required"),
  ],
  handleValidationErrors, // Handle validation errors
  createTeacher // Call the controller function for teacher creation
);

//================================================================================================
//================================================================================================
router.post(
  "/createstudent",
  verifyAdminToken, // Verify admin token
  uploadFields.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'parentPhoto', maxCount: 1 }
  ]), // Handle file uploads for both student and parent photos
  [
    // Validation middleware
    body("studentName").notEmpty().withMessage("Student name is required."),
    body("studentEmail")
      .isEmail()
      .withMessage("A valid student email is required."),
    body("studentPhone")
      .isLength({ min: 10, max: 10 })
      .withMessage("Phone number must be 10 digits"),
    body("studentAddress")
      .notEmpty()
      .withMessage("Student address is required."),
    body("studentDOB").notEmpty().withMessage("Student DOB is required."),
    body("studentGender").isString().withMessage("Invalid student gender."),
    body("className")
      .notEmpty()
      .withMessage("Class is required.")
      .isIn(['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'])
      .withMessage("Class must be in format 'Class X' where X is a number from 1 to 12."),
    body("religion").optional().isString().withMessage("Invalid religion."),
    body("category").optional().isString().withMessage("Invalid category."),
    body("bloodgroup")
      .optional()
      .isString()
      .withMessage("Invalid blood group."),

    body("parentName").notEmpty().withMessage("Parent name is required."),
    body("parentContactNumber")
      .isLength({ min: 10, max: 10 })
      .withMessage("Parent contact number must be 10 digits"),
    body("parentEmail")
      .isEmail()
      .withMessage("A valid parent email is required."),
    body("studentFatherName")
      .notEmpty()
      .withMessage("Student father name is required."),
    body("studentMotherName")
      .notEmpty()
      .withMessage("Student mother name is required."),

    // Validate relationship for the parent
    body("relationship").isString().withMessage("Invalid relationship."),
  ],
  handleValidationErrors,
  createStudent
);

// Class Management Routes
router.post("/createclass", verifyAdminToken, createClass);
router.get("/classes", verifyAdminToken, getAllClasses);
router.get("/classes/:classId", verifyAdminToken, getClassDetails);
router.put("/edit-class/:classId", verifyAdminToken, updateClass);
router.delete("/classes/:classId", verifyAdminToken, deleteClass);

// Subject Management Routes
router.post("/createsubject", verifyAdminToken, createSubject);
router.get("/subjects", verifyAdminToken, getAllSubjects);

// Teacher Assignment Routes
router.post("/assign-teacher-to-subject", verifyAdminToken, assignTeacherToSubject);
router.post("/assign-teacher-to-class", verifyAdminToken, assignTeacherToClass);

// Student Assignment Routes
router.post("/assign-students-class", verifyAdminToken, assignStudentToClass);

// Attendance Routes
router.post("/teacher-attendance-mark", verifyAdminToken, markTeacherAttendance);
router.get("/teacher-attendance-records", verifyAdminToken, fetchTeacherAttendanceRecords);

// Search Routes
router.get("/students/search", verifyAdminToken, searchStudents);
router.get("/teachers", verifyAdminToken, getAllTeachers);
router.get("/students", verifyAdminToken, getAllStudents);

module.exports = router;
