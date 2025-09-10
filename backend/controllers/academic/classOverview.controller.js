const AcademicClass = require(../models/ClassManagementModels/a-ca-de-mi-cc-la-ss.model");
const Section = require(../models/ClassManagementModels/s-ec-ti-on.model");
const Enrollment = require(../models/ClassManagementModels/e-nr-ol-lm-en-t.model");

/**
 * GET /api/classes/overview?sessionId=<id>
 * returns per-academicClass overview with sections, capacity, enrolled/waitlist counts and classTeacher
 */
exports.getOverview = async (req, res, next) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId)
      return res.status(400).json({ message: "sessionId required" });

    const classes = await AcademicClass.find({ sessionId }).lean();
    const classIds = classes.map((c) => c._id);

    const sections = await Section.find({
      academicClassId: { $in: classIds },
    }).lean();

    // counts grouped by section
    const enrollCounts = await Enrollment.aggregate([
      {
        $match: {
          sessionId: require("mongoose").Types.ObjectId(sessionId),
          status: { $in: ["enrolled", "transferred", "waitlisted"] },
        },
      },
      {
        $group: {
          _id: { sectionId: "$sectionId", status: "$status" },
          count: { $sum: 1 },
        },
      },
    ]);

    // build map { sectionId: {enrolled: x, waitlisted: y} }
    const map = {};
    for (const c of enrollCounts) {
      const sid = String(c._id.sectionId || "unassigned");
      map[sid] = map[sid] || { enrolled: 0, waitlisted: 0 };
      if (c._id.status === "waitlisted") map[sid].waitlisted = c.count;
      else map[sid].enrolled = c.count;
    }

    const overview = classes.map((ac) => {
      const acSections = sections.filter(
        (s) => String(s.academicClassId) === String(ac._id)
      );
      const sectionsInfo = acSections.map((s) => {
        const stats = map[String(s._id)] || { enrolled: 0, waitlisted: 0 };
        return {
          sectionId: s._id,
          name: s.name,
          capacity: s.capacity,
          classTeacher: s.classTeacher || null,
          enrolledCount: stats.enrolled,
          waitlistedCount: stats.waitlisted,
          availableSeats: Math.max(0, s.capacity - stats.enrolled),
        };
      });
      return {
        academicClassId: ac._id,
        displayName: ac.displayName,
        grade: ac.grade,
        sections: sectionsInfo,
      };
    });

    res.json({ overview });
  } catch (err) {
    next(err);
  }
};

