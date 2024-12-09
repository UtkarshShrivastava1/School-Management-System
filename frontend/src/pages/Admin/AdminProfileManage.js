import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./AdminProfileManage.module.css";
import { Button, Form, Spinner, Card } from "react-bootstrap"; // Added Bootstrap components
import ChangeAdminPassword from "../../components/Admin/ChangeAdminPassword";

const AdminProfileManage = () => {
  // State variables
  const [adminData, setAdminData] = useState(null); // Stores admin profile data
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state
  const [isEditing, setIsEditing] = useState(false); // Toggle edit mode
  const [formData, setFormData] = useState({}); // Form data for editing
  const [isUpdating, setIsUpdating] = useState(false); // Update state
  const [photo, setPhoto] = useState(null); // Profile photo file

  // Fetch admin data on component mount
  useEffect(() => {
    const fetchAdminData = async () => {
      console.log("Fetching admin data...");
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("Authentication token is missing.");
        setError("Authentication token is missing. Please log in.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          "http://localhost:5000/api/admin/auth/adminprofile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const fetchedData = response.data.admin;
        console.log("Admin data fetched successfully:", fetchedData);
        setAdminData(fetchedData);
        setFormData(fetchedData); // Initialize form data for editing
        setError(null);
      } catch (err) {
        console.error("Error fetching admin data:", err);
        setError(err.response?.data?.message || "Failed to fetch admin data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  // Handle input changes for the form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Input changed: ${name} = ${value}`);
    setFormData({ ...formData, [name]: value });
  };

  // Handle photo selection
  const handlePhotoChange = (e) => {
    console.log("Profile photo selected:", e.target.files[0]);
    setPhoto(e.target.files[0]);
  };

  // Toggle edit mode
  const handleEditToggle = () => {
    console.log("Toggling edit mode:", !isEditing);
    setIsEditing(!isEditing);
    if (!isEditing) setFormData(adminData); // Reset form data if editing is canceled
  };

  // Handle form submission for profile update
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting form data...");
    setIsUpdating(true);

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Authentication token is missing.");
      alert("Authentication token is missing. Please log in.");
      setIsUpdating(false);
      return;
    }

    try {
      const formDataToSubmit = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSubmit.append(key, value);
      });
      if (photo) {
        formDataToSubmit.append("photo", photo);
      }

      console.log("Form data to submit:", formDataToSubmit);

      const response = await axios.put(
        "http://localhost:5000/api/admin/auth/updateadmininfo",
        formDataToSubmit,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Profile updated successfully:", response.data.admin);
      setAdminData(response.data.admin);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    console.log("Loading admin data...");
    return (
      <div className={styles.textCenter}>
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) {
    console.error("Error encountered:", error);
    return (
      <div className={styles.textCenter}>
        <h4>Error</h4>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h2 className="text-center text-primary mb-4">Manage Profile</h2>
      <Card className="shadow-sm">
        {!isEditing ? (
          <div className="p-4">
            <div className="d-flex justify-content-center">
              <img
                src={`http://localhost:5000/uploads/Admin/${adminData.photo}`}
                alt="Admin Profile"
                className="rounded-circle mb-3"
                style={{ width: "120px", height: "120px", objectFit: "cover" }}
              />
            </div>
            <h5 className="text-center">{adminData.name || "N/A"}</h5>
            <div className="text-center">
              <p>
                <strong>Designation:</strong> {adminData.designation || "N/A"}
              </p>
              <p>
                <strong>Department:</strong> {adminData.department || "N/A"}
              </p>
              <p>
                <strong>Email:</strong> {adminData.email || "N/A"}
              </p>
              <p>
                <strong>Phone:</strong> {adminData.phone || "N/A"}
              </p>
              <p>
                <strong>Address:</strong> {adminData.address || "N/A"}
              </p>
            </div>
            <div className="text-center">
              <Button
                onClick={handleEditToggle}
                variant="primary"
                disabled={isUpdating}
              >
                Edit Profile
              </Button>
              <ChangeAdminPassword /> {/* Added Change Password Button */}
            </div>
          </div>
        ) : (
          <Form
            onSubmit={handleFormSubmit}
            encType="multipart/form-data"
            className="p-4"
          >
            <Form.Group controlId="formName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="formDesignation">
              <Form.Label>Designation</Form.Label>
              <Form.Control
                type="text"
                name="designation"
                value={formData.designation || ""}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group controlId="formDepartment">
              <Form.Label>Department</Form.Label>
              <Form.Control
                type="text"
                name="department"
                value={formData.department || ""}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group controlId="formEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="formPhone">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                type="tel"
                name="phone"
                value={formData.phone || ""}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group controlId="formAddress">
              <Form.Label>Address</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={formData.address || ""}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group controlId="formPhoto">
              <Form.Label>Profile Photo</Form.Label>
              <Form.Control type="file" onChange={handlePhotoChange} />
            </Form.Group>
            <div className="d-flex justify-content-between mt-3">
              <Button type="submit" variant="success" disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleEditToggle}
                disabled={isUpdating}
              >
                Cancel
              </Button>
            </div>
          </Form>
        )}
      </Card>
    </div>
  );
};

export default AdminProfileManage;
