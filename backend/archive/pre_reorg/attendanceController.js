const Class = require("../models/ClassModel");
const Student = require("../models/StudentModel");
const mongoose = require("mongoose");
const ExcelJS = require('exceljs');

// Get available classes for a teacher
exports.getTeacherClasses = async (req, res) => {
  try {
    const teacherId = req.teacher._id;
    
    // Fetch classes from the database
    const classes = await Class.find({
      teachers: teacherId
    }).select('className classId section').lean();

    // If no classes found, return standard classes
    if (!classes || classes.length === 0) {
      const standardClasses = Array.from({ length: 12 }, (_, i) => ({
        className: `Class ${i + 1}`,
        classId: `CLASS${i + 1}`,
      }));
      
      return res.status(200).json({
        success: true,
        data: standardClasses,
      });
    }
    
    // Sort classes by className and then by section
    const sortedClasses = classes.sort((a, b) => {
      // First sort by class name (Class 1, Class 2, etc.)
      const classA = parseInt(a.className.split(' ')[1]);
      const classB = parseInt(b.className.split(' ')[1]);
      
      if (classA !== classB) {
        return classA - classB;
      }
      
      // If same class, sort by section (A, B, C, etc.)
      return a.section.localeCompare(b.section);
    });
    
    res.status(200).json({
      success: true,
      data: sortedClasses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching classes",
      error: error.message,
    });
  }
};

// Get enrolled students for a class
exports.getEnrolledStudents = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.teacher._id;
    
    // First find the class to get its className
    const classDoc = await Class.findOne({ classId });
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Class not found"
      });
    }

    // Get students for the class using the className
    const students = await Student.find({ 
      enrolledClasses: classDoc._id 
    }).select("studentName studentID _id").lean();

    // If no students found, return empty array
    if (!students || students.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error("Error fetching enrolled students:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching enrolled students",
      error: error.message,
    });
  }
};

// Mark attendance for a class
exports.markAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { attendanceRecords, date } = req.body;
    const teacherId = req.teacher._id;
    
    // Use provided date or current date
    let attendanceDate;
    if (date) {
      // Parse the provided date and set to start of day in UTC
      const [year, month, day] = date.split('-').map(Number);
      attendanceDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      console.log(`Using provided date (UTC): ${date}, parsed as: ${attendanceDate.toISOString()}`);
    } else {
      // Use current date if no date provided
      attendanceDate = new Date();
      attendanceDate.setUTCHours(0, 0, 0, 0);
      console.log(`Using current date (UTC): ${attendanceDate.toISOString()}`);
    }

    // Check if attendance already exists for the selected date
    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const existingAttendance = await Class.findOne({
      classId: classId,
      "attendanceHistory.date": {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: "Attendance already marked for today",
      });
    }

    // Find the class
    const classDoc = await Class.findOne({ classId });
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Class not found"
      });
    }

    // Update class attendance history
    classDoc.attendanceHistory.push({
      date: attendanceDate,
      records: attendanceRecords.map(record => ({
        studentId: record.studentId,
        status: record.status
      }))
    });

    await classDoc.save();

    // Update student attendance records
    for (const record of attendanceRecords) {
      await Student.findByIdAndUpdate(record.studentId, {
        $push: {
          attendance: {
            date: attendanceDate,
            classId: classDoc._id,
            status: record.status,
          },
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Attendance marked successfully",
    });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({
      success: false,
      message: "Error marking attendance",
      error: error.message,
    });
  }
};

// Get attendance history for a class
exports.getClassAttendanceHistory = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;
    const teacherId = req.teacher._id;

    const query = { classId: classId };
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setMonth(endDate.getMonth() + 1);
      query["attendanceHistory.date"] = {
        $gte: startDate,
        $lt: endDate
      };
    }

    const classData = await Class.findOne(query)
      .populate("attendanceHistory.records.studentId", "studentName studentID")
      .lean();

    if (!classData) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      data: classData.attendanceHistory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching attendance history",
      error: error.message,
    });
  }
};

