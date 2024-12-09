const jwt = require("jsonwebtoken");

// Middleware function to verify JWT token
const verifyAdminToken = (req, res, next) => {
  // Retrieve token from Authorization header
  const token = req.header("Authorization")?.replace("Bearer ", "");

  // Log token received for debugging
  console.log("Authorization Header:", req.header("Authorization"));
  console.log("Token received:", token);

  if (!token) {
    console.error("No token provided. Authorization denied.");
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Log the decoded token data for debugging
    console.log("Decoded Token:", decoded);

    // Attach decoded token data (e.g., admin ID) to the request object
    req.admin = decoded;

    // Log the admin data being attached to the request object
    console.log("Admin data attached to request:", req.admin);

    // Proceed to the next middleware/controller
    next();
  } catch (error) {
    // Log the error for debugging
    console.error("Error verifying token:", error);

    if (error.name === "TokenExpiredError") {
      console.error("Token has expired");
      return res.status(401).json({ message: "Token has expired" });
    }
    if (error.name === "JsonWebTokenError") {
      console.error("Token is not valid");
      return res.status(401).json({ message: "Token is not valid" });
    }

    // If an unknown error occurs, log it
    console.error("Token verification failed", error.message);
    return res
      .status(500)
      .json({ message: "Token verification failed", error: error.message });
  }
};

module.exports = { verifyAdminToken }; // Export the verifyAdminToken function
