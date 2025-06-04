const express = require("express");
const router = express.Router();
const { verifyTeacherToken } = require("../middleware/authMiddleware");
const attendanceController = require("../controllers/attendanceController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Get teacher's assigned classes
router.get("/teacher-classes", verifyTeacherToken, attendanceController.getTeacherClasses);

// Get students in a class
router.get("/class/:classId/students", verifyTeacherToken, attendanceController.getEnrolledStudents);

// Mark attendance for a class
router.post("/class/:classId/attendance", verifyTeacherToken, attendanceController.markAttendance);

// Update attendance for a class on a specific date
router.put("/class/:classId/attendance/:date", verifyTeacherToken, attendanceController.updateAttendance);

// Get attendance history for a class
router.get("/class/:classId/attendance-history", verifyTeacherToken, attendanceController.getClassAttendanceHistory);

// Download monthly attendance report
router.get("/class/:classId/download-attendance", verifyTeacherToken, attendanceController.downloadMonthlyAttendance);

// Download attendance report by date range for a class
router.get("/class/:classId/download-report", verifyTeacherToken, attendanceController.downloadMonthlyAttendance);

// Basic route for testing
router.get("/", (req, res) => {
  res.json({ message: "Attendance routes working" });
});

module.exports = router; 