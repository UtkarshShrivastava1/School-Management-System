const { validationResult } = require("express-validator");
const Notification = require("../models/NotificationModel");

// POST /api/notifications/send
exports.createNotification = async (req, res) => {
  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, message, recipientGroup } = req.body;
    const file = req.file ? req.file.filename : undefined;
    
    // Check if admin exists in request
    if (!req.admin) {
      console.error("Notification creation failed: Admin not found in request");
      return res.status(401).json({ message: "Unauthorized: Valid admin credentials required" });
    }
    
    // Get admin ID safely
    const adminID = req.admin._id ? req.admin._id.toString() : null;
    const adminName = req.admin.name || "Administrator";
    
    if (!adminID) {
      console.error("Admin ID is missing or invalid");
      return res.status(401).json({ message: "Admin authentication failed: Invalid admin ID" });
    }
    
    console.log(`Creating notification for group: ${recipientGroup} by admin: ${adminID}`);
    
    // Create new notification with error handling
    try {
      const notification = new Notification({
        title,
        message,
        file,
        recipientGroup,
        creator: {
          adminID,
          name: adminName,
        },
      });
      
      await notification.save();
      console.log(`Notification created successfully with ID: ${notification._id}`);
      return res.status(201).json({ message: "Notification sent successfully", notification });
    } catch (saveError) {
      console.error("Error saving notification:", saveError);
      return res.status(500).json({ message: "Failed to save notification", error: saveError.message });
    }
  } catch (error) {
    console.error("Error in notification creation process:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// GET /api/notifications/teacher
exports.getTeacherNotifications = async (req, res) => {
  try {
    console.log("Fetching teacher notifications");
    const notifications = await Notification.find({
      recipientGroup: { $in: ["teachers", "all"] },
    }).sort({ createdAt: -1 }).lean();
    
    console.log(`Found ${notifications.length} notifications for teachers`);
    return res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error fetching teacher notifications:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// GET /api/notifications/student
exports.getStudentNotifications = async (req, res) => {
  try {
    console.log("Fetching student notifications");
    console.log("Student ID:", req.student._id);
    
    // Find notifications for students or all users
    const notifications = await Notification.find({
      recipientGroup: { $in: ["students", "all"] }
    })
    .sort({ createdAt: -1 })
    .lean();
    
    console.log(`Found ${notifications.length} notifications for students`);
    
    // Return the notifications
    return res.status(200).json({ 
      notifications,
      message: "Student notifications retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching student notifications:", error);
    return res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
};

// GET /api/notifications/parent
exports.getParentNotifications = async (req, res) => {
  try {
    console.log("Fetching parent notifications");
    const notifications = await Notification.find({
      recipientGroup: { $in: ["parents", "all"] },
    }).sort({ createdAt: -1 }).lean();
    
    console.log(`Found ${notifications.length} notifications for parents`);
    return res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error fetching parent notifications:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};