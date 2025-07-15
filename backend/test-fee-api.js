const mongoose = require('mongoose');
const Fee = require('./models/FeeModel');
const Student = require('./models/StudentModel');
require('dotenv').config();

async function testFeeAPI() {
  try {
    // Use the same database connection logic as the main server
    const isProduction = process.env.NODE_ENV === "production";
    const mongoURI = isProduction
      ? process.env.MONGO_ATLAS_URI
      : process.env.MONGO_LOCAL_URI || 'mongodb://localhost:27017/school_management';
    
    console.log(`🔗 Connecting to: ${isProduction ? 'Production (Atlas)' : 'Local MongoDB'}`);
    
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to database');
    
    // Get all fee records
    const allFees = await Fee.find().populate('student', 'studentName studentID').populate('class', 'className');
    console.log(`\n📊 Total fee records in database: ${allFees.length}`);
    
    if (allFees.length === 0) {
      console.log('❌ No fee records found');
      return;
    }
    
    // Group fees by student
    const feesByStudent = {};
    allFees.forEach(fee => {
      const studentId = fee.student._id.toString();
      if (!feesByStudent[studentId]) {
        feesByStudent[studentId] = {
          student: fee.student,
          fees: []
        };
      }
      feesByStudent[studentId].fees.push(fee);
    });
    
    console.log(`\n👥 Students with fees: ${Object.keys(feesByStudent).length}`);
    
    // Test the API logic for each student
    for (const [studentId, data] of Object.entries(feesByStudent)) {
      console.log(`\n=== TESTING STUDENT: ${data.student.studentName} (${data.student.studentID}) ===`);
      
      // Group fees by class
      const feesByClass = {};
      data.fees.forEach(fee => {
        const classId = fee.class._id.toString();
        if (!feesByClass[classId]) {
          feesByClass[classId] = {
            class: fee.class,
            fees: []
          };
        }
        feesByClass[classId].fees.push(fee);
      });
      
      for (const [classId, classData] of Object.entries(feesByClass)) {
        console.log(`\n📚 Class: ${classData.class.className}`);
        
        // Sort fees by due date (descending)
        const sortedFees = classData.fees.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
        
        // Current fee (most recent)
        const currentFee = sortedFees[0];
        console.log(`   Current Fee: ${currentFee ? `${currentFee.status} - ₹${currentFee.amount}` : 'None'}`);
        
        // Payment history (paid or under_process)
        const paymentHistory = sortedFees.filter(fee => fee.status === 'paid' || fee.status === 'under_process');
        console.log(`   Payment History: ${paymentHistory.length} records`);
        
        paymentHistory.forEach((payment, index) => {
          console.log(`     ${index + 1}. ${payment.status} - ₹${payment.amount} - ${new Date(payment.dueDate).toLocaleDateString()}`);
          if (payment.paymentDate) {
            console.log(`        Paid on: ${new Date(payment.paymentDate).toLocaleDateString()}`);
          }
          if (payment.paymentMethod) {
            console.log(`        Method: ${payment.paymentMethod}`);
          }
          if (payment.transactionId) {
            console.log(`        Transaction: ${payment.transactionId}`);
          }
        });
        
        // All fee history
        console.log(`   Total Fee Records: ${sortedFees.length}`);
        sortedFees.forEach((fee, index) => {
          console.log(`     ${index + 1}. ${fee.status} - ₹${fee.amount} - Due: ${new Date(fee.dueDate).toLocaleDateString()}`);
        });
      }
    }
    
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testFeeAPI(); 