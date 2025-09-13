import "bootstrap/dist/css/bootstrap.min.css";
import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  ListGroup,
  Modal,
  Table,
  Badge,
  Row,
  Col,
  Spinner,
} from "react-bootstrap";
import {
  FaArrowLeft,
  FaBook,
  FaChalkboard,
  FaEdit,
  FaPlusCircle,
  FaTrash,
  FaUsers,
  FaGraduationCap,
  FaSearch,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import adminApi from "../../api/adminApi"; // ✅ centralized axios instance
import "./ClassManagement.css";

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

// ✅ Fetch all classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await adminApi.getAllClasses(); // returns res.data
        if (!data || !Array.isArray(data.classes)) {
          throw new Error("Invalid API response format");
        }

        // ✅ Sort classes
        const sortedClasses = [...data.classes].sort((a, b) => {
          const numA = parseInt(a.className, 10);
          const numB = parseInt(b.className, 10);

          if (!isNaN(numA) && !isNaN(numB)) {
            if (numA !== numB) return numA - numB;
            const letterA = a.className.replace(numA.toString(), "");
            const letterB = b.className.replace(numB.toString(), "");
            return letterA.localeCompare(letterB);
          } else if (!isNaN(numA)) {
            return -1;
          } else if (!isNaN(numB)) {
            return 1;
          } else {
            return a.className.localeCompare(b.className);
          }
        });

        setClasses(sortedClasses);
        setError("");
      } catch (err) {
        console.error("Error fetching classes:", err);
        setError("Failed to fetch classes.");
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // ✅ View class details
  const handleViewDetails = async (classId) => {
    try {
      const data = await adminApi.getClassById(classId);
      setSelectedClass(data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Error fetching class details:", error);
      toast.error("Failed to fetch class details");
    }
  };

  // ✅ Delete class
  const handleDelete = async (classId) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      try {
        await adminApi.deleteClass(classId);
        setClasses((prev) => prev.filter((cls) => cls.classId !== classId));
        toast.success("Class deleted successfully!");
      } catch (err) {
        console.error("Error deleting class:", err);
        toast.error("Failed to delete class.");
      }
    }
  };

  const handleBack = () => {
    navigate("/admin/admin-dashboard", {
      state: { activeTab: "Academic Management" },
    });
  };

  // Grouping logic
  const getGroupKey = (cls) => {
    const name = cls.className;
    if (!name) return "Unknown";
    const digitMatch = name.match(/^(\d+)/);
    if (digitMatch) {
      return `Class ${digitMatch[1]}`;
    }
    if (name.toUpperCase().startsWith("KG")) {
      return "Kindergarten";
    }
    return name;
  };

  const filteredClasses = classes.filter(
    (cls) =>
      cls.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.classId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedClasses = filteredClasses.reduce((acc, cls) => {
    const key = getGroupKey(cls);
    if (!acc[key]) acc[key] = [];
    acc[key].push(cls);
    return acc;
  }, {});

  Object.keys(groupedClasses).forEach((groupKey) => {
    groupedClasses[groupKey].sort((a, b) =>
      a.section.localeCompare(b.section)
    );
  });

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedClass(null);
  };

  return (
    <div className="classManagement-container">
      <div className="classManagement-header">
        <div className="header-left">
          <FaArrowLeft
            onClick={handleBack}
            size={24}
            className="classManagement-back-icon"
          />
          <h1>
            <FaChalkboard /> Class Management
          </h1>
        </div>
        <div className="header-right">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="primary"
            onClick={handleAddClass}
            className="classManagement-add-btn"
          >
            <FaPlusCircle /> Add New Class
          </Button>
        </div>
      </div>

      {error && <div className="classManagement-error-message">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <Spinner animation="border" variant="primary" />
          <p>Loading classes...</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="no-classes-container">
          <FaChalkboard size={48} />
          <h3>No Classes Found</h3>
          <p>Start by adding your first class</p>
          <Button variant="primary" onClick={handleAddClass}>
            <FaPlusCircle /> Add Class
          </Button>
        </div>
      ) : (
        <div className="class-groups-container">
          {Object.keys(groupedClasses).map((groupKey) => (
            <div key={groupKey} className="class-group">
              <h3 className="class-group-title">
                <FaGraduationCap /> {groupKey}
              </h3>
              <Row className="g-4">
                {groupedClasses[groupKey].map((cls) => (
                  <Col key={cls.classId} xs={12} md={6} lg={4}>
                    <Card className="class-card">
                      <Card.Body>
                        <div className="class-header">
                          <Card.Title>{cls.className}</Card.Title>
                          <Card.Subtitle className="mb-2 text-muted">
                            ID: {cls.classId}
                          </Card.Subtitle>
                        </div>

                        <div className="class-stats">
                          <div className="stat-item">
                            <FaBook />
                            <span>
                              {cls.subjects ? cls.subjects.length : 0} Subjects
                            </span>
                          </div>
                          <div className="stat-item">
                            <FaUsers />
                            <span>
                              {cls.teachers ? cls.teachers.length : 0} Teachers
                            </span>
                          </div>
                        </div>

                        <div className="class-actions">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleViewDetails(cls.classId)}
                          >
                            <FaBook /> Details
                          </Button>
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => handleEdit(cls.classId)}
                          >
                            <FaEdit /> Edit
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(cls.classId)}
                          >
                            <FaTrash /> Delete
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          ))}
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
            <div className="class-details">
              <div className="class-info-header">
                <h3>{selectedClass.class.className}</h3>
                <Badge bg="info">ID: {selectedClass.class.classId}</Badge>
              </div>

              <div className="details-section">
                <h4>
                  <FaBook className="me-2" />
                  Subjects
                </h4>
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Subject Name</th>
                      <th>Subject Code</th>
                      <th>Assigned Teachers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedClass.subjects.map((subject, index) => (
                      <tr key={index}>
                        <td>{subject.subjectName}</td>
                        <td>{subject.subjectCode || "N/A"}</td>
                        <td>
                          {subject.assignedTeachers &&
                          subject.assignedTeachers.length > 0 ? (
                            <div className="teacher-badges">
                              {subject.assignedTeachers.map(
                                (teacher, tIndex) => (
                                  <Badge key={tIndex} bg="info" className="me-1">
                                    {teacher.name}
                                  </Badge>
                                )
                              )}
                            </div>
                          ) : (
                            <Badge bg="warning">No teacher assigned</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              <div className="details-section">
                <h4>
                  <FaUsers className="me-2" />
                  Class Teachers
                </h4>
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Teacher ID</th>
                      <th>Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedClass.class.teachers &&
                    selectedClass.class.teachers.length > 0 ? (
                      selectedClass.class.teachers.map((teacher, index) => (
                        <tr key={index}>
                          <td>{teacher.teacherID}</td>
                          <td>{teacher.name}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="2" className="text-center">
                          No teachers assigned
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              handleCloseModal();
              handleEdit(selectedClass.class.classId);
            }}
          >
            Edit Class
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ClassManagement;
