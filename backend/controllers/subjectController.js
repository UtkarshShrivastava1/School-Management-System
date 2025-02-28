const Subject = require("../models/SubjectModel");

const generateSubjectCode = (subjectName) => {
  // A simple example: Create a code like MATH101, SCI202
  const subjectCodePrefix = subjectName.slice(0, 4).toUpperCase(); // First 4 letters of subject name (e.g., "MATH")
  const randomCode = Math.floor(Math.random() * 1000) + 100; // Random 3-digit number for uniqueness
  return `${subjectCodePrefix}${randomCode}`;
};

const generateSubjectId = (subjectCode) => {
  // Simple approach: Concatenate 'SUB' with the generated subject code
  return `SUB_${subjectCode}`;
};

const createSubject = async (req, res) => {
  try {
    const { subjectName } = req.body;

    // Validate input
    if (!subjectName) {
      return res.status(400).json({
        message: "Please provide a subject name.",
      });
    }

    // Generate subjectCode and subjectId
    const subjectCode = generateSubjectCode(subjectName);
    const subjectId = generateSubjectId(subjectCode);

    // Check if the subjectCode already exists
    const existingSubject = await Subject.findOne({ subjectCode });
    if (existingSubject) {
      return res.status(400).json({
        message: `A subject with the code ${subjectCode} already exists.`,
      });
    }

    // Create the new subject
    const newSubject = new Subject({
      subjectName,
      subjectCode,
      subjectId,
    });

    // Save the subject to the database
    await newSubject.save();

    // Return success response
    return res.status(201).json({
      message: "Subject created successfully.",
      subject: newSubject,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};

//=======================================================================\
// Controller to fetch all subjects
const getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({}, "subjectId subjectName"); // Fetch only the fields needed
    return res.status(200).json({ subjects });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch subjects.",
      error: error.message,
    });
  }
};
module.exports = { createSubject, getAllSubjects };
