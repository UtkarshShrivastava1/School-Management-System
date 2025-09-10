const Attendance = require("../models/Attendance");
const Enrollment = require("../models/Enrollment");

// POST /attendance
// body: { sessionId, academicClassId, sectionId, date, records:[{ enrollmentId, studentId, status, remarks? }] }
exports.markAttendance = async (req, res) => {
  try {
    const { sessionId, academicClassId, sectionId, date, records } =
      req.body || {};
    if (
      !sessionId ||
      !academicClassId ||
      !sectionId ||
      !date ||
      !Array.isArray(records)
    ) {
      return res.status(400).json({
        message:
          "sessionId, academicClassId, sectionId, date, records required",
      });
    }

    const doc = await Attendance.findOneAndUpdate(
      { sessionId, academicClassId, sectionId, date: new Date(date) },
      {
        $set: {
          records,
          takenBy: req.teacher?._id,
          createdBy: req.admin?._id,
        },
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ message: "Attendance marked", attendance: doc });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

// GET /attendance?sessionId=&sectionId=&from=&to=
exports.getAttendance = async (req, res) => {
  try {
    const { sessionId, sectionId, from, to } = req.query;
    if (!sessionId || !sectionId) {
      return res
        .status(400)
        .json({ message: "sessionId and sectionId required" });
    }

    const q = { sessionId, sectionId };
    if (from || to) {
      q.date = {};
      if (from) q.date.$gte = new Date(from);
      if (to) q.date.$lte = new Date(to);
    }

    const items = await Attendance.find(q).sort({ date: 1 }).lean();
    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

// GET /attendance/student/:studentId?sessionId=&from=&to=
exports.getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { sessionId, from, to } = req.query;
    if (!studentId || !sessionId) {
      return res
        .status(400)
        .json({ message: "studentId and sessionId required" });
    }

    const q = { sessionId, "records.studentId": studentId };
    if (from || to) {
      q.date = {};
      if (from) q.date.$gte = new Date(from);
      if (to) q.date.$lte = new Date(to);
    }

    const items = await Attendance.find(q, { "records.$": 1, date: 1 })
      .sort({ date: 1 })
      .lean();
    res.json({ studentId, items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
};
