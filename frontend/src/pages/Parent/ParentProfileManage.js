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
import ChangeParentPassword from "../../components/Parent/ChangeParentPassword";

const ParentProfileManage = () => {
  const [formData, setFormData] = useState({
    parentName: "",
    parentEmail: "",
    parentContactNumber: "",
    parentAddress: "",
    parentOccupation: "",
    parentIncome: "",
    parentEducation: "",
    emergencyContact: {
      name: "",
      relation: "",
      phone: ""
    }
  });
  const [photoFile, setPhotoFile] = useState(null);

  const [parentData, setParentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const API_URL =
    process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL
      : process.env.REACT_APP_DEVELOPMENT_URL;

  const fetchParentData = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Authentication token is missing. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `${API_URL}/api/parent/auth/parentprofile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Fetched parent data:", response.data);
      setParentData(response.data.parent);
      setFormData(response.data.parent);
      setError(null);
    } catch (err) {
      console.error("Error fetching parent data:", err);
      setError(
        err.response?.data?.message || "Failed to fetch parent data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParentData();
  }, [API_URL]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('emergencyContact.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: value
        }
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleFileChange = (e) => {
    setPhotoFile(e.target.files[0]);
  };

  const handleEditToggle = () => {
    setIsEditing((prevState) => !prevState);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    const formDataToSubmit = new FormData();
    
    // Ensure parentID is included
    formDataToSubmit.append("parentID", parentData.parentID);
    
    // Append all form fields
    Object.keys(formData).forEach((key) => {
      if (key === 'emergencyContact') {
        formDataToSubmit.append(key, JSON.stringify(formData[key]));
      } else if (key !== 'children' && key !== 'password' && key !== '_id' && key !== '__v') {
        // Skip certain fields that should not be sent in the update
        formDataToSubmit.append(key, formData[key]);
      }
    });
    
    // Append photo file if it exists
    if (photoFile) {
      formDataToSubmit.append("photo", photoFile);
    }

    const token = localStorage.getItem("token");
    try {
      console.log("Sending parent profile update request");
      const response = await axios.put(
        `${API_URL}/api/parent/parentprofile`,
        formDataToSubmit,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSuccess("Profile updated successfully!");
      toast.success("Profile updated successfully!");
      
      // Update parent data with the returned data
      if (response.data.parent) {
        setParentData(response.data.parent);
        setFormData(response.data.parent);
        console.log("Updated parent data:", response.data.parent);
      }
      
      // Refresh data to ensure we have the latest
      setTimeout(() => {
        fetchParentData();
      }, 1000);
      
      setError(null);
    } catch (err) {
      console.error("Profile update error:", err.response || err);
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
      <h2 className="text-center mb-4">Manage Parent Profile</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {!isEditing ? (
        <div className="p-4">
          <Row>
            <Col md={4} className="text-center">
              {parentData?.photo && (
                <Image
                  src={`${API_URL}/uploads/Parent/${parentData.photo}`}
                  alt="Parent Profile"
                  className="rounded-circle mb-3"
                  style={{ width: "150px", height: "150px", objectFit: "cover" }}
                />
              )}
              <h5 className="mt-2">{parentData?.parentName || "N/A"}</h5>
              <p className="text-muted">{parentData?.parentID || "N/A"}</p>
            </Col>
            <Col md={8}>
              <Table bordered hover>
                <tbody>
                  <tr>
                    <th>Email</th>
                    <td>{parentData?.parentEmail || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Contact Number</th>
                    <td>{parentData?.parentContactNumber || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Address</th>
                    <td>{parentData?.parentAddress || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Occupation</th>
                    <td>{parentData?.parentOccupation || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Income</th>
                    <td>{parentData?.parentIncome || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Education</th>
                    <td>{parentData?.parentEducation || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Emergency Contact</th>
                    <td>
                      {parentData?.emergencyContact ? (
                        <>
                          <div>Name: {parentData.emergencyContact.name || "N/A"}</div>
                          <div>Relation: {parentData.emergencyContact.relation || "N/A"}</div>
                          <div>Phone: {parentData.emergencyContact.phone || "N/A"}</div>
                        </>
                      ) : (
                        "No emergency contact"
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th>Children</th>
                    <td>
                      {parentData?.children && parentData.children.length > 0 ? (
                        <ul className="list-unstyled">
                          {parentData.children.map((child, index) => (
                            <li key={index} className="mb-2">
                              {child.student ? (
                                <>
                                  <strong>{child.student.studentName}</strong> ({child.student.studentID})
                                  <br />
                                  <small className="text-muted">Relationship: {child.relationship || "N/A"}</small>
                                </>
                              ) : (
                                `Child information not available`
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        "No children registered"
                      )}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>
          <div className="text-center mt-3">
            <Button onClick={handleEditToggle} variant="primary" disabled={isUpdating}>
              Edit Profile
            </Button>
            <ChangeParentPassword />
          </div>
        </div>
      ) : (
        <Form onSubmit={handleFormSubmit} className="p-4">
          {[
            { name: "parentName", label: "Name" },
            { name: "parentEmail", label: "Email", type: "email" },
            { name: "parentContactNumber", label: "Contact Number" },
            { name: "parentAddress", label: "Address" },
            { name: "parentOccupation", label: "Occupation" },
            { name: "parentIncome", label: "Income", type: "number" },
            { name: "parentEducation", label: "Education" },
          ].map(({ name, label, type = "text" }) => (
            <Form.Group controlId={`form-${name}`} key={name} className="mb-3">
              <Form.Label>{label}</Form.Label>
              <Form.Control
                type={type}
                placeholder={`Enter ${label.toLowerCase()}`}
                name={name}
                value={formData[name] || ""}
                onChange={handleInputChange}
              />
            </Form.Group>
          ))}

          <h5 className="mt-4">Emergency Contact</h5>
          {[
            { name: "emergencyContact.name", label: "Name" },
            { name: "emergencyContact.relation", label: "Relation" },
            { name: "emergencyContact.phone", label: "Phone" },
          ].map(({ name, label }) => (
            <Form.Group controlId={`form-${name}`} key={name} className="mb-3">
              <Form.Label>{label}</Form.Label>
              <Form.Control
                type="text"
                placeholder={`Enter emergency contact ${label.toLowerCase()}`}
                name={name}
                value={name.startsWith('emergencyContact.') ? 
                  formData.emergencyContact?.[name.split('.')[1]] || "" : 
                  formData[name] || ""}
                onChange={handleInputChange}
              />
            </Form.Group>
          ))}

          <Form.Group controlId="formPhoto" className="mt-3">
            <Form.Label>Profile Photo</Form.Label>
            <Form.Control
              type="file"
              name="photo"
              onChange={handleFileChange}
            />
            {parentData?.photo && (
              <div className="mt-2">
                <small className="text-muted">Current photo: {parentData.photo}</small>
              </div>
            )}
          </Form.Group>

          <div className="text-center mt-4">
            <Button variant="primary" type="submit" disabled={isUpdating} className="me-2">
              {isUpdating ? "Updating..." : "Update Profile"}
            </Button>
            <Button variant="secondary" onClick={handleEditToggle} disabled={isUpdating}>
              Cancel
            </Button>
          </div>
        </Form>
      )}
    </div>
  );
};

export default ParentProfileManage;