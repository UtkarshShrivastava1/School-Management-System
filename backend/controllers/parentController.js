const bcrypt = require("bcryptjs");
const Parent = require("../models/ParentModel");
const generateToken = require("../config/generateToken");

// Parent Login
const parentLogin = async (req, res) => {
  try {
  const { parentID, password } = req.body;

  // Validate input
  if (!parentID || !password) {
      return res.status(400).json({ message: "All fields are required" });
  }

    // Find parent by ID without excluding any fields
    const parent = await Parent.findOne({ parentID }).select('+parentPassword');
    
    // Debug logging
    console.log("Login attempt for parentID:", parentID);
    console.log("Parent found:", parent ? "Yes" : "No");
    if (parent) {
      console.log("Parent has password:", !!parent.parentPassword);
      console.log("Parent password field:", parent.parentPassword ? "Present" : "Missing");
    }

    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }

    if (!parent.parentPassword) {
      return res.status(500).json({ message: "Parent account is not properly set up" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, parent.parentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = generateToken(parent._id, "parent");

    // Update last login
    parent.lastLogin = new Date();
    await parent.save();

    res.json({
      token,
      parent: {
        parentID: parent.parentID,
        parentName: parent.parentName,
        parentEmail: parent.parentEmail,
        parentContactNumber: parent.parentContactNumber,
        photo: parent.photo,
        role: "parent"
      }
    });
  } catch (error) {
    console.error("Parent login error:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
};

// Get Parent Profile
const getParentProfile = async (req, res) => {
  try {
    if (!req.parent || !req.parent.id) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    const parent = await Parent.findById(req.parent.id)
      .populate({
        path: 'children.student',
        select: 'studentName studentID studentEmail studentPhone studentGender studentDOB photo',
        model: 'Student'
      })
      .select('-parentPassword');
    
    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }

    // Format the response to include detailed child information
    const formattedParent = {
      ...parent.toObject(),
      children: parent.children.map(child => ({
        student: child.student,
        relationship: child.relationship
      }))
    };

    res.json({ parent: formattedParent });
  } catch (error) {
    console.error("Get parent profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update Parent Profile
const updateParentProfile = async (req, res) => {
  try {
    if (!req.parent || !req.parent.id) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    const {
      parentName,
      parentEmail,
      parentContactNumber,
      parentAddress,
      parentDOB,
      parentGender,
      religion,
      category,
      bloodgroup,
      emergencyContact
    } = req.body;
    
    const parent = await Parent.findById(req.parent.id);
    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }

    // Update fields
    if (parentName) parent.parentName = parentName;
    if (parentEmail) parent.parentEmail = parentEmail;
    if (parentContactNumber) parent.parentContactNumber = parentContactNumber;
    if (parentAddress) parent.parentAddress = parentAddress;
    if (parentDOB) parent.parentDOB = new Date(parentDOB);
    if (parentGender) parent.parentGender = parentGender;
    if (religion) parent.religion = religion;
    if (category) parent.category = category;
    if (bloodgroup) parent.bloodgroup = bloodgroup;
    if (emergencyContact) {
      parent.emergencyContact = {
        name: emergencyContact.name || parent.emergencyContact.name,
        relation: emergencyContact.relation || parent.emergencyContact.relation,
        phone: emergencyContact.phone || parent.emergencyContact.phone,
      };
    }

    // Handle photo upload if present
    if (req.file) {
      parent.photo = req.file.path;
    }

    await parent.save();

    // Fetch updated parent with populated children
    const updatedParent = await Parent.findById(parent._id)
      .populate({
        path: 'children.student',
        select: 'studentName studentID studentEmail studentPhone studentGender studentDOB photo',
        model: 'Student'
      })
      .select('-parentPassword');

    // Format the response
    const formattedParent = {
      ...updatedParent.toObject(),
      children: updatedParent.children.map(child => ({
        student: child.student,
        relationship: child.relationship
      }))
    };

    res.json({
      message: "Profile updated successfully",
      parent: formattedParent
    });
  } catch (error) {
    console.error("Update parent profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Change Parent Password
const changeParentPassword = async (req, res) => {
  try {
    if (!req.parent || !req.parent.id) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const parent = await Parent.findById(req.parent.id);
    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, parent.parentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    parent.parentPassword = await bcrypt.hash(newPassword, salt);

    await parent.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change parent password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create Parent (Admin function)
const createParent = async (req, res) => {
  try {
    const {
      parentName,
      parentEmail,
      parentContactNumber,
      parentAddress,
      parentDOB,
      parentGender,
      religion,
      category,
      bloodgroup,
      emergencyContact
    } = req.body;

    // Check if parent already exists
    const existingParent = await Parent.findOne({ parentEmail });
    if (existingParent) {
      return res.status(400).json({ message: "Parent with this email already exists" });
    }

    // Generate parent ID
    const parentID = `PRNT${Math.floor(10000 + Math.random() * 90000)}`;

    // Set default password
    const defaultPassword = "parent@123";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    // Debug logging
    console.log("Creating parent with ID:", parentID);
    console.log("Password hashed:", !!hashedPassword);

    // Create new parent
    const newParent = new Parent({
      parentID,
      parentName,
      parentEmail,
      parentContactNumber,
      parentAddress,
      parentDOB: new Date(parentDOB),
      parentGender,
      religion,
      category,
      bloodgroup,
      parentPassword: hashedPassword,
      emergencyContact: emergencyContact || {
        name: "",
        relation: "",
        phone: ""
      },
      photo: req.file ? req.file.path : null
    });

    await newParent.save();

    // Verify parent was created with password
    const savedParent = await Parent.findOne({ parentID });
    console.log("Parent saved with password:", !!savedParent?.parentPassword);

    res.status(201).json({
      message: "Parent created successfully",
      parent: {
        parentID: newParent.parentID,
        parentName: newParent.parentName,
        parentEmail: newParent.parentEmail,
        parentContactNumber: newParent.parentContactNumber,
        defaultPassword
      }
    });
  } catch (error) {
    console.error("Create parent error:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
};

// Get All Parents (Admin function)
const getAllParents = async (req, res) => {
  try {
    const parents = await Parent.find()
      .populate({
        path: 'children.student',
        select: 'studentName studentID',
        model: 'Student'
      })
      .select('-parentPassword');

    res.json({
      message: "Parents fetched successfully",
      parents: parents.map(parent => ({
        ...parent.toObject(),
        children: parent.children.map(child => ({
          student: child.student,
          relationship: child.relationship
        }))
      }))
    });
  } catch (error) {
    console.error("Get all parents error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Search Parents (Admin function)
const searchParents = async (req, res) => {
  try {
    const { parentID, parentName, parentEmail } = req.query;
    const query = {};

    if (parentID) query.parentID = parentID;
    if (parentName) query.parentName = { $regex: parentName, $options: 'i' };
    if (parentEmail) query.parentEmail = { $regex: parentEmail, $options: 'i' };

    const parents = await Parent.find(query)
      .populate({
        path: 'children.student',
        select: 'studentName studentID',
        model: 'Student'
      })
      .select('-parentPassword');

    res.json({
      message: "Parents fetched successfully",
      parents: parents.map(parent => ({
        ...parent.toObject(),
        children: parent.children.map(child => ({
          student: child.student,
          relationship: child.relationship
        }))
      }))
    });
  } catch (error) {
    console.error("Search parents error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  parentLogin,
  getParentProfile,
  updateParentProfile,
  changeParentPassword,
  createParent,
  getAllParents,
  searchParents
};
