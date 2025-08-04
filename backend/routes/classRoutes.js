const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const classController = require("../controllers/classController");
const { verifyAdminToken } = require("../middleware/authMiddleware");

// Basic route for testing
router.get("/", (req, res) => {
  res.json({ message: "Class routes working" });
});

router.get(
  "/available-sections/:standardName",
  verifyAdminToken,
  classController.getAvailableSections
);

module.exports = router;
