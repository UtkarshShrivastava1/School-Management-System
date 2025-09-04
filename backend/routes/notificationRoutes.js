const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const {
  createNotification,
  getTeacherNotifications,
  getStudentNotifications,
  getParentNotifications,
} = require("../controllers/notificationController");
const {
  verifyAdminToken,
  verifyTeacherToken,
  verifyStudentToken,
  verifyParentToken,
  protect,
  authorize,
} = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads/notifications");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for notification uploads (images or pdfs)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Accept images and pdfs
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;
  if (allowedTypes.test(ext) || allowedTypes.test(mime)) {
    cb(null, true);
  } else {
    cb(new Error("Only images and PDF files are allowed."), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter,
});

// Error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res
      .status(400)
      .json({ message: "File upload error: " + err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Validation middleware
const validateNotification = [
  body("title").notEmpty().withMessage("Title is required"),
  body("message").notEmpty().withMessage("Message is required"),
  body("recipientGroup")
    .isIn(["teachers", "students", "parents", "all"])
    .withMessage("Recipient group must be teachers, students, parents, or all"),
];

// POST /api/notifications/send
router.post(
  "/send",
  verifyAdminToken,
  upload.single("file"),
  handleMulterError,
  validateNotification,
  createNotification
);

// GET /api/notifications/teacher
router.get("/teacher", verifyTeacherToken, getTeacherNotifications);

// GET /api/notifications/student
router.get("/student", verifyStudentToken, getStudentNotifications);

// GET /api/notifications/parent
router.get("/parent", verifyParentToken, getParentNotifications);

// Basic route for testing
router.get("/", (req, res) => {
  res.json({ message: "Notification routes working" });
});

// Error handling for routes
router.use((err, req, res, next) => {
  console.error("Notification route error:", err);
  res
    .status(500)
    .json({ message: "Internal server error", error: err.message });
});

module.exports = router;
