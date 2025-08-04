const mongoose = require("mongoose");
const Class = require("../models/ClassModel");
require("dotenv").config();

const initializeClasses = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGO_ATLAS_URI ||
        "mongodb://localhost:27017/school_management"
    );
    console.log("Connected to MongoDB");

    // Create standard classes
    const standardClasses = Array.from({ length: 12 }, (_, i) => ({
      className: `Class ${i + 1}`,
      classId: `CLASS${i + 1}`,
      subjects: [],
      students: [],
      teachers: [],
      attendanceHistory: [],
    }));

    // Insert classes if they don't exist
    for (const classData of standardClasses) {
      const existingClass = await Class.findOne({
        className: classData.className,
      });
      if (!existingClass) {
        await Class.create(classData);
        console.log(`Created ${classData.className}`);
      } else {
        console.log(`${classData.className} already exists`);
      }
    }

    console.log("Class initialization completed");
    process.exit(0);
  } catch (error) {
    console.error("Error initializing classes:", error);
    process.exit(1);
  }
};

initializeClasses();
