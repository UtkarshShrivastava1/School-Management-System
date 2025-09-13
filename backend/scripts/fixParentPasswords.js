/**
 * This script checks all parent accounts and ensures the parentPassword field is properly set.
 * It fixes any accounts where the password might be stored under a different field name.
 */

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const Parent = require("../models/ParentModel");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_ATLAS_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

async function fixParentPasswords() {
  try {
    // Get all parents
    const parents = await Parent.find({});
    console.log(`Found ${parents.length} parent accounts`);

    let fixed = 0;
    let alreadyOk = 0;
    let problems = 0;

    for (const parent of parents) {
      console.log(`Checking parent: ${parent.parentID} (${parent.parentName})`);

      // Check if parentPassword exists
      if (parent.parentPassword) {
        console.log("- Account has parentPassword field already");
        alreadyOk++;
        continue;
      }

      // Check if password exists (wrong field name)
      if (parent.password) {
        console.log(
          "- Found password field instead of parentPassword, fixing..."
        );
        parent.parentPassword = parent.password;
        await parent.save();
        console.log("- Fixed: Copied password to parentPassword field");
        fixed++;
        continue;
      }

      // If neither exists, set a default password
      console.log("- No password field found, setting default password");
      const salt = await bcrypt.genSalt(10);
      const defaultPassword = await bcrypt.hash("Parent@123", salt);
      parent.parentPassword = defaultPassword;
      await parent.save();
      console.log("- Fixed: Set default password (Parent@123)");
      fixed++;
    }

    console.log("\nSummary:");
    console.log(`Total parents checked: ${parents.length}`);
    console.log(`Already OK: ${alreadyOk}`);
    console.log(`Fixed: ${fixed}`);
    console.log(`Problems: ${problems}`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
}

fixParentPasswords();
