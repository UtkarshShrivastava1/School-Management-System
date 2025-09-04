const mongoose = require("mongoose");

const STAGES = ["preprimary", "primary", "secondary", "senior_secondary"];

const ClassTemplateSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    }, // "LKG", "C1", "C11"
    label: { type: String, required: true, trim: true }, // "LKG", "Class 1", "Class 11"
    order: { type: Number, required: true }, // sort order across all grades
    stage: { type: String, enum: STAGES, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ClassTemplateSchema.index({ order: 1 });
module.exports = mongoose.model("ClassTemplate", ClassTemplateSchema);
