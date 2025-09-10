const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    // Basic Information
    studentName: { type: String, required: true, trim: true },
    studentID: { type: String, required: true, unique: true, trim: true },
    studentPassword: { type: String, required: true, select: false }, // 🔒 hidden
    studentEmail: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    studentPhone: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{10}$/, "Phone number must be 10 digits"],
    },
    studentAddress: { type: String, required: true, trim: true },
    studentDOB: { type: Date, required: true },
    studentGender: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Other"],
    },
    studentDateOfAdmission: { type: Date, default: Date.now },

    studentFatherName: { type: String, required: true, trim: true },
    studentMotherName: { type: String, required: true, trim: true },

    religion: { type: String, trim: true },
    category: { type: String, trim: true },
    bloodgroup: { type: String, trim: true },

    photo: { type: String, default: "" },

    // Parent link
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent",
      required: true,
    },

    // Admission workflow
    requestedClass: { type: String, trim: true }, // intended grade
    status: {
      type: String,
      enum: ["active", "inactive", "pending_class_assignment"],
      default: "pending_class_assignment",
    },

    registeredBy: {
      adminID: String,
      name: String,
    },

    emergencyContact: {
      name: String,
      relation: String,
      phone: {
        type: String,
        match: [/^\d{10}$/, "Phone number must be 10 digits"],
      },
    },

    actionHistory: [{ type: String }],

    AADHARnumber: { type: String, trim: true },

    lastLogin: { type: Date },
    loginHistory: [{ type: Date }],

    role: { type: String, default: "student" },

    isActive: { type: Boolean, default: true },
    admissionDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Helpful indexes
studentSchema.index({ parent: 1 });
studentSchema.index({ studentEmail: 1 }, { unique: true });
studentSchema.index({ studentID: 1 }, { unique: true });
studentSchema.index({ role: 1, isActive: 1 });
studentSchema.index({ status: 1 });
studentSchema.index({ requestedClass: 1 });

// Hide sensitive fields in JSON
studentSchema.set("toJSON", {
  transform: (_, ret) => {
    delete ret.studentPassword;
    return ret;
  },
});

module.exports = mongoose.model("Student", studentSchema);
