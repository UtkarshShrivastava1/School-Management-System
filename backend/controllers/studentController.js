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

// Get Student Profile
const getStudentProfile = async (req, res) => {
  try {
    if (!req.student || !req.student.id) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    const student = await Student.findById(req.student.id)
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
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({ student });
  } catch (error) {
    console.error("Get student profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update Student Profile
const updateStudentProfile = async (req, res) => {
  try {
    console.log("Update student profile request received:", req.body);
    
    const { studentID } = req.body;
    if (!studentID) {
      console.error("Student ID is missing in request body");
      return res.status(400).json({ message: "Student ID is required" });
    }

    console.log("Looking for student with ID:", studentID);
    const student = await Student.findOne({ studentID });
    
    if (!student) {
      console.log("Student not found with ID:", studentID);
      return res.status(404).json({ message: "Student not found" });
    }
    
    console.log("Student found:", student.studentID);

    const {
      studentEmail,
      studentPhone,
      studentName,
      studentAddress,
      studentDOB,
      studentGender,
      religion,
      category,
      bloodgroup,
      studentFatherName,
      studentMotherName,
      emergencyContact,
    } = req.body;
    
    const photo = req.file ? req.file.filename : null;
    console.log("Photo received:", photo);

    // Update fields if provided
    if (studentEmail) student.studentEmail = studentEmail;
    if (studentPhone) student.studentPhone = studentPhone;
    if (studentName) student.studentName = studentName;
    if (studentAddress) student.studentAddress = studentAddress;
    if (studentDOB) student.studentDOB = new Date(studentDOB);
    if (studentGender) student.studentGender = studentGender;
    if (religion) student.religion = religion;
    if (category) student.category = category;
    if (bloodgroup) student.bloodgroup = bloodgroup;
    if (studentFatherName) student.studentFatherName = studentFatherName;
    if (studentMotherName) student.studentMotherName = studentMotherName;
    if (emergencyContact) {
      try {
        // If emergencyContact is a string (JSON), parse it
        const contactData = typeof emergencyContact === 'string' 
          ? JSON.parse(emergencyContact) 
          : emergencyContact;
          
        student.emergencyContact = {
          name: contactData.name || student.emergencyContact?.name || "",
          relation: contactData.relation || student.emergencyContact?.relation || "",
          phone: contactData.phone || student.emergencyContact?.phone || "",
        };
      } catch (err) {
        console.error("Error processing emergencyContact:", err);
      }
    }
    if (photo) student.photo = photo;

    // Add to action history
    student.actionHistory.push("Profile updated");

    console.log("Saving updated student data...");
    await student.save();
    console.log("Student data saved successfully");

    // Create a new object without the password
    const studentObj = student.toObject();
    delete studentObj.studentPassword;

    res.json({
      message: "Profile updated successfully",
      student: studentObj
    });
  } catch (error) {
    console.error("Error updating student profile:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
};

// Change Student Password
const changeStudentPassword = async (req, res) => {
  try {
    const { studentID, currentPassword, newPassword } = req.body;
    if (!studentID) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    const student = await Student.findOne({ studentID });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, student.studentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
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
      studentFatherName,
      studentMotherName,
      relationship,
      religion,
      category,
      bloodgroup,
      AADHARnumber,
      emergencyContact
    } = req.body;

    // Check if student or parent email already exists
    const existingStudent = await Student.findOne({ studentEmail });
    const existingParent = await Parent.findOne({ parentEmail });

    if (existingStudent) {
      return res.status(400).json({ message: "Student email already exists." });
    }
    if (existingParent) {
      return res.status(400).json({ message: "Parent email already exists." });
    }

    // Generate IDs for student and parent
    const studentID = await generateStudentID();
    const parentID = `PRNT${Math.floor(10000 + Math.random() * 90000)}`;

    // Set default passwords
    const studentPlainPassword = "student@123";
    const parentPlainPassword = "parent@123";

    // Hash the passwords
    const studentPassword = await bcrypt.hash(studentPlainPassword, 10);
    const parentPassword = await bcrypt.hash(parentPlainPassword, 10);

    // Create new Student document
    const newStudent = new Student({
      studentName,
      photo: req.file ? req.file.path : null,
      studentID,
      studentPassword,
      studentEmail,
      studentPhone,
      studentAddress,
      studentDOB: new Date(studentDOB),
      studentGender,
      studentDateOfAdmission: new Date(),
      studentFatherName,
      studentMotherName,
      religion,
      category,
      bloodgroup,
      AADHARnumber,
      emergencyContact: emergencyContact || {
        name: "",
        relation: "",
        phone: ""
      },
      role: "student",
      registeredBy: req.admin ? {
        adminID: req.admin.adminID,
        name: req.admin.name,
      } : null,
      lastLogin: new Date(),
      loginHistory: [new Date()],
      actionHistory: ["Account created"]
    });

    // Save student to database
    const savedStudent = await newStudent.save();

    // Create new Parent document
    const newParent = new Parent({
      parentName,
      parentContactNumber,
      parentEmail,
      parentID,
      password: parentPassword,
      children: [
        {
          student: savedStudent._id,
          relationship,
        },
      ],
    });

    // Save parent to database
    const savedParent = await newParent.save();

    // Update student with parent reference
    savedStudent.parent = savedParent._id;
    await savedStudent.save();

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

    const isMatch = await bcrypt.compare(password, student.studentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(student._id, "student");

    // Update last login and login history
    student.lastLogin = new Date();
    student.loginHistory.push(new Date());
    await student.save();

    res.json({
      token,
      student: {
        studentID: student.studentID,
        studentName: student.studentName,
        studentEmail: student.studentEmail,
        studentPhone: student.studentPhone,
        photo: student.photo,
        role: "student"
      }
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

// Controller to assign a Student to a class
const assignStudentToClass = async (req, res) => {
  try {
  const { studentID, classId } = req.body;

  if (!studentID || !classId) {
    return res.status(400).json({
      message: "Both studentID and classId are required.",
    });
  }

    const student = await Student.findOne({ studentID });
    if (!student) {
      return res.status(404).json({
        message: "Student not found.",
      });
    }

    const classDoc = await Class.findOne({ classId });
    if (!classDoc) {
      return res.status(404).json({
        message: "Class not found.",
      });
    }

    // Check if student is already in the class
    if (student.enrolledClasses.includes(classDoc._id)) {
      return res.status(400).json({
        message: "Student is already enrolled in this class.",
      });
    }

    // Add class to student's enrolled classes
    student.enrolledClasses.push(classDoc._id);
    await student.save();

    // Add student to class's students array
    classDoc.students.push(student._id);
    await classDoc.save();

    // Add to student's action history
    student.actionHistory.push(`Enrolled in class ${classDoc.className}`);
      await student.save();

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
    console.error("Search students error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  studentLogin,
  getStudentProfile,
  updateStudentProfile,
  changeStudentPassword,
  createStudent,
  getAllStudents,
  assignStudentToClass,
  searchStudents
};
