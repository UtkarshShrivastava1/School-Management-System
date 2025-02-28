const Class = require("../models/ClassModel");
const Subject = require("../models/SubjectModel");
const Teacher = require("../models/TeacherModel");

const generateClassId = (standardName, sectionName) => {
  return `CLASS_${standardName.toUpperCase()}_${sectionName}`;
};

const generateSubjectCode = (subjectName) => {
  const subjectCodePrefix = subjectName.slice(0, 4).toUpperCase();
  const randomCode = Math.floor(Math.random() * 1000) + 100;
  return `${subjectCodePrefix}${randomCode}`;
};

const generateSubjectId = (subjectCode) => {
  return `SUB_${subjectCode}`;
};

const createClass = async (req, res) => {
  try {
    const { standardName, classStrength, subjects } = req.body;

    if (
      !standardName ||
      !classStrength ||
      !Array.isArray(subjects) ||
      subjects.length === 0
    ) {
      return res.status(400).json({
        message:
          "Please provide standardName, classStrength, and a list of subjects with assigned teachers.",
      });
    }

    // Validate each subject input (subjectCode is optional)
    for (const subject of subjects) {
      if (!subject.subjectName || !subject.teacherId) {
        return res.status(400).json({
          message:
            "Each subject must include a subjectName and an assigned teacherId.",
        });
      }
    }

    // Determine the next section for the class
    const existingClasses = await Class.find({
      className: new RegExp(`^${standardName}[A-Z]?$`),
    });
    const nextSection =
      existingClasses.length > 0
        ? String.fromCharCode(
            Math.max(
              ...existingClasses.map((cls) =>
                cls.className.slice(-1).charCodeAt(0)
              )
            ) + 1
          )
        : "A";
    const className = `${standardName}${nextSection}`;
    const classId = generateClassId(standardName, nextSection);

    // Arrays and maps for processing subjects and teacher assignments
    const subjectIds = []; // Custom subjectId strings for the Class document
    const processedSubjects = []; // { subjectId, subjectObjectId, teacherObjectId }
    const teacherToSubjects = {}; // Map: teacher _id (as string) => array of subject _id strings

    for (const {
      subjectName,
      teacherId,
      subjectCode: inputSubjectCode,
    } of subjects) {
      // Look up teacher by custom teacherID (e.g., "TCHR1234")
      const teacher = await Teacher.findOne({ teacherID: teacherId });
      if (!teacher) {
        return res.status(400).json({
          message: `Invalid teacherId: ${teacherId}. Teacher not found.`,
        });
      }

      // Process subject by subjectName
      let subject = await Subject.findOne({ subjectName });
      if (!subject) {
        // If a subject code is provided, use it; otherwise, generate one.
        const subjectCode = inputSubjectCode
          ? inputSubjectCode
          : generateSubjectCode(subjectName);
        const subjectCustomId = generateSubjectId(subjectCode);
        subject = new Subject({
          subjectName,
          subjectCode,
          subjectId: subjectCustomId,
          assignedTeachers: [teacher._id], // store teacher's ObjectId
          classes: [], // initialize classes array
        });
        await subject.save();
      } else {
        // If subject exists, add teacher (if not already assigned)
        if (!subject.assignedTeachers.includes(teacher._id)) {
          subject.assignedTeachers.push(teacher._id);
          await subject.save();
        }
      }

      subjectIds.push(subject.subjectId);
      processedSubjects.push({
        subjectId: subject.subjectId,
        subjectObjectId: subject._id,
        teacherObjectId: teacher._id,
      });

      // Build mapping: teacher _id -> array of subject _id's
      const teacherKey = teacher._id.toString();
      if (!teacherToSubjects[teacherKey]) {
        teacherToSubjects[teacherKey] = [];
      }
      if (!teacherToSubjects[teacherKey].includes(subject._id.toString())) {
        teacherToSubjects[teacherKey].push(subject._id.toString());
      }
    }

    // Create and save the class
    const newClass = new Class({
      className,
      classId,
      students: [],
      teachers: [], // will be updated below
      subjects: subjectIds, // storing custom subjectId strings
    });
    await newClass.save();

    // Update each subject: add this class's ID to their 'classes' field
    for (const processed of processedSubjects) {
      await Subject.findByIdAndUpdate(processed.subjectObjectId, {
        $addToSet: { classes: classId },
      });
    }

    // Update each teacher: add new class and update assigned subjects
    for (const teacherKey in teacherToSubjects) {
      await Teacher.findByIdAndUpdate(teacherKey, {
        $addToSet: {
          assignedClasses: newClass._id,
          assignedSubjects: { $each: teacherToSubjects[teacherKey] },
        },
      });
    }

    // Update the class document with teacher ObjectIds
    newClass.teachers = Object.keys(teacherToSubjects);
    await newClass.save();

    return res.status(201).json({
      message:
        "Class created successfully with subjects and assigned teachers.",
      class: newClass,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};

module.exports = { createClass };
