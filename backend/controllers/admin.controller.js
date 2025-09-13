const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
const Admin = require("../models/AdminModel");
const generateToken = require("../config/generateToken");

/* ---------------------------------- Helpers --------------------------------- */

// shape safe response (ensures schema toJSON transform runs for masking)
const formatAdminData = (admin) => {
  const a = typeof admin.toJSON === "function" ? admin.toJSON() : admin;
  return {
    adminID: a.adminID,
    name: a.name,
    email: a.email,
    phone: a.phone,
    designation: a.designation,
    address: a.address,
    dob: a.dob,
    gender: a.gender,
    religion: a.religion,
    category: a.category,
    bloodgroup: a.bloodgroup,
    department: a.department,
    role: a.role,
    photo: a.photo,
    emergencyContact: a.emergencyContact,
    experience: a.experience,
    highestQualification: a.highestQualification,
    AADHARnumber: a.AADHARnumber,
    lastLogin: a.lastLogin,
    loginHistory: a.loginHistory,
    actionHistory: a.actionHistory,
    salary: a.salary,
    bankDetails: a.bankDetails,
    feedbackScore: a.feedbackScore,
    registeredBy: a.registeredBy,
    isActive: a.isActive,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
};

// generate unique adminID like ADM1234
const generateAdminID = async () => {
  let id, exists;
  do {
    id = `ADM${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`;
    exists = await Admin.findOne({ adminID: id }).lean();
  } while (exists);
  return id;
};

// safe date cast
const castDate = (val) => {
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d;
};

/* ----------------------- Validation formatting helpers ---------------------- */
const formatExpressValidatorErrors = (result) =>
  result.array().map((e) => ({
    field: e.param,
    message: e.msg,
    value: e.value,
    location: e.location,
  }));

const formatMongooseValidationErrors = (err) =>
  Object.values(err.errors || {}).map((e) => ({
    field: e.path,
    message: e.message,
    value: e.value,
    location: "body",
  }));

const formatDuplicateKeyError = (err) => {
  // e.g. E11000 duplicate key error collection: admins index: email_1 dup key: { email: "a@b.com" }
  const errors = [];
  if (err && err.code === 11000 && err.keyValue) {
    for (const [field, value] of Object.entries(err.keyValue)) {
      errors.push({
        field,
        message: `${field} already exists`,
        value,
        location: "body",
      });
    }
  }
  return errors;
};

const sendValidation = (res, errors, status = 400, msg = "Validation error") =>
  res.status(status).json({ message: msg, errors });

/* -------------------------------- Controllers ------------------------------- */

/**
 * POST /api/admin/auth/createadmin
 * Note: model pre-save hook hashes the password; pass plain text here.
 */
const createAdmin = async (req, res, next) => {
  // express-validator safeguard
  const vResult = validationResult(req);
  if (!vResult.isEmpty()) {
    return sendValidation(res, formatExpressValidatorErrors(vResult));
  }

  const loggedInAdmin = req.admin;
  if (!loggedInAdmin)
    return res.status(400).json({ message: "Logged-in admin not found" });

  try {
    const {
      name,
      email,
      phone,
      designation,
      address,
      dob,
      gender,
      department,
      religion,
      category,
      bloodgroup,
      role,
      emergencyContact,
      experience,
      highestQualification,
      AADHARnumber,
      salary,
      bankDetails,
    } = req.body;

    const photo = req.file ? req.file.filename : undefined;

    // 🔎 Parse multipart JSON fields if they arrived as strings
    const parseErrors = [];
    let parsedEmergency = emergencyContact;
    let parsedBank = bankDetails;

    if (typeof emergencyContact === "string") {
      try {
        parsedEmergency = JSON.parse(emergencyContact);
      } catch {
        parseErrors.push({
          field: "emergencyContact",
          message:
            "Invalid JSON in emergencyContact. Send a JSON string or proper object.",
          value: emergencyContact,
          location: "body",
        });
      }
    }
    if (typeof bankDetails === "string") {
      try {
        parsedBank = JSON.parse(bankDetails);
      } catch {
        parseErrors.push({
          field: "bankDetails",
          message:
            "Invalid JSON in bankDetails. Send a JSON string or proper object.",
          value: bankDetails,
          location: "body",
        });
      }
    }
    if (parseErrors.length) return sendValidation(res, parseErrors);

    // 🔁 Uniqueness check: email
    const existing = await Admin.findOne({ email }).lean();
    if (existing) {
      return sendValidation(res, [
        {
          field: "email",
          message: "Admin with this email already exists",
          value: email,
          location: "body",
        },
      ]);
    }

    const adminID = await generateAdminID();
    const defaultPassword = "admin123"; // hashed by pre-save

    const newAdmin = await Admin.create({
      name,
      email,
      phone,
      designation,
      address,
      dob,
      gender,
      department,
      religion,
      category,
      bloodgroup,
      role: role || "admin",
      adminID,
      password: defaultPassword, // plain → hashed by pre-save
      photo,
      emergencyContact: parsedEmergency || undefined,
      experience: isNaN(Number(experience)) ? 0 : Number(experience),
      highestQualification: highestQualification || "",
      AADHARnumber: AADHARnumber || "",
      salary: isNaN(Number(salary)) ? 0 : Number(salary),
      bankDetails: parsedBank || undefined,
      registeredBy: {
        adminID: loggedInAdmin.adminID,
        name: loggedInAdmin.name,
      },
    });

    const token = generateToken(newAdmin._id, "admin");

    return res.status(201).json({
      message: "Admin created successfully",
      token,
      data: formatAdminData(newAdmin),
      ...(process.env.NODE_ENV !== "production" ? { defaultPassword } : {}),
    });
  } catch (err) {
    // 🧰 Provide super-informative validation output
    if (err?.name === "ValidationError") {
      return sendValidation(res, formatMongooseValidationErrors(err));
    }
    if (err?.code === 11000) {
      const dup = formatDuplicateKeyError(err);
      if (dup.length) return sendValidation(res, dup);
    }

    console.error("Error creating admin:", err);
    return next ? next(err) : res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/admin/auth/login
 */
const loginAdmin = async (req, res) => {
  const vResult = validationResult(req);
  if (!vResult.isEmpty())
    return sendValidation(res, formatExpressValidatorErrors(vResult));

  const { adminID, password } = req.body;

  try {
    if (!adminID || !password) {
      return sendValidation(
        res,
        [
          !adminID && {
            field: "adminID",
            message: "adminID is required",
            value: adminID,
            location: "body",
          },
          !password && {
            field: "password",
            message: "password is required",
            value: password,
            location: "body",
          },
        ].filter(Boolean)
      );
    }

    const admin = await Admin.findOne({ adminID }).select("+password");
    if (!admin) {
      return sendValidation(res, [
        { field: "adminID", message: "Invalid credentials", value: adminID },
      ]);
    }

    if (admin.isActive === false) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    if (typeof admin.isLocked === "function" && admin.isLocked()) {
      return res
        .status(423)
        .json({ message: "Account locked. Try again later." });
    }

    if (!admin.password) {
      return res
        .status(500)
        .json({ message: "Password not set for this admin" });
    }

    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) {
      admin.failedLoginAttempts = (admin.failedLoginAttempts || 0) + 1;
      if (admin.failedLoginAttempts >= 5) {
        admin.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await admin.save();
      return sendValidation(res, [
        { field: "password", message: "Invalid credentials", value: "******" },
      ]);
    }

    admin.failedLoginAttempts = 0;
    admin.lockUntil = null;
    admin.lastLogin = new Date();
    admin.loginHistory.push(admin.lastLogin);
    await admin.save();

    const token = generateToken(admin._id, "admin");

    return res.status(200).json({
      message: "Login successful",
      token,
      role: "admin",
      data: formatAdminData(admin),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

/**
 * POST /api/admin/auth/validate
 */
const validateToken = async (req, res) => {
  try {
    if (!req.admin) return res.status(401).json({ error: "Invalid token" });
    return res.status(200).json({ name: req.admin.name });
  } catch (err) {
    console.error("validateToken error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * GET /api/admin/auth/adminprofile
 */
const getProfile = async (req, res) => {
  try {
    const id = req.admin?.id;
    if (!id)
      return sendValidation(res, [
        {
          field: "token",
          message: "Admin ID missing in token",
          location: "headers",
        },
      ]);

    const admin = await Admin.findById(id);
    if (!admin)
      return sendValidation(
        res,
        [{ field: "admin", message: "Admin not found", value: id }],
        404,
        "Not found"
      );

    return res.status(200).json({ admin: formatAdminData(admin) });
  } catch (err) {
    console.error("getProfile error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * PUT /api/admin/auth/updateadmininfo
 */
const updateAdmin = async (req, res) => {
  const vResult = validationResult(req);
  if (!vResult.isEmpty())
    return sendValidation(res, formatExpressValidatorErrors(vResult));

  try {
    // Disallow immutable/sensitive fields changes
    for (const bad of ["role", "registeredBy"]) {
      if (bad in req.body) {
        return sendValidation(res, [
          { field: bad, message: `Not allowed to change ${bad}` },
        ]);
      }
    }

    const {
      adminID,
      email,
      phone,
      name,
      designation,
      department,
      address,
      dob,
      gender,
      religion,
      category,
      bloodgroup,
      emergencyContact,
      experience,
      highestQualification,
      AADHARnumber,
      salary,
      bankDetails,
      isActive,
    } = req.body;

    if (!adminID) {
      return sendValidation(res, [
        { field: "adminID", message: "adminID is required" },
      ]);
    }

    const photo = req.file ? req.file.filename : null;

    const admin = await Admin.findOne({ adminID });
    if (!admin)
      return sendValidation(
        res,
        [{ field: "adminID", message: "Admin not found", value: adminID }],
        404,
        "Not found"
      );

    // email uniqueness if changed
    if (email && email !== admin.email) {
      const emailInUse = await Admin.findOne({ email });
      if (emailInUse) {
        return sendValidation(res, [
          { field: "email", message: "Email is already in use", value: email },
        ]);
      }
      admin.email = email;
    }

    if (typeof phone !== "undefined") admin.phone = phone;
    if (typeof name !== "undefined") admin.name = name;
    if (typeof designation !== "undefined") admin.designation = designation;
    if (typeof department !== "undefined") admin.department = department;
    if (typeof address !== "undefined") admin.address = address;

    if (typeof dob !== "undefined") {
      const d = castDate(dob);
      if (!d)
        return sendValidation(res, [
          { field: "dob", message: "Invalid DOB", value: dob },
        ]);
      admin.dob = d;
    }

    if (typeof gender !== "undefined") admin.gender = gender;
    if (typeof religion !== "undefined") admin.religion = religion;
    if (typeof category !== "undefined") admin.category = category;
    if (typeof bloodgroup !== "undefined") admin.bloodgroup = bloodgroup;

    // allow JSON strings for nested objects too
    let parsedEmergency = emergencyContact;
    let parsedBank = bankDetails;
    const parseErrors = [];
    if (typeof emergencyContact === "string") {
      try {
        parsedEmergency = JSON.parse(emergencyContact);
      } catch {
        parseErrors.push({
          field: "emergencyContact",
          message: "Invalid JSON",
          value: emergencyContact,
        });
      }
    }
    if (typeof bankDetails === "string") {
      try {
        parsedBank = JSON.parse(bankDetails);
      } catch {
        parseErrors.push({
          field: "bankDetails",
          message: "Invalid JSON",
          value: bankDetails,
        });
      }
    }
    if (parseErrors.length) return sendValidation(res, parseErrors);

    if (typeof parsedEmergency !== "undefined") {
      admin.emergencyContact = {
        name: parsedEmergency?.name ?? admin.emergencyContact?.name,
        relation: parsedEmergency?.relation ?? admin.emergencyContact?.relation,
        phone: parsedEmergency?.phone ?? admin.emergencyContact?.phone,
      };
    }

    if (typeof experience !== "undefined") admin.experience = experience;
    if (typeof highestQualification !== "undefined")
      admin.highestQualification = highestQualification;
    if (typeof AADHARnumber !== "undefined") admin.AADHARnumber = AADHARnumber;
    if (typeof salary !== "undefined") admin.salary = salary;

    if (typeof parsedBank !== "undefined") {
      admin.bankDetails = {
        accountNumber:
          parsedBank?.accountNumber ?? admin.bankDetails?.accountNumber,
        bankName: parsedBank?.bankName ?? admin.bankDetails?.bankName,
        ifscCode: parsedBank?.ifscCode ?? admin.bankDetails?.ifscCode,
      };
    }

    if (typeof isActive !== "undefined") admin.isActive = !!isActive;
    if (photo) admin.photo = photo;

    const updated = await admin.save();
    return res.status(200).json({
      message: "Admin information updated successfully",
      admin: formatAdminData(updated),
    });
  } catch (err) {
    if (err?.name === "ValidationError") {
      return sendValidation(res, formatMongooseValidationErrors(err));
    }
    if (err?.code === 11000) {
      const dup = formatDuplicateKeyError(err);
      if (dup.length) return sendValidation(res, dup);
    }

    console.error("updateAdmin error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * PUT /api/admin/auth/changeadminpassword
 */
const changePassword = async (req, res) => {
  const vResult = validationResult(req);
  if (!vResult.isEmpty())
    return sendValidation(res, formatExpressValidatorErrors(vResult));

  try {
    const { newPassword, currentPassword } = req.body;
    const adminIdFromToken = req.admin?.id;
    if (!adminIdFromToken)
      return res.status(401).json({ message: "Unauthorized" });

    const admin = await Admin.findById(adminIdFromToken).select("+password");
    if (!admin) {
      return sendValidation(
        res,
        [
          {
            field: "admin",
            message: "Admin not found",
            value: adminIdFromToken,
          },
        ],
        404,
        "Not found"
      );
    }

    if (typeof currentPassword === "string" && currentPassword.length > 0) {
      const ok = await bcrypt.compare(currentPassword, admin.password || "");
      if (!ok)
        return sendValidation(res, [
          {
            field: "currentPassword",
            message: "Current password is incorrect",
          },
        ]);
    }

    if (admin.password) {
      const sameAsOld = await bcrypt.compare(newPassword, admin.password);
      if (sameAsOld)
        return sendValidation(res, [
          {
            field: "newPassword",
            message: "New password must be different from the old one",
          },
        ]);
    }

    admin.password = newPassword; // pre-save hook re-hashes
    await admin.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    if (err?.name === "ValidationError") {
      return sendValidation(res, formatMongooseValidationErrors(err));
    }
    console.error("changePassword error:", err);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
};

/* --------------------------------- Exports ---------------------------------- */

module.exports = {
  createAdmin,
  loginAdmin,
  validateToken,
  getProfile,
  updateAdmin,
  changePassword,
};
