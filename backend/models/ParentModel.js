const mongoose = require("mongoose");

const parentSchema = new mongoose.Schema(
  {
    parentName: { type: String, required: true },
    parentContactNumber: { type: String, required: true },
    parentEmail: { type: String, required: true, unique: false },
    parentID: {
      type: String,
      required: true,
      unique: true,
      match: /^PRNT\d{5}$/, // Parent ID format (e.g., PRNT12345)
    },
    parentPassword: { type: String, required: true }, // Hashed password for security
    children: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" }, // Reference to the Student
        relationship: {
          type: String,
          required: true,
        },
      },
    ], // Array of references to Student with relationship type
  },
  { timestamps: true }
);

const Parent = mongoose.models.Parent || mongoose.model("Parent", parentSchema);

module.exports = Parent;
