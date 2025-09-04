const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const compression = require("compression");
const helmet = require("helmet");
const chalk = require("chalk");
const connectToMongo = require("./config/db");
const ensureUploadDirsExist = require("./utils/checkUploads");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

const mongoURI = isProduction
  ? process.env.MONGO_ATLAS_URI
  : process.env.MONGO_LOCAL_URI;

// Ensure upload directories exist
ensureUploadDirsExist();

/* ------------------------------- CORS first ------------------------------- */
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.FRONTEND_URL, // optional override
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // if you don't use cookies, you can set to false
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-User-Role"],
  })
);
// Fast-track preflights
app.options("*", cors());

console.log(
  chalk.yellow("🌍 CORS configured for: ") +
    chalk.white(allowedOrigins.join(", "))
);

/* ------------------------ Security & perf (prod only) --------------------- */
if (isProduction) {
  app.use(compression());
  app.use(helmet());
  console.log(chalk.cyan("🔒 Compression and Helmet enabled for production"));
}

/* -------------------------------- Parsers --------------------------------- */
app.use(express.json());

/* ------------------------------- DB connect ------------------------------- */
connectToMongo(mongoURI);

/* --------------------------------- Health --------------------------------- */
app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.get("/api/test", (req, res) => {
  res.json({ message: "Backend server is running!" });
});

/* --------------------------------- Routes --------------------------------- */
const adminRoutes = require("./routes/admin.routes");
const parentRoutes = require("./routes/parentRoutes");
const studentRoutes = require("./routes/studentRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const feeRoutes = require("./routes/feeRoutes");

app.use("/api/admin/auth", adminRoutes);
app.use("/api/parent/auth", parentRoutes);
app.use("/api/student/auth", studentRoutes);
app.use("/api/teacher/auth", teacherRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api", require("./routes/academicClass.routes"));
app.use("/api", require("./routes/teachingAssignment.routes"));
app.use("/api", require("./routes/enrollment.routes"));
app.use("/api", require("./routes/result.routes"));
app.use("/api", require("./routes/rollover.routes"));
app.use("/api", require("./routes/attendance.routes"));
app.use("/api", require("./routes/teacherAttendance.routes"));

/* ------------------------------- Static files ----------------------------- */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
console.log(
  chalk.magenta(
    `📂 Static files are served from: ${path.join(__dirname, "uploads")}`
  )
);

/* --------------------------- Global error handler ------------------------- */
app.use((err, req, res, next) => {
  console.error(
    chalk.red("🔥 [Global Error Handler]"),
    err.stack || err.message
  );
  res.status(500).json({ message: "Internal Server Error" });
});

/* -------------------------- Process-level handlers ------------------------ */
process.on("uncaughtException", (err) => {
  console.error(chalk.red("🚨 [Uncaught Exception]"), err.message);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error(chalk.red("🚨 [Unhandled Rejection]"), err?.message || err);
  process.exit(1);
});

/* --------------------------------- Start ---------------------------------- */
app.listen(port, () => {
  const backendURL = `http://localhost:${port}`;
  const appName = "School Management System";
  const startTime = new Date().toLocaleString();
  const nodeVersion = process.version;
  const os = require("os");
  const hostName = os.hostname();

  console.log(chalk.cyan("\n==============================="));
  console.log(chalk.greenBright.bold(`🚀 ${appName} is up and running!`));
  console.log(
    chalk.blue("🌍 Environment: ") +
      chalk.blueBright(`${process.env.NODE_ENV || "development"}`)
  );
  console.log(chalk.blue("🔌 Port: ") + chalk.yellowBright(`${port}`));
  console.log(
    chalk.blue("🔗 Backend URL: ") + chalk.cyanBright(`${backendURL}`)
  );
  console.log(
    chalk.magentaBright(
      `📦 MongoDB Connected: ${
        isProduction ? "Atlas (Production)" : "Local (Development)"
      }`
    )
  );
  console.log(
    chalk.blue("🟢 Node.js Version: ") + chalk.greenBright(nodeVersion)
  );
  console.log(chalk.blue("💻 Host Machine: ") + chalk.yellowBright(hostName));
  console.log(chalk.blue("⏳ Start Time: ") + chalk.whiteBright(startTime));
  console.log(chalk.cyan("===============================\n"));
});
