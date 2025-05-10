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
// Set up multer for file storage (handling file uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/Admin/";
    const fs = require("fs");

    // Ensure the 'uploads' directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir); // Store files in "uploads" folder
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
router.post(
  "/createadmin",
  verifyAdminToken, // Verify admin token
  upload.single("photo"), // Handle file upload for admin's photo
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
  createAdmin // Call the controller function for admin creation
);
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
      console.log("Request received:", req.body); // Log incoming request body

      const { adminID, newPassword } = req.body;

      // Fetch the admin document using adminID
      console.log("Fetching admin from DB with adminID:", adminID);
      const admin = await Admin.findOne({ adminID });
      if (!admin) {
        console.log("Admin not found for adminID:", adminID); // Log if admin is not found
        return res.status(404).json({ message: "Admin not found" });
      }

      console.log("Admin found:", admin); // Log the admin document

      // Hash the new password and update it
      console.log("Generating salt for password hashing...");
      const salt = await bcrypt.genSalt(10);
      console.log("Salt generated:", salt);

      console.log("Hashing new password...");
      admin.password = await bcrypt.hash(newPassword, salt);

      console.log("Saving updated admin document...");
      await admin.save();

      // Respond with a success message
      console.log("Password updated successfully for adminID:", adminID);
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error); // Log the error details
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
  verifyAdminToken, // Verify admin token
  upload.single("photo"), // Handle file upload for the student's photo
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
    body("studentGender").isString().withMessage("Invalid student gender."), // Now accepts any string
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
    body("relationship").isString().withMessage("Invalid relationship."), // Now accepts any string
  ],
  handleValidationErrors, // Add this line to handle validation errors
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

//===============================================================================================
//================================================================================================

//===============================================================================================
//================================================================================================
router.get("/subjects", verifyAdminToken, getAllSubjects);
//===============================================================================================
//================================================================================================
router.get("/teachers", verifyAdminToken, getAllTeachers);
//===============================================================================================
//================================================================================================
router.get("/students", verifyAdminToken, getAllStudents);
//===============================================================================================
//================================================================================================
router.post(
  "/assign-teacher-to-subject",
  verifyAdminToken,
  assignTeacherToSubject
);

//===============================================================================================
//================================================================================================
router.post("/assign-teacher-to-class", verifyAdminToken, assignTeacherToClass);
//===============================================================================================
//================================================================================================
// Route to mark attendance for a teacher
router.post(
  "/teacher-attendance-mark",
  verifyAdminToken,
  markTeacherAttendance
);

// Route to get attendance records for a specific teacher
router.get(
  "/teacher-attendance-records",
  verifyAdminToken,
  fetchTeacherAttendanceRecords
);

//===============================================================================================
//================================================================================================
// Route to get attendance records for a specific teacher
router.post("/assign-students-class", verifyAdminToken, assignStudentToClass); // =================================================================================================
// =================================================================================================
// =================================================================================================
router.get("/students/search", verifyAdminToken, searchStudents);

// =================================================================================================
// =================================================================================================
// Fetch all classes
router.get("/classes", getAllClasses);
// Get details of a specific class
router.get("/classes/:classId", getClassDetails);

// Update a specific class
router.put("/edit-class/:classId", updateClass);
// Delete a specific class
router.delete("/classes/:classId", deleteClass);
module.exports = router;
