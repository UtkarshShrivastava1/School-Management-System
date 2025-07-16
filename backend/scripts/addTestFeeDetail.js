// Usage: node scripts/addTestFeeDetail.js
// Adds a test fee detail and fee record for a specific student and class

const mongoose = require('mongoose');
const Student = require('../models/StudentModel');
const Class = require('../models/ClassModel');
const Fee = require('../models/FeeModel');

const MONGO_URI = 'mongodb://localhost:27017/school_management'; // Change if needed

// Replace with your actual IDs
const studentId = '683c7d27d7eb64ba8c30219d';
const classId = '686ad6ab2964092c05c65124';

async function addTestFeeDetail() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const student = await Student.findById(studentId);
    if (!student) throw new Error('Student not found');
    const classDoc = await Class.findById(classId);
    if (!classDoc) throw new Error('Class not found');

    // Add feeDetails for the class if missing
    if (!student.feeDetails) student.feeDetails = new Map();
    let feeDetails = student.feeDetails.get(classId) || {};
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const baseFee = classDoc.baseFee || 1000;
    const monthlyFee = baseFee / 12;
    const totalAmount = monthlyFee;
    feeDetails = {
      ...feeDetails,
      classFee: baseFee,
      monthlyFee,
      totalAmount,
      status: 'paid',
      lastUpdated: now,
      dueDate: now,
      lateFeePerDay: 0,
      lateFeeAmount: 0,
      academicYear: `${currentYear}`,
      month: `${currentMonth}`,
      year: currentYear,
      paidMonth: `${currentMonth}`,
      paidYear: currentYear,
      currentMonth: `${currentMonth}`,
      currentYear: currentYear,
      paymentDate: now,
      paymentMethod: 'cash',
      receiptNumber: `RCPT${Math.floor(Math.random()*100000)}`,
      paymentHistory: [
        {
          month: `${currentMonth}`,
          year: currentYear,
          amount: totalAmount,
          status: 'paid',
          paymentDate: now,
          transactionId: `TXN${Math.floor(Math.random()*100000)}`
        }
      ],
      feeHistory: [
        {
          month: `${currentMonth}`,
          year: currentYear,
          baseFee,
          monthlyFee,
          lateFeeAmount: 0,
          totalAmount,
          status: 'paid',
          dueDate: now,
          paymentDate: now
        }
      ],
      gracePeriodUsed: false,
      remindersSent: 0
    };
    student.feeDetails.set(classId, feeDetails);
    await student.save();
    console.log('Updated student feeDetails');

    // Add a Fee record
    const fee = new Fee({
      student: student._id,
      class: classDoc._id,
      academicYear: `${currentYear}`,
      feeType: 'monthly',
      amount: monthlyFee,
      dueDate: now,
      status: 'paid',
      paymentDate: now,
      paymentMethod: 'cash',
      totalAmount,
      createdBy: null // Set to an admin _id if needed
    });
    await fee.save();
    console.log('Created Fee record');

    await mongoose.disconnect();
    console.log('Done!');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

addTestFeeDetail(); 