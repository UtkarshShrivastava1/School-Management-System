const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const parentSchema = new mongoose.Schema(
  {
    parentName: { type: String, required: true, trim: true },

    parentContactNumber: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{10}$/, "Parent contact number must be 10 digits"],
    },

    parentEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid parent email"],
    },

    parentID: {
      type: String,
      required: true,
      unique: true,
      match: [/^PRNT\d{5}$/, "Parent ID must follow the pattern PRNT12345"],
      index: true,
    },

    parentPassword: { type: String, required: true, select: false },

    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "active",
      index: true,
    },
    isActive: { type: Boolean, default: true }, // optional redundancy

    parentAddress: { type: String, default: "" },
    parentOccupation: { type: String, default: "" },
    parentIncome: { type: Number },
    parentEducation: { type: String, default: "" },

    parentPhoto: { type: String, default: "" },

    // top-level relationship optional; child-level is canonical
    relationship: { type: String, default: "Parent" },

    children: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
        relationship: { type: String, required: true },
      },
    ],

    emergencyContact: {
      name: { type: String, trim: true },
      relation: { type: String, trim: true },
      phone: {
        type: String,
        trim: true,
        match: [/^\d{10}$/, "Must be 10 digits"],
      },
    },

    actionHistory: [{ type: String }],
    lastLogin: { type: Date },
    loginHistory: [{ type: Date }],
  },
  { timestamps: true }
);

// Indexes
parentSchema.index({ parentEmail: 1 });
parentSchema.index({ parentContactNumber: 1 });

// Hash password
parentSchema.pre("save", async function (next) {
  if (!this.isModified("parentPassword")) return next();
  const salt = await bcrypt.genSalt(10);
  this.parentPassword = await bcrypt.hash(this.parentPassword, salt);
  next();
});

parentSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.parentPassword);
};

// Hide sensitive
parentSchema.set("toJSON", {
  transform: (_, ret) => {
    delete ret.parentPassword;
    return ret;
  },
});

const Parent = mongoose.models.Parent || mongoose.model("Parent", parentSchema);
module.exports = Parent;
