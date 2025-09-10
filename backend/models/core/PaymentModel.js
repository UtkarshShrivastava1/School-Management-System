const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },
    fee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fee",
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "online", "cheque"],
      required: true
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending"
    },
    receiptNumber: {
      type: String,
      unique: true
    },
    paymentDetails: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

// Create indexes for better query performance
paymentSchema.index({ student: 1 });
paymentSchema.index({ fee: 1 });
paymentSchema.index({ paymentDate: 1 });
paymentSchema.index({ status: 1 });

// Generate receipt number before saving
paymentSchema.pre("save", async function (next) {
  if (!this.receiptNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    const timestamp = Date.now().toString().slice(-4);
    this.receiptNumber = `RCP${year}${month}${day}${random}${timestamp}`;
  }
  next();
});

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment; 