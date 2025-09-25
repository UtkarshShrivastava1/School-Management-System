import React, { useState, useEffect } from "react";
import {
  FaChalkboardTeacher,
  FaUserGraduate,
  FaBook,
  FaCalendarAlt,
  FaChartLine,
  FaClipboardList,
  FaMoneyBillWave,
  FaUsers,
  FaArrowLeft,
  FaGraduationCap,
  FaSchool,
  FaUserTie,
  FaChartBar,
  FaClock,
  FaCheckCircle,
  FaSearch,
  FaFilter,
  FaBell,
} from "react-icons/fa";
import { Row, Col, Card, ProgressBar, InputGroup, Form, Button, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./AcademicManagement.css";

const API_URL = process.env.REACT_APP_API_URL;

// Create a logger utility
const logger = {
  debug: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(...args);
    }
  },
  error: (...args) => {
    console.error(...args);
  }
};

const academicManagementSections = [
  {
    title: "Class Management",
    description: "Manage and organize academic classes and schedules",
    icon: <FaSchool size={30} />,
    color: "#4b6cb7",
    cards: [
      {
        icon: <FaBook size={50} />,
        title: "Manage Classes",
        description: "Create and manage class schedules",
        page: "class-management",
        stats: {
          total: 12,
          active: 10,
          percentage: 83
        },
        notifications: 2
      },
      {
        icon: <FaCalendarAlt size={50} />,
        title: "Academic Calendar",
        description: "View and manage academic events",
        page: "academic-calendar",
        stats: {
          total: 8,
          upcoming: 3,
          percentage: 37
        },
        notifications: 1
      },
      {
        icon: <FaChartLine size={50} />,
        title: "Performance Analytics",
        description: "Track class performance metrics",
        page: "performance-analytics",
        stats: {
          total: 100,
          completed: 75,
          percentage: 75
        }
      },
    ],
  },
  {
    title: "Student Management",
    description: "Manage student records and academic progress",
    icon: <FaGraduationCap size={30} />,
    color: "#2ecc71",
    cards: [
      {
        icon: <FaUserGraduate size={50} />,
        title: "Student Profiles",
        description: "View and manage student information",
        page: "student-management",
        stats: {
          total: 500,
          active: 480,
          percentage: 96
        },
        notifications: 5
      },
      {
        icon: <FaClipboardList size={50} />,
        title: "Track Attendance",
        description: "Monitor student attendance records",
        page: "track-student-attendance",
        stats: {
          total: 100,
          present: 85,
          percentage: 85
        },
        notifications: 3
      },
      {
        icon: <FaMoneyBillWave size={50} />,
        title: "Manage Fees",
        description: "Handle student fee payments",
        page: "manage-class-fees",
        stats: {
          total: 100,
          paid: 70,
          percentage: 70
        },
        notifications: 4
      },
    ],
  },
  {
    title: "Teacher Management",
    description: "Manage teacher assignments and schedules",
    icon: <FaUserTie size={30} />,
    color: "#e74c3c",
    cards: [
      {
        icon: <FaChalkboardTeacher size={50} />,
        title: "Teacher Profiles",
        description: "View and manage teacher information",
        page: "teacher-management",
        stats: {
          total: 50,
          active: 45,
          percentage: 90
        },
        notifications: 2
      },
      {
        icon: <FaUsers size={50} />,
        title: "Assign Teachers",
        description: "Assign teachers to classes",
        page: "assign-teacher-classes",
        stats: {
          total: 30,
          assigned: 25,
          percentage: 83
        },
        notifications: 1
      },
      {
        icon: <FaClipboardList size={50} />,
        title: "Teacher Attendance",
        description: "Track teacher attendance",
        page: "teacher-attendance",
        stats: {
          total: 100,
          present: 95,
          percentage: 95
        }
      },
    ],
  },
];

