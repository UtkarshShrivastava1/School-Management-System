const jwt = require("jsonwebtoken");
const Admin = require("../models/AdminModel");
const Teacher = require("../models/TeacherModel");
const Student = require("../models/StudentModel");
const Parent = require("../models/ParentModel");

// Helper function to verify JWT and role
const verifyTokenAndRole = async (req, res, next, roles) => {
  // Look for token in multiple places
  const authHeader = req.header("Authorization");
  let token;
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.replace("Bearer ", "");
  } else if (req.cookies && req.cookies.token) {
    // Check cookies as fallback
    token = req.cookies.token;
  }
  
  console.log("Authorization Header:", authHeader);
  console.log("Token received:", token ? "Token exists" : "No token");
  console.log("Required Roles:", Array.isArray(roles) ? roles : [roles]);

  if (!token) {
    console.error("No token provided. Authorization denied.");
    return res.status(401).json({ message: "Authentication token not found. Please log in again." });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded);
    
    // Get user ID and token role
    const userId = decoded.id;
    const tokenRole = decoded.role;
    
    // Convert single role to array for consistent handling
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    // Check if token role matches any of the required roles
    if (!allowedRoles.includes(tokenRole)) {
      console.error(`Role mismatch. Token role: ${tokenRole}, Required roles: ${allowedRoles.join(', ')}`);
      return res.status(403).json({ message: "Unauthorized role. Please log in with correct credentials." });
    }

    // Fetch user based on role with proper error handling
    let loggedInUser;
    try {
      if (tokenRole === "admin") {
        loggedInUser = await Admin.findById(userId);
      } else if (tokenRole === "teacher") {
        loggedInUser = await Teacher.findById(userId);
      } else if (tokenRole === "student") {
        loggedInUser = await Student.findById(userId);
      } else if (tokenRole === "parent") {
        loggedInUser = await Parent.findById(userId);
        console.log("Parent user fetched:", loggedInUser ? {
          id: loggedInUser._id,
          parentID: loggedInUser.parentID,
          name: loggedInUser.parentName
        } : "Not found");
      }
    } catch (dbError) {
      console.error(`Database error finding ${tokenRole}:`, dbError);
      return res.status(500).json({ message: "Error retrieving user data. Please try again." });
    }

    if (!loggedInUser) {
      console.error(`${tokenRole} with ID ${userId} not found in database`);
      return res.status(404).json({
        message: "User not found. Please log in again.",
      });
    }

    // Attach user to request
    req[tokenRole] = loggedInUser;
    req.user = { id: loggedInUser._id, role: tokenRole };
    
    // Make sure we log the entire req.parent object if we're dealing with a parent
    if (tokenRole === "parent") {
      console.log("Setting req.parent:", {
        _id: loggedInUser._id,
        parentID: loggedInUser.parentID,
        parentName: loggedInUser.parentName,
        hasParentPassword: !!loggedInUser.parentPassword
      });
    }
    
    console.log(`${tokenRole.charAt(0).toUpperCase() + tokenRole.slice(1)} authenticated successfully:`, {
      id: loggedInUser._id,
      role: tokenRole,
      name: loggedInUser.name || loggedInUser.studentName || loggedInUser.parentName || loggedInUser.teacherName
    });
    
    next();
  } catch (error) {
    console.error("Teacher token verification error:", error);
    res.status(401).json({ message: "Invalid token" });
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

// New middleware for multiple roles
const verifyAdminOrTeacherToken = (req, res, next) => {
  verifyTokenAndRole(req, res, next, ["admin", "teacher"]);
};

// Protect routes - verify token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized to access this route" });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user based on role
      let user;
      switch (decoded.role) {
        case "admin":
          user = await Admin.findById(decoded.id);
          if (user) req.admin = user;
          break;
        case "parent":
          user = await Parent.findById(decoded.id);
          if (user) req.parent = user;
          break;
        case "student":
          user = await Student.findById(decoded.id);
          if (user) req.student = user;
          break;
        case "teacher":
          user = await Teacher.findById(decoded.id);
          if (user) req.teacher = user;
          break;
      }

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Add user role to request
      req.user = {
        id: user._id,
        role: decoded.role,
      };

      next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized to access this route" });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Authorize by role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized to access this route" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }

    next();
  };
};

module.exports = {
  verifyStudentToken,
  verifyAdminToken,
  verifyTeacherToken,
  verifyParentToken,
  verifyAdminOrTeacherToken,
  protect,
  authorize,
};