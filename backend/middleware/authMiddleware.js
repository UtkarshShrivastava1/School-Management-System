const jwt = require("jsonwebtoken");
const Admin = require("../models/AdminModel");
const Teacher = require("../models/TeacherModel");
const Student = require("../models/StudentModel");
const Parent = require("../models/ParentModel");

// Verify student token
const verifyStudentToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "student") {
      return res.status(401).json({ message: "Invalid token role" });
    }

    const student = await Student.findById(decoded.id).select("-password");
    if (!student) {
      return res.status(401).json({ message: "Student not found" });
    }

    req.student = student;
    next();
  } catch (error) {
    console.error("Student token verification error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

// Verify parent token
const verifyParentToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "parent") {
      return res.status(401).json({ message: "Invalid token role" });
    }

    const parent = await Parent.findById(decoded.id).select("-password");
    if (!parent) {
      return res.status(401).json({ message: "Parent not found" });
    }

    req.parent = parent;
    next();
  } catch (error) {
    console.error("Parent token verification error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

// Verify teacher token
const verifyTeacherToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "teacher") {
      return res.status(401).json({ message: "Invalid token role" });
    }

    const teacher = await Teacher.findById(decoded.id).select("-password");
    if (!teacher) {
      return res.status(401).json({ message: "Teacher not found" });
    }

    req.teacher = teacher;
    next();
  } catch (error) {
    console.error("Teacher token verification error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

// Verify admin token
const verifyAdminToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    console.log("Decoded token payload:", jwt.decode(token));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(401).json({ message: "Invalid token role: expected 'admin', got '" + decoded.role + "'" });
    }

    let admin = null;
    
    // First try to use the adminID from the token if available
    if (decoded.adminID) {
      console.log("Looking for admin with adminID from token:", decoded.adminID);
      admin = await Admin.findOne({ adminID: decoded.adminID }).select("-password");
    }
    
    // If admin not found or no adminID in token, try with MongoDB _id
    if (!admin) {
      console.log("Looking for admin with ID:", decoded.id);
      admin = await Admin.findById(decoded.id).select("-password");
    }
    
    // If admin still not found but the ID looks like an admin ID, try one more time
    if (!admin && decoded.id && typeof decoded.id === 'string' && decoded.id.startsWith('ADM')) {
      console.log("Admin not found by _id, trying with adminID:", decoded.id);
      admin = await Admin.findOne({ adminID: decoded.id }).select("-password");
    }
    
    if (!admin) {
      console.error("Admin not found with ID:", decoded.id);
      return res.status(401).json({ message: "Admin not found with the provided token" });
    }

    console.log("Admin found:", admin.adminID);
    req.admin = admin;
    next();
  } catch (error) {
    console.error("Admin token verification error:", error);
    res.status(401).json({ message: "Invalid token: " + error.message });
  }
};

module.exports = {
  verifyStudentToken,
  verifyParentToken,
  verifyTeacherToken,
  verifyAdminToken
};
