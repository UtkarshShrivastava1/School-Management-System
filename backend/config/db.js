const mongoose = require("mongoose");
require("colors");

const connectToMongo = async (uri) => {
  if (!uri) {
    console.error("MongoDB URI is missing.".red);
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("✅ Successfully connected to MongoDB".green);
  } catch (err) {
    console.error("❌ Error connecting to MongoDB:".red, err.message);
    process.exit(1); // Exit process if DB connection fails
  }
};

// Graceful shutdown: Close MongoDB connection when app is terminated
process.on("SIGINT", async () => {
  console.log("⚠ SIGINT received. Closing MongoDB connection...".yellow);
  await mongoose.connection.close();
  console.log("✅ MongoDB connection closed.".yellow);
  process.exit(0);
});

module.exports = connectToMongo;