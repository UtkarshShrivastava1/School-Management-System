const mongoose = require("mongoose");
const Enrollment = require("../models/Enrollment");
const AcademicClass = require("../models/ClassManagementModels/AcademicClass");
const Section = require("../models/ClassManagementModels/Section");
const Student = require("../models/StudentModel");

// helper: count active enrollments in a section
async function sectionLoad(sectionId) {
  return Enrollment.countDocuments({
    sectionId,
    status: { $in: ["enrolled", "transferred"] },
  });
}

// helper: generate next roll number within a section (simple incremental)
async function nextRollNumber(sessionId, sectionId) {
  const last = await Enrollment.find({ sessionId, sectionId })
    .select("rollNumber")
    .sort({ rollNumber: -1 })
    .limit(1)
    .lean();
  const lastNum = last?.[0]?.rollNumber ? parseInt(last[0].rollNumber, 10) : 0;
  return String((lastNum || 0) + 1).padStart(2, "0");
}

// POST /enrollments
// body: { sessionId, studentId, academicClassId, sectionId? }
// - if section given and capacity full: status="waitlisted"
// - if section omitted: create enrollment with sectionId=null (to be placed later)
exports.createEnrollment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      sessionId,
      studentId,
      academicClassId,
      sectionId,
      admissionType = "new",
    } = req.body;
    if (!sessionId || !studentId || !academicClassId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "sessionId, studentId, academicClassId are required",
      });
    }

    const [cls, student] = await Promise.all([
      AcademicClass.findById(academicClassId).lean(),
      Student.findById(studentId).lean(),
    ]);
    if (!cls) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "AcademicClass not found" });
    }
    if (!student) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Student not found" });
    }
    if (String(cls.sessionId) !== String(sessionId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "sessionId does not match the AcademicClass session",
      });
    }

    let status = "enrolled";
    let rollNumber = undefined;
    let placeSectionId = sectionId || null;

    if (placeSectionId) {
      const sec = await Section.findById(placeSectionId).lean();
      if (!sec) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "Section not found" });
      }
      if (String(sec.academicClassId) !== String(academicClassId)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          message: "Section does not belong to the given AcademicClass",
        });
      }

      const load = await sectionLoad(placeSectionId);
      if (load >= sec.capacity) {
        status = "waitlisted";
      } else {
        rollNumber = await nextRollNumber(sessionId, placeSectionId);
      }
    }

    const enrollment = await Enrollment.create(
      [
        {
          sessionId,
          studentId,
          academicClassId,
          sectionId: placeSectionId,
          status,
          admissionType,
          rollNumber,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    return res
      .status(201)
      .json({ message: "Enrollment created", enrollment: enrollment[0] });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    if (e.code === 11000)
      return res
        .status(409)
        .json({ message: "Student already enrolled for this session" });
    console.error(e);
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

// PATCH /enrollments/:id/section  { sectionId }
exports.moveSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { sectionId } = req.body;

    const enr = await Enrollment.findById(id);
    if (!enr) return res.status(404).json({ message: "Enrollment not found" });

    const sec = await Section.findById(sectionId).lean();
    if (!sec) return res.status(404).json({ message: "Section not found" });
    if (String(sec.academicClassId) !== String(enr.academicClassId)) {
      return res
        .status(400)
        .json({ message: "Section does not belong to the same AcademicClass" });
    }

    const load = await sectionLoad(sectionId);
    if (load >= sec.capacity) {
      // move to waitlist for that section
      enr.sectionId = sectionId;
      enr.status = "waitlisted";
      enr.rollNumber = undefined;
      await enr.save();
      return res.json({
        message: "Section full; student moved to waitlist",
        enrollment: enr,
      });
    }

    // assign section + new roll number
    enr.sectionId = sectionId;
    enr.status = "enrolled";
    enr.rollNumber = await nextRollNumber(enr.sessionId, sectionId);
    enr.audit = {
      movedBy: req?.admin?._id || req?.user?.id,
      movedAt: new Date(),
    };
    await enr.save();

    return res.json({ message: "Section updated", enrollment: enr });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

// GET /enrollments?sessionId=&academicClassId=&sectionId=&status=
exports.listEnrollments = async (req, res) => {
  try {
    const { sessionId, academicClassId, sectionId, status } = req.query;
    const q = {};
    if (sessionId) q.sessionId = sessionId;
    if (academicClassId) q.academicClassId = academicClassId;
    if (sectionId) q.sectionId = sectionId;
    if (status) q.status = status;

    const items = await Enrollment.find(q)
      .populate("studentId", "studentName studentID")
      .populate("sectionId", "name")
      .lean();

    // optional: section capacity stats
    let stats = null;
    if (academicClassId) {
      const sections = await Section.find({ academicClassId }).lean();
      const counts = await Enrollment.aggregate([
        {
          $match: {
            academicClassId: new mongoose.Types.ObjectId(academicClassId),
            status: { $in: ["enrolled", "transferred"] },
          },
        },
        { $group: { _id: "$sectionId", count: { $sum: 1 } } },
      ]);
      const bySection = counts.reduce(
        (acc, c) => ((acc[String(c._id)] = c.count), acc),
        {}
      );
      stats = sections.map((s) => ({
        sectionId: String(s._id),
        name: s.name,
        capacity: s.capacity,
        filled: bySection[String(s._id)] || 0,
      }));
    }

    res.json({ items, stats });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
};
// GET /enrollments/stats/sections?academicClassId=...
exports.sectionStats = async (req, res) => {
  try {
    const { academicClassId } = req.query;
    if (!academicClassId)
      return res.status(400).json({ message: "academicClassId is required" });

    const sections = await Section.find({ academicClassId })
      .sort({ name: 1 })
      .lean();
    const counts = await Enrollment.aggregate([
      {
        $match: {
          academicClassId: new mongoose.Types.ObjectId(academicClassId),
          status: { $in: ["enrolled", "transferred"] },
        },
      },
      { $group: { _id: "$sectionId", count: { $sum: 1 } } },
    ]);

    const byId = counts.reduce(
      (acc, c) => ((acc[String(c._id)] = c.count), acc),
      {}
    );
    const stats = sections.map((s) => ({
      sectionId: String(s._id),
      name: s.name,
      capacity: s.capacity,
      filled: byId[String(s._id)] || 0,
      available: Math.max(0, s.capacity - (byId[String(s._id)] || 0)),
    }));

    res.json({ academicClassId, stats });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
};
// helper: allocate next waitlisted student into a section (assign rollNumber)
async function allocateNextFromWaitlist(sessionId, sectionId) {
  // find section + capacity/load
  const sec = await Section.findById(sectionId).lean();
  if (!sec) return { allocated: 0, reason: "Section not found" };

  const current = await Enrollment.countDocuments({
    sectionId,
    status: { $in: ["enrolled", "transferred"] },
  });
  if (current >= sec.capacity) return { allocated: 0, reason: "No seats" };

  // next waitlisted (oldest first)
  const next = await Enrollment.findOne({
    sessionId,
    sectionId,
    status: "waitlisted",
  }).sort({ createdAt: 1 });

  if (!next) return { allocated: 0, reason: "No waitlisted" };

  // assign roll number
  const last = await Enrollment.find({ sessionId, sectionId })
    .select("rollNumber")
    .sort({ rollNumber: -1 })
    .limit(1)
    .lean();
  const lastNum = last?.[0]?.rollNumber ? parseInt(last[0].rollNumber, 10) : 0;
  next.rollNumber = String((lastNum || 0) + 1).padStart(2, "0");
  next.status = "enrolled";
  next.audit = { movedBy: null, movedAt: new Date() };
  await next.save();

  return { allocated: 1, enrollmentId: String(next._id) };
}

// POST /enrollments/allocate-waitlist { sessionId, sectionId }
exports.allocateWaitlist = async (req, res) => {
  try {
    const { sessionId, sectionId } = req.body || {};
    if (!sessionId || !sectionId) {
      return res
        .status(400)
        .json({ message: "sessionId and sectionId are required" });
    }
    const result = await allocateNextFromWaitlist(sessionId, sectionId);
    res.json({ message: "Allocation attempt complete", ...result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
};
// PATCH /enrollments/:id/withdraw  { reason? }
exports.withdraw = async (req, res) => {
  try {
    const { id } = req.params;
    const enr = await Enrollment.findById(id);
    if (!enr) return res.status(404).json({ message: "Enrollment not found" });
    const sectionId = enr.sectionId;
    const sessionId = enr.sessionId;

    enr.status = "withdrawn";
    enr.sectionId = null;
    enr.rollNumber = undefined;
    await enr.save();

    // try allocate a waitlisted student into the freed section
    let allocation = null;
    if (sectionId) {
      allocation = await allocateNextFromWaitlist(sessionId, sectionId);
    }
    return res.json({ message: "Enrollment withdrawn", allocation });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

// PATCH /enrollments/:id/transfer  { toSectionId }
exports.transfer = async (req, res) => {
  try {
    const { id } = req.params;
    const { toSectionId } = req.body;
    if (!toSectionId)
      return res.status(400).json({ message: "toSectionId is required" });

    const enr = await Enrollment.findById(id);
    if (!enr) return res.status(404).json({ message: "Enrollment not found" });

    const fromSectionId = enr.sectionId;
    // move to target using existing capacity logic
    req.body.sectionId = toSectionId;
    const updated = await exports.moveSection(req, res); // reuse handler if you prefer
    // note: if you don't want to reuse, you can inline the same checks as moveSection

    // after moving out, try fill the old section from waitlist
    if (fromSectionId && String(fromSectionId) !== String(toSectionId)) {
      await allocateNextFromWaitlist(enr.sessionId, fromSectionId);
    }

    return updated; // `moveSection` already sent the response
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
};
