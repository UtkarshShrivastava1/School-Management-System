const bcrypt = require("bcryptjs");
const Student = require("../models/StudentModel"); // Import Student model
const Parent = require("../models/ParentModel"); // Import Parent model
const generateToken = require("../config/generateToken"); // Helper for JWT token generation
const { validationResult } = require("express-validator"); // For input validation
const Class = require("../models/ClassModel");
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

    // Destructure request body
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
      studentFatherName,
      studentMotherName,
      relationship,
      religion,
      category,
      bloodgroup,
      className,
    } = req.body;

    console.log('Received request body:', req.body);
    console.log('Received file:', req.file);

    const photo = req.file ? req.file.filename : null;

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

    // Automatically set today's date for studentDateOfAdmission
    const studentDateOfAdmission = new Date();

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
      children: [
        {
          student: savedStudent._id,
          relationship: relationship,
        },
      ],
    });

    // Save parent to database
    const savedParent = await newParent.save();

    // Update the student document to include the parent reference
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
exports.studentLogin = async (req, res) => {
  const { studentID, password } = req.body;

  // Validate input
  if (!studentID || !password) {
    return res
      .status(400)
      .json({ message: "Both student ID and password are required." });
  }

  try {
    // Find student by studentID
    const student = await Student.findOne({ studentID });

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
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
      message: "Login successful",
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
    console.error("Error logging in student:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

//==================================================================================================

// Controller for fetching all students
exports.getAllStudents = async (req, res, next) => {
  try {
    // Fetch all students from the database
    const students = await Student.find()
      .populate("parent", "parentID parentName") // Optionally populate parent info if needed
      .select("-studentPassword"); // Exclude password from the response

    // If no students found, return a message
    if (students.length === 0) {
      return res.status(404).json({ message: "No students found." });
    }

    // Format the student data for better readability
    const formattedStudents = students.map((student) => ({
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
      parentID: student.parent ? student.parent.parentID : null, // Assuming 'parent' is populated
      parentName: student.parent ? student.parent.parentName : null,
    }));

    // Send the response back with the list of students
    res.status(200).json({
      message: "Students fetched successfully",
      data: formattedStudents,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    next(error); // Use a global error handler middleware
  }
};
//================================================================================================================================

// Controller to assign a Student to a class
exports.assignStudentToClass = async (req, res) => {
  const { studentID, classId } = req.body;

  // Validate input
  if (!studentID || !classId) {
    return res.status(400).json({
      message: "Both studentID and classId are required.",
    });
  }

  try {
    // Find the student by studentID
    const student = await Student.findOne({ studentID });
    if (!student) {
      return res.status(404).json({
        message: "Student not found.",
      });
    }

    // Find the class by classId
    const classDoc = await Class.findOne({ classId });
    if (!classDoc) {
      return res.status(404).json({
        message: "Class not found.",
      });
    }

    // Check if the student is already assigned to the class
    if (classDoc.students.some((id) => id.equals(student._id))) {
      return res.status(400).json({
        message: "Student is already assigned to this class.",
      });
    }

    // Add the student to the class's 'students' array
    classDoc.students.push(student._id);

    // Save the updated class document
    await classDoc.save();

    // Add the class to the student's 'enrolledClasses' array
    if (!student.enrolledClasses.some((id) => id.equals(classDoc._id))) {
      student.enrolledClasses.push(classDoc._id);

      // Save the updated student document
      await student.save();
    }

    // Respond with success message
    res.status(200).json({
      message: "Student assigned to class successfully.",
      data: {
        studentID: student.studentID,
        studentName: student.studentName,
        classId: classDoc.classId,
        className: classDoc.className,
      },
    });
  } catch (error) {
    console.error("Error assigning student to class:", error);
    res.status(500).json({
      message: "Server error. Please try again later.",
    });
  }
};

//===================================================================================================
// Controller for searching/filtering students
exports.searchStudents = async (req, res, next) => {
  try {
    // Extract query parameters
    const { name, studentID, className, gender, category, religion } =
      req.query;

    // Initialize the dynamic filter object
    const filter = {};

    // Dynamically add filters only if query parameters are provided
    if (name) {
      filter.studentName = { $regex: name, $options: "i" }; // Case-insensitive partial match
    }
    if (studentID) {
      filter.studentID = studentID; // Exact match
    }
    if (className) {
      // Match classId from the className if provided
      const classData = await Class.findOne({ className }).select("classId"); // Assuming Class model exists
      if (classData) {
        filter.classId = classData.classId;
      }
    }
    if (gender) {
      filter.studentGender = gender; // Exact match for gender
    }
    if (category) {
      filter.category = category; // Exact match for category
    }
    if (religion) {
      filter.religion = religion; // Exact match for religion
    }

    // Fetch students based on the dynamic filter
    const students = await Student.find(filter)
      .populate("parent", "parentID parentName")
      .select("-studentPassword");

    // If no students are found, return a 404 response
    if (students.length === 0) {
      return res.status(404).json({ message: "No matching students found." });
    }

    // Format the student data
    const formattedStudents = students.map((student) => ({
      studentID: student.studentID, // student id mapping
      studentName: student.studentName, //student name mapping
      studentEmail: student.studentEmail, // student email mapping
      studentPhone: student.studentPhone, // student phone mapping
      studentAddress: student.studentAddress, //student address mapping
      studentDOB: student.studentDOB, //
      studentGender: student.studentGender,
      studentDateOfAdmission: student.studentDateOfAdmission,
      studentFatherName: student.studentFatherName,
      studentMotherName: student.studentMotherName,
      religion: student.religion,
      category: student.category,
      bloodgroup: student.bloodgroup,
      photo: student.photo,
      parentID: student.parent ? student.parent.parentID : null,
      parentName: student.parent ? student.parent.parentName : null,
    }));

    res.status(200).json({
      message: "Students fetched successfully",
      data: formattedStudents,
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

    // Fetch student data from the database
    const student = await Student.findById(req.student._id)
      .populate("parent", "parentID parentName")
      .select("-studentPassword")
      .exec();

    // If student not found, return a 404 response
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

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
      parentID: student.parent ? student.parent.parentID : null,
      parentName: student.parent ? student.parent.parentName : null,
    };
    res.status(200).json({
      message: "Student profile fetched successfully",
      data: formattedStudent,
    });
  } catch (error) {
    console.error("Error fetching student profile:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};
