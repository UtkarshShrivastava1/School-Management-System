const mongoose = require('mongoose');
const Class = require('../models/ClassModel');

const  = process.env.MONGO_ATLAS_URI || 'mongodb+srv://sahilsharma06478:admin@cluster0.enasjof.mongodb.net/?retryWrites=true&w=majority&appName=AtlasDB';

if (!MONGO_ATLAS_URI) {
  console.error('MongoDB URI is missing. Set MONGO_ATLAS_URI in your environment.');
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(MONGO_ATLAS_URI);
    console.log('✅ Connected to MongoDB');
    const classes = await Class.find({});
    let totalChanged = 0;
    for (const cls of classes) {
      let changed = false;
      for (const record of cls.attendanceHistory) {
        const d = new Date(record.date);
        // If not at UTC midnight, fix it
        if (!(d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0)) {
          record.date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
          changed = true;
        }
      }
      if (changed) {
        await cls.save();
        totalChanged++;
        console.log(`Fixed attendanceHistory dates for class ${cls.classId}`);
      }
    }
    console.log(`Done. Classes updated: ${totalChanged}`);
    process.exit(0);
  } catch (err) {
    console.error('Error fixing attendanceHistory dates:', err);
    process.exit(1);
  }
})(); 