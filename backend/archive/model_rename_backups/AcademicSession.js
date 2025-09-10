const mongoose = require("mongoose");

const AcademicSessionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // e.g. "2024–25"
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

AcademicSessionSchema.index({ isActive: 1 });

module.exports = mongoose.model("AcademicSession", AcademicSessionSchema);
