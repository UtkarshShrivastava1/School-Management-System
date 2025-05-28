const bcrypt = require("bcryptjs");
const Student = require("../models/StudentModel"); // Import Student model
const Parent = require("../models/ParentModel"); // Import Parent model
const generateToken = require("../config/generateToken"); // Helper for JWT token generation
const { validationResult } = require("express-validator"); // For input validation
const Class = require("../models/ClassModel");
const jwt = require("jsonwebtoken");
//================================================================================================================================
// Function to generate a unique studentID
const generateStudentID = async () => {
  let newID;
  let existingStudent;
  do {
    newID = `STU${Math.floor(10000 + Math.random() * 90000)}`; // Generate a unique student ID starting with "STU" and 5 digits
    existingStudent = await Student.findOne({ studentID: newID });
  } while (existingStudent);
  return newID;
};

// Function to generate a unique parentID
const generateParentID = async () => {
  let newID;
  let existingParent;
  do {
    newID = `PRNT${Math.floor(10000 + Math.random() * 90000)}`; // Generate a unique parent ID starting with "PARENT"
    existingParent = await Parent.findOne({ parentID: newID });
  } while (existingParent);
  return newID;
};

//============================================================================================================

exports.createStudent = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('Validation errors in createStudent:', errors.array());
    return res.status(400).json({
      message: "Validation failed.",
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }

  try {
    // Get logged-in admin data (assuming it's available in `req.admin`)
    const loggedInAdmin = req.admin;
    if (!loggedInAdmin) {
      console.error('Logged-in admin not found in request');
      return res.status(400).json({ message: "Logged-in admin not found" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    student.studentPassword = await bcrypt.hash(newPassword, salt);

    // Add to action history
    student.actionHistory.push("Password changed");

    await student.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
};

// Create Student (Admin function)
const createStudent = async (req, res) => {
  try {
    const {
      studentName,
      studentEmail,
      studentPhone,
      studentAddress,
      studentDOB,
      studentGender,
      parentName,
      parentContactNumber,
      parentEmail,
      parentAddress,
      parentOccupation,
      studentFatherName,
      studentMotherName,
      relationship,
      religion,
      category,
      bloodgroup,
      className,
    } = req.body;

    console.log('Received request body:', req.body);
    console.log('Received files:', req.files);

    // Handle student photo
    const photo = req.files && req.files.photo ? req.files.photo[0].filename : null;
    
    // Handle parent photo if it exists in req.files
    let parentPhoto = null;
    if (req.files && req.files.parentPhoto) {
      parentPhoto = req.files.parentPhoto[0].filename;
    }

    // Generate IDs for student and parent
    const studentID = await generateStudentID();
    const parentID = await generateParentID();

    // Find or create the class
    let classDoc = await Class.findOne({ className });
    if (!classDoc) {
      classDoc = new Class({
        className,
        classId: `CLASS${className.split(' ')[1]}`,
        subjects: [],
        students: [],
        teachers: [],
        attendanceHistory: []
      });
      await classDoc.save();
    }

    // Plain text passwords (before hashing)
    const studentPlainPassword = "student@123";
    const parentPlainPassword = "parent@123";

    // Hash the passwords before saving to database
    const studentPassword = await bcrypt.hash(studentPlainPassword, 10);
    const parentPassword = await bcrypt.hash(parentPlainPassword, 10);

    // Check if student or parent email already exists
    const existingStudent = await Student.findOne({ studentEmail });
    const existingParent = await Parent.findOne({ parentEmail });

    if (existingStudent) {
      return res.status(400).json({ message: "Student email already exists." });
    }
    if (existingParent) {
      return res.status(400).json({ message: "Parent email already exists." });
    }

    // Create new Student document
    const newStudent = new Student({
      studentName,
      photo,
      studentID,
      studentPassword,
      studentEmail,
      studentPhone,
      studentAddress,
      studentDOB,
      studentGender,
      studentDateOfAdmission,
      studentFatherName,
      studentMotherName,
      religion,
      category,
      bloodgroup,
      enrolledClasses: [classDoc._id], // Add the class to enrolledClasses
      registeredBy: {
        adminID: loggedInAdmin.adminID,
        name: loggedInAdmin.name,
      },
    });

    // Save student to database
    const savedStudent = await newStudent.save();

    // Add student to class's students array
    classDoc.students.push(savedStudent._id);
    await classDoc.save();

    // Create new Parent document
    const newParent = new Parent({
      parentName,
      parentContactNumber,
      parentEmail,
      parentID,
      parentPassword,
      address: parentAddress || "",
      occupation: parentOccupation || "",
      relationship: relationship || "Parent",
      photo: parentPhoto || "",
      children: [
        {
          student: savedStudent._id,
          relationship: relationship,
        },
      ],
    });

    // Save parent to database
    const savedParent = await newParent.save();

    // Update student with parent reference
    savedStudent.parent = savedParent._id;
    await savedStudent.save();

    // Respond with success message and all details
    res.status(201).json({
      message: "Student and Parent profiles created successfully.",
      student: {
        id: savedStudent._id,
        studentID: savedStudent.studentID,
        name: savedStudent.studentName,
        email: savedStudent.studentEmail,
        phone: savedStudent.studentPhone,
        address: savedStudent.studentAddress,
        dob: savedStudent.studentDOB,
        gender: savedStudent.studentGender,
        dateOfAdmission: savedStudent.studentDateOfAdmission,
        fatherName: savedStudent.studentFatherName,
        motherName: savedStudent.studentMotherName,
        religion: savedStudent.religion,
        category: savedStudent.category,
        bloodgroup: savedStudent.bloodgroup,
        studentPassword: studentPlainPassword,
        photo: savedStudent.photo,
        parentID: savedParent.parentID,
        registeredBy: savedStudent.registeredBy,
        className: className, // Add className to the response
      },
      parent: {
        id: savedParent._id,
        parentID: savedParent.parentID,
        name: savedParent.parentName,
        contactNumber: savedParent.parentContactNumber,
        parentPassword: parentPlainPassword,
        email: savedParent.parentEmail,
        address: savedParent.address,
        occupation: savedParent.occupation,
        relationship: savedParent.relationship,
        photo: savedParent.photo,
        children: savedParent.children.map((child) => ({
          student: savedStudent.studentName,
          relationship: child.relationship,
        })),
      },
    });
  } catch (error) {
    console.error("Error creating student and parent:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

//-----------------------------------------------------------------------------------------------------
// Controller for logging in students
const studentLogin = async (req, res) => {
  try {
  const { studentID, password } = req.body;

  if (!studentID || !password) {
      return res.status(400).json({ message: "All fields are required" });
  }

    const student = await Student.findOne({ studentID });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      student.studentPassword
    );

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Generate JWT token with explicit role
    const token = generateToken(student._id, "student");

    // Return success response with token and student details
    res.json({
      token,
      role: "student", // Explicitly include role in response
      student: {
        studentID: student.studentID,
        studentName: student.studentName,
        studentEmail: student.studentEmail,
        photo: student.photo,
        role: "student", // Ensure role is set in student object
      },
    });
  } catch (error) {
    console.error("Student login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//==================================================================================================

// Controller for fetching all students
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate({
        path: 'parent',
        select: 'parentName parentID parentEmail parentContactNumber',
        model: 'Parent'
      })
      .populate({
        path: 'enrolledClasses',
        select: 'className classId',
        model: 'Class'
      })
      .select('-studentPassword');

    res.json({
      message: "Students fetched successfully",
      students: students.map(student => ({
        ...student.toObject(),
        enrolledClasses: student.enrolledClasses.map(cls => ({
          className: cls.className,
          classId: cls.classId
        }))
      }))
    });
  } catch (error) {
    console.error("Get all students error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
//================================================================================================================================

// Add this new function to clean up duplicate enrollments
exports.cleanupDuplicateEnrollments = async (req, res) => {
  try {
    console.log("Starting cleanup of duplicate enrollments...");
    
    // Start a session for transaction
    const session = await Student.startSession();
    session.startTransaction();

    try {
      // Find all students
      const students = await Student.find({}).session(session);
      let fixedCount = 0;

      for (const student of students) {
        if (student.enrolledClasses && student.enrolledClasses.length > 1) {
          console.log(`Found student ${student.studentID} in multiple classes:`, student.enrolledClasses);
            
            // Keep only the most recent class
          const mostRecentClass = student.enrolledClasses[student.enrolledClasses.length - 1];
            
          // Remove student from all classes
            await Class.updateMany(
              { students: student._id },
              { $pull: { students: student._id } },
              { session }
            );
            
          // Add student to the correct class
            await Class.findByIdAndUpdate(
              mostRecentClass,
              { $addToSet: { students: student._id } },
              { session }
            );
            
            // Update student's enrolledClasses
            student.enrolledClasses = [mostRecentClass];
            await student.save({ session });
            
            fixedCount++;
            console.log(`Fixed student ${student.studentID} - now in class ${mostRecentClass}`);
        }
      }

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        message: `Fixed ${fixedCount} students with duplicate class enrollments`,
        fixedCount
      });
    } catch (error) {
      // If an error occurred, abort the transaction
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error("Error cleaning up duplicate enrollments:", error);
    res.status(500).json({
      message: "Error cleaning up duplicate enrollments",
      error: error.message
    });
  }
};

// Update the assignStudentToClass function
exports.assignStudentToClass = async (req, res) => {
  const { studentID, classId } = req.body;

  if (!studentID || !classId) {
    return res.status(400).json({
      message: "Both studentID and classId are required.",
    });
  }

  try {
    console.log(`Assigning student ${studentID} to class ${classId}...`);

    // Start a session for transaction
    const session = await Student.startSession();
    session.startTransaction();

    try {
      // Find the student by studentID
      const student = await Student.findOne({ studentID }).session(session);
      if (!student) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          message: "Student not found.",
        });
      }

      // Find the class by classId
      const classDoc = await Class.findById(classId).session(session);
      if (!classDoc) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          message: "Class not found.",
        });
      }

      // Remove student from all other classes
      await Class.updateMany(
        { students: student._id },
        { $pull: { students: student._id } },
        { session }
      );

      // Add student to the new class
      await Class.findByIdAndUpdate(
        classDoc._id,
        { $addToSet: { students: student._id } },
        { session }
      );

      // Update student's enrolledClasses to only contain the new class
      student.enrolledClasses = [classDoc._id];
      await student.save({ session });

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      console.log(`Successfully assigned student ${studentID} to class ${classId}`);

      res.status(200).json({
        message: "Student assigned to class successfully.",
        data: {
          studentID: student.studentID,
          studentName: student.studentName,
          classId: classDoc.classId,
          className: classDoc.className,
        }
      });
    } catch (error) {
      // If an error occurred, abort the transaction
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error("Error assigning student to class:", error);
    res.status(500).json({
      message: "Server error. Please try again later.",
      error: error.message
    });
  }
};

//===================================================================================================
// Controller for searching/filtering students
const searchStudents = async (req, res) => {
  try {
    const { name, studentID, className, gender, category, religion } = req.query;
    const query = {};

    if (name) query.studentName = { $regex: name, $options: "i" };
    if (studentID) query.studentID = studentID;
    if (gender) query.studentGender = gender;
    if (category) query.category = category;
    if (religion) query.religion = religion;

    let students = await Student.find(query)
      .populate({
        path: 'parent',
        select: 'parentName parentID parentEmail parentContactNumber',
        model: 'Parent'
      })
      .populate({
        path: 'enrolledClasses',
        select: 'className classId',
        model: 'Class'
      })
      .select('-studentPassword');

    // Filter by class if specified
    if (className) {
      const classDoc = await Class.findOne({ className });
      if (classDoc) {
        students = students.filter(student => 
          student.enrolledClasses.some(cls => cls._id.equals(classDoc._id))
        );
      }
    }

    res.json({
      message: "Students fetched successfully",
      students: students.map(student => ({
        ...student.toObject(),
        enrolledClasses: student.enrolledClasses.map(cls => ({
          className: cls.className,
          classId: cls.classId
        }))
      }))
    });
  } catch (error) {
    console.error("Error searching students:", error);
    next(error); // Pass the error to the global error handler
  }
};

//Controller to get profile info of logged in student

exports.getStudentProfile = async (req, res) => {
  try {
    // Ensure req.student is defined
    if (!req.student || !req.student._id) {
      return res.status(400).json({ message: "Student not authenticated." });
    }

    console.log("Fetching student profile for ID:", req.student._id);

    // Fetch student data from the database
    const student = await Student.findById(req.student._id)
      .populate("parent", "parentID parentName")
      .populate("enrolledClasses", "className classId") // Populate enrolled classes to get class information
      .select("-studentPassword")
      .exec();

    // If student not found, return a 404 response
    if (!student) {
      console.error("Student not found in database with ID:", req.student._id);
      return res.status(404).json({ message: "Student not found." });
    }

    console.log("Found student:", {
      id: student._id,
      studentID: student.studentID,
      name: student.studentName,
      photo: student.photo || "No photo" 
    });

    // Get the class name from the first enrolled class (if any)
    const className = student.enrolledClasses && student.enrolledClasses.length > 0 
      ? student.enrolledClasses[0].className 
      : "";

    // Format the student data
    const formattedStudent = {
      studentID: student.studentID,
      studentName: student.studentName,
      studentEmail: student.studentEmail,
      studentPhone: student.studentPhone,
      studentAddress: student.studentAddress,
      studentDOB: student.studentDOB,
      studentGender: student.studentGender,
      studentDateOfAdmission: student.studentDateOfAdmission,
      studentFatherName: student.studentFatherName,
      studentMotherName: student.studentMotherName,
      religion: student.religion,
      category: student.category,
      bloodgroup: student.bloodgroup,
      photo: student.photo,
      className: className, // Include the class name
      enrolledClasses: student.enrolledClasses, // Include all enrolled classes data
      parentID: student.parent ? student.parent.parentID : null,
      parentName: student.parent ? student.parent.parentName : null,
    };

    console.log("Returning student profile with photo:", formattedStudent.photo);
    
    res.status(200).json({
      message: "Student profile fetched successfully",
      student: formattedStudent,
    });
  } catch (error) {
    console.error("Error fetching student profile:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Update the updateStudentInfo function to preserve class data
exports.updateStudentInfo = async (req, res) => {
  try {
    console.log("Updating student profile, request body:", req.body);
    console.log("File received:", req.file);
    
    const studentId = req.student._id;
    
    // Extract updated fields from request body
    const { 
      studentName, 
      studentEmail, 
      studentPhone,
      studentAddress
    } = req.body;
    
    // Find student by ID and preserve enrolledClasses
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    
    // Store the current enrolledClasses
    const currentEnrolledClasses = student.enrolledClasses;
    
    console.log("Found student to update:", {
      id: student._id,
      studentID: student.studentID,
      name: student.studentName,
      currentPhoto: student.photo || "No photo",
      enrolledClasses: currentEnrolledClasses
    });
    
    // Handle photo upload if provided
    let photoFilename = student.photo;
    if (req.file) {
      photoFilename = req.file.filename;
      console.log("New photo will be saved:", photoFilename);
    }
    
    // Update fields (only if they are provided)
    if (studentName) student.studentName = studentName;
    if (studentEmail) student.studentEmail = studentEmail;
    if (studentPhone) student.studentPhone = studentPhone;
    if (studentAddress !== undefined) student.studentAddress = studentAddress;
    if (photoFilename) student.photo = photoFilename;
    
    // Ensure enrolledClasses is preserved
    student.enrolledClasses = currentEnrolledClasses;
    
    // Save updated student
    const updatedStudent = await student.save();
    console.log("Student updated successfully with photo:", updatedStudent.photo);
    
    res.status(200).json({
      message: "Student information updated successfully",
      student: updatedStudent
    });
  } catch (error) {
    console.error("Error updating student information:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

// Controller to get students by class
exports.getStudentsByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    // Find the class
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ message: "Class not found" });
    }
      
    // Get all students enrolled in this class
    const students = await Student.find({
      enrolledClasses: classId
    })
    .select("studentName studentID feeDetails")
    .lean();
      
    // Format the response to include all fee details
    const formattedStudents = students.map(student => {
      // Get fee details for this specific class
      const classFeeDetails = student.feeDetails && student.feeDetails[classId] 
        ? student.feeDetails[classId] 
        : {
            classFee: classDoc.baseFee || 0,
            totalAmount: classDoc.baseFee || 0,
            status: 'pending',
            lastUpdated: new Date(),
            dueDate: classDoc.feeDueDate || null,
            lateFeePerDay: classDoc.lateFeePerDay || 0
          };

      return {
        _id: student._id,
        studentName: student.studentName,
        studentID: student.studentID,
        feeDetails: {
          [classId]: classFeeDetails
        }
      };
    });

    res.status(200).json({
      message: "Students retrieved successfully",
      data: formattedStudents
    });
  } catch (error) {
    console.error("Error in getStudentsByClass:", error);
    res.status(500).json({ message: "Error retrieving students", error: error.message });
  }
};
