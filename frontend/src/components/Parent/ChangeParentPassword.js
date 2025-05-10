import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ChangeParentPassword = () => {
  const [parentID, setParentID] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const API_URL =
    process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL
      : process.env.REACT_APP_DEVELOPMENT_URL;
      
  // Fetch parent ID on component mount
  useEffect(() => {
    const fetchParentInfo = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      try {
        const response = await axios.get(
          `${API_URL}/api/parent/auth/parentprofile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        if (response.data.parent && response.data.parent.parentID) {
          setParentID(response.data.parent.parentID);
        }
      } catch (error) {
        console.error("Error fetching parent info:", error);
      }
    };
    
    fetchParentInfo();
  }, [API_URL]);

  // Validate password requirements
  const validatePassword = (password) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/\d/.test(password)) {
      return "Password must contain at least one number";
    }
    if (!/[!@#$%^&*]/.test(password)) {
      return "Password must contain at least one special character";
    }
    return "";
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    setPasswordError(validatePassword(value));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    // Validate passwords match
    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Validate password requirements
    const validationError = validatePassword(newPassword);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    // Retrieve the JWT token from localStorage
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication token is missing. Please log in.");
      return;
    }

    try {
      setLoading(true);

      // Send PUT request to the backend API (only use one endpoint)
      const response = await axios.put(
        `${API_URL}/api/parent/changeparentpassword`,
        {
          parentID,
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

      toast.success(response.data.message || "Password changed successfully");
      
      // Reset form fields after successful response
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      // Close the modal on success
      document.getElementById("closeModal").click();
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to change password";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
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
                Change Parent Password
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
                  <label htmlFor="parentID" className="form-label">
                    Parent ID
                  </label>
                  <input
                    type="text"
                    id="parentID"
                    className="form-control"
                    value={parentID}
                    onChange={(e) => setParentID(e.target.value)}
                    placeholder="Enter Parent ID"
                    required
                    readOnly
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
                    className={`form-control ${passwordError ? "is-invalid" : ""}`}
                    value={newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter New Password"
                    required
                  />
                  {passwordError && (
                    <div className="invalid-feedback">{passwordError}</div>
                  )}
                  <small className="form-text text-muted">
                    Password must be at least 8 characters long, contain a number and a special character.
                  </small>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="confirmNewPassword" className="form-label">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmNewPassword"
                    className={`form-control ${newPassword !== confirmNewPassword && confirmNewPassword ? "is-invalid" : ""}`}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    required
                  />
                  {newPassword !== confirmNewPassword && confirmNewPassword && (
                    <div className="invalid-feedback">Passwords do not match</div>
                  )}
                </div>
                
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading || passwordError || newPassword !== confirmNewPassword}
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

export default ChangeParentPassword;
