const mongoose = require('mongoose');
const Student = require('../models/StudentModel');
const Class = require('../models/ClassModel');

const fixStudentEnrollment = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management');
    console.log('Connected to MongoDB');

    // Find the student by ID
    const student = await Student.findById('681ddf591f9708e99162b3c3');
    if (!student) {
      console.log('Student not found');
      process.exit(1);
    }

    // Find Class 2
    const class2 = await Class.findOne({ className: 'Class 2' });
    if (!class2) {
      console.log('Class 2 not found');
      process.exit(1);
    }

    // Update student's enrolledClasses to only include Class 2
    student.enrolledClasses = [class2._id];
    await student.save();
    console.log('Updated student enrollment');

    // Remove student from Class 1
    await Class.updateOne(
      { className: 'Class 1' },
      { $pull: { students: student._id } }
    );
    console.log('Removed student from Class 1');

    // Add student to Class 2 if not already there
    await Class.updateOne(
      { _id: class2._id },
      { $addToSet: { students: student._id } }
    );
    console.log('Added student to Class 2');

    console.log('Successfully fixed student enrollment');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixStudentEnrollment(); 