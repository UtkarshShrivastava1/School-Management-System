import React from "react";
import { FaCheckCircle, FaListAlt } from "react-icons/fa";
import { Row, Col, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./TeacherAttendanceManagement.css";

const teacherAttendanceSections = [
  {
    title: "Teacher Attendance Management",
    description: "Manage attendance records for all teachers.",
    cards: [
      {
        icon: <FaCheckCircle size={50} />,
        title: "Mark Attendance",
        page: "mark-teacher-attendance",
      },
      {
        icon: <FaListAlt size={50} />,
        title: "Track Attendance",
        page: "track-teacher-attendance",
      },
    ],
  },
];

const TeacherAttendanceManagement = () => {
  const navigate = useNavigate();

  const handleCardClick = (page) => {
    navigate(`/admin/${page}`);
  };

  return (
    <div className="teacher-attendance-management">
      <h2 className="text-center mb-5">Teacher Attendance Management</h2>

      {teacherAttendanceSections.map((section, index) => (
        <div
          key={index}
          className="category-section mb-5 p-3"
          style={{
            background: "#f9f9f9",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h3 className="category-title">{section.title}</h3>
          <p className="category-description">{section.description}</p>
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
        </div>
      ))}
    </div>
  );
};

export default TeacherAttendanceManagement;
