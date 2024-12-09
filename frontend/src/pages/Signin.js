import { useNavigate } from "react-router-dom";
import { Card, Container, Row, Col } from "react-bootstrap";
import {
  FaUserShield,
  FaChalkboardTeacher,
  FaUsers,
  FaUserGraduate,
} from "react-icons/fa"; // Importing icons for each role
import "./Signin.css"; // Custom styles for the Signin page

const Signin = () => {
  const navigate = useNavigate(); // Hook for programmatic navigation

  // Function to navigate to the respective login page based on role
  const handleRoleClick = (role) => {
    navigate(`/${role}-login`); // Dynamically navigates to the respective login page
  };

  return (
    <Container className="signin-container">
      {/* Page Heading */}
      <h2 className="text-center mb-5">Select Your Role to Login as</h2>

      {/* Row for displaying login role options */}
      <Row className="justify-content-center">
        {/* Admin Login Card */}
        <Col xs={12} sm={6} md={3}>
          <Card onClick={() => handleRoleClick("admin")} className="role-card">
            <Card.Body className="text-center">
              <FaUserShield size={50} className="role-icon mb-3" /> {/* Icon */}
              <h5>Admin</h5>
            </Card.Body>
          </Card>
        </Col>

        {/* Teacher Login Card */}
        <Col xs={12} sm={6} md={3}>
          <Card
            onClick={() => handleRoleClick("teacher")}
            className="role-card"
          >
            <Card.Body className="text-center">
              <FaChalkboardTeacher size={50} className="role-icon mb-3" />{" "}
              {/* Icon */}
              <h5>Teacher</h5>
            </Card.Body>
          </Card>
        </Col>

        {/* Parent Login Card */}
        <Col xs={12} sm={6} md={3}>
          <Card onClick={() => handleRoleClick("parent")} className="role-card">
            <Card.Body className="text-center">
              <FaUsers size={50} className="role-icon mb-3" /> {/* Icon */}
              <h5>Parent</h5>
            </Card.Body>
          </Card>
        </Col>

        {/* Student Login Card */}
        <Col xs={12} sm={6} md={3}>
          <Card
            onClick={() => handleRoleClick("student")}
            className="role-card"
          >
            <Card.Body className="text-center">
              <FaUserGraduate size={50} className="role-icon mb-3" />{" "}
              {/* Icon */}
              <h5>Student</h5>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Signin;
