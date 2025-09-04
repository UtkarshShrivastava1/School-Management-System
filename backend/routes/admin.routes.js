// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ✅ Use the known-good middleware path & export style.
// If your middleware is in a different file, change this line to match.
const { verifyAdminToken } = require("../middleware/auth");
// Auth/profile controllers
const {
  createAdmin,
  loginAdmin,
  validateToken,
  getProfile,
  updateAdmin,
  changePassword,
} = require("../controllers/admin.controller");

// Admin management (teachers/students/classes/subjects)
const mgmt = require("../controllers/adminManagementController");

/* --------------------- Validation error middleware --------------------- */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array().map((e) => ({
        field: e.path,
        msg: e.msg,
        value: e.value,
      })),
    });
  }
  next();
}

/* --------------------------- Multer (uploads) --------------------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir = path.join(__dirname, "..", "uploads", "Admin");

    const url = req.url.toLowerCase();
    if (file.fieldname === "photo" && url.includes("createstudent")) {
      uploadDir = path.join(__dirname, "..", "uploads", "Student");
    } else if (file.fieldname === "photo" && url.includes("createteacher")) {
      uploadDir = path.join(__dirname, "..", "uploads", "Teacher");
    } else if (file.fieldname === "parentPhoto") {
      uploadDir = path.join(__dirname, "..", "uploads", "Parent");
    }

    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

function imageOnly(_req, file, cb) {
  const allowed = /jpg|jpeg|png|gif/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) return cb(null, true);
  cb(new Error("Only image files are allowed"));
}

const upload = multer({ storage, fileFilter: imageOnly });
const uploadFields = multer({ storage, fileFilter: imageOnly });

/* ================================ AUTH ================================ */

// Validate token (will 401 if token invalid)
router.post("/validate", verifyAdminToken, validateToken);

// Create admin (by an existing admin)
router.post(
  "/createadmin",
  verifyAdminToken,
  upload.single("photo"),
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("phone")
      .matches(/^\d{10}$/)
      .withMessage("Phone must be 10 digits"),
    body("designation").notEmpty().withMessage("Designation is required"),
    body("address").notEmpty().withMessage("Address is required"),
    body("dob").notEmpty().withMessage("Date of Birth is required"),
    body("gender").notEmpty().withMessage("Gender is required"),
    body("department").notEmpty().withMessage("Department is required"),

    body("religion").optional().isString(),
    body("category").optional().isString(),
    body("bloodgroup").optional().isString(),

    body("emergencyContact").optional(),
    body("experience").optional().isNumeric(),
    body("highestQualification").optional().isString(),
    body("AADHARnumber")
      .optional()
      .matches(/^\d{12}$/)
      .withMessage("AADHAR must be 12 digits"),
    body("salary").optional().isNumeric(),
    body("bankDetails").optional(),
  ],
  handleValidationErrors,
  createAdmin
);

// Login admin
router.post(
  "/login",
  [
    body("adminID").trim().notEmpty().withMessage("Admin ID is required"),
    body("password").trim().notEmpty().withMessage("Password is required"),
  ],
  handleValidationErrors,
  loginAdmin
);

// Get own profile
router.get("/adminprofile", verifyAdminToken, getProfile);

// Update admin info
router.put(
  "/updateadmininfo",
  verifyAdminToken,
  upload.single("photo"),
  [
    body("adminID").notEmpty().withMessage("Admin ID is required"),
    body("email").optional().isEmail(),
    body("phone")
      .optional()
      .matches(/^\d{10}$/),
    body("dob").optional().isISO8601(),
    body("experience").optional().isNumeric(),
    body("AADHARnumber")
      .optional()
      .matches(/^\d{12}$/),
    body("salary").optional().isNumeric(),
  ],
  handleValidationErrors,
  updateAdmin
);

