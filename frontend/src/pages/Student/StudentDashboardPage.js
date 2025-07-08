import "bootstrap/dist/css/bootstrap.min.css";
import React, { useState } from "react";
import { Card, Col, Nav, Row } from "react-bootstrap";
import {
    FaBars,
    FaBook,
    FaCalendarAlt,
    FaChalkboardTeacher,
    FaChartLine,
    FaClipboardList,
    FaMoneyBill,
    FaRegBell,
    FaUserAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../../Styles/Dashboard.css";
import "./StudentDashboardPage.css";
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
    title: "My Academics",
    description: "Access and manage academic-related information.",
    cards: [
      {
        icon: <FaChalkboardTeacher size={50} />,
        title: "My Class",
        page: "my-class",
      },
      {
        icon: <FaClipboardList size={50} />,
        title: "My Results",
        page: "my-results",
      },
      {
        icon: <FaChartLine size={50} />,
        title: "My Performance",
        page: "my-performance",
      },
    ],
  },
  {
    title: "My Schedule",
    description: "View and manage your schedule.",
    cards: [
      {
        icon: <FaCalendarAlt size={50} />,
        title: "My Time Table",
        page: "my-timetable",
      },
      { icon: <FaBook size={50} />, title: "My Syllabus", page: "my-syllabus" },
    ],
  },
  {
    title: "Financial",
    description: "View your fee status.",
    cards: [
      {
        icon: <FaMoneyBill size={50} />,
        title: "My Fee Status",
        page: "my-fee-status",
      },
    ],
  },
  {
    title: "Notifications",
    description: "Stay updated with notices.",
    cards: [
      {
        icon: <FaRegBell size={50} />,
        title: "Notice Board",
        page: "notice-board",
      },
    ],
  },
];

const StudentDashboardPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("My Profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleCardClick = (page) => {
    navigate(`/student/${page}`);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };
  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };
  return (
    <div className="student-dashboard">
      {/* Dashboard Title */}

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
        <h2 className="dashboard-title">Student Dashboard</h2>
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

export default StudentDashboardPage;
