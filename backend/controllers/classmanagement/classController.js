const Class = require("../models/ClassModel");
const Subject = require("../models/SubjectModel");
const Teacher = require("../models/TeacherModel");

const generateSubjectCode = (subjectName) => {
  const subjectCodePrefix = subjectName.slice(0, 4).toUpperCase();
  const randomCode = Math.floor(Math.random() * 1000) + 100;
  return `${subjectCodePrefix}${randomCode}`;
};

const generateSubjectId = (subjectCode) => {
  return `SUB_${subjectCode}`;
};

const generateClassId = (standardName, sectionName) => {
  return `CLASS_${standardName.toUpperCase().replace(" ", "_")}_${sectionName}`;
};

const getAllowedSections = ["A", "B", "C", "D", "E"];

const createClass = async (req, res) => {
  try {
    const { standardName, classStrength, section, subjects } = req.body;
    console.log("Incoming body =>", req.body);

    // Validate required fields
    if (
      !standardName ||
      !section ||
      !classStrength ||
      !Array.isArray(subjects) ||
      subjects.length === 0
    ) {
      return res.status(400).json({
        message:
          "Please provide standardName, section, classStrength, and a list of subjects with assigned teachers.",
      });
    }

    // Check for existing sections
    const existingSections = await Class.find(
      { className: standardName },
      { section: 1, _id: 0 }
    );
    const usedSections = existingSections.map((item) => item.section);

    // Validate if section is available
    if (usedSections.includes(section.toUpperCase())) {
      return res.status(400).json({
        message: `Section ${section} already exists for class ${standardName}. Available sections: ${getAllowedSections
          .filter((s) => !usedSections.includes(s))
          .join(", ")}`,
      });
    }

    // Validate section is in allowed list
    if (!getAllowedSections.includes(section.toUpperCase())) {
      return res.status(400).json({
        message: "Section must be one of A, B, C, D, or E.",
      });
    }

    // Validate class strength
    const strength = parseInt(classStrength, 10);
    if (isNaN(strength) || strength <= 0) {
      return res.status(400).json({
        message: "Class strength must be a positive number.",
      });
    }

    // Check for duplicate class
    const existingClass = await Class.findOne({
      className: standardName,
      section: section.toUpperCase(),
    });
    if (existingClass) {
      return res.status(400).json({
        message: "A class with the same name and section already exists.",
      });
    }

    const classId = generateClassId(standardName, section.toUpperCase());
    const subjectObjectIds = [];
    const processedSubjects = [];
    const teacherToSubjects = {};

    // Process each subject and teacher
    for (const {
      subjectName,
      teacherId,
      subjectCode: inputSubjectCode,
    } of subjects) {
      // Validate teacher
      const teacher = await Teacher.findOne({ teacherID: teacherId });
      if (!teacher) {
        return res.status(400).json({
          message: `Invalid teacherId: ${teacherId}. Teacher not found.`,
        });
      }

      // Create or update subject
      let subject = await Subject.findOne({ subjectName });
      if (!subject) {
        const subjectCode =
          inputSubjectCode || generateSubjectCode(subjectName);
        const subjectCustomId = generateSubjectId(subjectCode);
        subject = new Subject({
          subjectName,
          subjectCode,
          subjectId: subjectCustomId,
          assignedTeachers: [teacher._id],
          classes: [],
        });
        await subject.save();
      } else if (!subject.assignedTeachers.includes(teacher._id)) {
        subject.assignedTeachers.push(teacher._id);
        await subject.save();
      }

      subjectObjectIds.push(subject._id);
      processedSubjects.push({
        subjectObjectId: subject._id,
        teacherObjectId: teacher._id,
      });

      // Track teacher-subject relationships
      const teacherKey = teacher._id.toString();
      if (!teacherToSubjects[teacherKey]) {
        teacherToSubjects[teacherKey] = [];
      }
      if (!teacherToSubjects[teacherKey].includes(subject._id.toString())) {
        teacherToSubjects[teacherKey].push(subject._id.toString());
      }
    }

    // Create new class
    const newClass = new Class({
      className: standardName,
      section: section.toUpperCase(),
      classId,
      classStrength: strength,
      students: [],
      teachers: [],
      subjects: subjectObjectIds,
    });
    await newClass.save();

    // Update subjects with class reference
    for (const { subjectObjectId } of processedSubjects) {
      await Subject.findByIdAndUpdate(subjectObjectId, {
        $addToSet: { classes: newClass._id },
      });
    }

    // Update teachers with class and subject references
    for (const teacherKey in teacherToSubjects) {
      await Teacher.findByIdAndUpdate(teacherKey, {
        $addToSet: {
          assignedClasses: newClass._id,
          assignedSubjects: { $each: teacherToSubjects[teacherKey] },
        },
      });
    }

    // Update class with teacher references
    newClass.teachers = Object.keys(teacherToSubjects);
    await newClass.save();

    return res.status(201).json({
      message:
        "Class created successfully with subjects and assigned teachers.",
      class: newClass,
    });
  } catch (error) {
    console.error("Error creating class:", error);
    return res.status(500).json({
      message: "Server error while creating class.",
      error: error.message,
    });
  }
};

