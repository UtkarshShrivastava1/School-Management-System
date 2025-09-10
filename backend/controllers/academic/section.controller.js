const Section = require(../models/ClassManagementModels/s-ec-ti-on.model");
const AcademicClass = require(../models/ClassManagementModels/a-ca-de-mi-cc-la-ss.model");
const Enrollment = require(../models/ClassManagementModels/e-nr-ol-lm-en-t.model");
// POST /classes/academic/:id/sections
exports.createSection = async (req, res) => {
  try {
    const { id: academicClassId } = req.params;
    const { name, capacity = 40, room } = req.body;

    const cls = await AcademicClass.findById(academicClassId);
    if (!cls)
      return res.status(404).json({ message: "AcademicClass not found" });
    if (!name)
      return res.status(400).json({ message: "Section name required" });

    const section = await Section.create({
      academicClassId,
      name: String(name).toUpperCase().trim(),
      capacity: Number(capacity) > 0 ? Number(capacity) : 40,
      room,
    });
    res.status(201).json({ message: "Section created", section });
  } catch (e) {
    if (e.code === 11000)
      return res
        .status(409)
        .json({ message: "Section already exists in this class" });
    res.status(500).json({ message: e.message });
  }
};

// GET /classes/academic/:id/sections/available
exports.getAvailableSections = async (req, res) => {
  try {
    const ALLOWED = ["A", "B", "C", "D", "E"];
    const used = await Section.find({
      academicClassId: req.params.id,
    }).distinct("name");
    const available = ALLOWED.filter((s) => !used.includes(s));
    res.json({ academicClassId: req.params.id, used, available });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
// POST /sections/:sectionId/class-teacher
exports.setClassTeacher = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { teacherId } = req.body;
    if (!teacherId)
      return res.status(400).json({ message: "teacherId is required" });

    const section = await Section.findById(sectionId);
    if (!section) return res.status(404).json({ message: "Section not found" });

    section.classTeacher = teacherId;
    await section.save();

    res.json({ message: "Class teacher assigned", section });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
exports.getSectionStats = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { sessionId } = req.query;
    if (!sessionId)
      return res.status(400).json({ message: "sessionId required" });

    const sec = await Section.findById(sectionId).lean();
    if (!sec) return res.status(404).json({ message: "Section not found" });

    const counts = await Enrollment.aggregate([
      {
        $match: {
          sectionId: sec._id,
          sessionId: require("mongoose").Types.ObjectId(sessionId),
          status: { $in: ["enrolled", "transferred"] },
        },
      },
      { $count: "count" },
    ]);

    const filled = counts.length ? counts[0].count : 0;
    res.json({
      sectionId,
      name: sec.name,
      capacity: sec.capacity,
      filled,
      available: Math.max(0, sec.capacity - filled),
      classTeacher: sec.classTeacher || null,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

