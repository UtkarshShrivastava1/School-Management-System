const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// --- Helpers ---
function hidePII(_, ret) {
  delete ret.password;
  if (ret.bankDetails) {
    // mask account number
    if (ret.bankDetails.accountNumber) {
      const acc = ret.bankDetails.accountNumber;
      ret.bankDetails.accountNumber =
        acc.length > 4 ? acc.slice(-4).padStart(acc.length, "•") : "••••";
    }
  }
  return ret;
}

const AdminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{10}$/, "Phone number must be 10 digits"],
    },

    designation: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    dob: { type: Date, required: true },

    gender: { type: String, required: true, enum: ["Male", "Female", "Other"] },

    religion: { type: String, default: "", trim: true },
    category: { type: String, default: "", trim: true },
    bloodgroup: { type: String, default: "", trim: true },

    department: { type: String, required: true, trim: true },

    role: { type: String, enum: ["admin"], default: "admin", index: true },

    adminID: {
      type: String,
      required: true,
      unique: true,
      match: /^ADM\d{4}$/,
      trim: true,
      index: true,
    },

    // 🔒 security
    password: { type: String, required: true, select: false },

    photo: { type: String, default: "" },

    emergencyContact: {
      name: { type: String, trim: true },
      relation: { type: String, trim: true },
      phone: {
        type: String,
        match: [/^\d{10}$/, "Phone number must be 10 digits"],
      },
    },

    experience: { type: Number, min: 0 },
    highestQualification: { type: String, trim: true },
    AADHARnumber: { type: String, trim: true },

    lastLogin: { type: Date },
    loginHistory: [{ type: Date }],

    actionHistory: [{ type: String }],

    salary: { type: Number, min: 0 },

    bankDetails: {
      accountNumber: { type: String, trim: true },
      bankName: { type: String, trim: true },
      ifscCode: { type: String, trim: true },
    },

    feedbackScore: { type: Number, min: 0, max: 5 },

    isActive: { type: Boolean, default: true, index: true },

    failedLoginAttempts: { type: Number, default: 0, min: 0 },
    lockUntil: { type: Date, default: null },
    lastPasswordChange: { type: Date },

    twoFactor: {
      enabled: { type: Boolean, default: false },
      method: {
        type: String,
        enum: ["totp", "email", "sms"],
        default: "email",
      },
      secret: { type: String, select: false }, // for TOTP if used
    },

    // Who created this admin (optional for first super admin)
    registeredBy: {
      adminID: { type: String },
      name: { type: String },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: hidePII },
    toObject: { virtuals: true, transform: hidePII },
  }
);

// --- Indexes ---
AdminSchema.index({ email: 1 }, { unique: true });
AdminSchema.index({ adminID: 1 }, { unique: true });
AdminSchema.index({ role: 1, isActive: 1 });

// --- Password hashing ---
AdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.lastPasswordChange = new Date();
  next();
});

// For findOneAndUpdate password changes
AdminSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate() || {};
  const $set = update.$set || update;
  if ($set.password) {
    const salt = await bcrypt.genSalt(10);
    $set.password = await bcrypt.hash($set.password, salt);
    $set.lastPasswordChange = new Date();
  }
  next();
});

// --- Methods ---
AdminSchema.methods.checkPassword = function (plain) {
  // Ensure you selected +password in your query before calling this
  return bcrypt.compare(plain, this.password);
};

AdminSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > new Date();
};

// Export
const Admin = mongoose.models.Admin || mongoose.model("Admin", AdminSchema);
module.exports = Admin;
