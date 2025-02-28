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
    const classDoc = await Class.findOne({ classId }).populate(
      "teachers",
      "teacherID name"
    );
    if (!classDoc) {
      return res.status(404).json({ message: "Class not found" });
    }
    // Retrieve subjects using the custom subjectId values stored in the class document
    const subjects = await Subject.find({
      subjectId: { $in: classDoc.subjects },
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
      subjects: updatedSubjects,
      teachers: updatedTeachers,
    } = req.body;

    console.log("Updating class with ID:", classId);
    console.log("Payload:", req.body);

    // Find the class document by its custom classId
    let classDoc = await Class.findOne({ classId });
    if (!classDoc) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Update class name if provided
    if (className) {
      console.log(
        "Old className:",
        classDoc.className,
        "New className:",
        className
      );
      classDoc.className = className;
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
          await subject.save();
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
            classes: [],
          });
          console.log("Creating new subject:", subject);
          await subject.save();
        }
        // Update teacher assignment for the subject
        if (subj.teacherId) {
          const teacher = await Teacher.findOne({ teacherID: subj.teacherId });
          if (teacher) {
            console.log(
              `Assigning teacher ${teacher.teacherID} to subject ${subject.subjectName}`
            );
            subject.assignedTeachers = [teacher._id];
            await subject.save();
          } else {
            console.log(
              `Teacher ${subj.teacherId} not found for subject ${subj.subjectName}`
            );
          }
        }
        subjectIds.push(subject.subjectId);
      }
      // Update the class document's subjects with the unique list of subjectIds
      classDoc.subjects = Array.from(new Set(subjectIds));
      console.log("Updated class subjects:", classDoc.subjects);
    }

    // Update class teacher assignments if provided
    if (updatedTeachers && Array.isArray(updatedTeachers)) {
      let teacherObjIds = [];
      for (const tid of updatedTeachers) {
        const teacher = await Teacher.findOne({ teacherID: tid });
        if (teacher) teacherObjIds.push(teacher._id);
      }
      classDoc.teachers = teacherObjIds;
      console.log("Updated class teachers:", classDoc.teachers);
    }

    const updatedDoc = await classDoc.save();
    console.log("Updated class document:", updatedDoc);
    return res.status(200).json({
      message: "Class updated successfully",
      class: updatedDoc,
    });
  } catch (error) {
    console.error("Error updating class:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
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
