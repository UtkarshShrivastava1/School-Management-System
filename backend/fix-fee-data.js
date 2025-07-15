const mongoose = require('mongoose');
const Fee = require('./models/FeeModel');
const Student = require('./models/StudentModel');
const Class = require('./models/ClassModel');

async function fixFeeData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/school_management');
    console.log('Connected to database');
    
    // Find all fee records
    const fees = await Fee.find();
    console.log(`Found ${fees.length} fee records`);
    
    let invalidFees = 0;
    let fixedFees = 0;
    let deletedFees = 0;
    
    for (const fee of fees) {
      console.log(`\nChecking fee: ${fee._id}`);
      console.log(`Student: ${fee.student}`);
      console.log(`Class: ${fee.class}`);
      console.log(`Status: ${fee.status}`);
      
      let hasIssues = false;
      
      // Check if student exists
      if (!fee.student) {
        console.log('❌ Fee has no student reference');
        hasIssues = true;
      } else {
        const studentExists = await Student.findById(fee.student);
        if (!studentExists) {
          console.log('❌ Student referenced in fee does not exist');
          hasIssues = true;
        } else {
          console.log(`✅ Student exists: ${studentExists.studentName}`);
        }
      }
      
      // Check if class exists
      if (!fee.class) {
        console.log('❌ Fee has no class reference');
        hasIssues = true;
      } else {
        const classExists = await Class.findById(fee.class);
        if (!classExists) {
          console.log('❌ Class referenced in fee does not exist');
          hasIssues = true;
        } else {
          console.log(`✅ Class exists: ${classExists.className}`);
        }
      }
      
      if (hasIssues) {
        invalidFees++;
        
        // Try to fix the fee by finding valid student and class
        if (!fee.student || !fee.class) {
          console.log('Attempting to fix fee...');
          
          // Find a valid student and class to use
          const validStudent = await Student.findOne();
          const validClass = await Class.findOne();
          
          if (validStudent && validClass) {
            fee.student = validStudent._id;
            fee.class = validClass._id;
            fee.description = `Fixed fee for ${validStudent.studentName} in ${validClass.className}`;
            
            try {
              await fee.save();
              console.log('✅ Fee fixed successfully');
              fixedFees++;
            } catch (error) {
              console.log('❌ Failed to fix fee:', error.message);
              // Delete the invalid fee
              await Fee.findByIdAndDelete(fee._id);
              console.log('🗑️ Deleted invalid fee');
              deletedFees++;
            }
          } else {
            console.log('❌ No valid student or class found, deleting fee');
            await Fee.findByIdAndDelete(fee._id);
            deletedFees++;
          }
        }
      } else {
        console.log('✅ Fee is valid');
      }
    }
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total fees: ${fees.length}`);
    console.log(`Invalid fees: ${invalidFees}`);
    console.log(`Fixed fees: ${fixedFees}`);
    console.log(`Deleted fees: ${deletedFees}`);
    console.log(`Valid fees: ${fees.length - invalidFees}`);
    
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error fixing fee data:', error);
  }
}

fixFeeData(); 