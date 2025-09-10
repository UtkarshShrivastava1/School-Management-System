const mongoose = require("mongoose");

const SectionSchema = new mongoose.Schema(
  {
    academicClassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicClass",
      required: true,
      index: true,
    },
    name: { type: String, required: true, uppercase: true, trim: true }, // "A", "B"
    capacity: { type: Number, default: 40, min: 1 },
    room: { type: String, trim: true },
    meta: { type: mongoose.Schema.Types.Mixed },

    // NEW: class teacher for the section
    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
    },

    // optional: starting roll offset for numbering
    rollStart: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// unique section name within an academicClass
SectionSchema.index({ academicClassId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Section", SectionSchema);
