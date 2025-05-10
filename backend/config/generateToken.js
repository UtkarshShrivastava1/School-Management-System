const jwt = require("jsonwebtoken");

const generateToken = (id, role, adminID = null) => {
  // Generate a token with id, role, and adminID (if provided) in the payload
  const payload = { id, role };
  
  // Include adminID for admin users if provided
  if (role === 'admin' && adminID) {
    payload.adminID = adminID;
  }
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "30d", // You can adjust this value depending on your requirements
  });
};

module.exports = generateToken;
