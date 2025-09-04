const jwt = require("jsonwebtoken");

/**
 * Generate JWT token for authentication
 * @param {string|ObjectId} id - User ID 
 * @param {string} role - User role (admin, teacher, student, parent)
 * @returns {string} JWT token
 */
const generateToken = (id, role) => {
  if (!id) {
    throw new Error("User ID is required to generate token");
  }
  
  if (!role) {
    throw new Error("User role is required to generate token");
  }
  
  // Convert ObjectId to string if needed
  const userId = id.toString();
  
  // Generate a token with id and role in the payload
  return jwt.sign(
    { 
      id: userId,
      role 
    }, 
    process.env.JWT_SECRET, 
    {
      expiresIn: "30d" // 30 day expiration
    }
  );
};

module.exports = generateToken;