const Fee = require("../models/FeeModel");
const Student = require("../models/StudentModel");
const Class = require("../models/ClassModel");
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
        // Calculate total amount including any late fees
        let totalAmount = Number(baseFee);
        const currentDate = new Date();
        const dueDate = feeDueDate ? new Date(feeDueDate) : null;
        
        let status = 'pending';
        let lateFeeAmount = 0;
        
        if (dueDate && currentDate > dueDate) {
          const daysLate = Math.ceil((currentDate - dueDate) / (1000 * 60 * 60 * 24));
          lateFeeAmount = daysLate * Number(lateFeePerDay);
          totalAmount = Number(baseFee) + lateFeeAmount;
          status = 'overdue';
        }

        // Create the fee details update
        const feeDetailsUpdate = {
          [`feeDetails.${classId}`]: {
            classFee: Number(baseFee),
            totalAmount: totalAmount,
            status: status,
            lastUpdated: currentDate,
            dueDate: dueDate,
            lateFeePerDay: Number(lateFeePerDay),
            lateFeeAmount: lateFeeAmount
          }
        };

        // Update the student document using findOneAndUpdate
        console.log("Updating student:", student.studentID);
        const updatedStudent = await Student.findOneAndUpdate(
          { _id: student._id },
          { $set: feeDetailsUpdate },
          { new: true, upsert: true }
        );

        // Check for existing fee record for this month
        const existingFee = await Fee.findOne({
          student: student._id,
          class: classId,
          academicYear: new Date().getFullYear().toString(),
          feeType: "monthly",
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
          }
        });

        if (!existingFee) {
          // Create a new fee record only if one doesn't exist for this month
          const feeRecord = new Fee({
            student: student._id,
            class: classId,
            academicYear: new Date().getFullYear().toString(),
            feeType: "monthly",
            amount: Number(baseFee),
            dueDate: dueDate || new Date(),
            status: status,
            totalAmount: totalAmount,
            lateFeeAmount: lateFeeAmount,
            createdBy: req.admin._id
          });

          await feeRecord.save();
        }

        return updatedStudent;
      } catch (studentError) {
        console.error("Error updating student:", student.studentID, studentError);
        throw studentError;
      }
    });

    // Wait for all student updates to complete
    const updatedStudents = await Promise.all(updatePromises);
    console.log("All student updates completed");

    // Fetch updated class data
    const updatedClass = await Class.findById(classId);

    res.status(200).json({
      message: "Class fee settings updated successfully",
      updatedClass: {
        id: updatedClass._id,
        className: updatedClass.className,
        baseFee: updatedClass.baseFee,
        lateFeePerDay: updatedClass.lateFeePerDay,
        feeDueDate: updatedClass.feeDueDate
      },
      updatedStudents: updatedStudents.map(student => ({
        id: student._id,
        studentID: student.studentID,
        studentName: student.studentName,
        feeDetails: student.feeDetails ? student.feeDetails[classId] : null
      })),
      updatedStudentsCount: students.length
    });
  } catch (error) {
    console.error("Error updating class fee:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Error updating class fee settings",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}; 