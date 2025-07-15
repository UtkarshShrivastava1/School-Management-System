const mongoose = require('mongoose');
const Student = require('./models/StudentModel');
const Class = require('./models/ClassModel');
const Parent = require('./models/ParentModel');
const Fee = require('./models/FeeModel');

async function createParentTestData() {
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
    
    // Create test parents
    const testParents = [
      {
        parentName: "John Smith",
        parentID: "PAR001",
        parentContactNumber: "9876543210",
        parentEmail: "john.smith@test.com",
        relationship: "Father",
        parentPassword: "password123",
        occupation: "Engineer",
        address: "123 Main Street, City"
      },
      {
        parentName: "Sarah Johnson",
        parentID: "PAR002", 
        parentContactNumber: "9876543211",
        parentEmail: "sarah.johnson@test.com",
        relationship: "Mother",
        parentPassword: "password123",
        occupation: "Teacher",
        address: "456 Oak Avenue, City"
      }
    ];
    
    const createdParents = [];
    for (const parentData of testParents) {
      let parent = await Parent.findOne({ parentID: parentData.parentID });
      if (!parent) {
        parent = new Parent(parentData);
        await parent.save();
        console.log(`Created parent: ${parentData.parentName}`);
      } else {
        console.log(`Parent ${parentData.parentName} already exists`);
      }
      createdParents.push(parent);
    }
    
    // Create test students for each parent
    const testStudents = [
      {
        studentName: "Emma Smith",
        studentID: "STU001",
        studentEmail: "emma.smith@test.com",
        studentPhone: "9876543220",
        studentAddress: "123 Main Street, City",
        studentDOB: new Date("2010-01-15"),
        studentGender: "Female",
        studentFatherName: "John Smith",
        studentMotherName: "Mary Smith",
        parent: createdParents[0]._id,
        enrolledClasses: [classes[0]._id], // Class 1
        studentPassword: "password123"
      },
      {
        studentName: "Michael Smith",
        studentID: "STU002",
        studentEmail: "michael.smith@test.com",
        studentPhone: "9876543221",
        studentAddress: "123 Main Street, City",
        studentDOB: new Date("2012-03-20"),
        studentGender: "Male",
        studentFatherName: "John Smith",
        studentMotherName: "Mary Smith",
        parent: createdParents[0]._id,
        enrolledClasses: [classes[1]._id], // Class 2
        studentPassword: "password123"
      },
      {
        studentName: "Sophia Johnson",
        studentID: "STU003",
        studentEmail: "sophia.johnson@test.com",
        studentPhone: "9876543222",
        studentAddress: "456 Oak Avenue, City",
        studentDOB: new Date("2011-07-10"),
        studentGender: "Female",
        studentFatherName: "David Johnson",
        studentMotherName: "Sarah Johnson",
        parent: createdParents[1]._id,
        enrolledClasses: [classes[2]._id], // Class 3
        studentPassword: "password123"
      }
    ];
    
    const createdStudents = [];
    for (const studentData of testStudents) {
      let student = await Student.findOne({ studentID: studentData.studentID });
      if (!student) {
        student = new Student(studentData);
        await student.save();
        console.log(`Created student: ${studentData.studentName}`);
      } else {
        console.log(`Student ${studentData.studentName} already exists`);
      }
      createdStudents.push(student);
    }
    
    // Update parents with children
    for (let i = 0; i < createdParents.length; i++) {
      const parent = createdParents[i];
      const parentStudents = createdStudents.filter(s => s.parent.toString() === parent._id.toString());
      
      parent.children = parentStudents.map(student => ({
        student: student._id,
        relationship: "Child"
      }));
      
      await parent.save();
      console.log(`Updated parent ${parent.parentName} with ${parentStudents.length} children`);
    }
    
    // Create fee records for each student
    const currentYear = new Date().getFullYear().toString();
    for (const student of createdStudents) {
      const classDoc = await Class.findById(student.enrolledClasses[0]);
      if (!classDoc) continue;
      
      // Check if fee already exists
      const existingFee = await Fee.findOne({
        student: student._id,
        class: classDoc._id,
        academicYear: currentYear,
        feeType: 'monthly'
      });
      
      if (!existingFee) {
        const monthlyFee = classDoc.baseFee / 12;
        const fee = new Fee({
          student: student._id,
          class: classDoc._id,
          academicYear: currentYear,
          feeType: 'monthly',
          amount: monthlyFee,
          totalAmount: monthlyFee,
          dueDate: classDoc.feeDueDate,
          status: 'pending',
          description: `Monthly fee for ${classDoc.className}`,
          createdBy: null // Will be set by admin
        });
        
        await fee.save();
        console.log(`Created fee for ${student.studentName} in ${classDoc.className}`);
      } else {
        console.log(`Fee already exists for ${student.studentName} in ${classDoc.className}`);
      }
    }
    
    // Create some overdue fees for testing
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - 15); // 15 days ago
    
    for (const student of createdStudents.slice(0, 2)) { // First 2 students get overdue fees
      const classDoc = await Class.findById(student.enrolledClasses[0]);
      if (!classDoc) continue;
      
      const monthlyFee = classDoc.baseFee / 12;
      const daysLate = Math.ceil((new Date() - overdueDate) / (1000 * 60 * 60 * 24));
      const lateFeeAmount = daysLate * classDoc.lateFeePerDay;
      
      const overdueFee = new Fee({
        student: student._id,
        class: classDoc._id,
        academicYear: (currentYear - 1).toString(), // Last year
        feeType: 'monthly',
        amount: monthlyFee,
        totalAmount: monthlyFee + lateFeeAmount,
        lateFeeAmount: lateFeeAmount,
        dueDate: overdueDate,
        status: 'overdue',
        description: `Overdue monthly fee for ${classDoc.className}`,
        createdBy: null
      });
      
      await overdueFee.save();
      console.log(`Created overdue fee for ${student.studentName}`);
    }
    
    // Create some paid fees for testing
    for (const student of createdStudents.slice(1, 2)) { // Second student gets a paid fee
      const classDoc = await Class.findById(student.enrolledClasses[0]);
      if (!classDoc) continue;
      
      const monthlyFee = classDoc.baseFee / 12;
      const paidDate = new Date();
      paidDate.setDate(paidDate.getDate() - 5); // 5 days ago
      
      const paidFee = new Fee({
        student: student._id,
        class: classDoc._id,
        academicYear: (currentYear - 1).toString(),
        feeType: 'monthly',
        amount: monthlyFee,
        totalAmount: monthlyFee,
        dueDate: new Date(paidDate.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days before payment
        status: 'paid',
        paymentDate: paidDate,
        paymentMethod: 'online',
        transactionId: 'TXN' + Date.now(),
        description: `Paid monthly fee for ${classDoc.className}`,
        createdBy: null
      });
      
      await paidFee.save();
      console.log(`Created paid fee for ${student.studentName}`);
    }
    
    await mongoose.connection.close();
    console.log('\n=== TEST DATA CREATED SUCCESSFULLY ===');
    console.log('Parents created:', createdParents.length);
    console.log('Students created:', createdStudents.length);
    console.log('Classes updated with fee settings');
    console.log('Fee records created for testing');
    console.log('\nYou can now test the parent pay-fee functionality!');
    
  } catch (error) {
    console.error('Error creating test data:', error);
  }
}

createParentTestData(); 