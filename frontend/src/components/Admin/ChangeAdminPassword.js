import React, { useState } from "react";
import axios from "axios";

const ChangeAdminPassword = () => {
  // State variables for input fields, messages, error handling, and loading status
  const [adminID, setAdminID] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL =
    process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL // Production API URL
      : process.env.REACT_APP_DEVELOPMENT_URL; // Local development API URL
  /**
   * Handles the form submission for changing the admin password.
   * Validates token presence, sends the PUT request, and updates UI based on response.
   * @param {Object} e - The form submission event object.
   */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage(""); // Clear previous messages
    setError(""); // Clear previous errors

    console.log("Attempting to change the password..."); // Debugging log

    // Retrieve the JWT token from localStorage
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Token is missing from localStorage."); // Debugging log
      setError("Authentication token is missing. Please log in.");
      return;
    }

    try {
      setLoading(true); // Indicate loading state
      console.log("Sending API request to change password..."); // Debugging log

      // Send PUT request to the backend API
      const response = await axios.put(
        `${API_URL}/api/admin/auth/changeadminpassword`, // Corrected URL with backticks
        {
          adminID,
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
      setMessage(response.data.message); // Set success message

      // Reset form fields after successful response
      setAdminID("");
      setNewPassword("");
      setConfirmNewPassword("");

      // Close the modal on success
      document.getElementById("closeModal").click();
    } catch (err) {
      console.error("Error occurred while changing password:", err); // Debugging log
      setError(err.response?.data?.message || "Error occurred");
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
                Change Admin Password
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
                  <label htmlFor="adminID" className="form-label">
                    Admin ID
                  </label>
                  <input
                    type="text"
                    id="adminID"
                    className="form-control"
                    value={adminID}
                    onChange={(e) => setAdminID(e.target.value)}
                    placeholder="Enter Admin ID"
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
              {/* Display Success Message */}
              {message && (
                <div className="alert alert-success mt-3" role="alert">
                  {message}
                </div>
              )}
              {/* Display Error Message */}
              {error && (
                <div className="alert alert-danger mt-3" role="alert">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeAdminPassword;
