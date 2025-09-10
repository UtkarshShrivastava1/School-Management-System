const bcrypt = require("bcrypt");
const Student = require("../models/StudentModel"); // Import Student model
const Parent = require("../models/ParentModel"); // Import Parent model
const generateToken = require("../config/generateToken"); // Helper for JWT token generation
const { validationResult } = require("express-validator"); // For input validation
const Class = require("../models/ClassModel");
//================================================================================================================================
// Function to generate a unique studentID

/* ------------ ID generators (use correct digit lengths per schema) --------- */
async function generateStudentID() {
  let id, exists;
  do {
    id = `STU${Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0")}`; // STU + 5 digits
    exists = await Student.findOne({ studentID: id }).lean();
  } while (exists);
  return id;
}

// Function to generate a unique parentID
async function generateParentID() {
  let id, exists;
  do {
    id = `PRNT${Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0")}`; // PRNT + 5 digits
    exists = await Parent.findOne({ parentID: id }).lean();
  } while (exists);
  return id;
}

//============================================================================================================

exports.createStudent = async (req, res, next) => {
  try {
    const {
      // student fields (match Student schema)
      studentName,
      studentEmail,
      studentPhone,
      studentAddress,
      studentDOB,
      studentGender,
      className, // requested class only (no actual assignment here)
      religion,
      category,
      bloodgroup,
      studentFatherName,
      studentMotherName,
      // parent fields (match Parent schema)
      parentName,
      parentContactNumber,
      parentEmail,
      relationship,
      parentAddress,
      parentOccupation,
      AADHARnumber,
    } = req.body;

    const studentPhoto = req.files?.photo?.[0]?.filename;
    const parentPhoto = req.files?.parentPhoto?.[0]?.filename;

    // Basic server-side validations for clarity
    const missing = [];
    if (!studentName)
      missing.push({ field: "studentName", msg: "Student name is required" });
    if (!studentEmail)
      missing.push({ field: "studentEmail", msg: "Student email is required" });
    if (!studentPhone)
      missing.push({ field: "studentPhone", msg: "Student phone is required" });
    if (!studentAddress)
      missing.push({
        field: "studentAddress",
        msg: "Student address is required",
      });
    if (!studentDOB)
      missing.push({ field: "studentDOB", msg: "Student DOB is required" });
    if (!studentGender)
      missing.push({
        field: "studentGender",
        msg: "Student gender is required",
      });
    if (!studentFatherName)
      missing.push({
        field: "studentFatherName",
        msg: "Father's name is required",
      });
    if (!studentMotherName)
      missing.push({
        field: "studentMotherName",
        msg: "Mother's name is required",
      });
    if (!className)
      missing.push({ field: "className", msg: "Requested class is required" });

    if (!parentName)
      missing.push({ field: "parentName", msg: "Parent name is required" });
    if (!parentEmail)
      missing.push({ field: "parentEmail", msg: "Parent email is required" });
    if (!parentContactNumber)
      missing.push({
        field: "parentContactNumber",
        msg: "Parent contact number is required",
      });
    if (!relationship)
      missing.push({ field: "relationship", msg: "Relationship is required" });

    if (missing.length) {
      return res.status(400).json({
        message: "Validation failed",
        errors: missing,
      });
    }

    // Uniqueness check for student
    const existingStudent = await Student.findOne({
      $or: [{ studentEmail }, { studentPhone }],
    });
    if (existingStudent) {
      const errors = [];
      if (existingStudent.studentEmail === studentEmail) {
        errors.push({
          field: "studentEmail",
          msg: "Student email already in use",
        });
      }
      if (existingStudent.studentPhone === studentPhone) {
        errors.push({
          field: "studentPhone",
          msg: "Student phone already in use",
        });
      }
      return res.status(400).json({
        message: "Student already exists",
        errors: errors.length
          ? errors
          : [{ field: "studentEmail", msg: "Duplicate found" }],
      });
    }

    // Upsert Parent by parentEmail (using schema field names)
    let parent = await Parent.findOne({ parentEmail });
    if (!parent) {
      const parentID = await generateParentID();
      const defaultParentPassword = "parent123"; // let Parent schema pre-save hook hash this

      parent = await Parent.create({
        parentID, // ✅ matches schema (and 5 digits)
        parentName, // ✅ matches schema
        parentEmail, // ✅ matches schema
        parentContactNumber, // ✅ matches schema
        relationship, // ✅ matches schema
        parentAddress: parentAddress || undefined,
        parentOccupation: parentOccupation || undefined,
        parentPhoto: parentPhoto || undefined,
        parentPassword: defaultParentPassword, // ✅ schema should hash in pre-save
        status: "active",
      });
    } else {
      // Optionally patch missing parent info
      parent.parentName = parent.parentName || parentName;
      parent.parentContactNumber =
        parent.parentContactNumber || parentContactNumber;
      parent.relationship = parent.relationship || relationship;
      parent.parentAddress = parent.parentAddress || parentAddress;
      parent.parentOccupation = parent.parentOccupation || parentOccupation;
      if (parentPhoto && !parent.parentPhoto) parent.parentPhoto = parentPhoto;
      await parent.save();
    }

    // Generate studentID
    const studentID = await generateStudentID();
    const defaultStudentPassword = "student123"; // let Student schema pre-save hash

    // Create Student (NO actual class assignment here)
    const student = await Student.create({
      studentID, // ✅ STU + 5 digits
      studentName,
      studentEmail,
      studentPhone,
      studentAddress,
      studentDOB,
      studentGender,
      religion,
      category,
      bloodgroup,
      studentFatherName,
      studentMotherName,
      photo: studentPhoto || undefined,
      parent: parent._id,

      studentPassword: defaultStudentPassword, // ✅ schema pre-save hash

      AADHARnumber: AADHARnumber || undefined,

      // record intent only; assignment happens later
      requestedClass: className,
      status: "pending_class_assignment",

      registeredBy: req.admin
        ? { adminID: req.admin.adminID, name: req.admin.name }
        : undefined,
    });

    return res.status(201).json({
      message: "Student registered (pending class assignment)",
      student,
      parent,
      ...(process.env.NODE_ENV !== "production"
        ? { defaults: { studentPassword: defaultStudentPassword } }
        : {}),
    });
  } catch (err) {
    // Bubble up mongoose validation errors with fields
    if (err?.name === "ValidationError") {
      const errors = Object.entries(err.errors).map(([k, v]) => ({
        field: k,
        msg: v.message,
      }));
      return res.status(400).json({ message: "Validation failed", errors });
    }
    next(err);
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
          console.log(
            `Found student ${student.studentID} in multiple classes:`,
            student.enrolledClasses
          );

          // Keep only the most recent class
          const mostRecentClass =
            student.enrolledClasses[student.enrolledClasses.length - 1];

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
          console.log(
            `Fixed student ${student.studentID} - now in class ${mostRecentClass}`
          );
        }
      }

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        message: `Fixed ${fixedCount} students with duplicate class enrollments`,
        fixedCount,
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
      error: error.message,
    });
  }
};