const AcademicManagement = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Simulated notifications - replace with actual API call
    const mockNotifications = [
      { id: 1, message: "New class schedule needs approval", type: "class" },
      { id: 2, message: "5 students have pending fee payments", type: "student" },
      { id: 3, message: "Teacher attendance report due", type: "teacher" },
    ];
    setNotifications(mockNotifications);
  }, []);

  const handleCardClick = (page) => {
    navigate(`/admin/${page}`);
  };

  const handleBack = () => {
    navigate("/admin/admin-dashboard");
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSectionFilter = (section) => {
    setSelectedSection(selectedSection === section ? null : section);
  };

  const filteredSections = academicManagementSections.filter(section => {
    if (!selectedSection) return true;
    return section.title === selectedSection;
  });

  const filteredCards = filteredSections.map(section => ({
    ...section,
    cards: section.cards.filter(card =>
      card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(section => section.cards.length > 0);

  return (
    <div className="academic-management">
      <div className="header-section">
        <div className="header-left">
          <button className="back-button" onClick={handleBack}>
            <FaArrowLeft /> Back
          </button>
          <h1 className="page-title">Academic Management</h1>
        </div>
        <div className="header-right">
          <div className="notifications-bell">
            <FaBell size={20} />
            {notifications.length > 0 && (
              <Badge bg="danger" className="notification-badge">
                {notifications.length}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="search-filter-section">
        <Row>
          <Col md={6}>
            <InputGroup className="search-input">
              <InputGroup.Text>
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search features..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </InputGroup>
          </Col>
          <Col md={6}>
            <div className="filter-buttons">
              {academicManagementSections.map((section, index) => (
                <Button
                  key={index}
                  variant={selectedSection === section.title ? "primary" : "outline-primary"}
                  onClick={() => handleSectionFilter(section.title)}
                  className="filter-button"
                >
                  {section.icon} {section.title}
                </Button>
              ))}
            </div>
          </Col>
        </Row>
      </div>

      <div className="overview-section">
        <Row>
          <Col md={4}>
            <Card className="overview-card">
              <Card.Body>
                <div className="overview-icon class">
                  <FaSchool />
                </div>
                <h3>Total Classes</h3>
                <p className="overview-number">12</p>
                <div className="overview-progress">
                  <ProgressBar now={85} label={`85%`} />
                </div>
                <div className="overview-footer">
                  <span className="trend positive">↑ 5% from last month</span>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="overview-card">
              <Card.Body>
                <div className="overview-icon student">
                  <FaUserGraduate />
                </div>
                <h3>Total Students</h3>
                <p className="overview-number">500</p>
                <div className="overview-progress">
                  <ProgressBar now={90} label={`90%`} />
                </div>
                <div className="overview-footer">
                  <span className="trend positive">↑ 8% from last month</span>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="overview-card">
              <Card.Body>
                <div className="overview-icon teacher">
                  <FaChalkboardTeacher />
                </div>
                <h3>Total Teachers</h3>
                <p className="overview-number">50</p>
                <div className="overview-progress">
                  <ProgressBar now={95} label={`95%`} />
                </div>
                <div className="overview-footer">
                  <span className="trend positive">↑ 3% from last month</span>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>

      {filteredCards.map((section, index) => (
        <div key={index} className="section-container">
          <div className="section-header">
            <div className="section-title">
              <div className="section-icon" style={{ color: section.color }}>
                {section.icon}
              </div>
              <div>
                <h2>{section.title}</h2>
                <p className="section-description">{section.description}</p>
              </div>
            </div>
          </div>
          <Row className="justify-content-center">
            {section.cards.map((card, cardIndex) => (
              <Col key={cardIndex} xs={12} sm={6} md={4}>
                <Card
                  className="feature-card"
                  onClick={() => handleCardClick(card.page)}
                >
                  <Card.Body>
                    <div className="card-header">
                      <div className="card-icon" style={{ color: section.color }}>
                        {card.icon}
                      </div>
                      {card.notifications && (
                        <Badge bg="danger" className="card-notification">
                          {card.notifications}
                        </Badge>
                      )}
                    </div>
                    <h5 className="card-title">{card.title}</h5>
                    <p className="card-description">{card.description}</p>
                    <div className="card-stats">
                      <div className="stat-item">
                        <FaCheckCircle />
                        <span>{card.stats.active || card.stats.present} Active</span>
                      </div>
                      <div className="stat-item">
                        <FaClock />
                        <span>{card.stats.total} Total</span>
                      </div>
                    </div>
                    <div className="progress-container">
                      <ProgressBar 
                        now={card.stats.percentage} 
                        label={`${card.stats.percentage}%`}
                        style={{ backgroundColor: `${section.color}20` }}
                      />
                    </div>
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

export default AcademicManagement; 