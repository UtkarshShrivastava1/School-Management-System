// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const path = require("path");
const Admin = require("../models/AdminModel"); // Ensure this import is correct
const Teacher = require("../models/TeacherModel"); // Importing Teacher model
const Student = require("../models/StudentModel"); // Importing Teacher model
const Parent = require("../models/ParentModel"); // Importing Teacher model
const Class = require("../models/ClassModel"); // Add Class model import
const Subject = require("../models/SubjectModel"); // Add Subject model import
const studentController = require("../controllers/studentController");

// Import verifyAdminToken middleware
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
} = require("../controllers/teacherController"); // Assuming you have the controller set up
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
const feeController = require("../controllers/feeController");
// Set up multer for file storage (handling file uploads)
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

    // Ensure the 'uploads' directory exists
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

// Configure multer to handle file type validation
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

// Configure multer for multiple file uploads
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
//================================================================================================
//================================================================================================
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
//================================================================================================
//================================================================================================
//------------------------------------------------------------------------------------------------
// Route: Create an admin using POST "/api/admin/auth/createadmin"
router.post("/createadmin", verifyAdminToken, upload.single("photo"), [
  // Existing validations
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("phone").isLength({ min: 10, max: 10 }).withMessage("Phone must be 10 digits"),
  body("designation").notEmpty().withMessage("Designation is required"),
  body("address").notEmpty().withMessage("Address is required"),
  body("dob").notEmpty().withMessage("Date of Birth is required"),
  body("gender").notEmpty().withMessage("Gender is required"),
  body("department").notEmpty().withMessage("Department is required"),
  body("religion").optional().isString().withMessage("Religion must be a string"),
  body("category").optional().isString().withMessage("Category must be a string"),
  body("bloodgroup").optional().isString().withMessage("Blood group must be a string"),
  // Validations for new fields
  body("emergencyContact").optional().isObject().withMessage("Emergency contact must be an object"),
  body("emergencyContact.name").optional().notEmpty().withMessage("Emergency contact name is required"),
  body("emergencyContact.relation").optional().notEmpty().withMessage("Emergency contact relation is required"),
  body("emergencyContact.phone").optional().isLength({ min: 10, max: 10 }).withMessage("Emergency contact phone must be 10 digits"),
  body("experience").optional().isNumeric().withMessage("Experience must be a numeric value"),
  body("highestQualification").optional().notEmpty().withMessage("Highest qualification is required"),
  body("AADHARnumber").optional().isLength({ min: 12, max: 12 }).withMessage("AADHAR number must be 12 digits"),
  body("salary").optional().isNumeric().withMessage("Salary must be numeric"),
  body("bankDetails").optional().isObject().withMessage("Bank details must be an object"),
  body("bankDetails.accountNumber").optional().notEmpty().withMessage("Bank account number is required"),
  body("bankDetails.bankName").optional().notEmpty().withMessage("Bank name is required"),
  body("bankDetails.ifscCode").optional().notEmpty().withMessage("IFSC code is required")
], handleValidationErrors, createAdmin);
//================================================================================================
//================================================================================================

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
//------------------------------------------------------------------------------------------------
//================================================================================================
//================================================================================================

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
//================================================================================================
//================================================================================================