// Update the assignStudentToClass function
exports.assignStudentToClass = async (req, res) => {
  const { studentID, classId } = req.body;

  // Validate input
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
      const student = await Student.findOne({ studentID })
        .populate("enrolledClasses", "className section classId")
        .session(session);
      if (!student) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          message: "Student not found.",
        });
      }

      // Find the class by classId
      const classDoc = await Class.findOne({ classId }).session(session);
      if (!classDoc) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          message: "Class not found.",
        });
      }

      // Check if student is already enrolled in this class
      const isAlreadyEnrolled = student.enrolledClasses.some(
        (enrolledClass) =>
          enrolledClass._id.toString() === classDoc._id.toString()
      );

      if (isAlreadyEnrolled) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          message: `Student ${student.studentName} (${student.studentID}) is already enrolled in ${classDoc.className} - Section ${classDoc.section}.`,
          alreadyEnrolled: true,
          currentClass: {
            classId: classDoc.classId,
            className: classDoc.className,
            section: classDoc.section,
          },
        });
      }

      // Check if student is enrolled in any other class
      if (student.enrolledClasses && student.enrolledClasses.length > 0) {
        const currentClass = student.enrolledClasses[0];
        console.log(
          `Student is currently enrolled in: ${currentClass.className} - Section ${currentClass.section}`
        );

        // Return information about current enrollment
        return res.status(409).json({
          message: `Student ${student.studentName} (${student.studentID}) is already enrolled in ${currentClass.className} - Section ${currentClass.section}.`,
          conflict: true,
          currentClass: {
            classId: currentClass.classId,
            className: currentClass.className,
            section: currentClass.section,
          },
          targetClass: {
            classId: classDoc.classId,
            className: classDoc.className,
            section: classDoc.section,
          },
          student: {
            studentID: student.studentID,
            studentName: student.studentName,
          },
        });
      }

      // Remove student from all other classes (safety check)
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
      // Use $set to ensure atomic update and avoid duplicate key errors
      await Student.findByIdAndUpdate(
        student._id,
        { $set: { enrolledClasses: [classDoc._id] } },
        { session }
      );

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      console.log(
        `Successfully assigned student ${studentID} to class ${classId}`
      );

      res.status(200).json({
        message: "Student assigned to class successfully.",
        data: {
          studentID: student.studentID,
          studentName: student.studentName,
          classId: classDoc.classId,
          className: classDoc.className,
          section: classDoc.section,
        },
      });
    } catch (error) {
      // If an error occurred, abort the transaction
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error("Error assigning student to class:", error);

    // Handle specific MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "Student is already enrolled in a class. Please check current enrollment.",
        error: "Duplicate enrollment detected",
      });
    }

    res.status(500).json({
      message: "Server error. Please try again later.",
      error: error.message,
    });
  }
};

