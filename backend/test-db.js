const mongoose = require('mongoose');
const Student = require('./models/StudentModel');
const Class = require('./models/ClassModel');

async function testDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/school_management');
    console.log('Connected to database');
    
    const students = await Student.find().limit(5);
    const classes = await Class.find().limit(5);
    
    console.log('\n=== STUDENTS ===');
    students.forEach(s => {
      console.log(`ID: ${s._id}`);
      console.log(`Name: ${s.studentName}`);
      console.log(`Enrolled Classes: ${s.enrolledClasses.length}`);
      console.log(`Fee Details: ${s.feeDetails ? 'Has fee details' : 'No fee details'}`);
      if (s.feeDetails && s.feeDetails instanceof Map) {
        console.log(`Fee Details Map size: ${s.feeDetails.size}`);
      }
      console.log('---');
    });
    
    console.log('\n=== CLASSES ===');
    classes.forEach(c => {
      console.log(`ID: ${c._id}`);
      console.log(`Name: ${c.className}`);
      console.log(`Base Fee: ${c.baseFee}`);
      console.log(`Late Fee: ${c.lateFeePerDay}`);
      console.log('---');
    });
    
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

testDatabase(); 