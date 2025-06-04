const Class = require("../models/ClassModel");
const Subject = require("../models/SubjectModel");
const Teacher = require("../models/TeacherModel");

/**
 * Helper Functions to generate subject codes/IDs if needed
 */
function generateSubjectCode(subjectName) {
  const subjectCodePrefix = subjectName.slice(0, 4).toUpperCase();
  const randomCode = Math.floor(Math.random() * 1000) + 100;
  return `${subjectCodePrefix}${randomCode}`;
}

function generateSubjectId(subjectCode) {
  return `SUB_${subjectCode}`;
}

/**
 * Helper function to generate a unique subjectId.
 * Uses the providedSubjectCode if given; otherwise, generates one.
 * Loops until a subjectId is found that does not exist in the database.
 */
async function generateUniqueSubjectId(subjectName, providedSubjectCode) {
  let subjectCode = providedSubjectCode || generateSubjectCode(subjectName);
  let subjectCustomId = generateSubjectId(subjectCode);
  let existing = await Subject.findOne({ subjectId: subjectCustomId });
  while (existing) {
    // Generate a new subject code (ignoring providedSubjectCode to avoid constant collisions)
    subjectCode = generateSubjectCode(subjectName);
    subjectCustomId = generateSubjectId(subjectCode);
    existing = await Subject.findOne({ subjectId: subjectCustomId });
  }
  return { subjectCode, subjectCustomId };
}

/**
 * GET /api/admin/auth/classes
 * Fetch all classes with basic info.
 */
