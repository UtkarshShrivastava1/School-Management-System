const router = require("express").Router();
const ctrl = require("../controllers/section.controller");
const { requireAdmin } = require("../middleware/auth");

// Create a section for an academic class
router.post("/classes/academic/:id/sections", requireAdmin, ctrl.createSection);

// Available section letters for an academic class
router.get(
  "/classes/academic/:id/sections/available",
  requireAdmin,
  ctrl.getAvailableSections
);

// Assign class teacher to a section
router.post(
  "/sections/:sectionId/class-teacher",
  requireAdmin,
  ctrl.setClassTeacher
);

// Section stats (optional)
router.get("/sections/:sectionId/stats", requireAdmin, ctrl.getSectionStats);

module.exports = router;
