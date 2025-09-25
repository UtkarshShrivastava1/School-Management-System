import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Image,
  Table,
  Spinner,
  Alert,
} from "react-bootstrap";
import axios from "axios";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const ChildProfile = () => {
  const [childData, setChildData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Set default API URL with fallback
  const API_URL =
    process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL
      : process.env.REACT_APP_DEVELOPMENT_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchChildData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication token is missing. Please log in.");
        }

        const response = await axios.get(`${API_URL}/api/parent/auth/childprofile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-User-Role": "parent",
          },
        });

        if (!response.data || !response.data.child) {
          throw new Error("Invalid response format from server");
        }

        setChildData(response.data.child);
      } catch (err) {
        console.error("Error fetching child profile:", err);
        const errorMessage = err.response?.data?.message || err.message || "Failed to fetch child data";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchChildData();
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

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4 mt-100px">Child Profile</h2>
      <ToastContainer />
      
      {/* Back button with icon */}
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
      
      {error && <Alert variant="danger">{error}</Alert>}

      {childData && (
        <div className="p-4">
          <Row>
            <Col md={4} className="text-center">
              <Image
                src={childData.photo 
                  ? `${API_URL}/uploads/Student/${childData.photo}`
                  : "https://via.placeholder.com/150"}
                alt="Child Profile"
                className="rounded-circle mb-3"
                style={{
                  width: "150px",
                  height: "150px",
                  objectFit: "cover",
                  border: "2px solid #007bff"
                }}
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/150";
                  e.target.onerror = null;
                }}
              />
              <h5 className="mt-2">{childData.studentName || "N/A"}</h5>
              <p className="text-muted">Student</p>
            </Col>
            <Col md={8}>
              <Table bordered hover>
                <tbody>
                  <tr>
                    <th>Student ID</th>
                    <td>{childData.studentID || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Class</th>
                    <td>{childData.class || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Section</th>
                    <td>{childData.section || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Roll Number</th>
                    <td>{childData.rollNumber || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Date of Birth</th>
                    <td>{childData.dateOfBirth || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Gender</th>
                    <td>{childData.gender || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Email</th>
                    <td>{childData.email || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Phone</th>
                    <td>{childData.phone || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Address</th>
                    <td>{childData.address || "N/A"}</td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
};

export default ChildProfile; 