// Download monthly attendance report
exports.downloadMonthlyAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { month, year, fromDate, toDate } = req.query;
    const teacherId = req.teacher._id;

    console.log("Download request params:", { classId, month, year, fromDate, toDate });

    // Find the class by classId (which could be a string ID, not necessarily an ObjectId)
    const classDoc = await Class.findOne({ classId });
    
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Class not found with ID: " + classId,
      });
    }

    let startDate, endDate;
    if (fromDate && toDate) {
      startDate = new Date(fromDate);
      endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
    } else if (month && year) {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59, 999);
    } else {
      return res.status(400).json({
        success: false,
        message: "Please provide either month/year or fromDate/toDate."
      });
    }

    console.log("Date range:", { startDate, endDate });

    // Get class data with attendance records
    const populatedClassData = await Class.findById(classDoc._id)
      .populate("attendanceHistory.records.studentId", "studentName studentID photo")
      .lean();

    // Filter attendance records for the specified range
    const filteredAttendance = populatedClassData.attendanceHistory.filter(
      record => {
        const recordDate = new Date(record.date);
        return recordDate >= startDate && recordDate <= endDate;
      }
    );

    console.log(`Found ${filteredAttendance.length} attendance records in the date range`);

    if (filteredAttendance.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No attendance records found for the selected date range."
      });
    }

    // Sort attendance records by date
    filteredAttendance.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Get a unique list of students from all attendance records
    const studentsMap = new Map();
    filteredAttendance.forEach(record => {
      record.records.forEach(studentRecord => {
        if (studentRecord.studentId) {
          studentsMap.set(studentRecord.studentId._id.toString(), {
            id: studentRecord.studentId._id,
            studentID: studentRecord.studentId.studentID,
            studentName: studentRecord.studentId.studentName
          });
        }
      });
    });
    
    const uniqueStudents = Array.from(studentsMap.values());
    uniqueStudents.sort((a, b) => a.studentID.localeCompare(b.studentID));

    // Create Excel workbook with better formatting
    const workbook = new ExcelJS.Workbook();
    
    // Create summary worksheet
    const summarySheet = workbook.addWorksheet('Summary');
    
    // Add class info and report title
    summarySheet.mergeCells('A1:E1');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = `Attendance Report - ${classDoc.className}`;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center' };
    
    summarySheet.mergeCells('A2:E2');
    const dateRangeCell = summarySheet.getCell('A2');
    dateRangeCell.value = `Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`;
    dateRangeCell.font = { size: 12, italic: true };
    dateRangeCell.alignment = { horizontal: 'center' };
    
    // Add empty row
    summarySheet.addRow([]);
    
    // Add headers
    const summaryHeaders = ['Student ID', 'Student Name', 'Total Days', 'Present', 'Absent', 'Attendance %'];
    const headerRow = summarySheet.addRow(summaryHeaders);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    // Calculate and add student attendance summary
    uniqueStudents.forEach(student => {
      const totalDays = filteredAttendance.length;
      let presentDays = 0;
      
      filteredAttendance.forEach(record => {
        const studentRecord = record.records.find(r => 
          r.studentId && r.studentId._id.toString() === student.id.toString()
        );
        if (studentRecord && studentRecord.status === 'Present') {
          presentDays++;
        }
      });
      
      const absentDays = totalDays - presentDays;
      const attendancePercentage = totalDays > 0 ? (presentDays / totalDays * 100).toFixed(2) : 'N/A';
      
      const dataRow = summarySheet.addRow([
        student.studentID,
        student.studentName,
        totalDays,
        presentDays,
        absentDays,
        `${attendancePercentage}%`
      ]);
      
      dataRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
    
    // Auto-size columns
    summarySheet.columns.forEach(column => {
      column.width = 15;
    });
    
    // Create detailed worksheet
    const detailSheet = workbook.addWorksheet('Daily Details');
    
    // Add class info and report title
    detailSheet.mergeCells('A1:E1');
    const detailTitleCell = detailSheet.getCell('A1');
    detailTitleCell.value = `Daily Attendance Details - ${classDoc.className}`;
    detailTitleCell.font = { size: 16, bold: true };
    detailTitleCell.alignment = { horizontal: 'center' };
    
    detailSheet.mergeCells('A2:E2');
    const detailDateCell = detailSheet.getCell('A2');
    detailDateCell.value = `Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`;
    detailDateCell.font = { size: 12, italic: true };
    detailDateCell.alignment = { horizontal: 'center' };
    
    // Add empty row
    detailSheet.addRow([]);
    
    // Add data for each date
    filteredAttendance.forEach(dateRecord => {
      const recordDate = new Date(dateRecord.date).toLocaleDateString();
      
      // Add date header
      const dateHeaderRow = detailSheet.addRow([`Date: ${recordDate}`]);
      dateHeaderRow.font = { bold: true, size: 12 };
      dateHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCCCFF' }
      };
      
      // Add column headers for this date
      const dailyHeaders = ['Student ID', 'Student Name', 'Status'];
      const dailyHeaderRow = detailSheet.addRow(dailyHeaders);
      dailyHeaderRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD3D3D3' }
        };
      });
      
      // Add student data for this date
      dateRecord.records.forEach(studentRecord => {
        if (studentRecord.studentId) {
          const studentRow = detailSheet.addRow([
            studentRecord.studentId.studentID,
            studentRecord.studentId.studentName,
            studentRecord.status
          ]);
          
          // Color-code the status cell
          const statusCell = studentRow.getCell(3);
          if (studentRecord.status === 'Present') {
            statusCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFD4EDDA' }
            };
          } else {
            statusCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8D7DA' }
            };
          }
        }
      });
      
      // Add empty row after each date's data
      detailSheet.addRow([]);
    });
    
    // Auto-size columns
    detailSheet.columns.forEach(column => {
      column.width = 20;
    });
    
    // Create date-wise individual sheets
    const usedSheetNames = new Set();
    filteredAttendance.forEach(dateRecord => {
      const recordDate = new Date(dateRecord.date);
      let sheetName = recordDate.toLocaleDateString().replace(/\//g, '-');
      // Ensure uniqueness
      let originalSheetName = sheetName;
      let counter = 1;
      while (usedSheetNames.has(sheetName)) {
        sheetName = `${originalSheetName} (${counter++})`;
      }
      usedSheetNames.add(sheetName);

      const dateSheet = workbook.addWorksheet(sheetName);
      
      // Add class info and date title
      dateSheet.mergeCells('A1:C1');
      const dateTitleCell = dateSheet.getCell('A1');
      dateTitleCell.value = `${classDoc.className} - Attendance for ${recordDate.toLocaleDateString()}`;
      dateTitleCell.font = { size: 14, bold: true };
      dateTitleCell.alignment = { horizontal: 'center' };
      
      // Add empty row
      dateSheet.addRow([]);
      
      // Add headers
      const dateHeaders = ['Student ID', 'Student Name', 'Status'];
      const dateHeaderRow = dateSheet.addRow(dateHeaders);
      dateHeaderRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD3D3D3' }
        };
      });
      
      // Add attendance data
      dateRecord.records.forEach(studentRecord => {
        if (studentRecord.studentId) {
          const studentRow = dateSheet.addRow([
            studentRecord.studentId.studentID,
            studentRecord.studentId.studentName,
            studentRecord.status
          ]);
          
          // Color-code the status cell
          const statusCell = studentRow.getCell(3);
          if (studentRecord.status === 'Present') {
            statusCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFD4EDDA' }
            };
          } else {
            statusCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8D7DA' }
            };
          }
        }
      });
      
      // Add summary at the bottom
      dateSheet.addRow([]);
      const presentCount = dateRecord.records.filter(r => r.status === 'Present').length;
      const absentCount = dateRecord.records.filter(r => r.status === 'Absent').length;
      const total = dateRecord.records.length;
      
      dateSheet.addRow(['Total Students', total]);
      dateSheet.addRow(['Present', presentCount]);
      dateSheet.addRow(['Absent', absentCount]);
      
      // Auto-size columns
      dateSheet.columns.forEach(column => {
        column.width = 20;
      });
    });

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=attendance_${classDoc.className}_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.xlsx`
    );

    // Send the Excel file
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating attendance report:", error);
    res.status(500).json({
      success: false,
      message: "Error generating attendance report: " + error.message,
      error: error.message,
    });
  }
};

// Update attendance for a class on a specific date
exports.updateAttendance = async (req, res) => {
  try {
    const { classId, date } = req.params;
    const { attendanceRecords } = req.body;
    const teacherId = req.teacher._id;

    console.log(`Updating attendance for class ${classId} on date ${date}`);

    // Parse the date parameter as UTC
    let targetDate;
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-').map(Number);
      targetDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    } else {
      targetDate = new Date(date);
    }
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Find the class
    const classDoc = await Class.findOne({ classId });
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Class not found"
      });
    }

    // Debug: Print all attendanceHistory dates and the search range
    console.log('All attendanceHistory dates for this class:');
    classDoc.attendanceHistory.forEach((rec, i) => {
      console.log(i, rec.date, new Date(rec.date).toISOString());
    });
    console.log('Looking for date between', startOfDay.toISOString(), 'and', endOfDay.toISOString());

    // Find the specific attendance record for the date
    const attendanceIndex = classDoc.attendanceHistory.findIndex(record => {
      const recordDate = new Date(record.date);
      return recordDate >= startOfDay && recordDate <= endOfDay;
    });

    if (attendanceIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "No attendance record found for the specified date"
      });
    }

    // Update the existing attendance record
    classDoc.attendanceHistory[attendanceIndex].records = attendanceRecords.map(record => ({
      studentId: record.studentId,
      status: record.status
    }));

    await classDoc.save();

    // Update student attendance records
    // First, remove existing attendance records for this date/class
    for (const student of await Student.find({ enrolledClasses: classDoc._id })) {
      await Student.updateOne(
        { _id: student._id },
        { 
          $pull: {
            attendance: {
              date: { $gte: startOfDay, $lte: endOfDay },
              classId: classDoc._id
            }
          }
        }
      );
    }

    // Create a date object for the start of the target day (00:00:00 UTC)
    const updateAttendanceDate = new Date(targetDate);
    updateAttendanceDate.setUTCHours(0, 0, 0, 0);

    // Then add the updated attendance records
    for (const record of attendanceRecords) {
      await Student.findByIdAndUpdate(record.studentId, {
        $push: {
          attendance: {
            date: updateAttendanceDate,
            classId: classDoc._id,
            status: record.status,
          },
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
    });
  } catch (error) {
    console.error("Error updating attendance:", error);
    res.status(500).json({
      success: false,
      message: "Error updating attendance",
      error: error.message,
    });
  }
};

// Get student attendance records for admin
exports.getStudentAttendanceRecords = async (req, res) => {
  try {
    const { studentID, studentName, month, year, date } = req.query;
    
    console.log("Admin attendance query params:", { studentID, studentName, month, year, date });
    
    // Build the query object
    const query = {};
    
    if (studentID) {
      query.studentID = { $regex: studentID, $options: 'i' };
    }
    
    if (studentName) {
      query.studentName = { $regex: studentName, $options: 'i' };
    }
    
    console.log("Student query:", query);
    
    // Find students based on the query
    const students = await Student.find(query).populate('enrolledClasses', 'className classId');
    
    console.log(`Found ${students.length} students`);
    
    if (!students || students.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No students found matching the criteria"
      });
    }
    
    // Get attendance records for all found students
    const attendanceRecords = [];
    
    for (const student of students) {
      // Build date filter for attendance
      let dateFilter = {};
      
      if (date) {
        // Create date range for the entire day in UTC
        const [year, month, day] = date.split('-').map(Number);
        const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
        
        dateFilter = {
          date: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        };
        console.log(`Date filter for ${date}:`, dateFilter);
      } else if (month && year) {
        // Filter by month and year
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
        
        dateFilter = {
          date: { $gte: startDate, $lte: endDate }
        };
        console.log(`Month/Year filter for ${month}/${year}:`, dateFilter);
      } else if (year) {
        // Filter by year only
        const startDate = new Date(parseInt(year), 0, 1);
        const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59, 999);
        
        dateFilter = {
          date: { $gte: startDate, $lte: endDate }
        };
        console.log(`Year filter for ${year}:`, dateFilter);
      } else {
        // No date filter - show all attendance records
        console.log("No date filter applied - showing all attendance records");
      }
      
      // Check if student has any attendance records at all
      const totalAttendanceCount = await Student.aggregate([
        { $match: { _id: student._id } },
        { $project: { attendanceCount: { $size: "$attendance" } } }
      ]);
      
      console.log(`Student ${student.studentID} has ${totalAttendanceCount[0]?.attendanceCount || 0} total attendance records`);
      
      // Get attendance records for this student
      console.log(`Processing student ${student.studentID} with date filter:`, dateFilter);
      
      const studentAttendance = await Student.aggregate([
        { $match: { _id: student._id } },
        { $unwind: '$attendance' },
        ...(Object.keys(dateFilter).length > 0 ? [{ $match: { 'attendance.date': dateFilter.date } }] : []),
        {
          $lookup: {
            from: 'classes',
            localField: 'attendance.classId',
            foreignField: '_id',
            as: 'classInfo'
          }
        },
        {
          $project: {
            student: {
              studentID: '$studentID',
              name: '$studentName'
            },
            status: '$attendance.status',
            date: '$attendance.date',
            remarks: null, // Since remarks field doesn't exist in the model
            className: { $arrayElemAt: ['$classInfo.className', 0] },
            section: { $arrayElemAt: ['$classInfo.section', 0] },
            classId: { $arrayElemAt: ['$classInfo.classId', 0] }
          }
        }
      ]);
      
      console.log(`Found ${studentAttendance.length} attendance records for student ${student.studentID}`);
      attendanceRecords.push(...studentAttendance);
    }
    
    // Sort by date (most recent first)
    attendanceRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    console.log(`Total attendance records found: ${attendanceRecords.length}`);
    
    // Debug: Let's also show what the actual attendance records look like
    if (attendanceRecords.length === 0 && date) {
      console.log(`No records found for date ${date}. Let's check what dates are actually in the database:`);
      const allDates = await Student.aggregate([
        { $unwind: '$attendance' },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$attendance.date" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      console.log(`Available dates in database:`, allDates);
      
      // Also show the actual attendance records with more details
      const allAttendanceRecords = await Student.aggregate([
        { $unwind: '$attendance' },
        {
          $project: {
            studentID: '$studentID',
            studentName: '$studentName',
            status: '$attendance.status',
            date: '$attendance.date',
            dateString: { $dateToString: { format: "%Y-%m-%d", date: "$attendance.date" } },
            classId: '$attendance.classId'
          }
        },
        { $sort: { dateString: 1 } }
      ]);
      console.log(`All attendance records with details:`, allAttendanceRecords);
      
      // Let's also check if there are any records in the Class model
      const classAttendanceRecords = await Class.aggregate([
        { $unwind: '$attendanceHistory' },
        {
          $project: {
            classId: '$classId',
            className: '$className',
            date: '$attendanceHistory.date',
            dateString: { $dateToString: { format: "%Y-%m-%d", date: "$attendanceHistory.date" } },
            recordCount: { $size: '$attendanceHistory.records' }
          }
        },
        { $sort: { dateString: 1 } }
      ]);
      console.log(`Class attendance records:`, classAttendanceRecords);
      
      // Let's also check what the search date looks like in different formats
      console.log(`Search date: ${date}`);
      console.log(`Search date as Date object:`, new Date(date));
      console.log(`Search date start of day:`, new Date(date + 'T00:00:00.000Z'));
      console.log(`Search date end of day:`, new Date(date + 'T23:59:59.999Z'));
    }
    
    res.status(200).json({
      success: true,
      data: attendanceRecords,
      message: "Student attendance records fetched successfully"
    });
    
  } catch (error) {
    console.error("Error fetching student attendance records:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching student attendance records",
      error: error.message,
    });
  }
}; 