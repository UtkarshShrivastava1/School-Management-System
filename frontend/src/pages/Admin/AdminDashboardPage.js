import React from "react";
import {
  FaUserShield,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaUsersCog,
  FaRegCalendarAlt,
  FaCalendarCheck,
  FaBell,
  FaMoneyBillWave,
  FaUserAlt, // Icon for Profile
} from "react-icons/fa";
import { Row, Col, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./AdminDashboardPage.css";

// Dashboard sections and cards
const dashboardSections = [
  {
    title: "User Registration",
    description: "Manage registrations for admins, teachers, and students.",
    cards: [
      {
        icon: <FaUserShield size={50} />,
        title: "Admin Register",
        page: "register-admin",
      },
      {
        icon: <FaChalkboardTeacher size={50} />,
        title: "Teacher Register",
        page: "register-teacher",
      },
      {
        icon: <FaUserGraduate size={50} />,
        title: "Student Register",
        page: "register-student",
      },
    ],
  },
  {
    title: "Academic Management",
    description: "Manage classes, teacher assignments, and student details.",
    cards: [
      {
        icon: <FaRegCalendarAlt size={50} />,
        title: "Class Management",
        page: "class-management",
      },
      {
        icon: <FaUsersCog size={50} />,
        title: "Teacher Management",
        page: "teacher-management",
      },
      {
        icon: <FaUserGraduate size={50} />,
        title: "Student Management",
        page: "student-management",
      },
    ],
  },
  {
    title: "Attendance Management",
    description: "Track attendance for students and teachers.",
    cards: [
      {
        icon: <FaCalendarCheck size={50} />,
        title: "Attendance Management",
        page: "attendance-management",
      },
    ],
  },
  {
    title: "Salary Management",
    description: "Manage teacher and staff salaries efficiently.",
    cards: [
      {
        icon: <FaMoneyBillWave size={50} />,
        title: "Salary Management",
        page: "salary-management",
      },
    ],
  },
  {
    title: "Notifications",
    description:
      "Send and manage important notifications to staff and students.",
    cards: [
      {
        icon: <FaBell size={50} />,
        title: "Notifications",
        page: "notifications",
      },
    ],
  },
];

const AdminDashboard = () => {
  const navigate = useNavigate();

  const handleCardClick = (page) => {
    navigate(`/admin/${page}`);
  };

  const handleProfileClick = () => {
    navigate("/admin/profile"); // Navigate to the admin profile page
  };

  return (
    <div className="admin-dashboard">
      <h2 className="text-center mb-5 font-weight-bold text-primary">
        Admin Dashboard
      </h2>

      <Row className="justify-content-center mb-4">
        {/* Profile Management Card */}
        <Col xs={12} sm={6} md={3}>
          <Card
            className="role-card shadow-lg rounded border-0"
            onClick={handleProfileClick}
            style={{ cursor: "pointer" }}
          >
            <Card.Body className="text-center py-4">
              <div className="role-icon mb-3">
                <FaUserAlt size={50} />
              </div>
              <h5 className="mb-3">Profile Management</h5>
              <Button variant="primary" className="mt-2">
                Go to Profile
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {dashboardSections.map((section, index) => (
        <div key={index} className="category-section mb-5">
          <h3 className="category-title text-info">{section.title}</h3>
          <p className="category-description text-muted mb-4">
            {section.description}
          </p>
          <Row className="justify-content-center">
            {section.cards.map((card, cardIndex) => (
              <Col key={cardIndex} xs={12} sm={6} md={3}>
                <Card
                  onClick={() => handleCardClick(card.page)}
                  className="role-card shadow-lg rounded border-0 mb-4"
                  style={{ cursor: "pointer" }}
                >
                  <Card.Body className="text-center py-4">
                    <div className="role-icon mb-3">{card.icon}</div>
                    <h5>{card.title}</h5>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ))}
    </div>
  );
};

export default AdminDashboard;
