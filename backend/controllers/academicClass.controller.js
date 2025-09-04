const AcademicClass = require("../models/ClassManagementModels/AcademicClass");
const ClassTemplate = require("../models/ClassManagementModels/ClassTemplate");
const AcademicSession = require("../models/ClassManagementModels/AcademicSession");
const Section = require("../models/ClassManagementModels/Section");

// POST /classes/academic
exports.createAcademicClass = async (req, res) => {
  try {
    const { sessionId, classTemplateId, feeSettings, subjectIds } = req.body;
    if (!sessionId || !classTemplateId)
      return res
        .status(400)
        .json({ message: "sessionId and classTemplateId are required" });

    const tmpl = await ClassTemplate.findById(classTemplateId);
    if (!tmpl)
      return res.status(404).json({ message: "ClassTemplate not found" });

    const session = await AcademicSession.findById(sessionId);
    if (!session)
      return res.status(404).json({ message: "AcademicSession not found" });

    const displayName = `${tmpl.label} | ${session.name}`;
    const academicClass = await AcademicClass.create({
      sessionId,
      classTemplateId,
      grade: tmpl.code,
      displayName,
      feeSettings,
      subjectIds,
    });
    res.status(201).json({ message: "Academic class created", academicClass });
  } catch (e) {
    if (e.code === 11000)
      return res
        .status(409)
        .json({ message: "Already exists for this session & template" });
    res.status(500).json({ message: e.message });
  }
};

// GET /classes/academic?sessionId=...
exports.listAcademicClasses = async (req, res) => {
  try {
    const q = req.query.sessionId ? { sessionId: req.query.sessionId } : {};
    const items = await AcademicClass.find(q)
      .populate("classTemplateId", "code label order stage")
      .lean();
    res.json({ items });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// GET /classes/academic/:id
exports.getAcademicClass = async (req, res) => {
  try {
    const academicClass = await AcademicClass.findById(req.params.id)
      .populate("classTemplateId", "code label stage")
      .populate("subjectIds", "subjectCode subjectName type")
      .lean();
    if (!academicClass) return res.status(404).json({ message: "Not found" });
    const sections = await Section.find({ academicClassId: req.params.id })
      .sort({ name: 1 })
      .lean();
    res.json({ academicClass, sections });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
