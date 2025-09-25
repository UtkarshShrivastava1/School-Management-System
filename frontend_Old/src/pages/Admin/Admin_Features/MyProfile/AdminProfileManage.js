import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Image,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import { FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ChangeAdminPassword from "../../../../components/Admin/ChangeAdminPassword";
import "./AdminProfileManage.css";

const AdminProfileManage = ({ userRole = "admin" }) => {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();
  const [showBankDetails, setShowBankDetails] = useState(false);

  const toggleShowBankDetails = () => {
    setShowBankDetails((prev) => !prev);
  };

  const API_URL =
    process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL
      : process.env.REACT_APP_DEVELOPMENT_URL;

  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);

      // Retrieve token from localStorage
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication token is missing. Please log in.");
        setLoading(false);
        return;
      }

      try {
        // Fetch admin data from the API
        const response = await axios.get(
          `${API_URL}/api/admin/auth/adminprofile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setAdminData(response.data.admin);
        setFormData(response.data.admin);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch admin data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [userRole, API_URL]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const keys = name.split(".");

    if (keys.length === 1) {
      // Top-level key update
      setFormData((prevData) => ({ ...prevData, [name]: value }));
    } else {
      // Nested key update
      setFormData((prevData) => {
        // Clone the previous state
        const newData = { ...prevData };

        // Navigate to the nested object using the keys
        let current = newData;
        for (let i = 0; i < keys.length - 1; i++) {
          // If the nested object doesn't exist yet, create it
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        // Set the final key to the new value
        current[keys[keys.length - 1]] = value;
        return newData;
      });
    }
  };

  const handlePhotoChange = (e) => {
    setPhoto(e.target.files[0]);
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) setFormData(adminData);
  };

  // Helper to format date to yyyy-MM-dd
  function formatDateToInput(date) {
    if (!date) return '';
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    // Validation checks
    let errors = {};
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email.";
    }
    if (formData.phone && formData.phone.length !== 10) {
      errors.phone = "Phone number must be 10 digits.";
    }
    if (formData.AADHARnumber && formData.AADHARnumber.length !== 12) {
      errors.AADHARnumber = "AADHAR number must be 12 digits.";
    }
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      setIsUpdating(false);
      return; // Prevent submission if there are validation errors
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Authentication token is missing. Please log in.");
      setIsUpdating(false);
      return;
    }

    try {
      // Use FormData for the request
      const formDataToSubmit = new FormData();

      // Ensure adminID is included (fallback to formData or adminData)
      const adminID = (adminData && adminData.adminID) || formData.adminID;
      if (!adminID) {
        toast.error("Admin ID is missing. Cannot update profile.");
        setIsUpdating(false);
        return;
      }
      formDataToSubmit.append("adminID", adminID);

      // Only send allowed fields
      const allowedFields = [
        "adminID", "name", "email", "phone", "designation", "department", "address", "dob", "gender", "religion", "category", "bloodgroup", "emergencyContact", "experience", "highestQualification", "AADHARnumber", "salary", "bankDetails"
      ];
      allowedFields.forEach((key) => {
        const value = formData[key];
        if (value !== undefined && value !== null && key !== "adminID") {
          if ((key === "emergencyContact" || key === "bankDetails") && typeof value === "object" && !Array.isArray(value)) {
            // Append nested fields using bracket notation
            Object.entries(value).forEach(([subKey, subValue]) => {
              if (subValue !== undefined && subValue !== null) {
                formDataToSubmit.append(`${key}[${subKey}]`, subValue);
              }
            });
          } else if (key === "dob") {
            formDataToSubmit.append(key, formatDateToInput(value));
          } else {
            formDataToSubmit.append(key, value);
          }
        }
      });

      // Append the photo file if it exists
      if (photo) {
        formDataToSubmit.append("photo", photo);
      }

      // Debug: log FormData content
      for (let pair of formDataToSubmit.entries()) {
        console.log(pair[0]+ ': ' + pair[1]);
      }

      console.log("Sending admin profile update request");
      const response = await axios.put(
        `${API_URL}/api/admin/auth/updateadmininfo`,
        formDataToSubmit,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data", // Ensure correct content type for file upload
          },
        }
      );

      setAdminData(response.data.admin);
      setIsEditing(false);
      toast.success(response.data.message || "Profile updated successfully!");
    } catch (err) {
      if (err.response?.data?.errors) {
        // Backend validation errors (array)
        setValidationErrors(
          err.response.data.errors.reduce((acc, curr) => {
            acc[curr.field] = curr.message;
            return acc;
          }, {})
        );
        toast.error("Validation errors occurred. Please check the form.");
      } else {
        toast.error(err.response?.data?.message || "Failed to update profile.");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="textCenter">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="textCenter">
        <h4>Error</h4>
        <p>{error}</p>
      </div>
    );
  }

  const handleBack = () => {
    navigate(-1); // Navigate back to the previous page
  };

  return (
    <div className="admin-profile-container mt-5">
      <h2 className="text-center text-primary mb-4">Manage Profile</h2>
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
      <Card className="shadow-sm">
        {!isEditing ? (
          <div className="p-4">
            <Row>
              <Col md={4} className="text-center">
                <Image
                  src={`${API_URL}/uploads/Admin/${adminData.photo}`}
                  alt="Admin Profile"
                  className="rounded-circle mb-3"
                  style={{
                    width: "150px",
                    height: "150px",
                    objectFit: "cover",
                  }}
                />
                <h5 className="mt-2">{adminData.name || "N/A"}</h5>
                <p className="text-muted">{adminData.designation || "N/A"}</p>
              </Col>
              <Col md={8}>
                <Table bordered hover>
                  <tbody>
                    <tr>
                      <th>Role</th>
                      <td>{adminData.role || "N/A"}</td>
                    </tr>
                    <tr>
                      <th>Gender</th>
                      <td>{adminData.gender || "N/A"}</td>
                    </tr>
                    <tr>
                      <th>Department</th>
                      <td>{adminData.department || "N/A"}</td>
                    </tr>
                    <tr>
                      <th>Email</th>
                      <td>{adminData.email || "N/A"}</td>
                    </tr>
                    <tr>
                      <th>Phone</th>
                      <td>{adminData.phone || "N/A"}</td>
                    </tr>
                    <tr>
                      <th>Address</th>
                      <td>{adminData.address || "N/A"}</td>
                    </tr>
                    <tr>
                      <th>AADHAR Number</th>
                      <td>{adminData.AADHARnumber || "N/A"}</td>
                    </tr>
                    <tr>
                      <th>Blood Group</th>
                      <td>{adminData.bloodgroup || "N/A"}</td>
                    </tr>
                    <tr>
                      <th>Category</th>
                      <td>{adminData.category || "N/A"}</td>
                    </tr>
                    <tr>
                      <th>Religion</th>
                      <td>{adminData.religion || "N/A"}</td>
                    </tr>
                    <tr>
                      <th>Highest Qualification</th>
                      <td>{adminData.highestQualification || "N/A"}</td>
                    </tr>
                    <tr>
                      <th>Experience</th>
                      <td>{adminData.experience || "N/A"} years</td>
                    </tr>

                    <tr>
                      <th>Salary</th>
                      <td>₹{adminData.salary || "N/A"}</td>
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
              <ChangeAdminPassword />
            </div>
          </div>
        ) : (
          <Form onSubmit={handleFormSubmit} className="p-4">
            {/* Show all validation errors at the top if any */}
            {Object.values(validationErrors).length > 0 && (
              <Alert variant="danger">
                <ul style={{ marginBottom: 0 }}>
                  {Object.entries(validationErrors).map(([field, msg]) => (
                    <li key={field}><strong>{field}:</strong> {msg}</li>
                  ))}
                </ul>
              </Alert>
            )}
            <Row>
              <Col md={6}>
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
              </Col>
              <Col md={6}>
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
              </Col>
            </Row>
            <Row>
              <Col md={6}>
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
              </Col>
              <Col md={6}>
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
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group controlId="formAADHARnumber">
                  <Form.Label>AADHAR Number</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter AADHAR number"
                    name="AADHARnumber"
                    value={formData.AADHARnumber || ""}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="formPhoto">
                  <Form.Label>Profile Photo</Form.Label>
                  <Form.Control
                    type="file"
                    name="photo"
                    onChange={handlePhotoChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
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
              </Col>
              <Col md={6}>
                <Form.Group controlId="formAddress">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter address"
                    name="address"
                    value={formData.address || ""}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group controlId="formDOB">
                  <Form.Label>Date of Birth</Form.Label>
                  <Form.Control
                    type="date"
                    name="dob"
                    value={formData.dob ? formData.dob.slice(0, 10) : ""}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="formGender">
                  <Form.Label>Gender</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter gender"
                    name="gender"
                    value={formData.gender || ""}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
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
              <Col md={6}>
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
            </Row>
            <Row>
              <Col md={6}>
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
              <Col md={6}>
                <Form.Group controlId="formEmergencyContactName">
                  <Form.Label>Emergency Contact Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter emergency contact name"
                    name="emergencyContact.name"
                    value={formData.emergencyContact?.name || ""}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group controlId="formEmergencyContactRelation">
                  <Form.Label>Emergency Contact Relation</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter relation"
                    name="emergencyContact.relation"
                    value={formData.emergencyContact?.relation || ""}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="formEmergencyContactPhone">
                  <Form.Label>Emergency Contact Phone</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter emergency contact phone"
                    name="emergencyContact.phone"
                    value={formData.emergencyContact?.phone || ""}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group controlId="formExperience">
                  <Form.Label>Experience (in years)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Enter years of experience"
                    name="experience"
                    value={formData.experience || ""}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group controlId="formHighestQualification">
                  <Form.Label>Highest Qualification</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter highest qualification"
                    name="highestQualification"
                    value={formData.highestQualification || ""}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group controlId="formSalary">
                  <Form.Label>Salary</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Enter salary"
                    name="salary"
                    value={formData.salary || ""}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Row>
                <Col md={12}>
                  <h5 className="mb-3">
                    Bank Details
                    <span
                      className="toggle-eye"
                      onClick={toggleShowBankDetails}
                    >
                      {showBankDetails ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </h5>
                </Col>
              </Row>
              <Row></Row>
              <Col md={6}>
                <Form.Group controlId="formBankDetailsAccountNumber">
                  <Form.Label>Bank Account Number</Form.Label>
                  <Form.Control
                    type={showBankDetails ? "text" : "password"}
                    placeholder="Enter bank account number"
                    name="bankDetails.accountNumber"
                    value={formData.bankDetails?.accountNumber || ""}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group controlId="formBankDetailsBankName">
                  <Form.Label>Bank Name</Form.Label>
                  <Form.Control
                    type={showBankDetails ? "text" : "password"}
                    placeholder="Enter bank name"
                    name="bankDetails.bankName"
                    value={formData.bankDetails?.bankName || ""}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="formBankDetailsIFSCCode">
                  <Form.Label>IFSC Code</Form.Label>
                  <Form.Control
                    type={showBankDetails ? "text" : "password"}
                    placeholder="Enter IFSC code"
                    name="bankDetails.ifscCode"
                    value={formData.bankDetails?.ifscCode || ""}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="text-center mt-4">
              <Button type="submit" variant="primary" disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Save Changes"}
              </Button>
            </div>
          </Form>
        )}
      </Card>
      <ToastContainer />
    </div>
  );
};

export default AdminProfileManage;
