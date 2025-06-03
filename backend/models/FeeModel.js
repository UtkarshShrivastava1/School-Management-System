const mongoose = require("mongoose");

const feeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
    },
    feeType: {
      type: String,
      enum: ["monthly", "exam", "transport", "other"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue"],
      default: "pending",
    },
    paymentDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: ["online", "cash", "cheque"],
    },
    transactionId: {
      type: String,
    },
    receiptNumber: {
      type: String,
      unique: true,
    },
    lateFeeAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
    },
    paymentDetails: {
      bankName: String,
      accountNumber: String,
      chequeNumber: String,
      onlinePaymentDetails: {
        gateway: String,
        transactionReference: String,
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  { timestamps: true }
);

// Generate receipt number before saving
feeSchema.pre("save", async function (next) {
  if (!this.receiptNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    const timestamp = Date.now().toString().slice(-4);
    this.receiptNumber = `RCP${year}${month}${day}${random}${timestamp}`;
  }
  next();
});

module.exports = mongoose.model("Fee", feeSchema); 