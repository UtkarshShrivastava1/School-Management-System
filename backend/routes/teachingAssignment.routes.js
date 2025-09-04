const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/teachingAssignment.controller");
const { requireAdmin } = require("../middleware/auth");

router.post(
  "/teaching-assignments",
  requireAdmin,
  ctrl.createTeachingAssignment
);
router.get("/teaching-assignments", requireAdmin, ctrl.listTeachingAssignments);
router.patch(
  "/teaching-assignments/:id",
  requireAdmin,
  ctrl.updateTeachingAssignment
);
router.get("/search/teachers", requireAdmin, ctrl.searchTeachers);
router.get("/search/subjects", requireAdmin, ctrl.searchSubjects);

module.exports = router;
