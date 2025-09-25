const multer = require("multer");
const path = require("path");

// Define storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Specify the destination folder for uploaded files
    cb(null, path.join(__dirname, "../uploads/teachers"));
  },
  filename: (req, file, cb) => {
    // Generate a unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname); // Get the file extension
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  },
});

// Define file filter to allow only specific file types
const fileFilter = (req, file, cb) => {
  // Accept only image files
  const allowedFileTypes = /jpeg|jpg|png/;
  const extension = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;

  if (allowedFileTypes.test(extension) && allowedFileTypes.test(mimeType)) {
    cb(null, true); // Accept the file
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, JPG, and PNG files are allowed."
      ),
      false
    );
  }
};

// Create Multer instance with defined storage and file filter
const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // Limit file size to 2MB
  },
  fileFilter,
});

module.exports = upload;
