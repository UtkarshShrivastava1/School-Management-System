import React from "react";
import { FaUserGraduate, FaUserCircle, FaClipboardList } from "react-icons/fa";
import { Row, Col, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./StudentManagement.css";
import { FaArrowLeft } from "react-icons/fa";
const studentManagementSections = [
  {
    title: "Student Management",
    description: "Manage all aspects of students and their activities.",
    cards: [
      {
        icon: <FaUserGraduate size={50} />,
        title: "Assign Students to Class",
        page: "assign-students-class",
      },
      {
        icon: <FaUserCircle size={50} />,
        title: "See Student Profiles",
        page: "student-profiles",
      },
      {
        icon: <FaClipboardList size={50} />,
        title: "Track Student Attendance",
        page: "track-student-attendance",
      },
    ],
  },
];

const StudentManagement = () => {
  const navigate = useNavigate();

  const handleCardClick = (page) => {
    navigate(`/admin/${page}`);
  };
  const handleBack = () => {
    navigate("/admin/admin-dashboard", {
      state: { activeTab: "Academic Management" },
    });
  };
  return (
    <div className="student-management">
      <h2 className="text-center mb-5">Student Management</h2>

      {studentManagementSections.map((section, index) => (
        <div
          key={index}
          className="category-section mb-5 p-3"
          style={{
            background: "#f9f9f9",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          <FaArrowLeft
            onClick={handleBack}
            size={24}
            className="classManagement-back-icon"
          />
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

export default StudentManagement;
