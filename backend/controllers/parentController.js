const bcrypt = require("bcryptjs");
const Parent = require("../models/ParentModel"); // Importing Parent model
const generateToken = require("../config/generateToken"); // Importing token generator
const Fee = require("../models/FeeModel"); // Importing Fee model
const Student = require("../models/StudentModel"); // Importing Student model
const Class = require("../models/ClassModel");

// Controller for logging in parents
const parentLogin = async (req, res) => {
  const { parentID, password } = req.body;

    console.log("Parent login attempt:", { parentID });
    try{
    // Validate input
    if (!parentID || !password) {
      console.log("Missing credentials:", { parentID: !!parentID, password: !!password });
      return res
        .status(400)
        .json({ message: "Both parent ID and password are required." });
    }

    // Find parent by parentID
    const parent = await Parent.findOne({ parentID });
    console.log("Parent lookup result:", parent ? "Found" : "Not found");

    if (!parent) {
      return res.status(404).json({ message: "Parent not found." });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      parent.parentPassword
    );
    console.log("Password validation:", isPasswordValid ? "Valid" : "Invalid");

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Generate JWT token with parent role
    const token = generateToken(parent._id, "parent");
    console.log("Token generated successfully for parent:", {
      id: parent._id,
      role: "parent"
    });

    // Return success response with token and parent details
    res.json({
      message: "Login successful",
      token,
      parent: {
        parentID: parent.parentID,
        parentName: parent.parentName,
        parentEmail: parent.parentEmail,
        parentContactNumber: parent.parentContactNumber,
        address: parent.address || "",
        occupation: parent.occupation || "",
        relationship: parent.relationship || "",
        photo: parent.photo || "",
        children: parent.children,
        _id: parent._id,
      },
    });
  } catch (error) {
    console.error("Error logging in parent:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Get parent profile
const getParentProfile = async (req, res) => {
  try {
    console.log("Fetching parent profile for ID:", req.parent._id);
    
    const parent = await Parent.findById(req.parent._id);
    
    if (!parent) {
      console.error("Parent not found in database with ID:", req.parent._id);
      return res.status(404).json({ message: "Parent not found" });
    }
    
    console.log("Found parent:", {
      id: parent._id,
      parentID: parent.parentID,
      name: parent.parentName,
      photo: parent.photo || "No photo" 
    });
    
    // Format the parent data
    const formattedParent = {
      parentID: parent.parentID,
      parentName: parent.parentName,
      parentEmail: parent.parentEmail,
      parentContactNumber: parent.parentContactNumber,
      address: parent.address || "",
      occupation: parent.occupation || "",
      relationship: parent.relationship || "",
      photo: parent.photo || "",
      children: parent.children
    };
    
    console.log("Returning parent profile with photo:", formattedParent.photo);
    
    res.status(200).json({ 
      parent: formattedParent
    });
  } catch (error) {
    console.error("Error fetching parent profile:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

// Update parent information
const updateParentInfo = async (req, res) => {
  try {
    console.log("Updating parent profile, request body:", req.body);
    console.log("File received:", req.file);
    
    // Get the parent ID from the auth middleware
    const parentId = req.parent._id;

    // Extract updated fields from request body
    const { 
      parentName, 
      parentEmail, 
      parentContactNumber,
      address,
      occupation,
      relationship
    } = req.body;

    // Find the parent by ID
    const parent = await Parent.findById(parentId);
    if (!parent) {
      console.error("Parent not found with ID:", parentId);
      return res.status(404).json({ message: "Parent not found" });
    }

    console.log("Found parent to update:", {
      id: parent._id,
      parentID: parent.parentID,
      name: parent.parentName,
      currentPhoto: parent.photo || "No photo"
    });

    // Handle photo upload if provided
    let photoFilename = parent.photo; // Default to existing photo
    if (req.file) {
      photoFilename = req.file.filename;
      console.log("New photo will be saved:", photoFilename);
    }

    // Update fields (only if they are provided)
    if (parentName) parent.parentName = parentName;
    if (parentEmail) parent.parentEmail = parentEmail;
    if (parentContactNumber) parent.parentContactNumber = parentContactNumber;
    if (address !== undefined) parent.address = address;
    if (occupation !== undefined) parent.occupation = occupation;
    if (relationship !== undefined) parent.relationship = relationship;
    if (photoFilename) parent.photo = photoFilename;

    // Save updated parent
    const updatedParent = await parent.save();
    console.log("Parent updated successfully with photo:", updatedParent.photo);

    // Return success response
    res.status(200).json({
      message: "Parent information updated successfully",
      parent: {
        parentID: updatedParent.parentID,
        parentName: updatedParent.parentName,
        parentEmail: updatedParent.parentEmail,
        parentContactNumber: updatedParent.parentContactNumber,
        address: updatedParent.address || "",
        occupation: updatedParent.occupation || "",
        relationship: updatedParent.relationship || "",
        photo: updatedParent.photo || "",
        children: updatedParent.children
      }
    });
  } catch (error) {
    console.error("Error updating parent information:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

// Change parent password
const changeParentPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }
    
    // Get the parent from the database
    const parent = await Parent.findById(req.parent._id);
    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, parent.parentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    parent.parentPassword = hashedPassword;
    await parent.save();
    
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing parent password:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

const createSampleFees = async (studentId) => {
  try {
    console.log('Creating sample fees for student:', studentId);
    
    // Get the student to find their class
    const student = await Student.findById(studentId);
    if (!student) {
      console.error('Student not found:', studentId);
      return;
    }

    console.log('Found student:', {
      id: student._id,
      name: student.studentName,
      enrolledClasses: student.enrolledClasses
    });

    // Get or create a class for the student
    let studentClass;
    if (!student.enrolledClasses || student.enrolledClasses.length === 0) {
      console.log('Student has no enrolled classes, creating default class...');
      studentClass = await Class.findOne({ name: 'Default Class' });
      
      if (!studentClass) {
        studentClass = await Class.create({
          name: 'Default Class',
          grade: 'Default',
          section: 'A',
          academicYear: '2023-2024'
        });
        console.log('Created new default class:', studentClass._id);
      }
      
      // Add class to student's enrolled classes
      await Student.findByIdAndUpdate(studentId, {
        $push: { enrolledClasses: studentClass._id }
      });
      console.log('Added class to student\'s enrolled classes');
    } else {
      studentClass = await Class.findById(student.enrolledClasses[0]);
      console.log('Using existing class:', studentClass._id);
    }

    if (!studentClass) {
      console.error('Failed to get or create class for student');
      return;
    }

    // Calculate monthly fee (base fee divided by 12)
    const baseFee = studentClass.baseFee || 5000;
    const monthlyFee = Math.round(baseFee / 12);

    // Get current year
    const currentYear = new Date().getFullYear().toString();

    // Check for existing fees for this month
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const existingFee = await Fee.findOne({
      student: studentId,
      class: studentClass._id,
      feeType: 'monthly',
      academicYear: currentYear,
      dueDate: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    });

    if (existingFee) {
      console.log('Fee already exists for this month:', existingFee._id);
      return existingFee;
    }

    // Create new fee record
    const fee = new Fee({
      student: studentId,
      class: studentClass._id,
      academicYear: currentYear,
      feeType: 'monthly',
      amount: monthlyFee,
      dueDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1), // First day of next month
      status: 'pending',
      totalAmount: monthlyFee,
      createdBy: studentClass.createdBy || studentClass._id
    });

    await fee.save();
    console.log('Created new fee record:', {
      id: fee._id,
      student: fee.student,
      class: fee.class,
      amount: fee.amount,
      dueDate: fee.dueDate
    });

    return fee;
  } catch (error) {
    console.error('Error creating sample fees:', error);
    throw error;
  }
};

// Get fees for parent's children
const getChildFees = async (req, res) => {
  try {
    console.log("Fetching fees for parent:", req.parent._id);
    
    // Find parent and populate children with student details
    const parent = await Parent.findById(req.parent._id)
      .populate({
        path: 'children.student',
        select: 'studentID studentName enrolledClasses'
      });

    if (!parent) {
      console.log("Parent not found");
      return res.status(404).json({ message: "Parent not found" });
    }

    console.log("Parent found:", {
      id: parent._id,
      name: parent.parentName,
      childrenCount: parent.children.length
    });

    // Check if parent has children
    if (!parent.children || parent.children.length === 0) {
      console.log("Parent has no children");
      return res.status(404).json({ message: "No children found for this parent" });
    }

    // Extract student IDs from children array
    const studentIds = parent.children.map(child => child.student._id);
    console.log("Student IDs:", studentIds);

    // Find all fees for these students
    const fees = await Fee.find({
      student: { $in: studentIds }
    })
    .populate('student', 'studentID studentName')
    .populate('class', 'className')
    .sort({ dueDate: -1 });

    console.log("Found fees:", fees.length);

    // Map fees to include child name and relationship
    const feesWithChildInfo = fees.map(fee => {
      const childInfo = parent.children.find(
        child => child.student._id.toString() === fee.student._id.toString()
      );
      
      return {
        ...fee.toObject(),
        childName: childInfo.student.studentName,
        relationship: childInfo.relationship
      };
    });

    res.status(200).json({
      message: "Fees retrieved successfully",
      fees: feesWithChildInfo
    });

  } catch (error) {
    console.error("Error in getChildFees:", error);
    res.status(500).json({
      message: "Error fetching child fees",
      error: error.message
    });
  }
};

const payFee = async (req, res) => {
  try {
    const { feeId, paymentMethod, transactionId } = req.body;
    const parentId = req.parent._id;

    console.log('Processing payment:', {
      feeId,
      paymentMethod,
      transactionId,
      parentId
    });

    // Find the fee record
    let fee = await Fee.findById(feeId)
      .populate('student')
      .populate('class');
      
    if (!fee) {
      console.log('Fee not found:', feeId);
      return res.status(404).json({ message: 'Fee record not found' });
    }

    // If student is not populated, try to populate it manually
    if (!fee.student || !fee.student._id) {
      console.log('Student not populated, trying to populate manually');
      fee = await Fee.findById(feeId)
        .populate('student')
        .populate('class');
      
      if (!fee.student || !fee.student._id) {
        console.log('Still cannot populate student, fee may have invalid student reference');
        return res.status(400).json({ message: 'Fee record has invalid student reference' });
      }
    }

    console.log('Found fee:', {
      id: fee._id,
      student: fee.student,
      status: fee.status
    });

    // Check if fee has valid student and class data
    if (!fee.student || !fee.student._id) {
      console.log('Fee has invalid student data:', fee.student);
      return res.status(400).json({ message: 'Fee record has invalid student data' });
    }

    if (!fee.class || !fee.class._id) {
      console.log('Fee has invalid class data:', fee.class);
      return res.status(400).json({ message: 'Fee record has invalid class data' });
    }

    // Verify that the student actually exists in the database
    const studentExists = await Student.findById(fee.student._id);
    if (!studentExists) {
      console.log('Student referenced in fee does not exist:', fee.student._id);
      return res.status(400).json({ message: 'Student referenced in fee does not exist' });
    }

    // Verify that the class actually exists in the database
    const classExists = await Class.findById(fee.class._id);
    if (!classExists) {
      console.log('Class referenced in fee does not exist:', fee.class._id);
      return res.status(400).json({ message: 'Class referenced in fee does not exist' });
    }

    // Verify that the fee belongs to one of the parent's children
    const parent = await Parent.findById(parentId).populate('children.student');
    if (!parent) {
      console.log('Parent not found:', parentId);
      return res.status(404).json({ message: 'Parent not found' });
    }

    console.log('Found parent:', {
      id: parent._id,
      childrenCount: parent.children.length,
      children: parent.children.map(c => c.student?._id?.toString())
    });

    // Check if the fee's student ID matches any of the parent's children
    const isAuthorized = parent.children.some(
      child => child.student && child.student._id && child.student._id.toString() === fee.student._id.toString()
    );

    if (!isAuthorized) {
      console.log('Unauthorized payment attempt:', {
        feeStudentId: fee.student._id.toString(),
        parentChildrenIds: parent.children.map(c => c.student?._id?.toString())
      });
      return res.status(403).json({ message: 'Unauthorized to pay this fee' });
    }

    // Check if fee is already paid or under process
    if (fee.status === 'paid' || fee.status === 'under_process') {
      return res.status(400).json({ 
        message: `Fee is already ${fee.status === 'paid' ? 'paid' : 'under process'}`
      });
    }

    // Update fee payment details
    fee.status = 'under_process';
    fee.paymentMethod = paymentMethod;
    fee.transactionId = transactionId;
    fee.paymentDate = new Date();
    fee.paymentDetails = {
      onlinePaymentDetails: {
        gateway: 'online',
        transactionReference: transactionId
      }
    };
    fee.paymentApproval = {
      status: 'pending',
      approvedBy: null,
      approvedAt: null
    };

    // Update student's fee details
    const student = fee.student;
    const classId = fee.class._id.toString();

    try {
      // Get existing fee details for the class
      let existingFeeDetails = {};
      if (student.feeDetails && student.feeDetails instanceof Map) {
        existingFeeDetails = student.feeDetails.get(classId) || {};
      } else if (student.feeDetails && typeof student.feeDetails === 'object') {
        existingFeeDetails = student.feeDetails[classId] || {};
      }
      
      // Update the student's fee details
      const updatedFeeDetails = {
        ...existingFeeDetails,
        status: 'under_process',
        lastUpdated: new Date(),
        paymentDate: new Date(),
        paymentMethod: paymentMethod,
        transactionId: transactionId,
        totalAmount: fee.totalAmount,
        lateFeeAmount: fee.lateFeeAmount || 0
      };

      // Update the student document using $set with the Map structure
      const updatedStudent = await Student.findByIdAndUpdate(
        student._id,
        { $set: { [`feeDetails.${classId}`]: updatedFeeDetails } },
        { new: true }
      );

      if (!updatedStudent) {
        throw new Error('Failed to update student fee details');
      }

      // Save the fee record
      await fee.save();
      
      console.log('Fee updated successfully:', {
        id: fee._id,
        status: fee.status,
        transactionId: fee.transactionId
      });

      res.json({
        success: true,
        message: 'Payment submitted successfully. Waiting for admin approval.',
        fee
      });
    } catch (updateError) {
      console.error('Error updating student fee details:', updateError);
      // If student update fails, revert fee status
      fee.status = 'pending';
      await fee.save();
      throw new Error('Failed to update student fee details: ' + updateError.message);
    }
  } catch (error) {
    console.error('Error processing fee payment:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error processing payment',
      error: error.message,
      stack: error.stack
    });
  }
};

// Get child profile
const getChildProfile = async (req, res) => {
  try {
    console.log("Fetching child profile for parent ID:", req.parent._id);
    
    const parent = await Parent.findById(req.parent._id)
      .populate({
        path: 'children.student',
        select: 'studentID studentName studentEmail studentPhone studentAddress studentDOB studentGender enrolledClasses photo'
      });
    
    if (!parent) {
      console.error("Parent not found in database with ID:", req.parent._id);
      return res.status(404).json({ message: "Parent not found" });
    }

    if (!parent.children || parent.children.length === 0) {
      return res.status(404).json({ message: "No children found for this parent" });
    }

    // Get the first child's student data
    const child = parent.children[0].student;
    
    if (!child) {
      return res.status(404).json({ message: "Child data not found" });
    }
    
    console.log("Found child:", {
      id: child._id,
      studentID: child.studentID,
      name: child.studentName,
      photo: child.photo || "No photo" 
    });

    // Get class information if available
    let classInfo = {};
    if (child.enrolledClasses && child.enrolledClasses.length > 0) {
      const classDoc = await Class.findById(child.enrolledClasses[0]);
      if (classDoc) {
        classInfo = {
          class: classDoc.className,
          section: classDoc.section || "N/A"
        };
      }
    }
    
    // Format the child data
    const formattedChild = {
      studentID: child.studentID,
      studentName: child.studentName,
      class: classInfo.class || "N/A",
      section: classInfo.section || "N/A",
      rollNumber: child.rollNumber || "N/A",
      dateOfBirth: child.studentDOB ? new Date(child.studentDOB).toISOString().split('T')[0] : "N/A",
      gender: child.studentGender,
      email: child.studentEmail,
      phone: child.studentPhone,
      address: child.studentAddress,
      photo: child.photo || ""
    };
    
    res.status(200).json({ 
      child: formattedChild
    });
  } catch (error) {
    console.error("Error fetching child profile:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

module.exports = {
  parentLogin,
  getParentProfile,
  updateParentInfo,
  changeParentPassword,
  getChildFees,
  payFee,
  getChildProfile,
};
