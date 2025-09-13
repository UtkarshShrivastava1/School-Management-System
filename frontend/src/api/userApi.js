// src/api/userApi.js
import api from "./axiosInstance";

/**
 * 🧑‍💻 Fetch user profile based on role
 * @param {string} role - admin | teacher | student | parent
 */
export const fetchUserProfileApi = async (role) => {
  const roleEndpoints = {
    admin: "/admin/auth/adminprofile",
    teacher: "/teacher/auth/teacherprofile",
    student: "/student/auth/studentprofile",
    parent: "/parent/auth/parentprofile",
  };

  const endpoint = roleEndpoints[role];
  if (!endpoint) {
    throw new Error(`❌ Invalid role provided: ${role}`);
  }

  const { data } = await api.get(endpoint);
  return data; // Expecting user profile object
};
