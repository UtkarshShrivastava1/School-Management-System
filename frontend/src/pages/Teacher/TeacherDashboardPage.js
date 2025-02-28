import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUserAlt,
  FaChalkboardTeacher,
  FaRegCalendarAlt,
  FaBell,
  FaDollarSign,
  FaClipboardList,
  FaBars,
} from "react-icons/fa";
import { Row, Col, Card, Nav } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./TeacherDashboardPage.css";
import "../../Styles/Dashboard.css";
const dashboardSections = [
  {
    title: "My Profile",
    description: "Manage your profile and personal details.",
    cards: [
      {
        icon: <FaUserAlt size={50} />,
        title: "Profile Management",
        page: "profile",
      },
    ],
  },
  {
    title: "Class & Subjects",
    description: "View your classes and the subjects you're teaching.",
    cards: [
      {
        icon: <FaChalkboardTeacher size={50} />,
        title: "My Class",
        page: "my-class",
      },
      {
        icon: <FaRegCalendarAlt size={50} />,
        title: "My Subjects",
        page: "my-subjects",
      },
    ],
  },
  {
    title: "Class Attendance Management",
    description: "take attendance of the selected class.",
    cards: [
      {
        icon: <FaClipboardList size={50} />,
        title: "Take Class Attendance",
        page: "take-class-attendance",
      },
    ],
  },
  {
    title: "Notifications",
    description: "Stay updated with important notifications from the admin.",
    cards: [
      {
        icon: <FaBell size={50} />,
        title: "Get Notification from Admin",
        page: "notifications",
      },
    ],
  },
  {
    title: "Salary Management",
    description: "View and manage your salary status.",
    cards: [
      {
        icon: <FaDollarSign size={50} />,
        title: "View Salary Status",
        page: "salary-status",
      },
    ],
  },
];

const TeacherDashboardPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("My Profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleCardClick = (page) => {
    navigate(`/teacher/${page}`);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };
  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };
  return (
    <div className="teacher-dashboard">
      {/* Mobile Hamburger Button */}
      <div className="mobile-hamburger" onClick={toggleSidebar}>
        <FaBars size={24} color="#1b2838" />
      </div>
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <Nav className="flex-column">
          {dashboardSections.map((section, index) => (
            <Nav.Item key={index}>
              <Nav.Link
                href="#"
                active={activeTab === section.title}
                onClick={() => handleTabClick(section.title)}
                className="sidebar-link"
              >
                {section.title}
              </Nav.Link>
            </Nav.Item>
          ))}
        </Nav>
      </div>
      {/* Main Content */}
      <div className="main-content">
        <h2 className="dashboard-title">Teacher Dashboard</h2>
        {dashboardSections
          .filter((section) => section.title === activeTab)
          .map((section, index) => (
            <div key={index} className="category-section">
              <h3 className="category-title">{section.title}</h3>
              <p className="category-description">{section.description}</p>
              <Row className="justify-content-center">
                {section.cards.map((card, cardIndex) => (
                  <Col key={cardIndex} xs={12} sm={6} md={3}>
                    <Card
                      className="dashboard-card shadow-sm"
                      onClick={() => handleCardClick(card.page)}
                    >
                      <Card.Body className="text-center">
                        <div className="card-icon mb-3">{card.icon}</div>
                        <h5 className="card-title">{card.title}</h5>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          ))}
      </div>
    </div>
  );
};

export default TeacherDashboardPage;
