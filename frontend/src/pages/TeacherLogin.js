//pages/TeacherLogin.js
import React, { useState } from "react";
import { Form, Button, Card, Container, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "./TeacherLogin.css"; // Import a separate CSS file for TeacherLogin (optional)

const TeacherLogin = () => {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Replace with your authentication logic
    if (id === "teacher" && password === "teacherpass") {
      navigate("/teacher-dashboard");
    } else {
      setError("Invalid credentials");
    }
    setLoading(false);
  };

  return (
    <Container className="login-container">
      <Card className="login-card">
        <Card.Body>
          <h3>Teacher Login</h3>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="formId">
              <Form.Label>Teacher ID</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter Teacher ID"
                value={id}
                onChange={(e) => setId(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group controlId="formPassword" className="mt-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>
            <Button type="submit" disabled={loading} className="w-100 mt-3">
              {loading ? "Logging in..." : "Login"}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TeacherLogin;