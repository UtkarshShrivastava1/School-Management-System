const mongoose = require("mongoose");

const STAGES = ["preprimary", "primary", "secondary", "senior_secondary"];
const SECTIONS = ["A", "B", "C", "D", "E"];

// Central catalog for grades (extend as needed)
const GRADE_CATALOG = [
  { code: "PN", label: "Pre-Nursery", order: 0, stage: "preprimary" },
  { code: "NUR", label: "Nursery", order: 1, stage: "preprimary" },
  { code: "LKG", label: "LKG", order: 2, stage: "preprimary" },
  { code: "UKG", label: "UKG", order: 3, stage: "preprimary" },
  { code: "C1", label: "Class 1", order: 4, stage: "primary" },
  { code: "C2", label: "Class 2", order: 5, stage: "primary" },
  { code: "C3", label: "Class 3", order: 6, stage: "primary" },
  { code: "C4", label: "Class 4", order: 7, stage: "primary" },
  { code: "C5", label: "Class 5", order: 8, stage: "primary" },
  { code: "C6", label: "Class 6", order: 9, stage: "secondary" },
  { code: "C7", label: "Class 7", order: 10, stage: "secondary" },
  { code: "C8", label: "Class 8", order: 11, stage: "secondary" },
  { code: "C9", label: "Class 9", order: 12, stage: "secondary" },
  { code: "C10", label: "Class 10", order: 13, stage: "secondary" },
  { code: "C11", label: "Class 11", order: 14, stage: "senior_secondary" },
  { code: "C12", label: "Class 12", order: 15, stage: "senior_secondary" },
];

const byCode = Object.fromEntries(GRADE_CATALOG.map((g) => [g.code, g]));

const classSchema = new mongoose.Schema(
  {
    stage: { type: String, enum: STAGES, required: true },
    gradeCode: { type: String, required: true, uppercase: true, trim: true }, // e.g., LKG
    gradeLabel: { type: String, required: true, trim: true }, // e.g., "LKG"
    gradeOrder: { type: Number, required: true }, // e.g., 2
    section: { type: String, enum: SECTIONS, required: true },

    // Legacy-friendly fields (optional if you used these in UI)
    className: { type: String, required: true, trim: true }, // e.g., "LKG" or "Class 1"

    // Unique identifier for class+section (optionally include year)
    classId: { type: String, required: true, unique: true, trim: true },

    // Fees
    baseFee: { type: Number, default: 0, min: 0 },
    lateFeePerDay: { type: Number, default: 0, min: 0 },
    feeDueDate: { type: Date, default: null },

    feeHistory: [
      {
        academicYear: { type: String, required: true },
        baseFee: { type: Number, required: true },
        lateFeePerDay: { type: Number, required: true },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Admin",
          required: true,
        },
        updatedAt: { type: Date, default: Date.now },
        reason: { type: String, trim: true },
      },
    ],

    currentAcademicYear: {
      type: String,
      default: () => new Date().getFullYear().toString(),
    },

    feeSettings: {
      monthlyFeeCalculation: {
        type: String,
        enum: ["baseFee", "custom"],
        default: "baseFee",
      },
      customMonthlyFee: { type: Number, default: 0 },
      feeFrequency: {
        type: String,
        enum: ["monthly", "quarterly", "annually"],
        default: "monthly",
      },
      gracePeriod: { type: Number, default: 5, min: 0 },
      autoGenerateFees: { type: Boolean, default: true },
    },

    classStrength: { type: Number, required: true, min: 1 },

    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],

    attendanceHistory: [
      {
        date: { type: Date, required: true },
        records: [
          {
            studentId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Student",
              required: true,
            },
            status: {
              type: String,
              enum: ["Present", "Absent"],
              required: true,
            },
          },
        ],
      },
    ],
  },
  { timestamps: true, versionKey: "version" }
);

// Ensure unique students array
classSchema.pre("save", function (next) {
  if (this.isModified("students") && Array.isArray(this.students)) {
    this.students = [...new Set(this.students.map((id) => id.toString()))];
  }
  next();
});

// Auto-fill stage/label/order/className from gradeCode (safety net)
classSchema.pre("validate", function (next) {
  if (this.gradeCode && byCode[this.gradeCode]) {
    const g = byCode[this.gradeCode];
    this.stage = this.stage || g.stage;
    this.gradeLabel = this.gradeLabel || g.label;
    this.gradeOrder = this.gradeOrder ?? g.order;
    this.className = this.className || g.label; // keeps compatibility with older UI
  }
  next();
});

classSchema.methods.calculateMonthlyFee = function () {
  if (this.feeSettings.monthlyFeeCalculation === "custom") {
    return this.feeSettings.customMonthlyFee;
  }
  return Math.ceil(this.baseFee / 12);
};

classSchema.methods.updateFeeHistory = function (adminId, reason = "") {
  this.feeHistory.push({
    academicYear: this.currentAcademicYear,
    baseFee: this.baseFee,
    lateFeePerDay: this.lateFeePerDay,
    updatedBy: adminId,
    reason,
  });
};

// Indexes
classSchema.index({ gradeOrder: 1, section: 1 }, { unique: false });
classSchema.index({ gradeCode: 1, section: 1 }, { unique: true }); // one section per grade
classSchema.index({ classId: 1 }, { unique: true }); // global unique code

module.exports = mongoose.model("Class", classSchema);
