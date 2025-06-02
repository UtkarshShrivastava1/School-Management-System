import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Image,
  Table,
  Spinner,
  Alert,
  Button,
} from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const ChildProfile = () => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_NODE_ENV === "production"
    ? process.env.REACT_APP_PRODUCTION_URL
    : process.env.REACT_APP_DEVELOPMENT_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication token is missing. Please log in.");
        }

        const response = await axios.get(`${API_URL}/api/parent/children`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data && response.data.children) {
          setChildren(response.data.children);
        } else {
          throw new Error("No children data received");
        }
      } catch (err) {
        console.error("Error fetching children:", err);
        setError(err.response?.data?.message || err.message || "Failed to fetch children data");
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [API_URL]);

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <Alert variant="danger">{error}</Alert>
        <div className="text-center mt-3">
          <Button variant="primary" onClick={handleBack}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">My Children</h2>
      
      {/* Back button */}
      <div style={{ marginBottom: "20px" }}>
        <FaArrowLeft
          onClick={handleBack}
          size={24}
          style={{
            cursor: "pointer",
            color: "#007bff",
            display: "inline-block",
            marginRight: "10px",
          }}
        />
        <span
          onClick={handleBack}
          style={{ cursor: "pointer", color: "#007bff" }}
        >
          Back
        </span>
      </div>

      {children.length === 0 ? (
        <Alert variant="info">No children found.</Alert>
      ) : (
        <Row>
          {children.map((child) => (
            <Col key={child.id} md={6} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <div className="text-center mb-3">
                    <Image
                      src={child.photo 
                        ? `${API_URL}/uploads/Student/${child.photo}`
                        : "https://via.placeholder.com/150"}
                      alt={child.name}
                      className="rounded-circle mb-3"
                      style={{
                        width: "150px",
                        height: "150px",
                        objectFit: "cover",
                        border: "2px solid #007bff"
                      }}
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/150";
                      }}
                    />
                    <h4>{child.name}</h4>
                    <p className="text-muted">ID: {child.studentID}</p>
                  </div>

                  <Table bordered hover>
                    <tbody>
                      <tr>
                        <th>Email</th>
                        <td>{child.email}</td>
                      </tr>
                      <tr>
                        <th>Phone</th>
                        <td>{child.phone}</td>
                      </tr>
                      <tr>
                        <th>Address</th>
                        <td>{child.address}</td>
                      </tr>
                      <tr>
                        <th>Date of Birth</th>
                        <td>{new Date(child.dateOfBirth).toLocaleDateString()}</td>
                      </tr>
                      <tr>
                        <th>Gender</th>
                        <td>{child.gender}</td>
                      </tr>
                      <tr>
                        <th>Admission Date</th>
                        <td>{new Date(child.admissionDate).toLocaleDateString()}</td>
                      </tr>
                      <tr>
                        <th>Status</th>
                        <td>
                          <span className={`badge ${child.isActive ? 'bg-success' : 'bg-danger'}`}>
                            {child.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </Table>

                  {child.enrolledClasses && child.enrolledClasses.length > 0 && (
                    <div className="mt-3">
                      <h5>Enrolled Classes</h5>
                      <Table bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>Class ID</th>
                            <th>Class Name</th>
                          </tr>
                        </thead>
                        <tbody>
                          {child.enrolledClasses.map((cls) => (
                            <tr key={cls.id}>
                              <td>{cls.classId}</td>
                              <td>{cls.name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default ChildProfile; 