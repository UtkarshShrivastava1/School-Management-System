import React, { useState } from "react";
import { Form, Button, Card, Container, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminLogin.css"; // Ensure this file exists for styling

const AdminLogin = ({ setIsLoggedIn, setUserRole }) => {
  // State variables to manage form inputs, loading state, and error messages
  const [adminID, setAdminID] = useState(""); // Admin ID input state
  const [password, setPassword] = useState(""); // Password input state
  const [loading, setLoading] = useState(false); // Loading indicator state
  const [error, setError] = useState(""); // Error message state

  const navigate = useNavigate(); // Hook to programmatically navigate between routes

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    setLoading(true); // Set loading state to true to indicate process is ongoing
    setError(""); // Reset error message before submission

    console.log("Submitting login form..."); // Log form submission
    console.log("AdminID:", adminID); // Log AdminID entered by the user
    console.log("Password:", password); // Log Password entered by the user

    try {
      // Send login request to the backend API
      const response = await axios.post(
        "http://localhost:5000/api/admin/auth/login", // Backend login endpoint
        {
          adminID, // Payload: AdminID
          password, // Payload: Password
        }
      );

      console.log("Login successful. Response data:", response.data); // Log success response

      // Store the JWT token in localStorage for authentication purposes
      localStorage.setItem("token", response.data.token);
      console.log("Token saved to localStorage:", response.data.token); // Log token storage

      // Save admin data (excluding sensitive info) to localStorage
      const adminData = response.data.data; // Extract admin data from the response
      localStorage.setItem("adminInfo", JSON.stringify(adminData));
      console.log("Admin data saved to localStorage:", adminData); // Log admin data storage

      // Update application state for logged-in status and user role
      setIsLoggedIn(true); // Update state to reflect logged-in status
      setUserRole(adminData.role); // Update state with the admin's role

      console.log("Navigating to admin dashboard..."); // Log navigation action
      navigate("/admin-dashboard"); // Redirect user to admin dashboard
    } catch (err) {
      console.error("Login failed. Error:", err); // Log the error

      // Extract error message from the backend or show a generic message
      setError(err.response?.data?.message || "An error occurred during login");
      console.log("Error message displayed to user:", error); // Log the error message shown to user
    } finally {
      setLoading(false); // Reset loading state regardless of success or failure
      console.log("Login request process completed."); // Log the end of the process
    }
  };

  return (
    <Container className="login-container">
      {" "}
      {/* Main container for the login form */}
      <Card className="login-card">
        {" "}
        {/* Card for styling the login form */}
        <Card.Body>
          <h3>Admin Login</h3> {/* Login header */}
          {/* Display error message if it exists */}
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            {" "}
            {/* Login form */}
            <Form.Group controlId="formAdminID">
              <Form.Label>Admin ID</Form.Label> {/* Label for Admin ID */}
              <Form.Control
                type="text"
                placeholder="Enter Admin ID"
                value={adminID}
                onChange={(e) => setAdminID(e.target.value)} // Update adminID state on change
                required // Make this field mandatory
              />
            </Form.Group>
            <Form.Group controlId="formPassword" className="mt-3">
              <Form.Label>Password</Form.Label> {/* Label for Password */}
              <Form.Control
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)} // Update password state on change
                required // Make this field mandatory
              />
            </Form.Group>
            <Button type="submit" disabled={loading} className="w-100 mt-3">
              {loading ? "Logging in..." : "Login"}{" "}
              {/* Show loading text if processing */}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminLogin;
