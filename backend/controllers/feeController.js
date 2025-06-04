const Fee = require("../models/FeeModel");
const Student = require("../models/StudentModel");
const Class = require("../models/ClassModel");
const Teacher = require("../models/TeacherModel");
const { validationResult } = require("express-validator");

// Create a new fee record
exports.createFee = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      studentId,
      classId,
      academicYear,
      feeType,
      amount,
      dueDate,
      description,
    } = req.body;

    // Validate student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Validate class - try both by ID and classId
    let classDoc = await Class.findById(classId);
    if (!classDoc) {
      classDoc = await Class.findOne({ classId: classId });
    }
    if (!classDoc) {
      return res.status(404).json({ 
        message: "Class not found",
        details: "Please provide a valid class ID or class identifier"
      });
    }

    // Verify student is enrolled in the class
    const isEnrolled = student.enrolledClasses.includes(classDoc._id);
    if (!isEnrolled) {
      return res.status(400).json({ 
        message: "Student is not enrolled in this class",
        studentId: student.studentID,
        className: classDoc.className
      });
    }

    // Create new fee record
    const fee = new Fee({
      student: studentId,
      class: classDoc._id,
      academicYear,
      feeType,
      amount,
      dueDate,
      description,
      totalAmount: amount,
      createdBy: req.admin._id,
    });

    await fee.save();

    res.status(201).json({
      message: "Fee record created successfully",
      data: fee,
    });
  } catch (error) {
    console.error("Error creating fee record:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
};

// Get all fees for a student
exports.getStudentFees = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYear, status } = req.query;

    const query = { student: studentId };
    if (academicYear) query.academicYear = academicYear;
    if (status) query.status = status;

    const fees = await Fee.find(query)
      .populate("student", "studentName studentID")
      .populate("class", "className classId")
      .sort({ dueDate: -1 });

    res.status(200).json({
      message: "Fees retrieved successfully",
      data: fees,
    });
  } catch (error) {
    console.error("Error retrieving fees:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update fee status (for admin)
exports.updateFeeStatus = async (req, res) => {
  try {
    const { feeId } = req.params;
    const { status, paymentMethod, paymentDetails } = req.body;

    const fee = await Fee.findById(feeId);
    if (!fee) {
      return res.status(404).json({ message: "Fee record not found" });
    }

    // Update fee status and payment details
    fee.status = status;
    if (status === "paid") {
      fee.paymentDate = new Date();
      fee.paymentMethod = paymentMethod;
      fee.paymentDetails = paymentDetails;
    }

    await fee.save();

    res.status(200).json({
      message: "Fee status updated successfully",
      data: fee,
    });
  } catch (error) {
    console.error("Error updating fee status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Process online payment (for parent)
exports.processPayment = async (req, res) => {
  try {
    const { feeId } = req.params;
    const { paymentMethod, paymentDetails } = req.body;

    const fee = await Fee.findById(feeId);
    if (!fee) {
      return res.status(404).json({ message: "Fee record not found" });
    }

    if (fee.status === "paid") {
      return res.status(400).json({ message: "Fee already paid" });
    }

    // Here you would integrate with a payment gateway
    // For now, we'll just update the status
    fee.status = "paid";
    fee.paymentDate = new Date();
    fee.paymentMethod = paymentMethod;
    fee.paymentDetails = paymentDetails;

    await fee.save();

    res.status(200).json({
      message: "Payment processed successfully",
      data: fee,
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get fee statistics
exports.getFeeStatistics = async (req, res) => {
  try {
    const { classId, academicYear } = req.query;

    const query = {};
    if (classId) {
      // Try both by ID and classId
      const classDoc = await Class.findOne({ 
        $or: [
          { _id: classId },
          { classId: classId }
        ]
      });
      if (classDoc) {
        query.class = classDoc._id;
      }
    }
    if (academicYear) query.academicYear = academicYear;

    const totalFees = await Fee.countDocuments(query);
    const paidFees = await Fee.countDocuments({ ...query, status: "paid" });
    const pendingFees = await Fee.countDocuments({ ...query, status: "pending" });
    const overdueFees = await Fee.countDocuments({ ...query, status: "overdue" });

    const totalAmount = await Fee.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const paidAmount = await Fee.aggregate([
      { $match: { ...query, status: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    res.status(200).json({
      message: "Fee statistics retrieved successfully",
      data: {
        totalFees,
        paidFees,
        pendingFees,
        overdueFees,
        totalAmount: totalAmount[0]?.total || 0,
        paidAmount: paidAmount[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("Error retrieving fee statistics:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update class fee settings
exports.updateClassFee = async (req, res) => {
  try {
    console.log("Received request body:", req.body);
    const { classId, baseFee, lateFeePerDay, feeDueDate } = req.body;

    if (!classId || !baseFee || !lateFeePerDay) {
      return res.status(400).json({
        message: "Class ID, base fee, and late fee per day are required"
      });
    }

    // Find the class
    console.log("Finding class with ID:", classId);
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      console.log("Class not found with ID:", classId);
      return res.status(404).json({
        message: "Class not found"
      });
    }

    console.log("Found class:", classDoc.className);

    // Update class fee settings
    classDoc.baseFee = Number(baseFee);
    classDoc.lateFeePerDay = Number(lateFeePerDay);
    if (feeDueDate) {
      console.log("Setting fee due date:", feeDueDate);
      classDoc.feeDueDate = new Date(feeDueDate);
    }
    
    console.log("Saving class document...");
    await classDoc.save();
    console.log("Class document saved successfully");

    // Update fee details for all students in this class
    console.log("Finding students for class:", classId);
    const students = await Student.find({ enrolledClasses: classId });
    console.log("Found", students.length, "students");

    const updatePromises = students.map(async (student) => {
      try {
        // Calculate monthly fee amount
        const monthlyFee = Number(baseFee) / 12;
        const currentDate = new Date();
        const dueDate = feeDueDate ? new Date(feeDueDate) : null;
        
        let status = 'pending';
        let lateFeeAmount = 0;
        
        if (dueDate && currentDate > dueDate) {
          const daysLate = Math.ceil((currentDate - dueDate) / (1000 * 60 * 60 * 24));
          lateFeeAmount = daysLate * Number(lateFeePerDay);
          status = 'overdue';
        }

        // Check for existing fee record for this month
        const existingFee = await Fee.findOne({
          student: student._id,
          class: classId,
          feeType: 'monthly',
          academicYear: new Date().getFullYear().toString(),
          dueDate: dueDate || new Date()
        });

        if (existingFee) {
          // Update existing fee record
          existingFee.amount = monthlyFee;
          existingFee.totalAmount = monthlyFee + lateFeeAmount;
          existingFee.lateFeeAmount = lateFeeAmount;
          existingFee.status = status;
          await existingFee.save();
          console.log("Updated existing fee record for student:", student.studentID);
        } else {
          // Create a new fee record for this month
          const feeRecord = new Fee({
            student: student._id,
            class: classId,
            academicYear: new Date().getFullYear().toString(),
            feeType: "monthly",
            amount: monthlyFee,
            dueDate: dueDate || new Date(),
            status: status,
            totalAmount: monthlyFee + lateFeeAmount,
            lateFeeAmount: lateFeeAmount,
            createdBy: req.admin._id
          });

          await feeRecord.save();
          console.log("Created new fee record for student:", student.studentID);
        }

        // Update the student's fee details
        const feeDetailsUpdate = {
          [`feeDetails.${classId}`]: {
            classFee: Number(baseFee),
            monthlyFee: monthlyFee,
            totalAmount: monthlyFee + lateFeeAmount,
            status: status,
            lastUpdated: currentDate,
            dueDate: dueDate,
            lateFeePerDay: Number(lateFeePerDay),
            lateFeeAmount: lateFeeAmount
          }
        };

        // Update the student document
        const updatedStudent = await Student.findOneAndUpdate(
          { _id: student._id },
          { $set: feeDetailsUpdate },
          { new: true }
        );

        return updatedStudent;
      } catch (error) {
        console.error("Error updating student fee:", error);
        throw error;
      }
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      message: "Class fee settings updated successfully",
      class: classDoc
    });
  } catch (error) {
    console.error("Error updating class fee:", error);
    res.status(500).json({
      message: "Error updating class fee",
      error: error.message
    });
  }
};

// Approve or reject fee payment
exports.handleFeeApproval = async (req, res) => {
  try {
    const { feeId } = req.params;
    const { action, rejectionReason } = req.body;

    console.log('Processing fee approval:', {
      feeId,
      action,
      rejectionReason
    });

    const fee = await Fee.findById(feeId)
      .populate('student')
      .populate('class');
      
    if (!fee) {
      console.log('Fee not found:', feeId);
      return res.status(404).json({ 
        success: false,
        message: 'Fee record not found' 
      });
    }

    // Allow both 'under_process' and 'pending' statuses
    if (fee.status !== 'under_process' && fee.status !== 'pending') {
      console.log('Invalid fee status:', fee.status);
      return res.status(400).json({ 
        success: false,
        message: 'Fee is not pending approval' 
      });
    }

    // Get the approver ID based on role
    const approverId = req.admin?._id || req.teacher?._id;
    const approverRole = req.admin ? 'admin' : 'teacher';

    if (!approverId) {
      console.log('No approver ID found');
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized to approve fees' 
      });
    }

    if (action === 'approve') {
      try {
        // Update fee record
        fee.status = 'paid';
        fee.paymentDate = new Date();
        fee.paymentApproval = {
          status: 'approved',
          approvedBy: approverId,
          approvedByRole: approverRole,
          approvedAt: new Date()
        };

        // Update student's fee details
        if (fee.student && fee.class) {
          const student = fee.student;
          const classId = fee.class._id.toString();

          // Get existing fee details for the class
          const existingFeeDetails = student.feeDetails?.get?.(classId) || {};
          
          // Update the student's fee details
          const updatedFeeDetails = {
            ...existingFeeDetails,
            status: 'paid',
            lastUpdated: new Date(),
            paymentDate: new Date(),
            paymentMethod: fee.paymentMethod || 'online',
            transactionId: fee.transactionId,
            totalAmount: fee.totalAmount,
            lateFeeAmount: fee.lateFeeAmount || 0,
            dueDate: fee.dueDate,
            paidMonth: new Date().getMonth() + 1,
            paidYear: new Date().getFullYear(),
            paymentApproval: {
              status: 'approved',
              approvedBy: approverId,
              approvedByRole: approverRole,
              approvedAt: new Date()
            }
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

          // Update all fee records for this student and class to reflect the paid status
          await Fee.updateMany(
            {
              student: student._id,
              class: fee.class._id,
              status: { $in: ['pending', 'overdue'] }
            },
            {
              $set: {
                status: 'paid',
                paymentDate: new Date(),
                paymentMethod: fee.paymentMethod || 'online',
                transactionId: fee.transactionId,
                paymentApproval: {
                  status: 'approved',
                  approvedBy: approverId,
                  approvedByRole: approverRole,
                  approvedAt: new Date()
                }
              }
            }
          );
        }

        await fee.save();
        
        console.log('Fee approved successfully:', {
          feeId: fee._id,
          studentId: fee.student?._id,
          classId: fee.class?._id
        });

        res.json({
          success: true,
          message: 'Payment approved successfully',
          fee
        });
      } catch (updateError) {
        console.error('Error updating fee details:', updateError);
        // If student update fails, revert fee status
        fee.status = 'under_process';
        await fee.save();
        throw new Error('Failed to update fee details: ' + updateError.message);
      }
    } else if (action === 'reject') {
      if (!rejectionReason) {
        return res.status(400).json({ 
          success: false,
          message: 'Rejection reason is required' 
        });
      }

      try {
        // Update fee record
        fee.status = 'cancelled';
        fee.paymentApproval = {
          status: 'rejected',
          approvedBy: approverId,
          approvedByRole: approverRole,
          approvedAt: new Date(),
          rejectionReason: rejectionReason || `Payment rejected by ${approverRole}`
        };

        // Update student's fee details
        if (fee.student && fee.class) {
          const student = fee.student;
          const classId = fee.class._id.toString();

          // Get existing fee details for the class
          const existingFeeDetails = student.feeDetails?.get?.(classId) || {};
          
          // Update the student's fee details
          const updatedFeeDetails = {
            ...existingFeeDetails,
            status: 'cancelled',
            lastUpdated: new Date(),
            rejectionReason: rejectionReason || `Payment rejected by ${approverRole}`,
            dueDate: fee.dueDate,
            paymentApproval: {
              status: 'rejected',
              approvedBy: approverId,
              approvedByRole: approverRole,
              approvedAt: new Date(),
              rejectionReason: rejectionReason || `Payment rejected by ${approverRole}`
            }
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
        }

        await fee.save();
        
        console.log('Fee rejected successfully:', {
          feeId: fee._id,
          studentId: fee.student?._id,
          classId: fee.class?._id
        });

        res.json({
          success: true,
          message: 'Payment rejected successfully',
          fee
        });
      } catch (updateError) {
        console.error('Error updating fee details:', updateError);
        // If student update fails, revert fee status
        fee.status = 'under_process';
        await fee.save();
        throw new Error('Failed to update fee details: ' + updateError.message);
      }
    } else {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid action' 
      });
    }
  } catch (error) {
    console.error('Error handling fee approval:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error processing approval',
      error: error.message 
    });
  }
};

// Get pending fee approvals
exports.getPendingApprovals = async (req, res) => {
  try {
    // Get the user's role and ID
    const isAdmin = !!req.admin;
    const isTeacher = !!req.teacher;
    const userId = req.admin?._id || req.teacher?._id;

    // Base query for pending fees
    const query = { status: 'under_process' };

    // If teacher, only show fees for their assigned classes
    if (isTeacher) {
      const teacher = await Teacher.findById(userId).populate('assignedClasses');
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }
      const classIds = teacher.assignedClasses.map(c => c._id);
      query.class = { $in: classIds };
    }

    const pendingFees = await Fee.find(query)
      .populate('student', 'studentName')
      .populate('class', 'className')
      .sort({ paymentDate: -1 });

    res.json({
      success: true,
      fees: pendingFees
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending approvals',
      error: error.message
    });
  }
};

// Approve or reject a fee payment
exports.approveFeePayment = async (req, res) => {
  try {
    const { feeId } = req.params;
    const { action, rejectionReason } = req.body;

    const fee = await Fee.findById(feeId);
    if (!fee) {
      return res.status(404).json({
        success: false,
        message: 'Fee payment not found'
      });
    }

    if (fee.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This fee payment has already been processed'
      });
    }

    if (action === 'approve') {
      fee.status = 'paid';
      fee.approvedBy = req.admin._id;
      fee.approvalDate = new Date();
    } else if (action === 'reject') {
      if (!rejectionReason) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }
      fee.status = 'rejected';
      fee.rejectionReason = rejectionReason;
      fee.rejectedBy = req.admin._id;
      fee.rejectionDate = new Date();
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action'
      });
    }

    await fee.save();

    res.json({
      success: true,
      message: action === 'approve' ? 'Payment approved successfully' : 'Payment rejected',
      fee
    });
  } catch (error) {
    console.error('Error processing fee approval:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing fee approval',
      error: error.message
    });
  }
}; 