import axios from "axios";
import axiosInstance from '../utils/axiosConfig';
import { useState } from "react";
import { Alert, Button, Card, Container, Form, InputGroup } from "react-bootstrap";
import { FaChalkboardTeacher, FaEye, FaEyeSlash, FaUserGraduate, FaUsers, FaUserShield } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Signin.css";
const Signin = ({ setIsLoggedIn, setUserRole }) => {
  const [loggingUser, setLoggingUser] = useState("Admin");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const API_URL =
    process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL
      : process.env.REACT_APP_DEVELOPMENT_URL;

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
      const roleEndpoints = {
        admin: "/api/admin/auth/login",
        teacher: "/api/teacher/auth/login",
        student: "/api/student/auth/login",
        parent: "/api/parent/auth/login",
      };

      const loginEndpoint = roleEndpoints[role];
      console.log('Attempting login with:', {
        url: loginEndpoint,
        data: { [`${role}ID`]: userId }
      });

      // First test if server is reachable
      try {
        const testResponse = await axiosInstance.get('/api/test');
        console.log('Server test response:', testResponse.data);
      } catch (testError) {
        console.error('Server test failed:', testError);
        throw new Error('Server is not reachable. Please check if the backend is running.');
      }

      const response = await axiosInstance.post(loginEndpoint, {
        [`${role}ID`]: userId,
        password,
      });

      console.log('Login response:', response.data);

      // Store token and role
      const token = response.data.token;
      if (!token) {
        throw new Error("No token received from server");
      }

      // Store authentication data
      localStorage.setItem("token", token);
      localStorage.setItem("userRole", role);
      
      // Store user info
      const userInfo = response.data[role] || response.data.data;
      if (userInfo) {
        const enhancedUserInfo = {
          ...userInfo,
          [`${role}ID`]: userId
        };
        
        console.log(`Storing ${role} info:`, enhancedUserInfo);
        localStorage.setItem(`${role}Info`, JSON.stringify(enhancedUserInfo));
      }

      // Update app state
      setIsLoggedIn(true);
      setUserRole(role);

      toast.success("Login successful!", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });

      // Navigate to appropriate dashboard
      navigate(`/${role}/${role}-dashboard`);
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message || err.message || "Login failed. Please try again."
      );
      toast.error("Failed to Login.", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
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
