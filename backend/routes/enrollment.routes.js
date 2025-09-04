const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/enrollment.controller");
const { requireAdmin } = require("../middleware/auth");

router.post("/enrollments", requireAdmin, ctrl.createEnrollment);
router.patch("/enrollments/:id/section", requireAdmin, ctrl.moveSection);
router.get("/enrollments", requireAdmin, ctrl.listEnrollments);
router.get("/enrollments/stats/sections", requireAdmin, ctrl.sectionStats);
router.post(
  "/enrollments/allocate-waitlist",
  requireAdmin,
  ctrl.allocateWaitlist
);

router.patch("/enrollments/:id/withdraw", requireAdmin, ctrl.withdraw);
router.patch("/enrollments/:id/transfer", requireAdmin, ctrl.transfer);

module.exports = router;
