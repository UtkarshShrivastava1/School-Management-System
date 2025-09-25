import "bootstrap/dist/css/bootstrap.min.css";
import React, { useState } from "react";
import { Card, Col, Nav, Row } from "react-bootstrap";
import {
    FaBars,
    FaBell,
    FaChalkboardTeacher,
    FaMoneyCheckAlt,
    FaRegCalendarAlt,
    FaUserAlt,
    FaUserGraduate,
    FaUsersCog,
    FaUserShield,
} from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import "../../Styles/Dashboard.css";
import "./AdminDashboardPage.css";
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
    subTabs: [
      {
        title: "Class Management",
        description: "Manage and organize classes.",
        cards: [
          {
            icon: <FaRegCalendarAlt size={50} />,
            title: "Class Management",
            page: "class-management",
          },
        ],
      },
      {
        title: "Teacher Management",
        description: "Assign teachers and manage their details.",
        cards: [
          {
            icon: <FaUsersCog size={50} />,
            title: "Teacher Management",
            page: "teacher-management",
          },
        ],
      },
      {
        title: "Student Management",
        description: "Manage student records and details.",
        cards: [
          {
            icon: <FaUserGraduate size={50} />,
            title: "Student Management",
            page: "student-management",
          },
          {
            icon: <FaMoneyCheckAlt size={50} />,
            title: "Manage Fee Approvals",
            page: "manage-fee-approvals",
          },
        ],
      },
    ],
  },
  {
    title: "Notification Management",
    description: "Send and manage important notifications.",
    cards: [
      {
        icon: <FaBell size={50} />,
        title: "Create Notification",
        page: "notifications",
      },
    ],
  },
];

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialActiveTab = location.state?.activeTab || "My Profile";
  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const [activeSubTab, setActiveSubTab] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleCardClick = (page) => navigate(`/admin/${page}`);
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setActiveSubTab(null);
  };
  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className="admin-dashboard">
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
        <h2 className="dashboard-title">Admin Dashboard</h2>

        {dashboardSections
          .filter((section) => section.title === activeTab)
          .map((section, index) => (
            <div key={index} className="category-section">
              <h3 className="category-title">{section.title}</h3>
              <p className="category-description">{section.description}</p>

              {/* Show Sub-Tabs for Academic Management */}
              {section.subTabs && (
                <Nav
                  variant="tabs"
                  activeKey={activeSubTab}
                  className="sub-tabs"
                >
                  {section.subTabs.map((subTab, subIndex) => (
                    <Nav.Item key={subIndex}>
                      <Nav.Link
                        eventKey={subTab.title}
                        onClick={() => setActiveSubTab(subTab.title)}
                        className="sub-tab-link"
                      >
                        {subTab.title}
                      </Nav.Link>
                    </Nav.Item>
                  ))}
                </Nav>
              )}

              {/* Show Cards for Active Sub-Tab */}
              {section.subTabs && activeSubTab
                ? section.subTabs
                    .filter((subTab) => subTab.title === activeSubTab)
                    .map((subTab, subIndex) => (
                      <div key={subIndex}>
                        <h4 className="category-title">{subTab.title}</h4>
                        <p className="category-description">
                          {subTab.description}
                        </p>
                        <Row className="justify-content-center">
                          {subTab.cards.map((card, cardIndex) => (
                            <Col key={cardIndex} xs={12} sm={6} md={3}>
                              <Card
                                className="dashboard-card shadow-sm"
                                onClick={() => handleCardClick(card.page)}
                                style={{
                                  cursor: "pointer",
                                  transition: "transform 0.2s",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.transform = "scale(1.05)")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.transform = "scale(1)")
                                }
                              >
                                <Card.Body className="text-center">
                                  <div className="card-icon mb-3">
                                    {card.icon}
                                  </div>
                                  <h5 className="card-title">{card.title}</h5>
                                </Card.Body>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      </div>
                    ))
                : // Show cards for non-sub-tab sections
                  !section.subTabs && (
                    <Row className="justify-content-center">
                      {section.cards.map((card, cardIndex) => (
                        <Col key={cardIndex} xs={12} sm={6} md={3}>
                          <Card
                            className="dashboard-card shadow-sm"
                            onClick={() => handleCardClick(card.page)}
                            style={{
                              cursor: "pointer",
                              transition: "transform 0.2s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.transform = "scale(1.05)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.transform = "scale(1)")
                            }
                          >
                            <Card.Body className="text-center">
                              <div className="card-icon mb-3">{card.icon}</div>
                              <h5 className="card-title">{card.title}</h5>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
