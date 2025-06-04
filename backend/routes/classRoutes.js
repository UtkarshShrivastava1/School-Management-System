const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");

// Basic route for testing
router.get("/", (req, res) => {
  res.json({ message: "Class routes working" });
});

module.exports = router; 