const getAllClasses = async (req, res) => {
  try {
    // Populate teachers (only teacherID and name) for each class
    const classes = await Class.find().populate("teachers", "teacherID name");
    return res.status(200).json({
      message: "Classes fetched successfully",
      classes,
    });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

/**
 * GET /api/admin/auth/classes/:classId
 * Fetch a single class's details, including subjects and teachers.
 */
const getClassDetails = async (req, res) => {
  try {
    const { classId } = req.params;
    
    if (!classId) {
      return res.status(400).json({ message: "Class ID is required" });
    }

    // Try to find by classId first (since that's what we're using in the frontend)
    let classDoc = await Class.findOne({ classId })
      .populate("teachers", "teacherID name")
      .populate("subjects", "subjectName subjectCode subjectId");
    
    // If not found by classId, try to find by MongoDB _id
    if (!classDoc) {
      try {
        classDoc = await Class.findById(classId)
          .populate("teachers", "teacherID name")
          .populate("subjects", "subjectName subjectCode subjectId");
      } catch (err) {
        // If the classId is not a valid ObjectId, just continue with null classDoc
        console.log("Invalid ObjectId format, continuing with classId search");
      }
    }
    
    if (!classDoc) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Get subjects with their assigned teachers
    const subjects = await Subject.find({
      _id: { $in: classDoc.subjects }
    }).populate("assignedTeachers", "teacherID name");

    return res.status(200).json({
      message: "Class details fetched successfully",
      class: classDoc,
      subjects,
    });
  } catch (error) {
    console.error("Error fetching class details:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

/**
 * PUT /api/admin/auth/classes/:classId
 * Update a class's details: className, subjects, and teacher assignments.
 *
 * Expected payload example:
 * {
 *   "className": "10B",
 *   "subjects": [
 *     {
 *       "existingSubjectId": "SUB_MATH101",  // Optional if subject already exists
 *       "subjectName": "Math",
 *       "teacherId": "TCHR1059",
 *       "subjectCode": "MATH101"             // Optional: if provided, update the code
 *     },
 *     {
 *       "subjectName": "Science",
 *       "teacherId": "TCHR9330"
 *     }
 *   ],
 *   "teachers": ["TCHR1059", "TCHR9330"]
 * }
 */
const updateClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const {
      className,
      section,
      subjects: updatedSubjects,
      teachers: updatedTeachers,
      classStrength
    } = req.body;

    console.log("Updating class with ID:", classId);
    console.log("Payload:", req.body);

    // Find the class document by its custom classId
    let classDoc = await Class.findOne({ classId });
    if (!classDoc) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Validate class name format if provided
    if (className) {
      const validClassNames = [
        "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
        "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
        "Class 11", "Class 12"
      ];
      if (!validClassNames.includes(className)) {
        return res.status(400).json({
          message: "Invalid class name. Must be in format 'Class X' where X is 1-12"
        });
      }
    }

    // Validate section if provided
    if (section) {
      const validSections = ["A", "B", "C", "D", "E"];
      if (!validSections.includes(section.toUpperCase())) {
        return res.status(400).json({
          message: "Invalid section. Must be one of A, B, C, D, or E"
        });
      }
    }

    // Check for duplicate class if either className or section is being updated
    if (className || section) {
      const newClassName = className || classDoc.className;
      const newSection = section ? section.toUpperCase() : classDoc.section;
      
      const existingClass = await Class.findOne({
        className: newClassName,
        section: newSection,
        _id: { $ne: classDoc._id } // Exclude current class
      });

      if (existingClass) {
        return res.status(400).json({
          message: `A class with name ${newClassName} and section ${newSection} already exists`
        });
      }
    }

    // Process subjects if provided
    if (updatedSubjects && Array.isArray(updatedSubjects)) {
      let subjectIds = [];
      for (const subj of updatedSubjects) {
        let subject;
        // 1. If an existingSubjectId is provided, try to find that subject
        if (subj.existingSubjectId) {
          subject = await Subject.findOne({
            subjectId: subj.existingSubjectId,
          });
          console.log("Found subject by existingSubjectId:", subject);
        }
        // 2. Otherwise, try to find by subjectName (case-insensitive)
        if (!subject) {
          subject = await Subject.findOne({
            subjectName: new RegExp("^" + subj.subjectName.trim() + "$", "i"),
          });
          console.log("Found subject by subjectName:", subject);
        }
        // If the subject is found, update its details without changing its subjectId
        if (subject) {
          // Update subject name if different
          if (subject.subjectName.trim() !== subj.subjectName.trim()) {
            console.log(
              "Updating subject name from",
              subject.subjectName,
              "to",
              subj.subjectName
            );
            subject.subjectName = subj.subjectName.trim();
          }
          // Update subject code if provided and different
          if (subj.subjectCode && subject.subjectCode !== subj.subjectCode) {
            // Check that no other subject (other than this one) uses the new code
            const duplicate = await Subject.findOne({
              subjectCode: subj.subjectCode,
              _id: { $ne: subject._id },
            });
            if (duplicate) {
              return res.status(400).json({
                message: `Subject code ${subj.subjectCode} is already in use by another subject.`,
              });
            }
            console.log(
              "Updating subject code from",
              subject.subjectCode,
              "to",
              subj.subjectCode
            );
            subject.subjectCode = subj.subjectCode;
          }
          // Update teacher assignment if provided
          if (subj.teacherId) {
            const teacher = await Teacher.findOne({ teacherID: subj.teacherId });
            if (teacher) {
              subject.assignedTeachers = [teacher._id];
            } else {
              return res.status(400).json({
                message: `Teacher with ID ${subj.teacherId} not found`,
              });
            }
          }
          await subject.save();
          subjectIds.push(subject._id); // Store MongoDB _id instead of subjectId
        }
        // 3. If no matching subject is found, create a new one with a unique subjectId
        if (!subject) {
          const { subjectCode, subjectCustomId } =
            await generateUniqueSubjectId(subj.subjectName, subj.subjectCode);
          subject = new Subject({
            subjectName: subj.subjectName.trim(),
            subjectCode,
            subjectId: subjectCustomId,
            assignedTeachers: [],
            classes: [classDoc._id],
          });
          // Assign teacher if provided
          if (subj.teacherId) {
            const teacher = await Teacher.findOne({ teacherID: subj.teacherId });
            if (teacher) {
              subject.assignedTeachers = [teacher._id];
            } else {
              return res.status(400).json({
                message: `Teacher with ID ${subj.teacherId} not found`,
              });
            }
          }
          await subject.save();
          subjectIds.push(subject._id); // Store MongoDB _id instead of subjectId
        }
      }
      classDoc.subjects = subjectIds;
    }

    // Update class fields if provided
    if (className) classDoc.className = className;
    if (section) classDoc.section = section.toUpperCase();
    
    // Handle classStrength - use existing value if not provided
    if (classStrength) {
      const strength = parseInt(classStrength, 10);
      if (isNaN(strength) || strength < 1) {
        return res.status(400).json({
          message: "Class strength must be a positive number"
        });
      }
      classDoc.classStrength = strength;
    }
    // If classStrength is not provided, keep the existing value

    // Update teachers if provided
    if (updatedTeachers && Array.isArray(updatedTeachers)) {
      const teacherIds = [];
      for (const teacherId of updatedTeachers) {
        const teacher = await Teacher.findOne({ teacherID: teacherId });
        if (!teacher) {
          return res.status(400).json({
            message: `Teacher with ID ${teacherId} not found`,
          });
        }
        teacherIds.push(teacher._id);
      }
      classDoc.teachers = teacherIds;
    }

    // Save the updated class
    await classDoc.save();

    // Return the updated class with populated fields
    const updatedClass = await Class.findById(classDoc._id)
      .populate("teachers", "teacherID name")
      .populate("subjects", "subjectName subjectCode subjectId");

    return res.status(200).json({
      message: "Class updated successfully",
      class: updatedClass,
    });
  } catch (error) {
    console.error("Error updating class:", error);
    return res.status(500).json({
      message: "Server error while updating class",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/admin/auth/classes/:classId
 * Delete a class and update subjects and teachers accordingly.
 * Additionally, if any subject becomes orphaned (i.e. no classes reference it), it is deleted.
 * Also, teacher assignments to subjects that are deleted are removed.
 */
const deleteClass = async (req, res) => {
  try {
    const { classId } = req.params;
    // Delete the class document
    const classDoc = await Class.findOneAndDelete({ classId });
    if (!classDoc) {
      return res.status(404).json({ message: "Class not found" });
    }
    // Remove this class from any subjects' classes field
    await Subject.updateMany(
      { classes: classId },
      { $pull: { classes: classId } }
    );
    // Delete subjects that are no longer associated with any class (orphans)
    const orphanSubjects = await Subject.find({ classes: { $size: 0 } });
    if (orphanSubjects.length > 0) {
      const orphanIds = orphanSubjects.map((subj) => subj._id);
      await Subject.deleteMany({ _id: { $in: orphanIds } });
      console.log("Deleted orphaned subjects:", orphanIds);
    }
    // Remove this class from teachers' assignedClasses field
    await Teacher.updateMany(
      { assignedClasses: classDoc._id },
      { $pull: { assignedClasses: classDoc._id } }
    );
    // Also remove any assignedSubjects from teachers that no longer exist in the Subject collection
    const validSubjects = await Subject.find({}, "_id");
    const validSubjectIds = validSubjects.map((s) => s._id);
    await Teacher.updateMany(
      {},
      { $pull: { assignedSubjects: { $nin: validSubjectIds } } }
    );
    return res.status(200).json({ message: "Class deleted successfully" });
  } catch (error) {
    console.error("Error deleting class:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getAllClasses,
  getClassDetails,
  updateClass,
  deleteClass,
};