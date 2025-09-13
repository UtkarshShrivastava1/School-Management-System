const mongoose = require("mongoose");
const Section = require("../models/ClassManagementModels/Section");
const { allocateFromWaitlist } = require("../services/waitlist.service");

// Example: run once to scan all sections and allocate up to N per section
async function scanAllSectionsAndAllocate() {
  const sections = await Section.find().lean();
  for (const s of sections) {
    // session filtering is up to your policy; here we assume enrollments exist per section
    try {
      const res = await allocateFromWaitlist(
        s._id,
        /* sessionId */ null,
        5,
        /* performedBy */ null
      );
      if (res.allocated)
        console.log(`Allocated ${res.allocated} to section ${s.name}`);
    } catch (err) {
      console.error(
        "Waitlist allocation error for section",
        s._id,
        err.message
      );
    }
  }
}

module.exports = { scanAllSectionsAndAllocate };
