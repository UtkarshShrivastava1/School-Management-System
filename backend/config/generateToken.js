const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    // Only pass id in the payload
    expiresIn: "300d", // Token expires in 300 days
  });
};

module.exports = generateToken;
