const express = require("express");
const router = express.Router();
const ac = require("../controllers/academicClass.controller");
const sc = require("../controllers/section.controller");
const { requireAdmin } = require("../middleware/auth");

router.post("/classes/academic", requireAdmin, ac.createAcademicClass);
router.get("/classes/academic", requireAdmin, ac.listAcademicClasses);
router.get("/classes/academic/:id", requireAdmin, ac.getAcademicClass);

router.post("/classes/academic/:id/sections", requireAdmin, sc.createSection);
router.get(
  "/classes/academic/:id/sections/available",
  requireAdmin,
  sc.getAvailableSections
);

module.exports = router;
