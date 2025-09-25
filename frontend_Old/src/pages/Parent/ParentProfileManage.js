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
import ChangeParentPassword from "../../components/Parent/ChangeParentPassword";

const ParentProfileManage = () => {
  const [formData, setFormData] = useState({
    parentName: "",
    parentEmail: "",
    parentContactNumber: "",
    address: "",
    occupation: "",
    relationship: "",
  });
  const [parentData, setParentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const navigate = useNavigate();

  // Set default API URL with fallback
  const API_URL =
    process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL
      : process.env.REACT_APP_DEVELOPMENT_URL || "http://localhost:5000";
      
  console.log("Using API URL:", API_URL);

  useEffect(() => {
    const fetchParentData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication token is missing. Please log in.");
        }

        // Get parent info from localStorage for debugging
        const parentInfo = JSON.parse(localStorage.getItem("parentInfo") || "{}");
        console.log("Parent info from localStorage:", parentInfo);
        
        console.log("Fetching parent profile using token:", token ? "Token exists" : "No token");
        
        const response = await axios.get(`${API_URL}/api/parent/auth/parentprofile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-User-Role": "parent", // Add role header for extra validation
          },
        });

        console.log("Parent profile API response:", response.data);

        if (!response.data || !response.data.parent) {
          throw new Error("Invalid response format from server");
        }

        const parentData = response.data.parent;
        console.log("Parent data received:", parentData);
        
        // Log photo information specifically
        if (parentData.photo) {
          console.log("Parent photo found:", parentData.photo);
          console.log("Full photo URL:", `${API_URL}/uploads/Parent/${parentData.photo}`);
        } else {
          console.log("No parent photo available in the response");
        }
        
        setParentData(parentData);
        setFormData({
          parentID: parentData.parentID || parentInfo.parentID || "",
          parentName: parentData.parentName || parentInfo.parentName || "",
          parentEmail: parentData.parentEmail || parentInfo.parentEmail || "",
          parentContactNumber: parentData.parentContactNumber || parentInfo.parentContactNumber || "",
          address: parentData.address || "",
          occupation: parentData.occupation || "",
          relationship: parentData.relationship || "",
        });
      } catch (err) {
        console.error("Error fetching parent profile:", err);
        
        // Fallback to localStorage data if API fails
        try {
          const parentInfo = JSON.parse(localStorage.getItem("parentInfo") || "{}");
          if (parentInfo && parentInfo.parentID) {
            console.log("Using localStorage data as fallback:", parentInfo);
            setParentData(parentInfo);
            setFormData({
              parentID: parentInfo.parentID || "",
              parentName: parentInfo.parentName || "",
              parentEmail: parentInfo.parentEmail || "",
              parentContactNumber: parentInfo.parentContactNumber || "",
              address: parentInfo.address || "",
              occupation: parentInfo.occupation || "",
              relationship: parentInfo.relationship || "",
            });
            setError("Using locally stored profile data. Some information may be limited.");
          } else {
            setError("Failed to fetch profile data and no local data available");
          }
        } catch (localStorageError) {
          console.error("Error accessing localStorage:", localStorageError);
          const errorMessage = err.response?.data?.message || err.message || "Failed to fetch parent data";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchParentData();
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

      // Get parentInfo from localStorage to ensure ID is included
      const parentInfo = JSON.parse(localStorage.getItem("parentInfo") || "{}");
      
      const formDataToSubmit = new FormData();
      
      // Ensure parentID is always included
      formDataToSubmit.append("parentID", formData.parentID || parentInfo.parentID || parentData.parentID);
      
      // Add other form fields
      Object.keys(formData).forEach((key) => {
        if (key !== "parentID" && formData[key] !== null && formData[key] !== undefined) { // Skip parentID as we've already added it
          formDataToSubmit.append(key, formData[key]);
        }
      });

      // Add photo if it exists
      if (photo) {
        formDataToSubmit.append("photo", photo);
      }
      
      // Log what's being submitted
      console.log("Submitting form data:", {
        parentID: formData.parentID || parentInfo.parentID || parentData.parentID,
        parentName: formData.parentName,
        parentEmail: formData.parentEmail,
        parentContactNumber: formData.parentContactNumber
      });

      const response = await axios.put(
        `${API_URL}/api/parent/auth/updateparentinfo`,
        formDataToSubmit,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!response.data || !response.data.parent) {
        throw new Error("Invalid response format from server");
      }

      // Update local state with the updated data
      setParentData(response.data.parent);
      
      // Update the form data to reflect the changes
      setFormData({
        parentID: response.data.parent.parentID || "",
        parentName: response.data.parent.parentName || "",
        parentEmail: response.data.parent.parentEmail || "",
        parentContactNumber: response.data.parent.parentContactNumber || "",
        address: response.data.parent.address || "",
        occupation: response.data.parent.occupation || "",
        relationship: response.data.parent.relationship || "",
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
      <h2 className="text-center mb-4">Manage Parent Profile</h2>
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
                src={parentData?.photo 
                  ? `${API_URL}/uploads/Parent/${parentData.photo}`
                  : "https://via.placeholder.com/150"}
                alt="Parent Profile"
                className="rounded-circle mb-3"
                style={{
                  width: "150px",
                  height: "150px",
                  objectFit: "cover",
                  border: "2px solid #007bff"
                }}
                onError={(e) => {
                  console.error("Error loading parent image:", e);
                  console.log("Failed image source:", e.target.src);
                  e.target.src = "https://via.placeholder.com/150";
                  e.target.onerror = null; // Prevent infinite loop
                }}
              />
              <h5 className="mt-2">{parentData?.parentName || "N/A"}</h5>
              <p className="text-muted">{parentData?.relationship || "N/A"}</p>
            </Col>
            <Col md={8}>
              <Table bordered hover>
                <tbody>
                  <tr>
                    <th>Role</th>
                    <td>Parent</td>
                  </tr>
                  <tr>
                    <th>Parent ID</th>
                    <td>{parentData?.parentID || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Email</th>
                    <td>{parentData?.parentEmail || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Phone</th>
                    <td>{parentData?.parentContactNumber || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Address</th>
                    <td>{parentData?.address || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Occupation</th>
                    <td>{parentData?.occupation || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Relationship</th>
                    <td>{parentData?.relationship || "N/A"}</td>
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
              name="parentName"
              value={formData.parentName || ""}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group controlId="formEmail" className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              name="parentEmail"
              value={formData.parentEmail || ""}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group controlId="formPhone" className="mb-3">
            <Form.Label>Phone</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter phone number"
              name="parentContactNumber"
              value={formData.parentContactNumber || ""}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group controlId="formAddress" className="mb-3">
            <Form.Label>Address</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter address"
              name="address"
              value={formData.address || ""}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group controlId="formOccupation" className="mb-3">
            <Form.Label>Occupation</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter occupation"
              name="occupation"
              value={formData.occupation || ""}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group controlId="formRelationship" className="mb-3">
            <Form.Label>Relationship</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter relationship"
              name="relationship"
              value={formData.relationship || ""}
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
      <ChangeParentPassword
        show={showPasswordModal}
        handleClose={handleClosePasswordModal}
      />
    </div>
  );
};

export default ParentProfileManage; 