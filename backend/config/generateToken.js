const jwt = require("jsonwebtoken");

const generateToken = (id, role) => {
  // Generate a token with id and role in the payload
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "30d", // You can adjust this value depending on your requirements
  });
};

module.exports = generateToken;