// Reassign student to a different class
exports.reassignStudentToClass = async (req, res) => {
  const { studentID, newClassId } = req.body;

  // Validate input
  if (!studentID || !newClassId) {
    return res.status(400).json({
      message: "Both studentID and newClassId are required.",
    });
  }

  try {
    console.log(`Reassigning student ${studentID} to class ${newClassId}...`);

    // Start a session for transaction
    const session = await Student.startSession();
    session.startTransaction();

    try {
      // Find the student by studentID
      const student = await Student.findOne({ studentID })
        .populate("enrolledClasses", "className section classId")
        .session(session);
      if (!student) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          message: "Student not found.",
        });
      }

      // Find the new class by classId
      const newClassDoc = await Class.findOne({ classId: newClassId }).session(
        session
      );
      if (!newClassDoc) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          message: "Target class not found.",
        });
      }

      // Get current class information
      const currentClass =
        student.enrolledClasses && student.enrolledClasses.length > 0
          ? student.enrolledClasses[0]
          : null;

      // Remove student from current class
      if (currentClass) {
        await Class.findByIdAndUpdate(
          currentClass._id,
          { $pull: { students: student._id } },
          { session }
        );
        console.log(
          `Removed student from current class: ${currentClass.className} - Section ${currentClass.section}`
        );
      }

      // Add student to the new class
      await Class.findByIdAndUpdate(
        newClassDoc._id,
        { $addToSet: { students: student._id } },
        { session }
      );

      // Update student's enrolledClasses to only contain the new class
      // Use $set to ensure atomic update and avoid duplicate key errors
      await Student.findByIdAndUpdate(
        student._id,
        { $set: { enrolledClasses: [newClassDoc._id] } },
        { session }
      );

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      console.log(
        `Successfully reassigned student ${studentID} from ${
          currentClass
            ? `${currentClass.className} - Section ${currentClass.section}`
            : "no class"
        } to ${newClassDoc.className} - Section ${newClassDoc.section}`
      );

      res.status(200).json({
        message: "Student reassigned to class successfully.",
        data: {
          studentID: student.studentID,
          studentName: student.studentName,
          previousClass: currentClass
            ? {
                classId: currentClass.classId,
                className: currentClass.className,
                section: currentClass.section,
              }
            : null,
          newClass: {
            classId: newClassDoc.classId,
            className: newClassDoc.className,
            section: newClassDoc.section,
          },
        },
      });
    } catch (error) {
      // If an error occurred, abort the transaction
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error("Error reassigning student to class:", error);
    res.status(500).json({
      message: "Server error. Please try again later.",
      error: error.message,
    });
  }
};

