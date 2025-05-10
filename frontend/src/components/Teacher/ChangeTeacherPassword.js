import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ChangeTeacherPassword = () => {
  // State variables for input fields, messages, error handling, and loading status
  const [teacherID, setTeacherID] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL =
    process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL
      : process.env.REACT_APP_DEVELOPMENT_URL;
      
  // When component mounts, get the teacher ID from the profile data if available
  useEffect(() => {
    // Get teacherID from localStorage or from profile data if available
    const token = localStorage.getItem("token");
    if (token) {
      // Fetch teacher profile to get teacherID
      const fetchTeacherData = async () => {
        try {
          const response = await axios.get(
            `${API_URL}/api/teacher/auth/teacherprofile`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (response.data.teacher && response.data.teacher.teacherID) {
            setTeacherID(response.data.teacher.teacherID);
          }
        } catch (err) {
          console.error("Error fetching teacher ID:", err);
        }
      };
      fetchTeacherData();
    }
  }, [API_URL]);

  /**
   * Handles the form submission for changing the teacher password.
   * Validates token presence, sends the PUT request, and updates UI based on response.
   * @param {Object} e - The form submission event object.
   */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage(""); // Clear previous messages
    setError(""); // Clear previous errors

    console.log("Attempting to change the password..."); // Debugging log

    // Validate password requirements
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    
    if (!/\d/.test(newPassword)) {
      setError("Password must contain at least one number");
      return;
    }
    
    if (!/[!@#$%^&*]/.test(newPassword)) {
      setError("Password must contain at least one special character");
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }

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
        `${API_URL}/api/teacher/auth/changeteacherpassword`,
        {
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
      setMessage(response.data.message); // Set success message
      toast.success(response.data.message || "Password changed successfully!");

      // Reset form fields after successful response
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      // Close the modal on success
      document.getElementById("closeModal").click();
    } catch (err) {
      console.error("Error occurred while changing password:", err); // Debugging log
      setError(err.response?.data?.message || "Error occurred");
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  return (
    <div className="container mt-5">
      {/* Button to Open Modal */}
      <button
        type="button"
        className="btn btn-primary ms-2"
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
                Change Teacher Password
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
                  <label htmlFor="teacherID" className="form-label">
                    Teacher ID
                  </label>
                  <input
                    type="text"
                    id="teacherID"
                    className="form-control"
                    value={teacherID}
                    onChange={(e) => setTeacherID(e.target.value)}
                    placeholder="Enter Teacher ID"
                    disabled={true} // Disable as we auto-populate it
                    required
                  />
                  <small className="text-muted">
                    Your teacher ID is automatically filled in
                  </small>
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
                  <small className="text-muted">
                    Password must be at least 8 characters long, contain at least one number and one special character.
                  </small>
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

export default ChangeTeacherPassword;
