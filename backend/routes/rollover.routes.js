const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/auth");
const rc = require("../controllers/result.controller");

router.post("/results/assessments", requireAdmin, rc.bulkUpsertAssessments);
router.post("/results/compute", requireAdmin, rc.computeResults);
router.get("/results/enrollment/:id", requireAdmin, rc.getEnrollmentResult);

module.exports = router;