//------------------------------------------------------------------------------------------------
// Route: Update admin info using PUT "/api/admin/auth/updateadmininfo"
//------------------------------------------------------------------------------------------------
// Route: Update admin info using PUT "/api/admin/auth/updateadmininfo"
router.put(
  "/updateadmininfo",
  verifyAdminToken, // Middleware to verify admin token
  upload.single("photo"), // Middleware to handle photo upload
  [
    // Validation rules
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
    body("dob").optional().isISO8601().toDate().withMessage("Invalid DOB"),
    body("gender").optional().isString().withMessage("Gender must be a string"),
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
    body("emergencyContact").optional().isObject(),
    body("emergencyContact.name")
      .optional()
      .notEmpty()
      .withMessage("Emergency contact name cannot be empty"),
    body("emergencyContact.relation")
      .optional()
      .notEmpty()
      .withMessage("Emergency contact relation cannot be empty"),
    body("emergencyContact.phone")
      .optional()
      .isLength({ min: 10, max: 10 })
      .withMessage("Emergency contact phone must be 10 digits"),

    body("experience")
      .optional()
      .isNumeric()
      .withMessage("Experience must be numeric"),

    body("highestQualification")
      .optional()
      .notEmpty()
      .withMessage("Highest qualification cannot be empty"),

    body("AADHARnumber")
      .optional()
      .isLength({ min: 12, max: 12 })
      .withMessage("AADHAR number must be 12 digits"),
    body("salary").optional().isNumeric().withMessage("Salary must be numeric"),
    body("bankDetails").optional().isObject(),
    body("bankDetails.accountNumber")
      .optional()
      .notEmpty()
      .withMessage("Bank account number cannot be empty"),
    body("bankDetails.bankName")
      .optional()
      .notEmpty()
      .withMessage("Bank name cannot be empty"),
    body("bankDetails.ifscCode")
      .optional()
      .notEmpty()
      .withMessage("IFSC code cannot be empty"),
  ],
  handleValidationErrors, // Middleware to handle validation errors
  async (req, res) => {
    try {
      const {
        adminID,
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
      const photo = req.file ? req.file.filename : null; // Handle uploaded photo

      // Fetch the admin document using adminID
      const admin = await Admin.findOne({ adminID });
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      // Ensure registeredBy fields are not updated
      const { registeredBy } = admin.toObject();
      const updatedAdminData = { ...req.body, registeredBy }; // Preserve the registeredBy field

      // Ensure the update excludes registeredBy fields
      delete updatedAdminData.registeredBy; // If registeredBy is included in req.body, remove it explicitly

      // Update the admin document with the valid fields
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
      if (emergencyContact) {
        admin.emergencyContact = {
          name: emergencyContact.name || admin.emergencyContact.name,
          relation:
            emergencyContact.relation || admin.emergencyContact.relation,
          phone: emergencyContact.phone || admin.emergencyContact.phone,
        };
      }
      if (experience) admin.experience = experience;
      if (highestQualification)
        admin.highestQualification = highestQualification;
      if (AADHARnumber) admin.AADHARnumber = AADHARnumber;
      if (salary) admin.salary = salary;
      if (bankDetails) {
        admin.bankDetails = {
          accountNumber:
            bankDetails.accountNumber || admin.bankDetails.accountNumber,
          bankName: bankDetails.bankName || admin.bankDetails.bankName,
          ifscCode: bankDetails.ifscCode || admin.bankDetails.ifscCode,
        };
      }
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
//================================================================================================
//================================================================================================

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
      console.log("Request received:", req.body);
      const { adminID, newPassword } = req.body;
      console.log("Fetching admin from DB with adminID:", adminID);
      const admin = await Admin.findOne({ adminID });
      if (!admin) {
        console.log("Admin not found for adminID:", adminID);
        return res.status(404).json({ message: "Admin not found" });
      }
      console.log("Admin found:", admin);
      console.log("Generating salt for password hashing...");
      const salt = await bcrypt.genSalt(10);
      console.log("Salt generated:", salt);
      console.log("Hashing new password...");
      admin.password = await bcrypt.hash(newPassword, salt);
      console.log("Saving updated admin document...");
      await admin.save();
      console.log("Password updated successfully for adminID:", adminID);
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ error: "An unexpected error occurred" });
    }
  }
);
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
  verifyAdminToken,
  uploadFields.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'parentPhoto', maxCount: 1 }
  ]),
  [
    // Student validations
    body("studentName").trim().notEmpty().withMessage("Student name is required."),
    body("studentEmail").trim().isEmail().withMessage("A valid student email is required."),
    body("studentPhone").trim().isLength({ min: 10, max: 10 }).withMessage("Phone number must be 10 digits"),
    body("studentAddress").trim().notEmpty().withMessage("Student address is required."),
    body("studentDOB").notEmpty().withMessage("Student DOB is required."),
    body("studentGender").isIn(["Male", "Female", "Other"]).withMessage("Gender must be Male, Female, or Other"),
    body("className").trim().notEmpty().withMessage("Class is required.")
      .matches(/^Class [1-9]|1[0-2]$/).withMessage("Class must be in format 'Class X' where X is a number from 1 to 12"),
    body("religion").optional().trim(),
    body("category").optional().trim(),
    body("bloodgroup").optional().trim(),
    body("studentFatherName").trim().notEmpty().withMessage("Student father name is required."),
    body("studentMotherName").trim().notEmpty().withMessage("Student mother name is required."),

    // Parent validations
    body("parentName").trim().notEmpty().withMessage("Parent name is required."),
    body("parentContactNumber").trim().isLength({ min: 10, max: 10 }).withMessage("Parent contact number must be 10 digits"),
    body("parentEmail").trim().isEmail().withMessage("A valid parent email is required."),
    body("relationship").trim().notEmpty().withMessage("Relationship is required."),
  ],
  handleValidationErrors,
  createStudent
);

//================================================================================================
//================================================================================================
router.post("/createclass", verifyAdminToken, createClass);
//===============================================================================================
//================================================================================================

router.post("/createsubject", verifyAdminToken, createSubject);
//===============================================================================================
//================================================================================================

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

// Get students by class
router.get("/students/class/:classId", verifyAdminToken, studentController.getStudentsByClass);

// =================================================================================================
// =================================================================================================
// Fetch all classes
router.get("/classes", verifyAdminToken, getAllClasses);

// Get all teachers
router.get("/teachers", verifyAdminToken, getAllTeachers);

// Get class by classId
router.get("/classes/:classId", verifyAdminToken, async (req, res) => {
  try {
    const { classId } = req.params;
    
    if (!classId) {
      return res.status(400).json({ message: "Class ID is required" });
    }

    // First try to find by classId
    let classDoc = await Class.findOne({ classId })
      .populate("teachers", "teacherID name")
      .populate("subjects", "subjectName subjectCode subjectId");
    
    // If not found by classId, try to find by MongoDB _id
    if (!classDoc) {
      try {
        classDoc = await Class.findById(classId)
          .populate("teachers", "teacherID name")
          .populate("subjects", "subjectName subjectCode subjectId");
      } catch (err) {
        // If the classId is not a valid ObjectId, just continue with null classDoc
        console.log("Invalid ObjectId format, continuing with classId search");
      }
    }
    
    if (!classDoc) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Get subjects with their assigned teachers
    const subjects = await Subject.find({
      _id: { $in: classDoc.subjects }
    }).populate("assignedTeachers", "teacherID name");

    return res.status(200).json({
      message: "Class details fetched successfully",
      class: classDoc,
      subjects: subjects
    });
  } catch (error) {
    console.error("Error fetching class details:", error);
    return res.status(500).json({ 
      message: "Error fetching class details",
      error: error.message 
    });
  }
});

module.exports = router;
