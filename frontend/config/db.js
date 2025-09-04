const mongoose = require("mongoose");
const chalk = require("chalk");

const connectToMongo = async (uri) => {
  if (!uri) {
    console.error(chalk.red("MongoDB URI is missing."));
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log(chalk.green("✅ Successfully connected to MongoDB"));
  } catch (err) {
    console.error(chalk.red("❌ Error connecting to MongoDB:"), err.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log(chalk.yellow("⚠ SIGINT received. Closing MongoDB connection..."));
  await mongoose.connection.close();
  console.log(chalk.yellow("✅ MongoDB connection closed."));
  process.exit(0);
});

module.exports = connectToMongo;
