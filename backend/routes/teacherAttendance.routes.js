const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/teacherAttendance.controller");
const { requireAdmin } = require("../middleware/auth");

// only admins/HR mark teacher attendance
router.post("/teacher-attendance", requireAdmin, ctrl.markTeacherAttendance);
router.get("/teacher-attendance", requireAdmin, ctrl.getByDate);
router.get("/teacher-attendance/teacher/:id", requireAdmin, ctrl.getForTeacher);

module.exports = router;
