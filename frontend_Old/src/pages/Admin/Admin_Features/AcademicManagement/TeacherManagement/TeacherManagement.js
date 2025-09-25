import React from "react";
import {
  FaUserTie,
  FaChalkboardTeacher,
  FaClipboardCheck,
  FaMoneyBillWave,
} from "react-icons/fa";
import { Row, Col, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./TeacherManagement.css";
import { FaArrowLeft } from "react-icons/fa";

const teacherManagementSections = [
  {
    title: "Teacher Management",
    description: "Manage all teacher-related activities and operations.",
    cards: [
      {
        icon: <FaChalkboardTeacher size={50} />,
        title: "Assign Teacher to Subjects",
        page: "assign-teacher-subjects",
      },
      {
        icon: <FaUserTie size={50} />,
        title: "Assign Teacher to Classes",
        page: "assign-teacher-classes",
      },
      {
        icon: <FaClipboardCheck size={50} />,
        title: "Teacher Attendance",
        page: "teacher-attendance",
      },
      {
        icon: <FaMoneyBillWave size={50} />,
        title: "Teacher Salary",
        page: "teacher-salary",
      },
    ],
  },
];

const TeacherManagement = () => {
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
    <div className="teacher-management">
      <h2 className="text-center mb-5">Teacher Management</h2>

      {teacherManagementSections.map((section, index) => (
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

export default TeacherManagement;
