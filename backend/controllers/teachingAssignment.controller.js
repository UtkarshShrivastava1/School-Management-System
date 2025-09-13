const TeachingAssignment = require("../models/TeachingAssignment");
const AcademicClass = require("../models/ClassManagementModels/AcademicClass");
const Section = require("../models/ClassManagementModels/Section");
const Subject = require("../models/SubjectModel");
const Teacher = require("../models/TeacherModel");

// POST /teaching-assignments
// body: { sessionId, academicClassId, sectionId?, subjectId, teacherId, periodsPerWeek? }
exports.createTeachingAssignment = async (req, res) => {
  try {
    const {
      sessionId,
      academicClassId,
      sectionId,
      subjectId,
      teacherId,
      periodsPerWeek,
    } = req.body;
    if (!sessionId || !academicClassId || !subjectId || !teacherId) {
      return res.status(400).json({
        message:
          "sessionId, academicClassId, subjectId, teacherId are required",
      });
    }

    const [cls, subj, teacher] = await Promise.all([
      AcademicClass.findById(academicClassId).lean(),
      Subject.findById(subjectId).lean(),
      Teacher.findById(teacherId).lean(),
    ]);
    if (!cls)
      return res.status(404).json({ message: "AcademicClass not found" });
    if (!subj) return res.status(404).json({ message: "Subject not found" });
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    if (String(cls.sessionId) !== String(sessionId)) {
      return res.status(400).json({
        message: "sessionId does not match the AcademicClass session",
      });
    }

    if (sectionId) {
      const section = await Section.findById(sectionId).lean();
      if (!section)
        return res.status(404).json({ message: "Section not found" });
      if (String(section.academicClassId) !== String(academicClassId)) {
        return res.status(400).json({
          message: "sectionId does not belong to the given AcademicClass",
        });
      }
    }

    const ta = await TeachingAssignment.create({
      sessionId,
      academicClassId,
      sectionId: sectionId || null,
      subjectId,
      teacherId,
      periodsPerWeek,
    });

    return res
      .status(201)
      .json({ message: "Teaching assignment created", teachingAssignment: ta });
  } catch (e) {
    if (e.code === 11000)
      return res
        .status(409)
        .json({ message: "Assignment already exists for this scope" });
    console.error(e);
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

// GET /teaching-assignments?sessionId=&academicClassId=&sectionId=
exports.listTeachingAssignments = async (req, res) => {
  try {
    const { sessionId, academicClassId, sectionId } = req.query;
    const q = { isActive: true };
    if (sessionId) q.sessionId = sessionId;
    if (academicClassId) q.academicClassId = academicClassId;
    if (sectionId) q.sectionId = sectionId;

    const items = await TeachingAssignment.find(q)
      .populate("subjectId", "subjectCode subjectName type")
      .populate("teacherId", "teacherName teacherID")
      .populate("sectionId", "name")
      .lean();

    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

// PATCH /teaching-assignments/:id  { teacherId?, periodsPerWeek?, isActive? }
exports.updateTeachingAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const patch = {};
    if (req.body.teacherId) patch.teacherId = req.body.teacherId;
    if (req.body.periodsPerWeek !== undefined)
      patch.periodsPerWeek = req.body.periodsPerWeek;
    if (req.body.isActive !== undefined) patch.isActive = req.body.isActive;

    const updated = await TeachingAssignment.findByIdAndUpdate(
      id,
      { $set: patch },
      { new: true }
    );
    if (!updated)
      return res.status(404).json({ message: "TeachingAssignment not found" });

    res.json({
      message: "Teaching assignment updated",
      teachingAssignment: updated,
    });
  } catch (e) {
    if (e.code === 11000)
      return res
        .status(409)
        .json({ message: "Duplicate after update; check uniqueness" });
    console.error(e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
};
// GET /search/teachers?q=
exports.searchTeachers = async (req, res) => {
  const q = req.query.q?.trim();
  if (!q) return res.json({ items: [] });
  const items = await Teacher.find({
    $or: [
      { teacherName: new RegExp(q, "i") },
      { teacherID: new RegExp(q, "i") },
      { subjectSpeciality: new RegExp(q, "i") },
    ],
  })
    .select("_id teacherName teacherID subjectSpeciality")
    .limit(20)
    .lean();
  res.json({ items });
};

// GET /search/subjects?q=
exports.searchSubjects = async (req, res) => {
  const q = req.query.q?.trim();
  if (!q) return res.json({ items: [] });
  const items = await Subject.find({
    $or: [
      { subjectName: new RegExp(q, "i") },
      { subjectCode: new RegExp(q, "i") },
    ],
  })
    .select("_id subjectName subjectCode type")
    .limit(20)
    .lean();
  res.json({ items });
};
