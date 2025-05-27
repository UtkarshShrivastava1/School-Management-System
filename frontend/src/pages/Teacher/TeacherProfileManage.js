import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Form,
  Image,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import { toast , ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import ChangeTeacherPassword from "../../components/Teacher/ChangeTeacherPassword";

const TeacherProfileManage = () => {
  const [formData, setFormData] = useState({
    teacherID: "",
    name: "",
    email: "",
    phone: "",
    designation: "",
    experience: "",
    photo: "",
    address: "",
    department: "",
    highestQualification: "",
    religion: "",
    category: "",
    bloodgroup: ""
  });
  const [teacherData, setTeacherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const navigate = useNavigate();

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
          teacherID: teacherData.teacherID || "",
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
  }, [API_URL, success]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Convert experience to a number
    if (name === 'experience') {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value === '' ? '' : Number(value),
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
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

      // Get teacherInfo from localStorage to ensure ID is included
      const teacherInfo = JSON.parse(localStorage.getItem("teacherInfo") || "{}");
      
      const formDataToSubmit = new FormData();
      
      // Ensure teacherID is always included
      formDataToSubmit.append("teacherID", formData.teacherID || teacherInfo.teacherID || teacherData.teacherID);
      
      // Add other form fields
      Object.keys(formData).forEach((key) => {
        if (key !== "teacherID" && formData[key] !== null && formData[key] !== undefined) { // Skip teacherID as we've already added it
          // Convert experience to number before appending
          if (key === 'experience' && formData[key] !== '') {
            formDataToSubmit.append(key, Number(formData[key]));
          } else {
            formDataToSubmit.append(key, formData[key]);
          }
        }
      });

      // Log what's being submitted
      console.log("Submitting form data:", {
        teacherID: formData.teacherID || teacherInfo.teacherID || teacherData.teacherID,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        experience: formData.experience,
        subjects: formData.subjects,
        designation: formData.designation
      });

      const response = await axios.put(
        `${API_URL}/api/teacher/auth/updateteacherinfo`,
        formDataToSubmit,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!response.data || !response.data.teacher) {
        throw new Error("Invalid response format from server");
      }

      // Update local state with the updated data
      setTeacherData(response.data.teacher);
      
      // Update the form data to reflect the changes
      setFormData({
        teacherID: response.data.teacher.teacherID || "",
        name: response.data.teacher.name || "",
        email: response.data.teacher.email || "",
        phone: response.data.teacher.phone || "",
        designation: response.data.teacher.designation || "",
        subjects: response.data.teacher.subjects || "",
        experience: response.data.teacher.experience || "",
      });
      
      setSuccess("Profile updated successfully!");
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to update profile";
      setError(errorMessage);
      toast.error(errorMessage);
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
      <h2 className="text-center mb-4">Manage Teacher Profile</h2>
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
                src={teacherData?.photo 
                  ? `${API_URL}/uploads/Teacher/${teacherData.photo}`
                  : "https://via.placeholder.com/150"}
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
                    <th>Teacher ID</th>
                    <td>{teacherData?.teacherID || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Role</th>
                    <td>{teacherData?.role || "Teacher"}</td>
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
                    <th>Department</th>
                    <td>{teacherData?.department || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Designation</th>
                    <td>{teacherData?.designation || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Address</th>
                    <td>{teacherData?.address || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Experience</th>
                    <td>{teacherData?.experience ? `${teacherData.experience} years` : "N/A"}</td>
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
              name="name"
              value={formData.name || ""}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group controlId="formEmail" className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              name="email"
              value={formData.email || ""}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group controlId="formPhone" className="mb-3">
            <Form.Label>Phone</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter phone number"
              name="phone"
              value={formData.phone || ""}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group controlId="formDesignation" className="mb-3">
            <Form.Label>Designation</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter designation"
              name="designation"
              value={formData.designation || ""}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group controlId="formSubjects" className="mb-3">
            <Form.Label>Subjects</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter subjects taught"
              name="subjects"
              value={formData.subjects || ""}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group controlId="formExperience" className="mb-3">
            <Form.Label>Experience (in years)</Form.Label>
            <Form.Control
              type="number"
              min="0"
              step="1"
              placeholder="Enter experience in years"
              name="experience"
              value={formData.experience || ""}
              onChange={(e) => {
                // Convert experience to a number immediately on change
                const numValue = e.target.value === "" ? "" : Number(e.target.value);
                setFormData((prevData) => ({
                  ...prevData,
                  experience: numValue
                }));
              }}
            />
            <small className="text-muted">Please enter a numeric value for years of experience</small>
          </Form.Group>
          
          <Form.Group controlId="formAddress">
            <Form.Label>Address</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Enter address"
              name="address"
              value={formData.address || ""}
              onChange={handleInputChange}
            />
          </Form.Group>
          
          <Form.Group controlId="formDepartment">
            <Form.Label>Department</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter department"
              name="department"
              value={formData.department || ""}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group controlId="formFile" className="mb-3">
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
      <ChangeTeacherPassword
        show={showPasswordModal}
        handleClose={handleClosePasswordModal}
      />
    </div>
  );
};

export default TeacherProfileManage;
