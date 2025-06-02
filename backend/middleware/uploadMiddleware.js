const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Set up storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine the upload directory based on user role
    let uploadDir = "uploads/";
    
    if (req.admin) {
      uploadDir += "Admin/";
    } else if (req.teacher) {
      uploadDir += "Teacher/";
    } else if (req.parent) {
      uploadDir += "Parent/";
    } else if (req.student) {
      uploadDir += "Student/";
    } else {
      uploadDir += "Other/";
    }

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`Created upload directory: ${uploadDir}`);
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = /jpeg|jpg|png|gif/;
  
  // Check file extension
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime type
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files (jpeg, jpg, png, gif) are allowed!"));
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB file size limit
  }
});

module.exports = upload; 