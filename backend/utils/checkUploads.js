const fs = require('fs');
const path = require('path');

// Function to ensure upload directories exist
function ensureUploadDirsExist() {
  const uploadDirs = [
    path.join(__dirname, '..', 'uploads'),
    path.join(__dirname, '..', 'uploads', 'Admin'),
    path.join(__dirname, '..', 'uploads', 'Student'),
    path.join(__dirname, '..', 'uploads', 'Parent'),
    path.join(__dirname, '..', 'uploads', 'Teacher')
  ];

  uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    } else {
      console.log(`Directory exists: ${dir}`);
    }
  });

  console.log('All upload directories verified.');
}

// Export the function
module.exports = ensureUploadDirsExist;

// Run directly if executed as a script
if (require.main === module) {
  ensureUploadDirsExist();
} 