import React, { useState } from "react";
import { Button, Form, Modal, Spinner, Alert } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";

const ChangeParentPassword = ({ show, handleClose }) => {
  const [formData, setFormData] = useState({
    parentID: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const API_URL =
    process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL
      : process.env.REACT_APP_DEVELOPMENT_URL;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const validatePassword = (password) => {
    // At least 8 characters, one number, one special character
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);
    const hasMinLength = password.length >= 8;

    if (!hasMinLength) {
      return "Password must be at least 8 characters long";
    }
    if (!hasNumber) {
      return "Password must contain at least one number";
    }
    if (!hasSpecial) {
      return "Password must contain at least one special character (!@#$%^&*)";
    }

    return null;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Get parentID from localStorage
      const parentInfo = JSON.parse(localStorage.getItem("parentInfo") || "{}");
      const parentID = parentInfo.parentID;
      
      if (!parentID) {
        throw new Error("Parent ID not found. Please log in again.");
      }
      
      const passwordData = {
        parentID: parentID,
        newPassword: formData.newPassword,
        confirmNewPassword: formData.confirmNewPassword
      };
      
      console.log("Password change data prepared:", { 
        parentID, 
        passwordLength: formData.newPassword?.length 
      });

      // Password validation
      if (formData.newPassword !== formData.confirmNewPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }

      const passwordError = validatePassword(formData.newPassword);
      if (passwordError) {
        setError(passwordError);
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token is missing. Please log in again.");
      }

      const response = await axios.put(
        `${API_URL}/api/parent/auth/changeparentpassword`,
        passwordData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setSuccess("Password changed successfully!");
      toast.success("Password changed successfully!");
      
      // Reset the form
      setFormData({
        parentID: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      
      // Close the modal after a short delay
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      const errorMessage = 
        err.response?.data?.message || 
        err.message || 
        "Failed to change password";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Error changing password:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Change Password</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Form onSubmit={handleFormSubmit}>
          <Form.Group className="mb-3" controlId="newPassword">
            <Form.Label>New Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter new password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              required
            />
            <Form.Text className="text-muted">
              Password must be at least 8 characters long, contain at least one
              number and one special character.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3" controlId="confirmNewPassword">
            <Form.Label>Confirm New Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Confirm new password"
              name="confirmNewPassword"
              value={formData.confirmNewPassword}
              onChange={handleInputChange}
              required
            />
          </Form.Group>

          <div className="d-flex justify-content-end">
            <Button variant="secondary" onClick={handleClose} className="me-2">
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? <Spinner size="sm" animation="border" /> : "Change Password"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default ChangeParentPassword; 