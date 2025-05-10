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
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ChangeTeacherPassword from "../../components/Teacher/ChangeTeacherPassword";
const TeacherProfileManage = () => {
  const [formData, setFormData] = useState({
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

  const API_URL =
    process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL
      : process.env.REACT_APP_DEVELOPMENT_URL;

  useEffect(() => {
    const fetchTeacherData = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication token is missing. Please log in.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `${API_URL}/api/teacher/auth/teacherprofile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("Fetched teacher data:", response.data);
        setTeacherData(response.data.teacher);
        setFormData(response.data.teacher);
        setError(null);
      } catch (err) {
        console.error("Error fetching teacher data:", err);
        setError(
          err.response?.data?.message || "Failed to fetch teacher data."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, [API_URL, success]);

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

    const formDataToSubmit = new FormData();
    
    // Debug - check what data we're submitting
    console.log("Original form data to submit:", formData);
    
    // Ensure experience is a number
    if (formData.experience && typeof formData.experience === 'string') {
      formData.experience = Number(formData.experience);
    }
    
    // Only include fields that the backend expects
    const allowedFields = [
      'name', 'email', 'phone', 'designation', 'department', 
      'address', 'religion', 'category', 'bloodgroup',
      'photo', 'experience', 'highestQualification'
    ];
    
    // Handle regular fields
    Object.keys(formData).forEach((key) => {
      // Only process fields that the backend expects
      if (!allowedFields.includes(key)) {
        return;
      }
      
      // Skip the photo field if it's a string (existing photo path)
      if (key === 'photo' && typeof formData[key] === 'string') {
        return;
      }
      
      // Special handling for experience to ensure it's a number
      if (key === 'experience') {
        formDataToSubmit.append(key, Number(formData[key] || 0));
        console.log(`Adding ${key} as number:`, Number(formData[key] || 0));
        return;
      }
      
      // Handle nested objects (like emergencyContact)
      if (formData[key] !== null && typeof formData[key] === 'object' && !Array.isArray(formData[key]) && !(formData[key] instanceof File)) {
        formDataToSubmit.append(key, JSON.stringify(formData[key]));
        console.log(`Adding ${key} as JSON:`, JSON.stringify(formData[key]));
      } else if (formData[key] !== undefined && formData[key] !== null) {
        formDataToSubmit.append(key, formData[key]);
        console.log(`Adding ${key}:`, formData[key]);
      }
    });

    // Add teacherID explicitly if it exists in the profile
    if (teacherData && teacherData.teacherID) {
      formDataToSubmit.append('teacherID', teacherData.teacherID);
      console.log('Adding teacherID:', teacherData.teacherID);
    }

    const token = localStorage.getItem("token");
    try {
      console.log("Sending profile update request");
      
      // Create a log of which fields we're sending to help with debugging
      console.log("Form data entries:");
      for (let pair of formDataToSubmit.entries()) {
        console.log(`Form field - ${pair[0]}: ${pair[1]}`);
      }
      
      const response = await axios.put(
        `${API_URL}/api/teacher/auth/teacherprofile`,
        formDataToSubmit,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type with multipart form data, 
            // axios will automatically set the correct boundary
          },
        }
      );

      console.log("Profile update response:", response.data);
      
      // Update the teacherData state with the response data
      if (response.data.teacher) {
        setTeacherData(response.data.teacher);
        console.log("Updated teacher data in state:", response.data.teacher);
        
        // Force a refresh of the data to ensure it's updated
        setTimeout(() => {
          // Refetch teacher data to ensure we have the latest
          const fetchUpdatedData = async () => {
            try {
              const refreshResponse = await axios.get(
                `${API_URL}/api/teacher/auth/teacherprofile`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              console.log("Refreshed teacher data:", refreshResponse.data);
              setTeacherData(refreshResponse.data.teacher);
            } catch (err) {
              console.error("Error refreshing data:", err);
            }
          };
          fetchUpdatedData();
        }, 1000); // Wait for 1 second to ensure data is saved in the database
      }

      setSuccess("Profile updated successfully!");
      toast.success("Profile updated successfully!");
      setError(null);
    } catch (err) {
      console.error("Profile update error:", err);
      // Log the detailed error response for debugging
      if (err.response && err.response.data) {
        console.error("Error details:", err.response.data);
      }
      setError(err.response?.data?.message || "Failed to update profile.");
      toast.error(err.response?.data?.message || "Failed to update profile.");
      setSuccess(null);
    } finally {
      setIsUpdating(false);
      setIsEditing(false);
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
                    <th>Department</th>
                    <td>{teacherData?.department || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Address</th>
                    <td>{teacherData?.address || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Religion</th>
                    <td>{teacherData?.religion || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Category</th>
                    <td>{teacherData?.category || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Blood Group</th>
                    <td>{teacherData?.bloodgroup || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Experience</th>
                    <td>{teacherData?.experience || "N/A"} years</td>
                  </tr>
                  <tr>
                    <th>Highest Qualification</th>
                    <td>{teacherData?.highestQualification || "N/A"}</td>
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
            <ChangeTeacherPassword/>
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

          <Form.Group controlId="formExperience">
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
          
          <Row>
            <Col md={4}>
              <Form.Group controlId="formReligion">
                <Form.Label>Religion</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter religion"
                  name="religion"
                  value={formData.religion || ""}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
            
            <Col md={4}>
              <Form.Group controlId="formCategory">
                <Form.Label>Category</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter category"
                  name="category"
                  value={formData.category || ""}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
            
            <Col md={4}>
              <Form.Group controlId="formBloodgroup">
                <Form.Label>Blood Group</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter blood group"
                  name="bloodgroup"
                  value={formData.bloodgroup || ""}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Form.Group controlId="formQualification">
            <Form.Label>Highest Qualification</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter highest qualification"
              name="highestQualification"
              value={formData.highestQualification || ""}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group controlId="formPhoto">
            <Form.Label>Profile Photo</Form.Label>
            <Form.Control
              type="file"
              name="photo"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  console.log("Selected file:", e.target.files[0].name);
                  setFormData((prevData) => ({
                    ...prevData,
                    photo: e.target.files[0]
                  }));
                }
              }}
            />
            <small className="text-muted">
              {formData.photo && typeof formData.photo === 'object' 
                ? `Selected file: ${formData.photo.name}`
                : 'No new file selected'}
            </small>
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
