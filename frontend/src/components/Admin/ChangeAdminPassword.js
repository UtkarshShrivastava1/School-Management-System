import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { changeAdminPassword } from "../../api/adminApi"; // ✅ use centralized service

const ChangeAdminPassword = () => {
  const { token, role, user } = useAuth();
  const [adminID, setAdminID] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Pre-fill adminID if logged in as admin
  useEffect(() => {
    if (role === "admin" && (user?.adminID || user?.id)) {
      setAdminID(user.adminID || user.id);
    }
  }, [role, user]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (role !== "admin") {
      setError("Unauthorized. Only admins can change admin passwords.");
      return;
    }

    if (!token) {
      setError("Authentication token is missing. Please log in again.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      // ✅ Call adminApi instead of raw axios
      const res = await changeAdminPassword({
        adminID,
        newPassword,
        confirmNewPassword,
      });

      setMessage(res.message || "Password changed successfully!");
      setNewPassword("");
      setConfirmNewPassword("");
      document.getElementById("closeModal").click();
    } catch (err) {
      setError(err.response?.data?.message || "Error occurred");
    } finally {
      setLoading(false);
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
        disabled={role !== "admin"}
      >
        Change Password
      </button>

      {/* Modal */}
      <div
        className="modal fade"
        id="changePasswordModal"
        tabIndex="-1"
        aria-labelledby="changePasswordModalLabel"
        aria-hidden="true"
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
                    readOnly
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

              {message && (
                <div className="alert alert-success mt-3" role="alert">
                  {message}
                </div>
              )}
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
