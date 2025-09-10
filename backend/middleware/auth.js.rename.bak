const jwt = require("jsonwebtoken");
const Admin = require("../models/AdminModel");
const Teacher = require("../models/TeacherModel");
const Student = require("../models/StudentModel");
const Parent = require("../models/ParentModel");

/** Extract Bearer token from header or cookie */
function getToken(req) {
  const h = req.header("Authorization");
  if (h && h.startsWith("Bearer ")) return h.slice(7);
  if (req.cookies && req.cookies.token) return req.cookies.token;
  return null;
}

/** Load a user doc by role + id and attach to req */
async function attachUser(req, role, id) {
  let Model = null,
    key = null;
  switch (role) {
    case "admin":
      Model = Admin;
      key = "admin";
      break;
    case "teacher":
      Model = Teacher;
      key = "teacher";
      break;
    case "student":
      Model = Student;
      key = "student";
      break;
    case "parent":
      Model = Parent;
      key = "parent";
      break;
    default:
      return null;
  }
  const user = await Model.findById(id);
  if (!user) return null;
  req[key] = user; // e.g. req.admin / req.teacher
  req.user = { id: user._id, role }; // normalized accessor
  return user;
}

/** Core guard: must be authenticated; optionally restrict to allowed roles */
function requireRoles(allowedRoles = []) {
  const allowAny = !allowedRoles || allowedRoles.length === 0;
  return async (req, res, next) => {
    try {
      const token = getToken(req);
      if (!token) {
        return res
          .status(401)
          .json({ message: "Authentication token not found. Please log in." });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({ message: "Token has expired" });
        }
        return res.status(401).json({ message: "Invalid token" });
      }

      const { id, role } = decoded || {};
      if (!id || !role) {
        return res.status(401).json({ message: "Invalid token payload" });
      }

      if (!allowAny && !allowedRoles.includes(role)) {
        return res.status(403).json({ message: "Unauthorized role" });
      }

      const user = await attachUser(req, role, id);
      if (!user) {
        return res
          .status(404)
          .json({ message: "User not found. Please log in again." });
      }

      return next();
    } catch (e) {
      console.error("Auth error:", e);
      return res
        .status(500)
        .json({ message: "Server error during authentication" });
    }
  };
}

/** Convenience wrappers (backwards-compatible names) */
const protect = requireRoles([]); // any authenticated role
const authorize = (...roles) => requireRoles(roles);
const verifyAdminToken = requireRoles(["admin"]);
const verifyTeacherToken = requireRoles(["teacher"]);
const verifyStudentToken = requireRoles(["student"]);
const verifyParentToken = requireRoles(["parent"]);
const verifyAdminOrTeacherToken = requireRoles(["admin", "teacher"]);

// For your new routes use this alias:
const requireAdmin = verifyAdminToken;

module.exports = {
  // generic
  protect,
  authorize,
  requireRoles,
  // specific
  verifyAdminToken,
  verifyTeacherToken,
  verifyStudentToken,
  verifyParentToken,
  verifyAdminOrTeacherToken,
  // alias used in controllers/routes I shared
  requireAdmin,
};
