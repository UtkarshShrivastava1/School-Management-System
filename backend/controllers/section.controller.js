const Section = require("../models/ClassManagementModels/Section");
const AcademicClass = require("../models/ClassManagementModels/AcademicClass");

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
