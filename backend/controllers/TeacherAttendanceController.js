const TeacherAttendance = require("../models/TeacherAttendanceModel");
const Teacher = require("../models/TeacherModel");

//==================================================================================================
//==================================================================================================
// Controller to mark attendance for multiple teachers
exports.markTeacherAttendance = async (req, res) => {
  const loggedInAdmin = req.admin; // Access logged-in admin's data
  console.log("Logged-in Admin:", loggedInAdmin);

  if (!loggedInAdmin) {
    return res.status(400).json({ message: "Logged-in Admin not found" });
  }

  const { attendanceData } = req.body; // Destructure attendanceData from the request body

  // Ensure attendanceData is provided and is an array
  if (
    !attendanceData ||
    !Array.isArray(attendanceData) ||
    attendanceData.length === 0
  ) {
    return res.status(400).json({
      message: "Attendance data for teachers is required.",
    });
  }

  try {
    const createdAttendances = []; // To store created attendance records

    // Loop through the attendanceData array
    for (let i = 0; i < attendanceData.length; i++) {
      const { teacherID, status, remarks } = attendanceData[i];

      // Ensure teacherID and status are present for each record
      if (!teacherID || !status) {
        return res.status(400).json({
          message: `Teacher ID and status are required for teacher at index ${i}.`,
        });
      }

      // Find the teacher by teacherID
      const teacher = await Teacher.findOne({ teacherID });
      if (!teacher) {
        return res
          .status(404)
          .json({ message: `Teacher with ID ${teacherID} not found.` });
      }

      // Check if attendance for this teacher is already marked for today's date
      const existingAttendance = await TeacherAttendance.findOne({
        teacher: teacher._id,
        date: new Date().toDateString(), // Automatically use today's date
      });

      if (existingAttendance) {
        return res.status(400).json({
          message: `Attendance already marked for ${teacher.name} today.`,
        });
      }

      // Create a new attendance record with the current date
      const newAttendance = new TeacherAttendance({
        teacher: teacher._id,
        date: Date.now(), // Automatically use the current date and time
        status,
        remarks: remarks || null, // Use remarks if provided, else set it to null
        markedBy: {
          adminID: loggedInAdmin.adminID, // Use logged-in admin's ID
          name: loggedInAdmin.name, // Use logged-in admin's name
        },
      });

      await newAttendance.save();
      createdAttendances.push(newAttendance); // Add the created attendance to the array
    }

    res.status(201).json({
      message: "Attendance marked successfully for multiple teachers.",
      data: createdAttendances,
    });
  } catch (error) {
    console.error("Error marking teacher attendance:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};
//================================================================================================
//================================================================================================
// Controller to get attendance records for a specific teacher
exports.getTeacherAttendance = async (req, res) => {
  const { teacherID, startDate, endDate } = req.query;

  // Ensure teacherID is provided in the request query
  if (!teacherID) {
    return res.status(400).json({ message: "Teacher ID is required." });
  }

  try {
    // Find the teacher by teacherID
    const teacher = await Teacher.findOne({ teacherID });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found." });
    }

    // Query attendance records for the teacher, with optional date filtering
    const filter = { teacher: teacher._id };

    // Handle startDate and endDate filtering
    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start)) {
        return res.status(400).json({ message: "Invalid start date format." });
      }
      filter.date = { ...filter.date, $gte: start };
    }

    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end)) {
        return res.status(400).json({ message: "Invalid end date format." });
      }
      filter.date = { ...filter.date, $lte: end };
    }

    // Fetch attendance records for the teacher, sorted by date (descending)
    const attendanceRecords = await TeacherAttendance.find(filter)
      .sort({ date: -1 }) // Sort by date in descending order
      .exec();

    res.status(200).json({
      message: "Attendance records fetched successfully.",
      data: attendanceRecords,
    });
  } catch (error) {
    console.error("Error fetching teacher attendance:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};
//================================================================================================
//================================================================================================
// Controller to fetch attendance by date or teacher details
// Controller to fetch attendance by date, teacher details, or month/year
exports.fetchTeacherAttendanceRecords = async (req, res) => {
  const { date, teacherID, teacherName, month, year } = req.query;

  try {
    const filter = {};

    // Filter by specific date (ignore time)
    if (date) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate)) {
        return res.status(400).json({ message: "Invalid date format." });
      }

      const startOfDay = new Date(parsedDate.setUTCHours(0, 0, 0, 0));
      const endOfDay = new Date(parsedDate.setUTCHours(23, 59, 59, 999));

      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }

    // Filter by month and year
    if (month && year) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0);

      filter.date = {
        $gte: startOfMonth,
        $lte: endOfMonth,
      };
    }

    // Filter by teacher ID
    if (teacherID) {
      const teacher = await Teacher.findOne({ teacherID });
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found." });
      }
      filter.teacher = teacher._id;
    }

    // Filter by teacher name
    if (teacherName) {
      const teacher = await Teacher.findOne({
        name: { $regex: teacherName, $options: "i" }, // Case-insensitive regex
      });
      if (!teacher) {
        return res
          .status(404)
          .json({ message: `No teacher found with name ${teacherName}.` });
      }
      filter.teacher = teacher._id;
    }

    // Fetch attendance records based on the filters
    const attendanceRecords = await TeacherAttendance.find(filter)
      .populate("teacher", "name teacherID") // Populate teacher's name and ID
      .sort({ date: -1 }) // Sort by date descending
      .exec();

    res.status(200).json({
      message: "Attendance records fetched successfully.",
      data: attendanceRecords,
    });
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

//================================================================================================
//================================================================================================
// Controller to delete attendance records by date or teacher details
//================================================================================================
//================================================================================================