const assignSubjectsToClass = async (req, res) => {
  try {
    const { classId, subjects } = req.body;

    // Validate required fields
    if (!classId || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        message:
          "Please provide classId and a list of subjects with assigned teachers.",
      });
    }

    // Find the class
    const classDoc = await Class.findOne({ classId });
    if (!classDoc) {
      return res.status(404).json({
        message: "Class not found.",
      });
    }

    const subjectObjectIds = [];
    const processedSubjects = [];
    const teacherToSubjects = {};

    // Process each subject and teacher
    for (const {
      subjectName,
      teacherId,
      subjectCode: inputSubjectCode,
    } of subjects) {
      // Validate teacher
      const teacher = await Teacher.findOne({ teacherID: teacherId });
      if (!teacher) {
        return res.status(400).json({
          message: `Invalid teacherId: ${teacherId}. Teacher not found.`,
        });
      }

      // Create or update subject
      let subject = await Subject.findOne({ subjectName });
      if (!subject) {
        const subjectCode =
          inputSubjectCode || generateSubjectCode(subjectName);
        const subjectCustomId = generateSubjectId(subjectCode);
        subject = new Subject({
          subjectName,
          subjectCode,
          subjectId: subjectCustomId,
          assignedTeachers: [teacher._id],
          classes: [classDoc._id],
        });
        await subject.save();
      } else if (!subject.assignedTeachers.includes(teacher._id)) {
        subject.assignedTeachers.push(teacher._id);
        if (!subject.classes.includes(classDoc._id)) {
          subject.classes.push(classDoc._id);
        }
        await subject.save();
      }

      subjectObjectIds.push(subject._id);
      processedSubjects.push({
        subjectObjectId: subject._id,
        teacherObjectId: teacher._id,
      });

      // Track teacher-subject relationships
      const teacherKey = teacher._id.toString();
      if (!teacherToSubjects[teacherKey]) {
        teacherToSubjects[teacherKey] = [];
      }
      if (!teacherToSubjects[teacherKey].includes(subject._id.toString())) {
        teacherToSubjects[teacherKey].push(subject._id.toString());
      }
    }

    // Update class with new subjects
    classDoc.subjects = subjectObjectIds;
    await classDoc.save();

    // Update teachers with class and subject references
    for (const teacherKey in teacherToSubjects) {
      await Teacher.findByIdAndUpdate(teacherKey, {
        $addToSet: {
          assignedClasses: classDoc._id,
          assignedSubjects: { $each: teacherToSubjects[teacherKey] },
        },
      });
    }

    // Update class with teacher references
    classDoc.teachers = Object.keys(teacherToSubjects);
    await classDoc.save();

    return res.status(200).json({
      message: "Subjects assigned to class successfully.",
      class: classDoc,
    });
  } catch (error) {
    console.error("Error assigning subjects to class:", error);
    return res.status(500).json({
      message: "Server error while assigning subjects to class.",
      error: error.message,
    });
  }
};

const getAvailableSections = async (req, res) => {
  try {
    const { standardName } = req.params;

    if (!standardName) {
      return res.status(400).json({
        message: "Please provide the class standard name",
      });
    }

    const formattedStandardName = `Class ${standardName}`;

    // Log the query
    console.log("Searching for class:", formattedStandardName);

    const existingSections = await Class.find(
      { className: formattedStandardName },
      { section: 1, _id: 0 }
    ).lean(); // Use lean() for better performance

    const usedSections = existingSections.map((item) => item.section);
    const availableSections = ["A", "B", "C", "D", "E"].filter(
      (section) => !usedSections.includes(section)
    );

    console.log("Found sections:", usedSections);
    console.log("Available sections:", availableSections);

    return res.status(200).json({
      success: true,
      message: "Available sections retrieved successfully",
      standardName: formattedStandardName,
      availableSections,
      existingSections: usedSections,
    });
  } catch (error) {
    console.error("Error in getAvailableSections:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching available sections",
      error: error.message,
    });
  }
};

module.exports = {
  createClass,
  assignSubjectsToClass,
  getAvailableSections,
};
