import React, { useState } from "react";
import {
  FaUserAlt,
  FaChartLine,
  FaClipboardList,
  FaRegBell,
  FaMoneyBill,
  FaFileAlt,
  FaCalendarAlt,
  FaClock,
  FaBars,
} from "react-icons/fa";
import { Row, Col, Card, Nav } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./ParentDashboardPage.css";
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
    title: "Child Management",
    description: "View and manage your child's profile and performance.",
    cards: [
      {
        icon: <FaUserAlt size={50} />,
        title: "My Child's Profile",
        page: "child-profile",
      },
      {
        icon: <FaChartLine size={50} />,
        title: "My Child's Performance",
        page: "child-performance",
      },
      {
        icon: <FaFileAlt size={50} />,
        title: "Result",
        page: "result",
      },
    ],
  },
  {
    title: "Academic Information",
    description: "Stay updated with academic schedules and events.",
    cards: [
      {
        icon: <FaCalendarAlt size={50} />,
        title: "Academic Calendar",
        page: "academic-calendar",
      },
      {
        icon: <FaClock size={50} />,
        title: "Timetable",
        page: "timetable",
      },
      {
        icon: <FaClipboardList size={50} />,
        title: "Exam Schedule",
        page: "exam-schedule",
      },
    ],
  },
  {
    title: "Financial",
    description: "Manage fees and payments.",
    cards: [
      {
        icon: <FaMoneyBill size={50} />,
        title: "Pay Fee",
        page: "pay-fee",
      },
    ],
  },
  {
    title: "Notifications",
    description: "Stay updated with important updates.",
    cards: [
      {
        icon: <FaRegBell size={50} />,
        title: "Notifications",
        page: "notifications",
      },
    ],
  },
];

const ParentDashboardPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("My Profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleCardClick = (page) => {
    navigate(`/parent/${page}`);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };
  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };
  return (
    <div className="parent-dashboard">
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
        <h2 className="dashboard-title">Parent Dashboard</h2>
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

export default ParentDashboardPage;
