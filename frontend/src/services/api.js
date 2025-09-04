// src/services/api.js
import axios from "axios";

/* --------------------------- Base URL resolution --------------------------- */
function getBaseURL() {
  const appEnv = process.env.REACT_APP_NODE_ENV || process.env.NODE_ENV;
  const isProd = appEnv === "production";

  return isProd
    ? process.env.REACT_APP_PRODUCTION_URL
    : process.env.REACT_APP_DEVELOPMENT_URL;
}

/* ------------------------------- Token store ------------------------------ */
const TOKEN_KEY = "token";

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}
function writeToken(t) {
  try {
    t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* noop */
  }
}

/* ------------------------------ Axios instance ---------------------------- */
const instance = axios.create({
  baseURL: getBaseURL(),
  timeout: 30_000,
  withCredentials: false, // keep false unless you rely on cookies/sessions
  // ❌ Do not send X-Requested-With — it triggers CORS header mismatches.
});

/* -------------------------------- Interceptors ---------------------------- */
// Attach Authorization header if a token exists
instance.interceptors.request.use(
  (config) => {
    const token = readToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Normalize responses & errors
instance.interceptors.response.use(
  (response) => response?.data ?? response,
  async (error) => {
    const status = error?.response?.status ?? 0;
    const data = error?.response?.data;
    const message =
      data?.message ||
      error?.message ||
      "Something went wrong. Please try again.";

    if (status === 401) {
      window.dispatchEvent(new Event("api:unauthorized"));
    }

    return Promise.reject({
      status,
      message,
      data,
      raw: error,
    });
  }
);

/* --------------------------------- Helpers -------------------------------- */
const api = {
  axios: instance,

  setToken(token) {
    writeToken(token);
  },
  clearToken() {
    writeToken(null);
  },

  setBaseURL(url) {
    instance.defaults.baseURL = url;
  },

  get: (url, config) => instance.get(url, config),
  delete: (url, config) => instance.delete(url, config),
  post: (url, body, config) => instance.post(url, body, config),
  put: (url, body, config) => instance.put(url, body, config),
  patch: (url, body, config) => instance.patch(url, body, config),

  upload: (url, formData, config = {}) =>
    instance.post(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      ...config,
    }),
};

export default api;
