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

const createClass = async (req, res) => {
  try {
    const { standardName, classStrength, section, subjects } = req.body;
    console.log("Incoming body =>", req.body);

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
    const allowedSections = ["A", "B", "C", "D", "E"];

    if (!allowedSections.includes(section.toUpperCase())) {
      return res.status(400).json({
        message: "Section must be one of A, B, C, D, or E.",
      });
    }

    if (!classStrength || parseInt(classStrength, 10) <= 0) {
      setErrorMessage("Class strength must be greater than 0.");
      return;
    }
    

    // Check for duplicate class with same name and section
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

    for (const {
      subjectName,
      teacherId,
      subjectCode: inputSubjectCode,
    } of subjects) {
      const teacher = await Teacher.findOne({ teacherID: teacherId });
      if (!teacher) {
        return res.status(400).json({
          message: `Invalid teacherId: ${teacherId}. Teacher not found.`,
        });
      }

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

      const teacherKey = teacher._id.toString();
      if (!teacherToSubjects[teacherKey]) {
        teacherToSubjects[teacherKey] = [];
      }
      if (!teacherToSubjects[teacherKey].includes(subject._id.toString())) {
        teacherToSubjects[teacherKey].push(subject._id.toString());
      }
    }

    const newClass = new Class({
      className: standardName,
      section: section.toUpperCase(),
      classId,
      students: [],
      teachers: [],
      subjects: subjectObjectIds,
    });
    await newClass.save();

    for (const { subjectObjectId } of processedSubjects) {
      await Subject.findByIdAndUpdate(subjectObjectId, {
        $addToSet: { classes: classId },
      });
    }

    for (const teacherKey in teacherToSubjects) {
      await Teacher.findByIdAndUpdate(teacherKey, {
        $addToSet: {
          assignedClasses: newClass._id,
          assignedSubjects: { $each: teacherToSubjects[teacherKey] },
        },
      });
    }

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
