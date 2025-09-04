/* run with: node scripts/seedClassTemplates.js */
const mongoose = require("mongoose");
const ClassTemplate = require("../models/ClassTemplate");

const GRADE_CATALOG = [
  { code: "PN", label: "Pre-Nursery", order: 0, stage: "preprimary" },
  { code: "NUR", label: "Nursery", order: 1, stage: "preprimary" },
  { code: "LKG", label: "LKG", order: 2, stage: "preprimary" },
  { code: "UKG", label: "UKG", order: 3, stage: "preprimary" },
  { code: "C1", label: "Class 1", order: 4, stage: "primary" },
  { code: "C2", label: "Class 2", order: 5, stage: "primary" },
  { code: "C3", label: "Class 3", order: 6, stage: "primary" },
  { code: "C4", label: "Class 4", order: 7, stage: "primary" },
  { code: "C5", label: "Class 5", order: 8, stage: "primary" },
  { code: "C6", label: "Class 6", order: 9, stage: "secondary" },
  { code: "C7", label: "Class 7", order: 10, stage: "secondary" },
  { code: "C8", label: "Class 8", order: 11, stage: "secondary" },
  { code: "C9", label: "Class 9", order: 12, stage: "secondary" },
  { code: "C10", label: "Class 10", order: 13, stage: "secondary" },
  { code: "C11", label: "Class 11", order: 14, stage: "senior_secondary" },
  { code: "C12", label: "Class 12", order: 15, stage: "senior_secondary" },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    for (const g of GRADE_CATALOG) {
      await ClassTemplate.updateOne(
        { code: g.code },
        { $set: g },
        { upsert: true }
      );
    }
    console.log("ClassTemplate seeding complete.");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
