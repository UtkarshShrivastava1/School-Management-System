import api from "./axiosInstance";

const notificationApi = {
  // ✅ validate admin token
  validateAdmin: () => {
    return api.post("/admin/auth/validate", {}, {
      headers: { "X-User-Role": "admin" }
    });
  },

  // ✅ send notification
  sendNotification: (formData) => {
    return api.post("/notifications/send", formData, {
      headers: { "X-User-Role": "admin" }
    });
  }
};

export default notificationApi;
