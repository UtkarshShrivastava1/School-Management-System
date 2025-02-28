const jwt = require("jsonwebtoken");
const Admin = require("../models/AdminModel");
const Teacher = require("../models/TeacherModel");
const Student = require("../models/StudentModel");
const Parent = require("../models/ParentModel");

// Helper function to verify JWT and role
const verifyTokenAndRole = async (req, res, next, role) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  console.log("Authorization Header:", req.header("Authorization"));
  console.log("Token received:", token);

  if (!token) {
    console.error("No token provided. Authorization denied.");
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded);

    // Check if the role matches
    if (decoded.role !== role) {
      return res
        .status(403)
        .json({ message: `Unauthorized role, ${role} access required` });
    }

    // Fetch specific fields based on role
    let loggedInUser;
    if (role === "admin") {
      loggedInUser = await Admin.findById(decoded.id, "name adminID");
    } else if (role === "teacher") {
      loggedInUser = await Teacher.findById(decoded.id, "name teacherID");
    } else if (role === "student") {
      loggedInUser = await Student.findById(decoded.id, "name studentID");
    } else if (role === "parent") {
      loggedInUser = await Parent.findById(decoded.id, "name parentID");
    } else {
      return res.status(400).json({ message: "Role not supported" });
    }

    if (!loggedInUser) {
      return res.status(404).json({
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} not found`,
      });
    }

    req[role] = loggedInUser; // Attach the partial document with required fields
    console.log(
      `${
        role.charAt(0).toUpperCase() + role.slice(1)
      } data attached to request:`,
      req[role]
    );
    next();
  } catch (error) {
    handleTokenError(error, res);
  }
};

// Middleware for admin verification
const verifyAdminToken = (req, res, next) => {
  verifyTokenAndRole(req, res, next, "admin");
};

// Middleware for teacher verification
const verifyTeacherToken = (req, res, next) => {
  verifyTokenAndRole(req, res, next, "teacher");
};

// Middleware for student verification
const verifyStudentToken = (req, res, next) => {
  verifyTokenAndRole(req, res, next, "student");
};

// Middleware for parent verification
const verifyParentToken = (req, res, next) => {
  verifyTokenAndRole(req, res, next, "parent");
};

// Common error handler for JWT verification issues
const handleTokenError = (error, res) => {
  console.error("Error verifying token:", error);

  if (error.name === "TokenExpiredError") {
    console.error("Token has expired");
    return res.status(401).json({ message: "Token has expired" });
  }
  if (error.name === "JsonWebTokenError") {
    console.error("Token is not valid");
    return res.status(401).json({ message: "Token is not valid" });
  }

  console.error("Token verification failed", error.message);
  return res
    .status(500)
    .json({ message: "Token verification failed", error: error.message });
};

module.exports = {
  verifyAdminToken,
  verifyTeacherToken,
  verifyStudentToken,
  verifyParentToken,
};
