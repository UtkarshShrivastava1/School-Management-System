import axios from "axios";
import React, { useState } from "react";
import { toast } from "react-toastify";
const ChangeStudentPassword = () => {

  const [studentID, setStudentID] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL =
    process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL // Production API URL
      : process.env.REACT_APP_DEVELOPMENT_URL; // Local development API URL

  const handleChangePassword = async (e) => {
    e.preventDefault();

    // Retrieve the JWT token from localStorage
    const token = localStorage.getItem("token");
    if (!token) {
        toast.error("Authentication token is missing. Please log in."); // ✅ Used toast
      return;
    }

    try {
      setLoading(true); // Indicate loading state
      console.log("Sending API request to change password..."); // Debugging log

      // Send PUT request to the backend API
      const response = await axios.put(
        `${API_URL}/api/student/auth/changestudentpassword`, // Corrected URL with backticks
        {
          studentID,
          currentPassword,
          newPassword,
          confirmNewPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Password changed successfully:", response.data); // Debugging log
      toast.success(response.data.message); // ✅ Toast success

      // Reset form fields after successful response
      setStudentID("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      // Close the modal on success
      document.getElementById("closeModal").click(); // ✅ Close modal
      } catch (err) {
        toast.error(err.response?.data?.message || "Error occurred"); // ✅ Toast error
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  return (
    <div className="container mt-5">
      {/* Button to Open Modal */}
      <button
        type="button"
        className="btn btn-primary"
        data-bs-toggle="modal"
        data-bs-target="#changePasswordModal"
      >
        Change Password
      </button>

      {/* Modal */}
      <div
        className="modal fade"
        id="changePasswordModal"
        tabIndex="-1"
        aria-labelledby="changePasswordModalLabel"
        aria-hidden="false"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="changePasswordModalLabel">
                Change Student Password
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                id="closeModal"
              ></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleChangePassword}>
                <div className="mb-3">
                  <label htmlFor="studentID" className="form-label">
                    Student ID
                  </label>
                  <input
                    type="text"
                    id="studentID"
                    className="form-control"
                    value={studentID}
                    onChange={(e) => setStudentID(e.target.value)}
                    placeholder="Enter Student ID"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="currentPassword" className="form-label">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    className="form-control"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter Current Password"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="newPassword" className="form-label">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    className="form-control"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter New Password"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="confirmNewPassword" className="form-label">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmNewPassword"
                    className="form-control"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? "Changing..." : "Change Password"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeStudentPassword;
