// routes/adminProtected.js
const express = require("express");
const router = express.Router();
const authenticateAdmin = require("../middleware/authMiddleware");

// Protect a route
router.get("/dashboard", authenticateAdmin, (req, res) => {
  res.json({ message: "Welcome to the Admin Dashboard!" });
});

module.exports = router;
