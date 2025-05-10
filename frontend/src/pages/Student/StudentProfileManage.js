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
import ChangeStudentPassword from "../../components/Student/ChangeStudentPassword";

const StudentProfileManage = () => {
  const [formData, setFormData] = useState({
    studentName: "",
    studentEmail: "",
    studentPhone: "",
    studentGender: "",
    studentDOB: "",
    studentAddress: "",
    studentFatherName: "",
    studentMotherName: "",
    bloodgroup: "",
    religion: "",
    category: "",
    emergencyContact: {
      name: "",
      relation: "",
      phone: ""
    }
  });
  const [photoFile, setPhotoFile] = useState(null);

  const [studentData, setStudentData] = useState(null);
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
    const fetchStudentData = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication token is missing. Please log in.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `${API_URL}/api/student/auth/studentprofile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setStudentData(response.data.student);
        setFormData(response.data.student);
        setError(null);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch student data."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
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
      setFormData(prev => ({
        ...prev,
        [name]: value
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
    
    // Ensure studentID is included
    formDataToSubmit.append("studentID", studentData.studentID);
    
    // Append all form fields
    Object.keys(formData).forEach((key) => {
      if (key === 'emergencyContact') {
        formDataToSubmit.append(key, JSON.stringify(formData[key]));
      } else {
        formDataToSubmit.append(key, formData[key]);
      }
    });
    
    // Append photo file if it exists
    if (photoFile) {
      formDataToSubmit.append("photo", photoFile);
    }

    const token = localStorage.getItem("token");
    try {
      console.log("Sending profile update request");
      const response = await axios.put(
        `${API_URL}/api/student/auth/studentprofile`,
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
      setStudentData(response.data.student);
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
      <h2 className="text-center mb-4">Manage Student Profile</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {!isEditing ? (
        <div className="p-4">
          <Row>
            <Col md={4} className="text-center">
              <Image
                src={`${API_URL}/uploads/Student/${studentData?.photo}`}
                alt="Student Profile"
                className="rounded-circle mb-3"
                style={{ width: "150px", height: "150px", objectFit: "cover" }}
              />
              <h5 className="mt-2">{studentData?.studentName || "N/A"}</h5>
              <p className="text-muted">{studentData?.studentID || "N/A"}</p>
            </Col>
            <Col md={8}>
              <Table bordered hover>
                <tbody>
                  <tr>
                    <th>Email</th>
                    <td>{studentData?.studentEmail || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Phone</th>
                    <td>{studentData?.studentPhone || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Gender</th>
                    <td>{studentData?.studentGender || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Date of Birth</th>
                    <td>
                      {studentData?.studentDOB
                        ? new Date(studentData.studentDOB).toLocaleDateString()
                        : "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <th>Address</th>
                    <td>{studentData?.studentAddress || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Father's Name</th>
                    <td>{studentData?.studentFatherName || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Mother's Name</th>
                    <td>{studentData?.studentMotherName || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Blood Group</th>
                    <td>{studentData?.bloodgroup || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Religion</th>
                    <td>{studentData?.religion || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Category</th>
                    <td>{studentData?.category || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Emergency Contact</th>
                    <td>
                      {studentData?.emergencyContact ? (
                        <>
                          <div>Name: {studentData.emergencyContact.name}</div>
                          <div>Relation: {studentData.emergencyContact.relation}</div>
                          <div>Phone: {studentData.emergencyContact.phone}</div>
                        </>
                      ) : (
                        "N/A"
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
            <ChangeStudentPassword />
          </div>
        </div>
      ) : (
        <Form onSubmit={handleFormSubmit} className="p-4">
          {[
            { name: "studentName", label: "Name" },
            { name: "studentEmail", label: "Email", type: "email" },
            { name: "studentPhone", label: "Phone" },
            { name: "studentGender", label: "Gender" },
            { name: "studentDOB", label: "Date of Birth", type: "date" },
            { name: "studentAddress", label: "Address" },
            { name: "studentFatherName", label: "Father's Name" },
            { name: "studentMotherName", label: "Mother's Name" },
            { name: "bloodgroup", label: "Blood Group" },
            { name: "religion", label: "Religion" },
            { name: "category", label: "Category" },
          ].map(({ name, label, type = "text" }) => (
            <Form.Group controlId={`form-${name}`} key={name}>
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

          <h4 className="mt-4">Emergency Contact</h4>
          {[
            { name: "emergencyContact.name", label: "Name" },
            { name: "emergencyContact.relation", label: "Relation" },
            { name: "emergencyContact.phone", label: "Phone" },
          ].map(({ name, label }) => (
            <Form.Group controlId={`form-${name}`} key={name}>
              <Form.Label>{label}</Form.Label>
              <Form.Control
                type="text"
                placeholder={`Enter ${label.toLowerCase()}`}
                name={name}
                value={formData.emergencyContact?.[name.split('.')[1]] || ""}
                onChange={handleInputChange}
              />
            </Form.Group>
          ))}

          <Form.Group controlId="formPhoto">
            <Form.Label>Profile Photo</Form.Label>
            <Form.Control
              type="file"
              name="photo"
              onChange={handleFileChange}
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

export default StudentProfileManage;
