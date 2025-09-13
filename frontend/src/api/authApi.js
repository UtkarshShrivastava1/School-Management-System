// src/api/authApi.js
import api from "./axiosInstance";

/**
 * 🔑 Login user by role
 * @param {string} role - admin | teacher | student | parent
 * @param {string} userId - role-specific ID (ADM1234, TCHR5678, etc.)
 * @param {string} password
 */
export const loginApi = async (role, userId, password) => {
  const roleEndpoints = {
    admin: "/admin/auth/login",
    teacher: "/teacher/auth/login",
    student: "/student/auth/login",
    parent: "/parent/auth/login",
  };

  const loginEndpoint = roleEndpoints[role];
  if (!loginEndpoint) {
    throw new Error(`❌ Invalid role provided: ${role}`);
  }

  const { data } = await api.post(loginEndpoint, {
    [`${role}ID`]: userId,
    password,
  });

  // Expecting { token, role, user }
  return data;
};

/**
 * 🔐 Validate token by role
 * Backend must return { valid: true, user } if token is valid
 */
export const validateTokenApi = async (role) => {
  const roleEndpoints = {
    admin: "/admin/auth/validate",
    teacher: "/teacher/auth/validate",
    student: "/student/auth/validate",
    parent: "/parent/auth/validate",
  };

  const endpoint = roleEndpoints[role];
  if (!endpoint) {
    throw new Error(`❌ Invalid role provided: ${role}`);
  }

  const { data } = await api.get(endpoint);
  return data;
};

/**
 * 🚪 Logout user
 * Clears session if backend supports it
 */
export const logoutApi = async (role) => {
  const roleEndpoints = {
    admin: "/admin/auth/logout",
    teacher: "/teacher/auth/logout",
    student: "/student/auth/logout",
    parent: "/parent/auth/logout",
  };

  const endpoint = roleEndpoints[role];
  if (!endpoint) {
    throw new Error(`❌ Invalid role provided: ${role}`);
  }

  const { data } = await api.post(endpoint);
  return data;
};
