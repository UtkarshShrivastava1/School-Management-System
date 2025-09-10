const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/attendance.controller");
const { requireAdmin, verifyTeacherToken } = require("../middleware/auth");

// teachers OR admins can mark attendance
router.post(
  "/attendance",
  [requireAdmin, verifyTeacherToken],
  ctrl.markAttendance
);

router.get("/attendance", requireAdmin, ctrl.getAttendance);
router.get(
  "/attendance/student/:studentId",
  requireAdmin,
  ctrl.getStudentAttendance
);

module.exports = router;