// Change own password
router.put(
  "/changeadminpassword",
  verifyAdminToken,
  [
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters")
      .matches(/\d/)
      .withMessage("New password must include a number")
      .matches(/[!@#$%^&*]/)
      .withMessage("New password must include a special character"),
    body("currentPassword").optional().isString(),
  ],
  handleValidationErrors,
  changePassword
);

/* ============================== TEACHERS ============================== */

router.post(
  "/createteacher",
  verifyAdminToken,
  upload.single("photo"),
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("phone")
      .matches(/^\d{10}$/)
      .withMessage("Phone must be 10 digits"),
    body("designation").notEmpty().withMessage("Designation is required"),
    body("address").notEmpty().withMessage("Address is required"),
    body("dob").notEmpty().withMessage("Date of Birth is required"),
    body("gender").notEmpty().withMessage("Gender is required"),
    body("department").notEmpty().withMessage("Department is required"),
    body("AADHARnumber")
      .optional()
      .matches(/^\d{12}$/)
      .withMessage("AADHAR must be 12 digits"),
    body("experience").optional().isNumeric(),
    body("salary").optional().isNumeric(),
  ],
  handleValidationErrors,
  mgmt.createTeacher
);

router.get("/teachers", verifyAdminToken, mgmt.getAllTeachers);

router.post(
  "/assign-teacher-to-subject",
  verifyAdminToken,
  [
    body("subjectCode").notEmpty().withMessage("subjectCode is required"),
    body("teacherID").notEmpty().withMessage("teacherID is required"),
  ],
  handleValidationErrors,
  mgmt.assignTeacherToSubject
);

router.post(
  "/assign-teacher-to-class",
  verifyAdminToken,
  [
    body("classId").notEmpty().withMessage("classId is required"),
    body("teacherIDs")
      .isArray({ min: 1 })
      .withMessage("teacherIDs must be a non-empty array"),
  ],
  handleValidationErrors,
  mgmt.assignTeacherToClass
);

/* ============================== STUDENTS ============================== */

router.post(
  "/createstudent",
  verifyAdminToken,
  uploadFields.fields([
    { name: "photo", maxCount: 1 },
    { name: "parentPhoto", maxCount: 1 },
  ]),
  [
    body("studentName").notEmpty().withMessage("Student name is required"),
    body("studentEmail")
      .isEmail()
      .withMessage("Valid student email is required"),
    body("studentPhone")
      .matches(/^\d{10}$/)
      .withMessage("Student phone must be 10 digits"),
    body("studentAddress")
      .notEmpty()
      .withMessage("Student address is required"),
    body("studentDOB").notEmpty().withMessage("Student DOB is required"),
    body("studentGender")
      .isIn(["Male", "Female", "Other"])
      .withMessage("Student gender is invalid"),
    body("className").notEmpty().withMessage("Requested class is required"),
    body("studentFatherName")
      .notEmpty()
      .withMessage("Father's name is required"),
    body("studentMotherName")
      .notEmpty()
      .withMessage("Mother's name is required"),

    body("parentName").notEmpty().withMessage("Parent name is required"),
    body("parentContactNumber")
      .matches(/^\d{10}$/)
      .withMessage("Parent contact must be 10 digits"),
    body("parentEmail").isEmail().withMessage("Valid parent email is required"),
    body("relationship").notEmpty().withMessage("Relationship is required"),
  ],
  handleValidationErrors,
  mgmt.createStudent
);

router.get("/students", verifyAdminToken, mgmt.getAllStudents);
router.get("/students/search", verifyAdminToken, mgmt.searchStudents);
router.get(
  "/students/class/:classId",
  verifyAdminToken,
  mgmt.getStudentsByClass
);

router.post(
  "/assign-students-class",
  verifyAdminToken,
  [
    body("studentIDs")
      .isArray({ min: 1 })
      .withMessage("studentIDs array is required"),
    body("classId").notEmpty().withMessage("classId is required"),
  ],
  handleValidationErrors,
  mgmt.assignStudentToClass
);

router.post(
  "/reassign-student-class",
  verifyAdminToken,
  [
    body("studentID").notEmpty().withMessage("studentID is required"),
    body("newClassId").notEmpty().withMessage("newClassId is required"),
  ],
  handleValidationErrors,
  mgmt.reassignStudentToClass
);

router.post(
  "/remove-student-class",
  verifyAdminToken,
  [body("studentID").notEmpty().withMessage("studentID is required")],
  handleValidationErrors,
  mgmt.removeStudentFromClass
);

/* ============================== SUBJECTS ============================== */

router.post(
  "/createsubject",
  verifyAdminToken,
  [
    body("subjectName").notEmpty().withMessage("subjectName is required"),
    body("subjectCode").notEmpty().withMessage("subjectCode is required"),
  ],
  handleValidationErrors,
  mgmt.createSubject
);

router.get("/subjects", verifyAdminToken, mgmt.getAllSubjects);

/* =============================== CLASSES =============================== */

router.get("/classes", verifyAdminToken, mgmt.getAllClasses);

router.post(
  "/createclass",
  verifyAdminToken,
  [
    body("className").notEmpty().withMessage("className is required"),
    body("classId").notEmpty().withMessage("classId is required"),
    body("section").notEmpty().withMessage("section is required"),
    body("classStrength").optional().isNumeric(),
  ],
  handleValidationErrors,
  mgmt.createClass
);

router.get("/classes/:classId", verifyAdminToken, mgmt.getClassById);

router.put(
  "/classes/:classId",
  verifyAdminToken,
  [
    body("className").optional().notEmpty(),
    body("subjects").optional(),
    body("teachers").optional(),
  ],
  handleValidationErrors,
  mgmt.updateClassById
);

router.delete("/classes/:classId", verifyAdminToken, mgmt.deleteClassById);

/* ============================= ATTENDANCE ============================== */

// router.post(
//   "/teacher-attendance-mark",
//   verifyAdminToken,
//   mgmt.markTeacherAttendance
// );
// router.get(
//   "/teacher-attendance-records",
//   verifyAdminToken,
//   mgmt.fetchTeacherAttendanceRecords
// );
// router.get(
//   "/student-attendance-records",
//   verifyAdminToken,
//   mgmt.getStudentAttendanceRecords
// );

module.exports = router;
