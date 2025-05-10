const jwt = require("jsonwebtoken");
const Admin = require("../models/AdminModel");
const Teacher = require("../models/TeacherModel");
const Student = require("../models/StudentModel");
const Parent = require("../models/ParentModel");

// Helper function to verify JWT and role
const verifyTokenAndRole = async (req, res, next, role) => {
  // Look for token in multiple places
  const authHeader = req.header("Authorization");
  let token;
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.replace("Bearer ", "");
  } else if (req.cookies && req.cookies.token) {
    // Check cookies as fallback
    token = req.cookies.token;
  }
  
  const headerRole = req.header("X-User-Role");
  console.log("Authorization Header:", authHeader);
  console.log("Token received:", token ? "Token exists" : "No token");
  console.log("Header Role:", headerRole);
  console.log("Required Role:", role);

  if (!token) {
    console.error("No token provided. Authorization denied.");
    return res.status(401).json({ message: "Authentication token not found. Please log in again." });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded);
    
    // Get user ID and provided role
    const userId = decoded.id;
    const tokenRole = decoded.role;
    
    // Check if either token role or header role matches required role
    const roleMatches = tokenRole === role || headerRole === role;

    if (!roleMatches) {
      console.error(`Role mismatch. Token role: ${tokenRole}, Header role: ${headerRole}, Required role: ${role}`);
      return res.status(403).json({ message: "Unauthorized role. Please log in with correct credentials." });
    }

    // Fetch user based on role with proper error handling
    let loggedInUser;
    try {
      if (role === "admin") {
        loggedInUser = await Admin.findById(userId);
      } else if (role === "teacher") {
        loggedInUser = await Teacher.findById(userId);
      } else if (role === "student") {
        loggedInUser = await Student.findById(userId);
      } else if (role === "parent") {
        loggedInUser = await Parent.findById(userId);
      }
    } catch (dbError) {
      console.error(`Database error finding ${role}:`, dbError);
      return res.status(500).json({ message: "Error retrieving user data. Please try again." });
    }

    if (!loggedInUser) {
      console.error(`${role} with ID ${userId} not found in database`);
      return res.status(404).json({
        message: "User not found. Please log in again.",
      });
    }

    // Attach user to request
    req[role] = loggedInUser;
    req.user = { id: loggedInUser._id, role: role };
    
    console.log(`${role.charAt(0).toUpperCase() + role.slice(1)} authenticated successfully:`, {
      id: loggedInUser._id,
      role: role,
      name: loggedInUser.name || loggedInUser.studentName || loggedInUser.parentName || loggedInUser.teacherName
    });
    
    next();
  } catch (error) {
    handleTokenError(error, res);
  }
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

// Middleware instances
const verifyAdminToken = (req, res, next) => {
  verifyTokenAndRole(req, res, next, "admin");
};

const verifyTeacherToken = (req, res, next) => {
  verifyTokenAndRole(req, res, next, "teacher");
};

const verifyStudentToken = (req, res, next) => {
  verifyTokenAndRole(req, res, next, "student");
};

const verifyParentToken = (req, res, next) => {
  verifyTokenAndRole(req, res, next, "parent");
};

module.exports = {
  verifyAdminToken,
  verifyTeacherToken,
  verifyStudentToken,
  verifyParentToken,
};