// Remove student from current class
exports.removeStudentFromClass = async (req, res) => {
  const { studentID } = req.body;

  // Validate input
  if (!studentID) {
    return res.status(400).json({
      message: "StudentID is required.",
    });
  }

  try {
    console.log(`Removing student ${studentID} from current class...`);

    // Start a session for transaction
    const session = await Student.startSession();
    session.startTransaction();

    try {
      // Find the student by studentID
      const student = await Student.findOne({ studentID })
        .populate("enrolledClasses", "className section classId")
        .session(session);
      if (!student) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          message: "Student not found.",
        });
      }

      // Check if student is enrolled in any class
      if (!student.enrolledClasses || student.enrolledClasses.length === 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          message: "Student is not enrolled in any class.",
        });
      }

      const currentClass = student.enrolledClasses[0];

      // Remove student from current class
      await Class.findByIdAndUpdate(
        currentClass._id,
        { $pull: { students: student._id } },
        { session }
      );

      // Clear student's enrolledClasses
      // Use $set to ensure atomic update and avoid duplicate key errors
      await Student.findByIdAndUpdate(
        student._id,
        { $set: { enrolledClasses: [] } },
        { session }
      );

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      console.log(
        `Successfully removed student ${studentID} from ${currentClass.className} - Section ${currentClass.section}`
      );

      res.status(200).json({
        message: "Student removed from class successfully.",
        data: {
          studentID: student.studentID,
          studentName: student.studentName,
          removedFromClass: {
            classId: currentClass.classId,
            className: currentClass.className,
            section: currentClass.section,
          },
        },
      });
    } catch (error) {
      // If an error occurred, abort the transaction
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error("Error removing student from class:", error);
    res.status(500).json({
      message: "Server error. Please try again later.",
      error: error.message,
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
      photo: student.photo || "No photo",
    });

    // Get the class name from the first enrolled class (if any)
    const className =
      student.enrolledClasses && student.enrolledClasses.length > 0
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

    console.log(
      "Returning student profile with photo:",
      formattedStudent.photo
    );

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
    const { studentName, studentEmail, studentPhone, studentAddress } =
      req.body;

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
      enrolledClasses: currentEnrolledClasses,
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
    console.log(
      "Student updated successfully with photo:",
      updatedStudent.photo
    );

    res.status(200).json({
      message: "Student information updated successfully",
      student: updatedStudent,
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
      enrolledClasses: classId,
    }).select("studentName studentID feeDetails");

    // Format the response to include all fee details
    const formattedStudents = students.map((student) => {
      // Get fee details for this specific class from Map structure
      let classFeeDetails = null;

      if (student.feeDetails && student.feeDetails instanceof Map) {
        classFeeDetails = student.feeDetails.get(classId);
      } else if (student.feeDetails && typeof student.feeDetails === "object") {
        // Handle both Map-like objects and plain objects
        classFeeDetails =
          student.feeDetails[classId] || student.feeDetails.get?.(classId);
      }

      // If no fee details found, create default ones
      if (!classFeeDetails) {
        classFeeDetails = {
          classFee: classDoc.baseFee || 0,
          monthlyFee: classDoc.baseFee ? classDoc.baseFee / 12 : 0,
          totalAmount: classDoc.baseFee || 0,
          status: "pending",
          lastUpdated: new Date(),
          dueDate: classDoc.feeDueDate || null,
          lateFeePerDay: classDoc.lateFeePerDay || 0,
        };
      }

      return {
        _id: student._id,
        studentName: student.studentName,
        studentID: student.studentID,
        feeDetails: classFeeDetails, // Return the fee details directly, not wrapped in an object
      };
    });

    res.status(200).json({
      message: "Students retrieved successfully",
      data: formattedStudents,
    });
  } catch (error) {
    console.error("Error in getStudentsByClass:", error);
    res
      .status(500)
      .json({ message: "Error retrieving students", error: error.message });
  }
};
