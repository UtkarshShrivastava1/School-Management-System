const mongoose = require("mongoose");
const Assessment = require("../models/ClassManagementModels/Assessment");
const ResultSummary = require("../models/ClassManagementModels/ResultSummary");
const Enrollment = require("../models/Enrollment");
const AcademicClass = require("../models/ClassManagementModels/AcademicClass");

// Configurable pass rules (simple defaults)
const PASS_MARK_PER_SUBJECT = 33; // percent
const COMPARTMENT_ALLOWED = 2; // number of failed subjects eligible for compartment

// POST /results/assessments
// body: { sessionId, academicClassId, sectionId?, examType, rows: [{ enrollmentId, studentId, subjectId, maxMarks, marks, attempt? }] }
exports.bulkUpsertAssessments = async (req, res) => {
  const {
    sessionId,
    academicClassId,
    sectionId,
    examType = "other",
    rows,
  } = req.body || {};
  if (
    !sessionId ||
    !academicClassId ||
    !Array.isArray(rows) ||
    rows.length === 0
  ) {
    return res.status(400).json({
      message: "sessionId, academicClassId and non-empty rows are required",
    });
  }

  // minimal check: class belongs to session
  const cls = await AcademicClass.findById(academicClassId).lean();
  if (!cls || String(cls.sessionId) !== String(sessionId)) {
    return res
      .status(400)
      .json({ message: "AcademicClass does not belong to sessionId" });
  }

  const ops = rows.map((r) => ({
    updateOne: {
      filter: {
        enrollmentId: r.enrollmentId,
        subjectId: r.subjectId,
        examType,
        attempt: r.attempt || 1,
      },
      update: {
        $set: {
          sessionId,
          academicClassId,
          sectionId: sectionId || null,
          enrollmentId: r.enrollmentId,
          studentId: r.studentId,
          subjectId: r.subjectId,
          examType,
          maxMarks: r.maxMarks,
          marks: r.marks,
          attempt: r.attempt || 1,
        },
      },
      upsert: true,
    },
  }));

  await Assessment.bulkWrite(ops);
  return res
    .status(200)
    .json({ message: "Assessments upserted", count: rows.length });
};

// POST /results/compute
// body: { sessionId, academicClassId, examTypeWeights? } (optional weights, else use "final" only if present, else best available)
exports.computeResults = async (req, res) => {
  const { sessionId, academicClassId } = req.body || {};
  if (!sessionId || !academicClassId) {
    return res
      .status(400)
      .json({ message: "sessionId and academicClassId are required" });
  }

  // gather enrollments in this class
  const enrollments = await Enrollment.find({
    sessionId,
    academicClassId,
    status: { $in: ["enrolled", "transferred", "waitlisted"] },
  })
    .select("_id studentId sectionId")
    .lean();

  // group assessments per enrollment+subject, choose total = best(last attempt of 'final') or aggregate highest exam per subject
  const assess = await Assessment.aggregate([
    {
      $match: {
        sessionId: new mongoose.Types.ObjectId(sessionId),
        academicClassId: new mongoose.Types.ObjectId(academicClassId),
      },
    },
    { $sort: { attempt: -1 } },
    {
      $group: {
        _id: { enrollmentId: "$enrollmentId", subjectId: "$subjectId" },
        max: { $first: "$maxMarks" },
        // prefer final exam mark if exists, else highest marks among all
        total: { $max: "$marks" },
        finals: {
          $push: { examType: "$examType", marks: "$marks", max: "$maxMarks" },
        },
      },
    },
  ]);

  // build map for quick lookup
  const byEnroll = new Map(); // key: enrollmentId -> { subjects: [...] }
  for (const a of assess) {
    const k = String(a._id.enrollmentId);
    const subj = {
      subjectId: a._id.subjectId,
      total: a.total,
      max: a.max,
      status:
        (a.total / (a.max || 100)) * 100 >= PASS_MARK_PER_SUBJECT
          ? "pass"
          : "fail",
    };
    if (!byEnroll.has(k)) byEnroll.set(k, []);
    byEnroll.get(k).push(subj);
  }

  // compute overall status per enrollment
  const summaries = [];
  for (const enr of enrollments) {
    const subs = byEnroll.get(String(enr._id)) || [];
    const failed = subs.filter((s) => s.status === "fail").length;

    let overall = "pass";
    if (failed === 0) overall = "pass";
    else if (failed <= COMPARTMENT_ALLOWED && failed > 0)
      overall = "compartment";
    else overall = "fail";

    summaries.push({
      updateOne: {
        filter: { enrollmentId: enr._id },
        update: {
          $set: {
            sessionId,
            enrollmentId: enr._id,
            overallStatus: overall,
            subjects: subs,
          },
        },
        upsert: true,
      },
    });
  }

  if (summaries.length) await ResultSummary.bulkWrite(summaries);
  return res.json({
    message: "Result summaries computed",
    count: summaries.length,
  });
};

// GET /results/enrollment/:id
exports.getEnrollmentResult = async (req, res) => {
  const doc = await ResultSummary.findOne({ enrollmentId: req.params.id })
    .populate("subjects.subjectId", "subjectCode subjectName")
    .lean();
  if (!doc) return res.status(404).json({ message: "Result not found" });
  return res.json(doc);
};
