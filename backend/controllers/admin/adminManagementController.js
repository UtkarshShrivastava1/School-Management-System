const Teacher = require("../models/TeacherModel");
const Student = require("../models/StudentModel");
const Parent = require("../models/ParentModel");
const Subject = require("../models/SubjectModel");

/* ----------------------------- ID Generator ------------------------------- */
async function generateId(prefix, Model, field, digits) {
  let id, exists;
  do {
    id = `${prefix}${Math.floor(Math.random() * 10 ** digits)
      .toString()
      .padStart(digits, "0")}`;
    exists = await Model.findOne({ [field]: id }).lean();
  } while (exists);
  return id;
}

/* ------------------------------ Teachers ---------------------------------- */
exports.createTeacher = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      designation,
      address,
      dob,
      gender,
      department,
      religion,
      category,
      bloodgroup,
      emergencyContact,
      experience,
      highestQualification,
      AADHARnumber,
      salary,
      bankDetails,
    } = req.body;

    const photo = req.file ? req.file.filename : undefined;

    const dup = await Teacher.findOne({ $or: [{ email }, { phone }] });
    if (dup) {
      return res.status(400).json({ message: "Teacher already exists" });
    }

    const teacherID = await generateId("TCHR", Teacher, "teacherID", 4);
    const defaultPassword = "teacher123";

    const teacher = await Teacher.create({
      teacherID,
      name,
      email,
      phone,
      designation,
      address,
      dob,
      gender,
      religion,
      category,
      bloodgroup,
      department,
      password: defaultPassword,
      photo,
      emergencyContact: emergencyContact || undefined,
      experience: Number.isFinite(+experience) ? +experience : 0,
      highestQualification: highestQualification || "",
      AADHARnumber: AADHARnumber || "",
      salary: Number.isFinite(+salary) ? +salary : 0,
      bankDetails: bankDetails || undefined,
      status: "active",
      registeredBy: req.admin
        ? { adminID: req.admin.adminID, name: req.admin.name }
        : undefined,
    });

    return res.status(201).json({ message: "Teacher created", teacher });
  } catch (err) {
    next(err);
  }
};

exports.getAllTeachers = async (_req, res, next) => {
  try {
    const teachers = await Teacher.find().select("-password");
    return res.status(200).json({ teachers });
  } catch (err) {
    next(err);
  }
};

/* ------------------------------ Students ---------------------------------- */
exports.createStudent = async (req, res, next) => {
  try {
    const {
      studentName,
      studentEmail,
      studentPhone,
      studentAddress,
      studentDOB,
      studentGender,
      religion,
      category,
      bloodgroup,
      studentFatherName,
      studentMotherName,
      className, // requested grade, NOT actual enrollment yet

      parentName,
      parentContactNumber,
      parentEmail,
      relationship,
      parentAddress,
      parentOccupation,
    } = req.body;

    const studentPhoto = req.files?.photo?.[0]?.filename;
    const parentPhoto = req.files?.parentPhoto?.[0]?.filename;

    const dupStudent = await Student.findOne({
      $or: [{ studentEmail }, { studentPhone }],
    });
    if (dupStudent) {
      return res.status(400).json({ message: "Student already exists" });
    }

    // find or create parent
    let parent = await Parent.findOne({ parentEmail });
    if (!parent) {
      const parentID = await generateId("PRNT", Parent, "parentID", 5);
      parent = await Parent.create({
        parentID,
        parentName,
        parentEmail,
        parentContactNumber,
        parentPassword: "parent123",
        relationship: relationship || "Parent",
        parentPhoto,
        parentAddress: parentAddress || "",
        parentOccupation: parentOccupation || "",
        status: "active",
      });
    } else {
      if (parentPhoto) parent.parentPhoto = parentPhoto;
      if (parentAddress) parent.parentAddress = parentAddress;
      if (parentOccupation) parent.parentOccupation = parentOccupation;
      if (relationship) parent.relationship = relationship;
      await parent.save();
    }

    // new student
    const studentID = await generateId("STD", Student, "studentID", 5);
    const student = await Student.create({
      studentID,
      studentName,
      studentEmail,
      studentPhone,
      studentAddress,
      studentDOB,
      studentGender,
      religion,
      category,
      bloodgroup,
      studentFatherName,
      studentMotherName,
      photo: studentPhoto,
      parent: parent._id,
      studentPassword: "student123",
      role: "student",
      requestedClass: className || "", // for admission intention
      registeredBy: req.admin
        ? { adminID: req.admin.adminID, name: req.admin.name }
        : undefined,
      isActive: true,
    });

    // link child to parent
    parent.children = parent.children || [];
    parent.children.push({
      student: student._id,
      relationship: relationship || "Parent",
    });
    await parent.save();

    return res.status(201).json({
      message: "Student created (not yet enrolled)",
      student,
      parent: {
        parentID: parent.parentID,
        parentEmail: parent.parentEmail,
        parentContactNumber: parent.parentContactNumber,
        parentName: parent.parentName,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllStudents = async (_req, res, next) => {
  try {
    const students = await Student.find()
      .select("-studentPassword")
      .populate(
        "parent",
        "parentName parentEmail parentContactNumber parentID"
      );
    return res.status(200).json({ students });
  } catch (err) {
    next(err);
  }
};

exports.searchStudents = async (req, res, next) => {
  try {
    const { q } = req.query;
    const regex = new RegExp(q || "", "i");
    const students = await Student.find({
      $or: [
        { studentName: regex },
        { studentEmail: regex },
        { studentID: regex },
        { studentPhone: regex },
      ],
    })
      .select("-studentPassword")
      .limit(50);
    return res.status(200).json({ students });
  } catch (err) {
    next(err);
  }
};

/* ------------------------------ Subjects ---------------------------------- */
exports.createSubject = async (req, res, next) => {
  try {
    const { subjectName, subjectCode } = req.body;

    let subject = await Subject.findOne({ subjectCode });
    if (subject) {
      return res.status(400).json({ message: "Subject already exists" });
    }

    subject = await Subject.create({
      subjectName,
      subjectCode,
      subjectId: subjectCode || subjectName,
      assignedTeachers: [], // real assignment is via TeachingAssignment
    });

    return res.status(201).json({ message: "Subject created", subject });
  } catch (err) {
    next(err);
  }
};

exports.getAllSubjects = async (_req, res, next) => {
  try {
    const subjects = await Subject.find().populate(
      "assignedTeachers",
      "teacherID name"
    );
    return res.status(200).json({ subjects });
  } catch (err) {
    next(err);
  }
};
