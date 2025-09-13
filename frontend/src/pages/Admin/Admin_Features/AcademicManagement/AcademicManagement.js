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
  FaClock,
  FaCheckCircle,
  FaSearch,
  FaBell,
} from "react-icons/fa";
import { Row, Col, Card, ProgressBar, InputGroup, Form, Button, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./AcademicManagement.css";
import academicApi from "../../api/academicApi";

const AcademicManagement = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [sections, setSections] = useState([]);
  const [overview, setOverview] = useState(null);

  // 🔹 Load sections, overview, and notifications
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sectionsRes, overviewRes, notificationsRes] = await Promise.all([
          academicApi.getSections(),
          academicApi.getOverview(),
          academicApi.getNotifications(),
        ]);
        setSections(sectionsRes.data || []);
        setOverview(overviewRes.data || null);
        setNotifications(notificationsRes.data || []);
      } catch (err) {
        console.error("Error loading academic data:", err);
      }
    };

    fetchData();
  }, []);

  const handleCardClick = (page) => {
    navigate(`/admin/${page}`);
  };

  const handleBack = () => {
    navigate("/admin/admin-dashboard");
  };

  const handleSearch = (e) => setSearchTerm(e.target.value);

  const handleSectionFilter = (section) =>
    setSelectedSection(selectedSection === section ? null : section);

  // 🔹 Filter sections and cards by search term
  const filteredSections = sections
    .filter((section) => !selectedSection || section.title === selectedSection)
    .map((section) => ({
      ...section,
      cards: section.cards.filter(
        (card) =>
          card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          card.description.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((section) => section.cards.length > 0);

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

      {/* 🔹 Search + Filter */}
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
              {sections.map((section, index) => (
                <Button
                  key={index}
                  variant={
                    selectedSection === section.title ? "primary" : "outline-primary"
                  }
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

      {/* 🔹 Overview Cards */}
      {overview && (
        <div className="overview-section">
          <Row>
            <Col md={4}>
              <Card className="overview-card">
                <Card.Body>
                  <div className="overview-icon class">
                    <FaSchool />
                  </div>
                  <h3>Total Classes</h3>
                  <p className="overview-number">{overview.classes.total}</p>
                  <div className="overview-progress">
                    <ProgressBar now={overview.classes.percentage} label={`${overview.classes.percentage}%`} />
                  </div>
                  <div className="overview-footer">
                    <span className="trend positive">{overview.classes.trend}</span>
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
                  <p className="overview-number">{overview.students.total}</p>
                  <div className="overview-progress">
                    <ProgressBar now={overview.students.percentage} label={`${overview.students.percentage}%`} />
                  </div>
                  <div className="overview-footer">
                    <span className="trend positive">{overview.students.trend}</span>
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
                  <p className="overview-number">{overview.teachers.total}</p>
                  <div className="overview-progress">
                    <ProgressBar now={overview.teachers.percentage} label={`${overview.teachers.percentage}%`} />
                  </div>
                  <div className="overview-footer">
                    <span className="trend positive">{overview.teachers.trend}</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* 🔹 Sections + Feature Cards */}
      {filteredSections.map((section, index) => (
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
