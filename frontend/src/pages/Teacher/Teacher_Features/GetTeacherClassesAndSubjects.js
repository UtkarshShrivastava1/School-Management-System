import axios from "axios";
import React, { useEffect, useState } from "react";
import { Badge, Button, Card, Col, Modal, Row } from "react-bootstrap";
import { FaArrowLeft, FaBook, FaCalendarAlt, FaChalkboardTeacher, FaUsers } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./GetTeacherClassesAndSubjects.css";

const GetTeacherClassesAndSubjects = () => {
  const navigate = useNavigate();
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const API_URL =
    process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL
      : process.env.REACT_APP_DEVELOPMENT_URL;

  useEffect(() => {
    const fetchAssignedClasses = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${API_URL}/api/teacher/auth/assigned-classes`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data?.assignedClasses?.length) {
          setAssignedClasses(response.data.assignedClasses);
        } else {
          toast.info("No assigned classes found.");
        }
      } catch (error) {
        console.error("Error fetching assigned classes and subjects:", error);
        toast.error("Failed to fetch assigned classes and subjects.");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedClasses();
  }, [API_URL]);

  const handleBack = () => {
    navigate("/teacher/teacher-dashboard");
  };

  const handleViewDetails = (cls) => {
    setSelectedClass(cls);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedClass(null);
  };

  const handleTakeAttendance = (classId) => {
    navigate(`/teacher/take-class-attendance?classId=${classId}`);
  };

  const handleViewAttendance = (classId) => {
    navigate(`/teacher/view-attendance-history?classId=${classId}`);
  };

  return (
    <div className="teachers-assignment-container">
      <div className="page-header">
        <div className="back-button" onClick={handleBack}>
          <FaArrowLeft size={24} className="back-icon" />
          <span className="back-text">Back to Dashboard</span>
        </div>
        <h1><FaChalkboardTeacher /> My Classes</h1>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your classes...</p>
        </div>
      ) : assignedClasses.length > 0 ? (
        <Row className="g-4">
          {assignedClasses.map((cls) => (
            <Col key={cls._id || cls.classID} xs={12} md={6} lg={4}>
              <Card className="class-card h-100">
                <Card.Body>
                  <Card.Title className="class-title">
                    <FaBook className="class-icon" />
                    {cls.className}
                  </Card.Title>
                  <Card.Subtitle className="mb-3 text-muted">
                    Class ID: {cls._id || cls.classID}
                  </Card.Subtitle>
                  
                  <div className="subjects-section">
                    <h6>Assigned Subjects:</h6>
                    {cls.assignedSubjects && cls.assignedSubjects.length > 0 ? (
                      <div className="subject-badges">
                        {cls.assignedSubjects.map((sub, index) => (
                          <Badge key={index} bg="info" className="subject-badge">
                            {sub.subjectName}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="no-subjects">No subjects assigned</p>
                    )}
                  </div>

                  <div className="card-actions mt-3">
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => handleViewDetails(cls)}
                      className="me-2"
                    >
                      View Details
                    </Button>
                    <Button 
                      variant="outline-success" 
                      size="sm"
                      onClick={() => handleTakeAttendance(cls._id || cls.classID)}
                      className="me-2"
                    >
                      <FaCalendarAlt /> Take Attendance
                    </Button>
                    <Button 
                      variant="outline-info" 
                      size="sm"
                      onClick={() => handleViewAttendance(cls._id || cls.classID)}
                    >
                      View History
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <div className="no-classes-container">
          <FaChalkboardTeacher size={48} />
          <h3>No Classes Assigned</h3>
          <p>You haven't been assigned to any classes yet.</p>
        </div>
      )}

      {/* Class Details Modal */}
      <Modal show={showDetailsModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaBook className="me-2" />
            Class Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedClass && (
            <div>
              <h3>{selectedClass.className}</h3>
              <p className="text-muted">Class ID: {selectedClass._id || selectedClass.classID}</p>
              
              <div className="mt-4">
                <h5><FaBook className="me-2" />Subjects</h5>
                {selectedClass.assignedSubjects && selectedClass.assignedSubjects.length > 0 ? (
                  <div className="subject-list">
                    {selectedClass.assignedSubjects.map((subject, index) => (
                      <div key={index} className="subject-item">
                        <h6>{subject.subjectName}</h6>
                        <p className="text-muted">Code: {subject.subjectCode || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No subjects assigned to this class.</p>
                )}
              </div>

              <div className="mt-4">
                <h5><FaUsers className="me-2" />Quick Actions</h5>
                <div className="quick-actions">
                  <Button 
                    variant="primary" 
                    onClick={() => handleTakeAttendance(selectedClass._id || selectedClass.classID)}
                    className="me-2"
                  >
                    <FaCalendarAlt className="me-2" />
                    Take Attendance
                  </Button>
                  <Button 
                    variant="info" 
                    onClick={() => handleViewAttendance(selectedClass._id || selectedClass.classID)}
                  >
                    View Attendance History
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer />
    </div>
  );
};

export default GetTeacherClassesAndSubjects;
