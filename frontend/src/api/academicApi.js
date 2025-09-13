import api from "./axiosInstance";

const academicApi = {
  // Fetch dashboard stats (classes, students, teachers, etc.)
  getOverview: () => api.get("/academic/overview"),

  // Fetch notifications related to academics
  getNotifications: () => api.get("/academic/notifications"),

  // Fetch management sections (or build them dynamically if backend supports)
  getSections: () => api.get("/academic/sections"),
};

export default academicApi;
