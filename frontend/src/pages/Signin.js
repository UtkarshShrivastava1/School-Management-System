import { useState } from "react";
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
import { useAuth } from "../context/useAuth"; // ✅ Only context
import "./Signin.css";

const Signin = () => {
  const [loggingUser, setLoggingUser] = useState("Admin");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth(); // ✅ from context

  const roleNames = {
    admin: "Admin",
    teacher: "Teacher",
    student: "Student",
    parent: "Parent",
  };

  const rolePrefixes = {
    admin: "ADM",
    teacher: "TCHR",
    student: "STU",
    parent: "PRNT",
  };

  const handleRoleChange = (e) => {
    const selectedRole = e.target.value;
    setRole(selectedRole);
    setLoggingUser(roleNames[selectedRole] || "Admin");
    setUserId("");
  };

  const validateUserId = (id) => {
    const prefix = rolePrefixes[role];
    const regex = new RegExp(
      `^${prefix}\\d{${role === "student" || role === "parent" ? 5 : 4}}$`
    );
    return regex.test(id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!validateUserId(userId)) {
      setError(`Invalid ${loggingUser} ID format.`);
      setLoading(false);
      return;
    }

    try {
      // ✅ Call context login
      await login(role, userId, password);

      toast.success("Login successful!", {
        position: "top-center",
        autoClose: 5000,
        theme: "colored",
      });

      // ✅ Navigate to role dashboard
      navigate(`/${role}/${role}-dashboard`);
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please try again."
      );
      toast.error("Failed to Login.", {
        position: "top-center",
        autoClose: 5000,
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
                placeholder={`Enter ${loggingUser} ID (e.g., ${rolePrefixes[role]}1234)`}
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
                  onClick={() => setShowPassword(!showPassword)}
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
