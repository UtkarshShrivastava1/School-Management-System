import React, { useState, useEffect } from "react";
import {
  Form,
  Button,
  Row,
  Col,
  Image,
  Table,
  Spinner,
  Alert,
} from "react-bootstrap";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import ChangeStudentPassword from "../../components/Student/ChangeStudentPassword";

const StudentProfileManage = () => {
  const [formData, setFormData] = useState({
    studentName: "",
    studentEmail: "",
    studentPhone: "",
    studentAddress: "",
    className: "",
  });
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const navigate = useNavigate();

  const API_URL =
    process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL
      : process.env.REACT_APP_DEVELOPMENT_URL;

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication token is missing. Please log in.");
        }

        const response = await axios.get(`${API_URL}/api/student/auth/studentprofile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Student profile API response:", response.data);

        if (!response.data || !response.data.student) {
          throw new Error("Invalid response format from server");
        }

        const studentData = response.data.student;
        console.log("Student data received:", studentData);
        
        // Log photo information specifically
        if (studentData.photo) {
          console.log("Student photo found:", studentData.photo);
          console.log("Full photo URL:", `${API_URL}/uploads/Student/${studentData.photo}`);
        } else {
          console.log("No student photo available in the response");
        }
        
        setStudentData(studentData);
        setFormData({
          studentID: studentData.studentID || "",
          studentName: studentData.studentName || "",
          studentEmail: studentData.studentEmail || "",
          studentPhone: studentData.studentPhone || "",
          studentAddress: studentData.studentAddress || "",
          className: studentData.className || "",
        });
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || "Failed to fetch student data";
        setError(errorMessage);
        toast.error(errorMessage);
        console.error("Error fetching student data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [API_URL]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e) => {
    setPhoto(e.target.files[0]);
  };

  const handleEditToggle = () => {
    setIsEditing((prevState) => !prevState);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token is missing. Please log in.");
      }

      // Get studentInfo from localStorage to ensure ID is included
      const studentInfo = JSON.parse(localStorage.getItem("studentInfo") || "{}");
      
      const formDataToSubmit = new FormData();
      
      // Ensure studentID is always included
      formDataToSubmit.append("studentID", formData.studentID || studentInfo.studentID);
      
      // Add other form fields
      Object.keys(formData).forEach((key) => {
        if (key !== "studentID") { // Skip studentID as we've already added it
          formDataToSubmit.append(key, formData[key]);
        }
      });

      if (photo) {
        formDataToSubmit.append("photo", photo);
      }
      
      console.log("Submitting form data:", Object.fromEntries(formDataToSubmit));

      const response = await axios.put(
        `${API_URL}/api/student/auth/updatestudentinfo`,
        formDataToSubmit,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!response.data || !response.data.student) {
        throw new Error("Invalid response format from server");
      }

      // Update local state with the updated data
      setStudentData(response.data.student);
      
      // Update the form data to reflect the changes
      setFormData({
        studentID: response.data.student.studentID || "",
        studentName: response.data.student.studentName || "",
        studentEmail: response.data.student.studentEmail || "",
        studentPhone: response.data.student.studentPhone || "",
        studentAddress: response.data.student.studentAddress || "",
        className: response.data.student.className || "",
      });
      
      setSuccess("Profile updated successfully!");
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to update profile";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Error updating profile:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = () => {
    setShowPasswordModal(true);
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
  };

  const handleBack = () => {
    navigate(-1); // Navigate back to the previous page
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
      <h2 className="text-center mb-4">Manage Student Profile</h2>
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
      {success && <Alert variant="success">{success}</Alert>}

      {!isEditing ? (
        <div className="p-4">
          <Row>
            <Col md={4} className="text-center">
              <Image
                src={studentData?.photo 
                  ? `${API_URL}/uploads/Student/${studentData.photo}`
                  : "https://via.placeholder.com/150"}
                alt="Student Profile"
                className="rounded-circle mb-3"
                style={{
                  width: "150px",
                  height: "150px",
                  objectFit: "cover",
                  border: "2px solid #007bff"
                }}
                onError={(e) => {
                  console.error("Error loading image:", e);
                  e.target.src = "https://via.placeholder.com/150";
                  e.target.onerror = null; // Prevent infinite loop
                }}
              />
              <h5 className="mt-2">{studentData?.studentName || "N/A"}</h5>
              <p className="text-muted">{studentData?.className || "N/A"}</p>
            </Col>
            <Col md={8}>
              <Table bordered hover>
                <tbody>
                  <tr>
                    <th>Role</th>
                    <td>Student</td>
                  </tr>
                  <tr>
                    <th>Student ID</th>
                    <td>{studentData?.studentID || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Email</th>
                    <td>{studentData?.studentEmail || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Phone</th>
                    <td>{studentData?.studentPhone || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Address</th>
                    <td>{studentData?.studentAddress || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Class</th>
                    <td>{studentData?.className || "N/A"}</td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>
          <div className="text-center mt-3 d-flex justify-content-center gap-2">
            <Button
              onClick={handleEditToggle}
              variant="primary"
              disabled={isUpdating}
            >
              Edit Profile
            </Button>
            <Button
              onClick={handleChangePassword}
              variant="secondary"
              disabled={isUpdating}
            >
              Change Password
            </Button>
          </div>
        </div>
      ) : (
        <Form onSubmit={handleFormSubmit} className="p-4">
          <Form.Group controlId="formName" className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter name"
              name="studentName"
              value={formData.studentName || ""}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group controlId="formEmail" className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              name="studentEmail"
              value={formData.studentEmail || ""}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group controlId="formPhone" className="mb-3">
            <Form.Label>Phone</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter phone number"
              name="studentPhone"
              value={formData.studentPhone || ""}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group controlId="formAddress" className="mb-3">
            <Form.Label>Address</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter address"
              name="studentAddress"
              value={formData.studentAddress || ""}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group controlId="formPhoto" className="mb-3">
            <Form.Label>Profile Photo</Form.Label>
            <Form.Control
              type="file"
              name="photo"
              onChange={handlePhotoChange}
              accept="image/*"
            />
            <Form.Text className="text-muted">
              Upload a new photo to change your profile picture.
            </Form.Text>
          </Form.Group>

          <div className="d-flex justify-content-center gap-2 mt-4">
            <Button
              variant="secondary"
              onClick={handleEditToggle}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Save Changes"}
            </Button>
          </div>
        </Form>
      )}

      {/* Password Change Modal */}
      <ChangeStudentPassword
        show={showPasswordModal}
        handleClose={handleClosePasswordModal}
      />
    </div>
  );
};

export default StudentProfileManage; 