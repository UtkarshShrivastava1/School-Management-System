const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const compression = require("compression");
const helmet = require("helmet");
require("colors");
const connectToMongo = require("./config/db"); // Import the MongoDB connection function

// Load environment variables
dotenv.config();

// Environment setup
const app = express();
const port = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production"; // Declare first

const mongoURI = isProduction
  ? process.env.MONGO_ATLAS_URI
  : process.env.MONGO_LOCAL_URI;

// Middleware setup
app.use(express.json());

// CORS Configuration
if (isProduction) {
  app.use(
    cors({
      origin: [process.env.FRONTEND_URL], // Use environment variable
      credentials: true,
    })
  );
  console.log(
    `🌍 CORS configured for production: ${process.env.FRONTEND_URL}`.green
  );
} else {
  app.use(cors()); // Allow all origins in development
  console.log("🌍 CORS configured for local development".yellow);
}
// Security and performance optimizations
if (isProduction) {
  app.use(compression()); // Compress response bodies for better performance
  app.use(helmet()); // Secure HTTP headers
  console.log("🔒 Compression and Helmet enabled for production".cyan);
}

// Connect to MongoDB
connectToMongo(mongoURI);

// Routes
const adminRoutes = require("./routes/adminRoutes");
const parentRoutes = require("./routes/parentRoutes");
const studentRoutes = require("./routes/studentRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

// Mount routes
app.use("/api/admin/auth", adminRoutes);
app.use("/api/parent/auth", parentRoutes);
app.use("/api/student/auth", studentRoutes);
app.use("/api/teacher/auth", teacherRoutes);
app.use("/api/notifications", notificationRoutes);

// Serve static files from the "uploads" directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
console.log(
  `📂 Static files are served from: ${path.join(__dirname, "uploads")}`.magenta
);

// Global error handler
app.use((err, req, res, next) => {
  console.error("🔥 [Global Error Handler]".red, err.stack || err.message);
  res.status(500).json({ message: "Internal Server Error" });
});

// Handle unexpected errors
process.on("uncaughtException", (err) => {
  console.error("🚨 [Uncaught Exception]".red, err.message);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("🚨 [Unhandled Rejection]".red, err.message);
  process.exit(1);
});

// Start the server
app.listen(port, () => {
  const backendURL = `http://localhost:${port}`;
  const appName = "School Management System";
  const startTime = new Date().toLocaleString();
  const nodeVersion = process.version;
  const os = require("os");
  const hostName = os.hostname();

  console.log("\n===============================".brightCyan);
  console.log(`🚀 ${appName} is up and running!`.brightGreen.bold);
  console.log(
    `🌍 Environment: `.blue +
      `${process.env.NODE_ENV || "development"}`.brightBlue
  );
  console.log(`🔌 Port: `.blue + `${port}`.brightYellow);
  console.log(`🔗 Backend URL: `.blue + `${backendURL}`.brightCyan.bold);
  console.log(
    `📦 MongoDB Connected: ${
      isProduction ? "Atlas (Production)" : "Local (Development)"
    }`.brightMagenta
  );
  console.log(`🟢 Node.js Version: `.blue + `${nodeVersion}`.brightGreen);
  console.log(`💻 Host Machine: `.blue + `${hostName}`.brightYellow);
  console.log(`⏳ Start Time: `.blue + `${startTime}`.brightWhite);
  console.log("===============================\n".brightCyan);
});
