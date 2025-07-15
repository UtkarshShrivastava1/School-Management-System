const mongoose = require('mongoose');
const Student = require('./models/StudentModel');
const Class = require('./models/ClassModel');
const Parent = require('./models/ParentModel');

async function createTestData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/school_management');
    console.log('Connected to database');
    
    // First, let's update classes with fee settings
    const classes = await Class.find();
    console.log(`Found ${classes.length} classes`);
    
    for (let i = 0; i < classes.length; i++) {
      const classDoc = classes[i];
      classDoc.baseFee = 12000; // ₹12,000 per year
      classDoc.lateFeePerDay = 50; // ₹50 per day
      classDoc.feeDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      classDoc.section = "A"; // Add required section
      classDoc.classStrength = 30; // Add required class strength
      await classDoc.save();
      console.log(`Updated ${classDoc.className} with fee settings`);
    }
    
    // Create a test parent if none exists
    let parent = await Parent.findOne();
    if (!parent) {
      parent = new Parent({
        parentName: "Test Parent",
        parentContactNumber: "1234567890",
        parentEmail: "parent@test.com",
        relationship: "Father",
        parentPassword: "password123"
      });
      await parent.save();
      console.log('Created test parent');
    }
    
    // Create test students
    const testStudents = [
      {
        studentName: "John Doe",
        studentID: "STU001",
        studentEmail: "john@test.com",
        studentPhone: "9876543210",
        studentAddress: "123 Test Street",
        studentDOB: new Date("2010-01-01"),
        studentGender: "Male",
        studentFatherName: "Test Parent",
        studentMotherName: "Test Mother",
        parent: parent._id,
        enrolledClasses: [classes[0]._id], // Enroll in Class 1
        studentPassword: "password123"
      },
      {
        studentName: "Jane Smith",
        studentID: "STU002",
        studentEmail: "jane@test.com",
        studentPhone: "9876543211",
        studentAddress: "456 Test Avenue",
        studentDOB: new Date("2010-02-01"),
        studentGender: "Female",
        studentFatherName: "Test Parent",
        studentMotherName: "Test Mother",
        parent: parent._id,
        enrolledClasses: [classes[0]._id], // Enroll in Class 1
        studentPassword: "password123"
      },
      {
        studentName: "Bob Johnson",
        studentID: "STU003",
        studentEmail: "bob@test.com",
        studentPhone: "9876543212",
        studentAddress: "789 Test Road",
        studentDOB: new Date("2009-03-01"),
        studentGender: "Male",
        studentFatherName: "Test Parent",
        studentMotherName: "Test Mother",
        parent: parent._id,
        enrolledClasses: [classes[1]._id], // Enroll in Class 2
        studentPassword: "password123"
      }
    ];
    
    for (const studentData of testStudents) {
      const existingStudent = await Student.findOne({ studentID: studentData.studentID });
      if (!existingStudent) {
        const student = new Student(studentData);
        await student.save();
        console.log(`Created student: ${studentData.studentName}`);
      } else {
        console.log(`Student ${studentData.studentName} already exists`);
      }
    }
    
    await mongoose.connection.close();
    console.log('Test data created successfully');
  } catch (error) {
    console.error('Error creating test data:', error);
  }
}

createTestData(); 