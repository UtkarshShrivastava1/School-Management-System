const bcrypt = require("bcryptjs");
const Parent = require("../models/ParentModel");
const generateToken = require("../config/generateToken");

// Parent Login
const parentLogin = async (req, res) => {
  try {
  const { parentID, password } = req.body;

  console.log("Parent login attempt:", { parentID });

  // Validate input
  if (!parentID || !password) {
    console.log("Missing credentials:", { parentID: !!parentID, password: !!password });
    return res
      .status(400)
      .json({ message: "Both parent ID and password are required." });
  }

  try {
    // Find parent by parentID
    const parent = await Parent.findOne({ parentID });
    console.log("Parent lookup result:", parent ? "Found" : "Not found");

    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }

    if (!parent.parentPassword) {
      return res.status(500).json({ message: "Parent account is not properly set up" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      parent.parentPassword
    );
    console.log("Password validation:", isPasswordValid ? "Valid" : "Invalid");

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Generate JWT token
    const token = generateToken(parent._id, "parent"); // Using "parent" as the role
    console.log("Token generated successfully");

    // Return success response with token and parent details
    res.json({
      token,
      parent: {
        parentID: parent.parentID,
        parentName: parent.parentName,
        parentEmail: parent.parentEmail,
        parentContactNumber: parent.parentContactNumber,
        address: parent.address || "",
        occupation: parent.occupation || "",
        relationship: parent.relationship || "",
        photo: parent.photo || "",
        children: parent.children, // Array of student IDs associated with the parent
        _id: parent._id, // Include MongoDB ID for reference
      },
    });
  } catch (error) {
    console.error("Error logging in parent:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Get parent profile
exports.getParentProfile = async (req, res) => {
  try {
    console.log("Fetching parent profile for ID:", req.parent._id);
    
    const parent = await Parent.findById(req.parent._id);
    
    if (!parent) {
      console.error("Parent not found in database with ID:", req.parent._id);
      return res.status(404).json({ message: "Parent not found" });
    }
    
    console.log("Found parent:", {
      id: parent._id,
      parentID: parent.parentID,
      name: parent.parentName,
      photo: parent.photo || "No photo" 
    });
    
    // Format the parent data
    const formattedParent = {
      parentID: parent.parentID,
      parentName: parent.parentName,
      parentEmail: parent.parentEmail,
      parentContactNumber: parent.parentContactNumber,
      address: parent.address || "",
      occupation: parent.occupation || "",
      relationship: parent.relationship || "",
      photo: parent.photo || "",
      children: parent.children
    };
    
    console.log("Returning parent profile with photo:", formattedParent.photo);
    
    res.status(200).json({ 
      parent: formattedParent
    });
  } catch (error) {
    console.error("Error fetching parent profile:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

// Update parent information
exports.updateParentInfo = async (req, res) => {
  try {
    console.log("Updating parent profile, request body:", req.body);
    console.log("File received:", req.file);
    
    // Get the parent ID from the auth middleware
    const parentId = req.parent._id;

    // Extract updated fields from request body
    const { 
      parentName, 
      parentEmail, 
      parentContactNumber,
      address,
      occupation,
      relationship
    } = req.body;

    // Find the parent by ID
    const parent = await Parent.findById(parentId);
    if (!parent) {
      console.error("Parent not found with ID:", parentId);
      return res.status(404).json({ message: "Parent not found" });
    }

    console.log("Found parent to update:", {
      id: parent._id,
      parentID: parent.parentID,
      name: parent.parentName,
      currentPhoto: parent.photo || "No photo"
    });

    // Handle photo upload if provided
    let photoFilename = parent.photo; // Default to existing photo
    if (req.file) {
      photoFilename = req.file.filename;
      console.log("New photo will be saved:", photoFilename);
    }

    // Update fields (only if they are provided)
    if (parentName) parent.parentName = parentName;
    if (parentEmail) parent.parentEmail = parentEmail;
    if (parentContactNumber) parent.parentContactNumber = parentContactNumber;
    if (address !== undefined) parent.address = address;
    if (occupation !== undefined) parent.occupation = occupation;
    if (relationship !== undefined) parent.relationship = relationship;
    if (photoFilename) parent.photo = photoFilename;

    // Save updated parent
    const updatedParent = await parent.save();
    console.log("Parent updated successfully with photo:", updatedParent.photo);

    // Return success response
    res.status(200).json({
      message: "Parent information updated successfully",
      parent: {
        parentID: updatedParent.parentID,
        parentName: updatedParent.parentName,
        parentEmail: updatedParent.parentEmail,
        parentContactNumber: updatedParent.parentContactNumber,
        address: updatedParent.address || "",
        occupation: updatedParent.occupation || "",
        relationship: updatedParent.relationship || "",
        photo: updatedParent.photo || "",
        children: updatedParent.children
      }
    });
  } catch (error) {
    console.error("Error updating parent information:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

// Change parent password
exports.changeParentPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }
    
    // Get the parent from the database
    const parent = await Parent.findById(req.parent._id);
    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, parent.parentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    parent.parentPassword = hashedPassword;
    await parent.save();
    
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing parent password:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};
