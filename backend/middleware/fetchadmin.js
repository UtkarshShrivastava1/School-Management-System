// middleware/fetchadmin.js
const Admin = require("../models/AdminModel"); // Import the Admin model

const fetchadmin = async (req, res, next) => {
  const { adminId } = req.admin; // adminId comes from the decoded token (from authenticateAdmin)

  if (!adminId) {
    return res.status(401).json({ error: "Admin ID not found in token" });
  }

  try {
    // Fetch the admin details from the database using the adminId
    const admin = await Admin.findById(adminId).select("-password"); // Exclude the password field

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Attach the admin's profile data to the request object
    req.user = {
      adminId: admin._id,
      name: admin.name,
      email: admin.email,
      // You can add more fields as needed
    };

    console.log("Admin details fetched:", req.user);

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Error fetching admin details:", error);
    res
      .status(500)
      .json({ error: "Internal server error", detail: error.message });
  }
};

module.exports = fetchadmin;
