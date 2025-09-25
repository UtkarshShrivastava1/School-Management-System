// src/pages/Signin.js
import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Container,
  Form,
  InputGroup,
} from "react-bootstrap";
import {
  FaChalkboardTeacher,
  FaEye,
  FaEyeSlash,
  FaUserGraduate,
  FaUsers,
  FaUserShield,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import api from "../services/api";
import "./Signin.css";

const Signin = ({ setIsLoggedIn, setUserRole }) => {
  const [role, setRole] = useState("admin");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const roleNames = useMemo(
    () => ({
      admin: "Admin",
      teacher: "Teacher",
      student: "Student",
      parent: "Parent",
    }),
    []
  );

  // Keep prefixes aligned with backend ID format
  const rolePrefixes = useMemo(
    () => ({
      admin: "ADM", // ADM1234
      teacher: "TCHR", // TCHR1234
      student: "STU", // STU12345 (adjust if needed)
      parent: "PRNT", // PRNT12345 (adjust if needed)
    }),
    []
  );

  const loggingUser = roleNames[role] || "Admin";

  const validateUserId = (id) => {
    const prefix = rolePrefixes[role];
    const digits = role === "student" || role === "parent" ? 5 : 4;
    const regex = new RegExp(`^${prefix}\\d{${digits}}$`);
    return regex.test(id);
  };

  const handleRoleChange = (e) => {
    setRole(e.target.value);
    setUserId("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!validateUserId(userId)) {
      setLoading(false);
      return setError(`Invalid ${loggingUser} ID format.`);
    }

    try {
      const endpoints = {
        admin: "/api/admin/auth/login",
        teacher: "/api/teacher/auth/login",
        student: "/api/student/auth/login",
        parent: "/api/parent/auth/login",
      };

      const loginEndpoint = endpoints[role];
      const idField = `${role}ID`; // adminID, teacherID, studentID, parentID

      // api.post returns the payload object directly (unwrapped)
      const resp = await api.post(loginEndpoint, {
        [idField]: userId,
        password,
      });

      // Expected payload: { message, token, role, data }
      const token = resp?.token;
      if (!token) throw new Error("No token received from server");

      // Persist token (axios header + localStorage)
      api.setToken(token);
      localStorage.setItem("token", token);
      localStorage.setItem("userRole", role);

      // Prefer `resp.data` (backend sends user in `data`)
      const userInfo = resp?.data || resp?.[role] || {};
      localStorage.setItem(`${role}Info`, JSON.stringify(userInfo));

      // App state
      setIsLoggedIn(true);
      setUserRole(role);

      toast.success("Login successful!", {
        position: "top-center",
        theme: "colored",
      });

      // Navigate to role dashboard
      navigate(`/${role}/${role}-dashboard`);
    } catch (err) {
      const msg =
        err?.message ||
        err?.data?.message ||
        err?.raw?.response?.data?.message ||
        "Login failed. Please try again.";
      setError(msg);
      toast.error(msg, {
        position: "top-center",
        theme: "colored",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="login-container">
      <Card className="login-card">
        <Card.Body>
          <h3 className="text-center">Login</h3>
          {error && <Alert variant="danger">{error}</Alert>}

          <div className="role-icon-container text-center">
            {role === "admin" && <FaUserShield size={60} />}
            {role === "teacher" && <FaChalkboardTeacher size={60} />}
            {role === "parent" && <FaUsers size={60} />}
            {role === "student" && <FaUserGraduate size={60} />}
          </div>

          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="formRole" className="mt-3">
              <Form.Label>Role</Form.Label>
              <Form.Select required value={role} onChange={handleRoleChange}>
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
                <option value="student">Student</option>
              </Form.Select>
            </Form.Group>

            <Form.Group controlId="formUserId" className="mt-3">
              <Form.Label>{loggingUser} ID</Form.Label>
              <Form.Control
                type="text"
                placeholder={`Enter ${loggingUser} ID (e.g., ${
                  rolePrefixes[role]
                }${
                  role === "student" || role === "parent" ? "12345" : "1234"
                })`}
                value={userId}
                onChange={(e) => setUserId(e.target.value.toUpperCase())}
                required
              />
            </Form.Group>

            <Form.Group controlId="formPassword" className="mt-3">
              <Form.Label>Password</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </InputGroup>
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

export default Signin;
