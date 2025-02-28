const bcrypt = require("bcryptjs");
const Teacher = require("../models/TeacherModel"); // Import Teacher model
const Subject = require("../models/SubjectModel"); // Import Teacher model
const Class = require("../models/ClassModel"); // Adjust the path to match your project structure
const generateToken = require("../config/generateToken"); // Helper for JWT token generation
const { validationResult } = require("express-validator"); // For input validation

// Function to generate a unique teacherID
const generateTeacherID = async () => {
  let newID;
  let existingTeacher;
  do {
    newID = `TCHR${Math.floor(Math.random() * 10000)}`; // Generate a unique teacher ID starting with "TCHR"
    existingTeacher = await Teacher.findOne({ teacherID: newID });
  } while (existingTeacher);
  return newID;
};
// Helper function to format the teacher data
const formatTeacherData = (teacher) => {
  return {
    teacherID: teacher.teacherID,
    name: teacher.name,
    email: teacher.email,
    phone: teacher.phone,
    designation: teacher.designation,
    address: teacher.address,
    dob: teacher.dob,
    gender: teacher.gender,
    religion: teacher.religion,
    category: teacher.category,
    bloodgroup: teacher.bloodgroup,
    department: teacher.department,
    role: teacher.role,
    photo: teacher.photo,
    emergencyContact: teacher.emergencyContact,
    experience: teacher.experience,
    highestQualification: teacher.highestQualification,
    AADHARnumber: teacher.AADHARnumber,
    lastLogin: teacher.lastLogin,
    loginHistory: teacher.loginHistory,
    actionHistory: teacher.actionHistory,
    salary: teacher.salary,
    bankDetails: teacher.bankDetails,
    feedbackScore: teacher.feedbackScore,
    registeredBy: teacher.registeredBy,
    createdAt: teacher.createdAt,
    updatedAt: teacher.updatedAt, // Include timestamps if required
  };
};
//================================================================================================

// Controller for creating a new teacher
// Controller for creating a new teacher
exports.createTeacher = async (req, res, next) => {
  const loggedInAdmin = req.admin; // Access logged-in admin's data
  console.log("Logged-in Admin:", loggedInAdmin, loggedInAdmin.name); // Add this line to log the teacher data
  if (!loggedInAdmin) {
    return res.status(400).json({ message: "Logged-in Admin not found" });
  }

  const {
    name,
    email,
    phone,
    designation,
    address,
    dob,
    gender,
    department,
    religion,
    category,
    bloodgroup,
    role,
    emergencyContact,
    experience,
    highestQualification,
    AADHARnumber,
    salary,
    bankDetails,
  } = req.body;
  const photo = req.file ? req.file.filename : null;

  // Use express-validator to check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Check if an teacher already exists with the same email
    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      return res
        .status(400)
        .json({ message: "Teacher with this email already exists" });
    }

    // Generate a unique teacherID
    const teacherID = await generateTeacherID();

    // Set a default password and hash it
    const defaultPassword = "teacher123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Create the new teacher record
    const newTeacher = await Teacher.create({
      name,
      email,
      phone,
      designation,
      address,
      dob,
      gender,
      department,
      religion,
      category,
      bloodgroup,
      role: role || "teacher", // Default to 'teacher' if no role provided
      teacherID,
      password: hashedPassword,
      photo,
      emergencyContact: emergencyContact
        ? {
            name: emergencyContact.name || "",
            relation: emergencyContact.relation || "",
            phone: emergencyContact.phone || "",
          }
        : undefined,
      experience: experience || 0,
      highestQualification: highestQualification || "",
      AADHARnumber: AADHARnumber || "",
      salary: salary || 0,
      bankDetails: bankDetails
        ? {
            accountNumber: bankDetails.accountNumber || "",
            bankName: bankDetails.bankName || "",
            ifscCode: bankDetails.ifscCode || "",
          }
        : undefined,
      registeredBy: {
        adminID: loggedInAdmin.adminID, // Correctly use adminID
        name: loggedInAdmin.name, // Logged-in admin's name
      },
    });

    // Generate a JWT token for the newly created teacher
    const token = generateToken(newTeacher._id, "teacher");

    // Send the response back with the created teacher's details
    res.status(201).json({
      message: "Teacher created successfully",
      token,
      data: formatTeacherData(newTeacher),
    });
  } catch (error) {
    console.error("Error creating teacher:", error);
    next(error); // Use a global error handler middleware
  }
};

