const mongoose = require('mongoose');

const removeEnrolledClassesIndex = async () => {
  try {
    // Connect to MongoDB (use 'test' database as per error logs)
    await mongoose.connect('mongodb://localhost:27017/test');
    console.log('Connected to MongoDB');

    // Get the students collection
    const db = mongoose.connection.db;
    const studentsCollection = db.collection('students');

    // List all indexes on the students collection
    const indexes = await studentsCollection.indexes();
    console.log('Current indexes on students collection:');
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${JSON.stringify(index.key)} - ${index.unique ? 'UNIQUE' : 'NON-UNIQUE'}`);
    });

    // Find and remove the problematic enrolledClasses unique index
    const enrolledClassesIndex = indexes.find(index => 
      index.key && index.key.enrolledClasses === 1 && index.unique
    );

    if (enrolledClassesIndex) {
      console.log('Found problematic enrolledClasses unique index, removing...');
      await studentsCollection.dropIndex(enrolledClassesIndex.name);
      console.log('Successfully removed enrolledClasses unique index');
    } else {
      console.log('No problematic enrolledClasses unique index found');
    }

    // List indexes again to confirm removal
    const updatedIndexes = await studentsCollection.indexes();
    console.log('\nUpdated indexes on students collection:');
    updatedIndexes.forEach((index, i) => {
      console.log(`${i + 1}. ${JSON.stringify(index.key)} - ${index.unique ? 'UNIQUE' : 'NON-UNIQUE'}`);
    });

    console.log('Index cleanup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

removeEnrolledClassesIndex(); 