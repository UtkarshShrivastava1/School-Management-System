const mongoose = require("mongoose");
const ResultSummary = require("../models/ResultSummary");
const Enrollment = require("../models/Enrollment");
const AcademicClass = require("../models/ClassManagementModels/AcademicClass");
const ClassTemplate = require("../models/ClassManagementModels/ClassTemplate");

// Helper: find/create next year's AcademicClass for next grade
async function ensureNextAcademicClass(fromAcademicClassId, toSessionId) {
  const from = await AcademicClass.findById(fromAcademicClassId).lean();
  if (!from) throw new Error("Source AcademicClass not found");

  const tmpl = await ClassTemplate.findById(from.classTemplateId).lean();
  if (!tmpl) throw new Error("ClassTemplate not found");

  // derive next template by order+1
  const nextTemplate = await ClassTemplate.findOne({
    order: tmpl.order + 1,
  }).lean();
  // if no next (e.g., Class 12), keep same template (or you can decide to stop)
  const targetTemplate = nextTemplate || tmpl;

  // check existing target AcademicClass
  let target = await AcademicClass.findOne({
    sessionId: toSessionId,
    classTemplateId: targetTemplate._id,
  });
  if (!target) {
    target = await AcademicClass.create({
      sessionId: toSessionId,
      classTemplateId: targetTemplate._id,
      grade: targetTemplate.code,
      displayName: `${targetTemplate.label} | (auto)`,
      feeSettings: from.feeSettings,
      subjectIds: from.subjectIds,
    });
  }
  return target;
}

// POST /rollover/preview { fromSessionId, toSessionId }
exports.preview = async (req, res) => {
  const { fromSessionId, toSessionId } = req.body || {};
  if (!fromSessionId || !toSessionId)
    return res
      .status(400)
      .json({ message: "fromSessionId and toSessionId are required" });

  const enrollments = await Enrollment.find({
    sessionId: fromSessionId,
    status: { $in: ["enrolled", "transferred", "waitlisted"] },
  })
    .select("_id studentId academicClassId")
    .lean();

  // join with results
  const results = await ResultSummary.find({
    sessionId: fromSessionId,
    enrollmentId: { $in: enrollments.map((e) => e._id) },
  })
    .select("enrollmentId overallStatus")
    .lean();
  const resByEnr = new Map(
    results.map((r) => [String(r.enrollmentId), r.overallStatus])
  );

  const plan = [];
  for (const e of enrollments) {
    const status = resByEnr.get(String(e._id)) || "pass"; // default to pass if missing
    plan.push({
      fromEnrollmentId: e._id,
      studentId: e.studentId,
      fromAcademicClassId: e.academicClassId,
      toSessionId,
      decision:
        status === "pass"
          ? "promoted"
          : status === "fail"
          ? "repeat"
          : "compartment",
    });
  }
  return res.json({ count: plan.length, plan });
};

// POST /rollover/execute { fromSessionId, toSessionId }
exports.execute = async (req, res) => {
  const { fromSessionId, toSessionId } = req.body || {};
  if (!fromSessionId || !toSessionId)
    return res
      .status(400)
      .json({ message: "fromSessionId and toSessionId are required" });

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const enrollments = await Enrollment.find({
      sessionId: fromSessionId,
      status: { $in: ["enrolled", "transferred", "waitlisted"] },
    })
      .select("_id studentId academicClassId")
      .lean();

    const results = await ResultSummary.find({
      sessionId: fromSessionId,
      enrollmentId: { $in: enrollments.map((e) => e._id) },
    })
      .select("enrollmentId overallStatus")
      .lean();
    const resByEnr = new Map(
      results.map((r) => [String(r.enrollmentId), r.overallStatus])
    );

    const created = [];
    for (const e of enrollments) {
      const status = resByEnr.get(String(e._id)) || "pass";
      const decision =
        status === "pass"
          ? "promoted"
          : status === "fail"
          ? "repeat"
          : "compartment";

      // find/create target AcademicClass
      const targetClass = await ensureNextAcademicClass(
        e.academicClassId,
        toSessionId
      );

      // create next Enrollment (no section yet; placement later)
      const doc = await Enrollment.create(
        [
          {
            sessionId: toSessionId,
            studentId: e.studentId,
            academicClassId: targetClass._id,
            sectionId: null,
            status: "enrolled",
            admissionType: decision === "promoted" ? "promoted" : decision, // "repeat" or "compartment"
          },
        ],
        { session }
      );

      created.push(doc[0]._id);
    }

    await session.commitTransaction();
    session.endSession();
    return res
      .status(201)
      .json({ message: "Rollover completed", createdCount: created.length });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    console.error(e);
    return res
      .status(500)
      .json({ message: "Rollover failed", error: e.message });
  }
};
