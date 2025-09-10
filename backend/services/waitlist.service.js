// simple service to allocate seats from waitlist into a section
const mongoose = require("mongoose");
const Enrollment = require(../models/ClassManagementModels/e-nr-ol-lm-en-t.model");
const Section = require(../models/ClassManagementModels/s-ec-ti-on.model");
const AuditLog = require(../models/a-ud-it-lo-g.model");

/**
 * Try to allocate up to `limit` waitlisted students into a given section.
 * Returns { allocated: Number, details: [{ enrollmentId, oldStatus, newStatus, rollNumber }] }
 */
async function allocateFromWaitlist(
  sectionId,
  sessionId,
  limit = 1,
  performedBy = null
) {
  const sec = await Section.findById(sectionId).lean();
  if (!sec) throw new Error("Section not found");

  // count current enrolled
  const enrolledCount = await Enrollment.countDocuments({
    sectionId,
    status: { $in: ["enrolled", "transferred"] },
  });

  let seatsAvailable = Math.max(0, sec.capacity - enrolledCount);
  if (seatsAvailable <= 0)
    return { allocated: 0, details: [], reason: "No seats" };

  const toAllocate = Math.min(seatsAvailable, limit);

  // pick oldest waitlisted in same session and same academicClass (sectionId may be stored)
  const waitlisted = await Enrollment.find({
    sessionId,
    sectionId,
    status: "waitlisted",
  })
    .sort({ createdAt: 1 })
    .limit(toAllocate);

  const details = [];
  for (const w of waitlisted) {
    // compute next rollNumber in section:
    const last = await Enrollment.find({
      sessionId,
      sectionId,
      status: { $in: ["enrolled", "transferred"] },
    })
      .select("rollNumber")
      .sort({ _id: -1 })
      .limit(1)
      .lean();
    const lastNum = last?.[0]?.rollNumber
      ? parseInt(last[0].rollNumber, 10)
      : sec.rollStart || 0;
    const newRoll = String((lastNum || 0) + 1).padStart(2, "0");

    const oldStatus = w.status;
    w.status = "enrolled";
    w.rollNumber = newRoll;
    w.audit = w.audit || {};
    w.audit.movedBy = performedBy;
    w.audit.movedAt = new Date();
    w.audit.history = w.audit.history || [];
    w.audit.history.push({
      action: "WAITLIST_ALLOCATED",
      by: performedBy,
      at: new Date(),
      meta: { sectionId, rollNumber: newRoll },
    });

    await w.save();

    // record audit log
    await AuditLog.create({
      action: "WAITLIST_ALLOCATED",
      performedBy,
      targetType: "Enrollment",
      targetId: w._id,
      details: { sectionId, rollNumber: newRoll, oldStatus },
    });

    details.push({
      enrollmentId: String(w._id),
      oldStatus,
      newStatus: "enrolled",
      rollNumber: newRoll,
    });
  }

  return { allocated: details.length, details };
}

module.exports = { allocateFromWaitlist };