//-----------------------------------------------------------------------------------------------------
// Controller for logging in a teacher
exports.teacherLogin = async (req, res) => {
  const { teacherID, password } = req.body;

  // Check if both teacherID and password are provided
  if (!teacherID || !password) {
    return res
      .status(400)
      .json({ message: "Both Teacher ID and password are required." });
  }

  try {
    // Find teacher by teacherID
    const teacher = await Teacher.findOne({ teacherID });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found." });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, teacher.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Generate JWT token
    const token = generateToken(teacher._id, teacher.role);

    // Return response with token and teacher details
    res.json({
      token,
      teacher: {
        teacherID: teacher.teacherID,
        name: teacher.name,
        email: teacher.email,
        department: teacher.department,
        designation: teacher.designation,
        photo: teacher.photo,
        role: teacher.role, // Include role explicitly here
      },
    });
  } catch (error) {
    console.error("Error logging in teacher:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

//================================================================================================

// Controller for fetching all teachers
exports.getAllTeachers = async (req, res) => {
  try {
    // Fetch all teachers from the database
    const teachers = await Teacher.find();

    // Check if any teachers exist
    if (!teachers || teachers.length === 0) {
      return res.status(404).json({ message: "No teachers found." });
    }

    // Format the teacher data directly in the controller
    const formattedTeachers = teachers.map((teacher) => ({
      teacherID: teacher.teacherID,
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      designation: teacher.designation,
      address: teacher.address,
      dob: teacher.dob,
      gender: teacher.gender,
      religion: teacher.religion,
      category: teacher.category,
      bloodgroup: teacher.bloodgroup,
      department: teacher.department,
      role: teacher.role,
      photo: teacher.photo,
      emergencyContact: teacher.emergencyContact,
      experience: teacher.experience,
      highestQualification: teacher.highestQualification,
      AADHARnumber: teacher.AADHARnumber,
      salary: teacher.salary,
      bankDetails: teacher.bankDetails,
      feedbackScore: teacher.feedbackScore,
      registeredBy: teacher.registeredBy,
      createdAt: teacher.createdAt,
      updatedAt: teacher.updatedAt, // Include timestamps if needed
    }));

    // Return the response with formatted teacher data
    res.status(200).json({
      message: "Teachers fetched successfully",
      data: formattedTeachers,
    });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res
      .status(500)
      .json({ message: "Error fetching teachers. Please try again later." });
  }
};
//================================================================================================================================

// Controller to assign a teacher to a subject and vice versa
exports.assignTeacherToSubject = async (req, res) => {
  const { teacherID, subjectId } = req.body; // Using subjectId as per the request body

  // Validate input
  if (!teacherID || !subjectId) {
    return res.status(400).json({
      message: "Both teacherID and subjectId are required.",
    });
  }

  try {
    // Find the teacher by teacherID
    const teacher = await Teacher.findOne({ teacherID });
    if (!teacher) {
      return res.status(404).json({
        message: "Teacher not found.",
      });
    }

    // Find the subject by subjectId
    const subject = await Subject.findOne({ subjectId });
    if (!subject) {
      return res.status(404).json({
        message: "Subject not found.",
      });
    }

    // Check if the teacher is already assigned to the subject
    if (subject.assignedTeachers.includes(teacher._id)) {
      return res.status(400).json({
        message: "Teacher is already assigned to this subject.",
      });
    }

    // Assign the teacher to the subject
    subject.assignedTeachers.push(teacher._id);
    await subject.save();

    // Check if the subject is already assigned to the teacher
    if (!teacher.assignedSubjects.includes(subject._id)) {
      teacher.assignedSubjects.push(subject._id);
      await teacher.save();
    }

    res.status(200).json({
      message: "Teacher assigned to subject successfully.",
      data: {
        teacherID: teacher.teacherID,
        teacherName: teacher.name,
        subjectId: subject.subjectId,
        subjectName: subject.name,
      },
    });
  } catch (error) {
    console.error("Error assigning teacher to subject:", error);
    res.status(500).json({
      message: "Server error. Please try again later.",
    });
  }
};
//================================================================================================================================

// Controller to assign a teacher to a class and vice versa
// Controller to assign a teacher to a class and vice versa
exports.assignTeacherToClass = async (req, res) => {
  const { teacherID, classId } = req.body;

  if (!teacherID || !classId) {
    return res.status(400).json({
      message: "Both teacherID and classId are required.",
    });
  }

  try {
    const teacher = await Teacher.findOne({ teacherID });
    if (!teacher) {
      return res.status(404).json({
        message: "Teacher not found.",
      });
    }

    const classDoc = await Class.findOne({ classId });
    if (!classDoc) {
      return res.status(404).json({
        message: "Class not found.",
      });
    }

    console.log("Class Document:", classDoc); // Debugging classDoc

    if (!classDoc.teachers) {
      return res.status(400).json({
        message: "Teachers field is not properly defined in the Class schema.",
      });
    }

    if (classDoc.teachers.includes(teacher._id)) {
      return res.status(400).json({
        message: "Teacher is already assigned to this class.",
      });
    }

    classDoc.teachers.push(teacher._id);
    await classDoc.save();

    if (!teacher.assignedClasses.includes(classDoc._id)) {
      teacher.assignedClasses.push(classDoc._id);
      await teacher.save();
    }

    res.status(200).json({
      message: "Teacher assigned to class successfully.",
      data: {
        teacherID: teacher.teacherID,
        teacherName: teacher.name,
        classId: classDoc.classId,
        className: classDoc.className,
      },
    });
  } catch (error) {
    console.error("Error assigning teacher to class:", error);
    res.status(500).json({
      message: "Server error. Please try again later.",
    });
  }
};

// Controller to fetch a teacher's assigned classes

exports.getAssignedClasses = async (req, res) => {
  try {
    console.log("Request user data:", req.user);
    console.log("Request teacher data:", req.teacher);

    const teacherID = req.teacher?.teacherID || req.user?.teacherID;

    if (!teacherID) {
      return res.status(400).json({
        message: "Teacher ID is required.",
      });
    }

    const teacher = await Teacher.findOne({ teacherID })
      .populate({
        path: "assignedSubjects",
        select: "subjectName subjectId subjectCode",
      })
      .populate({
        path: "assignedClasses",
        select: "className classId",
      });

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher not found.",
      });
    }

    // Format the response to group subjects by class
    const assignedClasses = teacher.assignedClasses.map((cls) => {
      // Filter only subjects relevant to this class
      const subjectsForClass = teacher.assignedSubjects.filter((sub) =>
        cls.subjects?.includes(sub.subjectId)
      );

      return {
        classID: cls.classId,
        className: cls.className,
        assignedSubjects: subjectsForClass.map((sub) => ({
          subjectID: sub.subjectId,
          subjectName: sub.subjectName,
          subjectCode: sub.subjectCode,
        })),
      };
    });

    res.status(200).json({
      message: "Assigned classes and subjects fetched successfully.",
      assignedClasses,
    });
  } catch (error) {
    console.error("Error fetching assigned classes and subjects:", error);
    res.status(500).json({
      message: "Server error. Please try again later.",
    });
  }
};

// Controller to fetch a teacher's assigned subjects

//===================================================================================================
