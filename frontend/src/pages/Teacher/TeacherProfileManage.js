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

const TeacherProfileManage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    designation: "",
    subjects: "",
    experience: "",
    photo: "",
  });
  const [teacherData, setTeacherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication token is missing. Please log in.");
        }

        const response = await axios.get(`${API_URL}/api/teacher/auth/teacherprofile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.data || !response.data.teacher) {
          throw new Error("Invalid response format from server");
        }

        const teacherData = response.data.teacher;
        setTeacherData(teacherData);
        setFormData({
          name: teacherData.name || "",
          email: teacherData.email || "",
          phone: teacherData.phone || "",
          designation: teacherData.designation || "",
          subjects: teacherData.subjects || "",
          experience: teacherData.experience || "",
          photo: teacherData.photo || "",
        });
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || "Failed to fetch teacher data";
        setError(errorMessage);
        toast.error(errorMessage);
        console.error("Error fetching teacher data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, [API_URL]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
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

      const formDataToSubmit = new FormData();
      Object.keys(formData).forEach((key) => {
        formDataToSubmit.append(key, formData[key]);
      });

      const response = await axios.put(
        `${API_URL}/api/teacher/auth/updateteacherinfo`,
        formDataToSubmit,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data || !response.data.teacher) {
        throw new Error("Invalid response format from server");
      }

      setTeacherData(response.data.teacher);
      setSuccess("Profile updated successfully!");
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to update profile";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
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
      <h2 className="text-center mb-4">Manage Teacher Profile</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {!isEditing ? (
        <div className="p-4">
          <Row>
            <Col md={4} className="text-center">
              <Image
                src={`${API_URL}/uploads/Teacher/${teacherData?.photo}`}
                alt="Teacher Profile"
                className="rounded-circle mb-3"
                style={{
                  width: "150px",
                  height: "150px",
                  objectFit: "cover",
                }}
              />
              <h5 className="mt-2">{teacherData?.name || "N/A"}</h5>
              <p className="text-muted">{teacherData?.designation || "N/A"}</p>
            </Col>
            <Col md={8}>
              <Table bordered hover>
                <tbody>
                  <tr>
                    <th>Role</th>
                    <td>{teacherData?.role || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Email</th>
                    <td>{teacherData?.email || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Phone</th>
                    <td>{teacherData?.phone || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Subjects</th>
                    <td>{teacherData?.subjects || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Experience</th>
                    <td>{teacherData?.experience || "N/A"} years</td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>
          <div className="text-center mt-3">
            <Button
              onClick={handleEditToggle}
              variant="primary"
              disabled={isUpdating}
            >
              Edit Profile
            </Button>
          </div>
        </div>
      ) : (
        <Form onSubmit={handleFormSubmit} className="p-4">
          <Form.Group controlId="formName">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter name"
              name="name"
              value={formData.name || ""}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group controlId="formEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              name="email"
              value={formData.email || ""}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group controlId="formPhone">
            <Form.Label>Phone</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter phone number"
              name="phone"
              value={formData.phone || ""}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group controlId="formDesignation">
            <Form.Label>Designation</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter designation"
              name="designation"
              value={formData.designation || ""}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group controlId="formSubjects">
            <Form.Label>Subjects</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter subjects taught"
              name="subjects"
              value={formData.subjects || ""}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group controlId="formExperience">
            <Form.Label>Experience (in years)</Form.Label>
            <Form.Control
              type="number"
              placeholder="Enter experience in years"
              name="experience"
              value={formData.experience || ""}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group controlId="formFile">
            <Form.Label>Profile Photo</Form.Label>
            <Form.Control
              type="file"
              name="photo"
              onChange={(e) =>
                setFormData((prevData) => ({
                  ...prevData,
                  photo: e.target.files[0],
                }))
              }
            />
          </Form.Group>

          <div className="text-center mt-4">
            <Button variant="primary" type="submit" disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Profile"}
            </Button>
          </div>
        </Form>
      )}
    </div>
  );
};

export default TeacherProfileManage;
