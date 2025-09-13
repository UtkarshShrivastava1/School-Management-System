// src/api/feeApi.js
import api from "./axiosInstance";

const feeApi = {
  // Fetch all fee records for a class
  getClassFees: (classId) => api.get(`/fees/class/${classId}`),

  // Fetch fee history for a specific student in a class
  getStudentFeeHistory: async (classId, studentId) => {
    const response = await api.get(`/fees/class/${classId}`);
    const allFees = Array.isArray(response.data) ? response.data : response.data.data || [];
    return allFees.filter(fee => fee.student?._id === studentId);
  },
};

export default feeApi;

