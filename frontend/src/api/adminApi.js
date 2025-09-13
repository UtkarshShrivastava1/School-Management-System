import api from "./axiosInstance";

// =======================
// 🔐 Admin Authentication
// =======================
export const changeAdminPassword = async (data) => {
  const res = await api.put("/api/admin/auth/changeadminpassword", data);
  return res.data;
};

// =======================
// 🎓 Class Management
// =======================
export const getAllClasses = async () => {
  const res = await api.get("/api/admin/auth/classes");
  return res.data;
};

export const getClassById = async (classId) => {
  const res = await api.get(`/api/admin/auth/classes/${classId}`);
  return res.data;
};

export const createClass = async (classData) => {
  const res = await api.post("/api/admin/auth/createclass", classData);
  return res.data;
};

export const deleteClass = async (classId) => {
  const res = await api.delete(`/api/admin/auth/classes/${classId}`);
  return res.data;
};

export const assignSubjectsToClass = async (classId, subjectIds) => {
  const res = await api.post(`/api/admin/auth/class/${classId}/assign-subjects`, {
    subjectIds,
  });
  return res.data;
};

export const getAvailableSections = async (standardName) => {
  const res = await api.get(`/api/admin/auth/available-sections/${standardName}`);
  return res.data;
};

// =======================
// 📚 Subject Management
// =======================
export const getAllSubjects = async () => {
  const res = await api.get("/api/admin/auth/subjects");
  return res.data;
};

export const createSubject = async (subjectData) => {
  const res = await api.post("/api/admin/auth/createsubject", subjectData);
  return res.data;
};

// =======================
// 👩‍🏫 Teacher Management
// =======================
export const getTeachers = async () => {
  const res = await api.get("/api/admin/auth/teachers");
  return res.data;
};
