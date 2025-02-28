const { validationResult } = require("express-validator");

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Extract error messages from the validation results
    const errorMessages = errors.array().map((err) => ({
      field: err.param,
      message: err.msg,
    }));

    // Respond with the error messages
    return res.status(400).json({
      message: "Validation errors occurred",
      errors: errorMessages,
    });
  }

  // Proceed to the next middleware/controller if no errors
  next();
};

module.exports = handleValidationErrors;
