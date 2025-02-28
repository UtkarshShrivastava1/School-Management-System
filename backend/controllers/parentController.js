const bcrypt = require("bcryptjs");
const Parent = require("../models/ParentModel"); // Importing Parent model
const generateToken = require("../config/generateToken"); // Importing token generator

// Controller for logging in parents
exports.parentLogin = async (req, res) => {
  const { parentID, password } = req.body;

  // Validate input
  if (!parentID || !password) {
    return res
      .status(400)
      .json({ message: "Both parent ID and password are required." });
  }

  try {
    // Find parent by parentID
    const parent = await Parent.findOne({ parentID });

    if (!parent) {
      return res.status(404).json({ message: "Parent not found." });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      parent.parentPassword
    );

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Generate JWT token
    const token = generateToken(parent._id, "parent"); // Using "parent" as the role

    // Return success response with token and parent details
    res.json({
      message: "Login successful",
      token,
      parent: {
        parentID: parent.parentID,
        parentName: parent.parentName,
        parentEmail: parent.parentEmail,
        parentContactNumber: parent.parentContactNumber,
        children: parent.children, // Array of student IDs associated with the parent
      },
    });
  } catch (error) {
    console.error("Error logging in parent:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};
