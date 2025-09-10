const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    file: { type: String }, // Path to PDF or image, optional
    recipientGroup: {
      type: String,
      enum: ["teachers", "students", "parents", "all"],
      required: true,
    },
    creator: {
      adminID: { type: String, required: true },
      name: { type: String, required: true },
    },
  },
  { timestamps: true }
);

const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
module.exports = Notification; 