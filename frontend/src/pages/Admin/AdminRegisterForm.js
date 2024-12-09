import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Modal, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./AdminRegisterForm.css"; // Import styles for the page

const AdminRegisterForm = ({ userRole = "admin" }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    designation: "",
    address: "",
    dob: "",
    gender: "",
    photo: null,
    department: "",
    role: "admin",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [successData, setSuccessData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [globalError, setGlobalError] = useState("");

  // Fetch user details on mount
  useEffect(() => {
    const fetchUserData = async () => {
      console.log("Fetching user data..."); // Log fetching attempt
      const token = localStorage.getItem("token");

      if (!token) {
        setGlobalError("Authentication token is missing. Please log in.");
        console.error("Authentication token is missing.");
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:5000/api/admin/auth/adminprofile`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUser(response.data[userRole]);
        console.log("User data fetched successfully:", response.data); // Log success
      } catch (err) {
        setGlobalError(
          err.response?.data?.message || "Failed to fetch user data."
        );
        console.error("Error fetching user data:", err); // Log error
      }
    };

    fetchUserData();
  }, [userRole]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    console.log(`Form data updated: ${name} = ${value || files[0]?.name}`); // Log form data change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting form..."); // Log form submission attempt
    const formDataToSubmit = new FormData();
    Object.keys(formData).forEach((key) => {
      formDataToSubmit.append(key, formData[key]);
    });

    try {
      const response = await axios.post(
        "http://localhost:5000/api/admin/auth/createadmin",
        formDataToSubmit,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setSuccessData(response.data.data);
      setShowModal(true);
      console.log("Admin registered successfully:", response.data); // Log success
    } catch (err) {
      setFieldErrors(err.response?.data?.errors || {});
      setGlobalError(
        err.response?.data?.message || "Failed to register admin."
      );
      console.error("Error registering admin:", err); // Log error
    }
  };

  const handleCloseModal = () => {
    console.log("Closing modal and redirecting to admin dashboard..."); // Log modal close
    setShowModal(false);
    setTimeout(() => navigate("/admin-dashboard"), 300);
  };

  const handlePrint = () => {
    console.log("Printing details..."); // Log print action
    const printContent = document.getElementById("modalContent");
    const printWindow = window.open("", "_blank");
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="admin-register-page">
      <h1>Register New Admin</h1>
      {globalError && <p className="error-message">{globalError}</p>}{" "}
      {fieldErrors.global && (
        <p className="error-message">{fieldErrors.global}</p>
      )}
      <form onSubmit={handleSubmit} className="admin-register-form">
        {/* Form Fields */}
        <div className={`form-group ${fieldErrors.name ? "has-error" : ""}`}>
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          {fieldErrors.name && (
            <span className="error-text">{fieldErrors.name}</span>
          )}
        </div>
        <div className={`form-group ${fieldErrors.email ? "has-error" : ""}`}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          {fieldErrors.email && (
            <span className="error-text">{fieldErrors.email}</span>
          )}
        </div>
        <div className={`form-group ${fieldErrors.phone ? "has-error" : ""}`}>
          <label htmlFor="phone">Phone</label>
          <input
            type="text"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          {fieldErrors.phone && (
            <span className="error-text">{fieldErrors.phone}</span>
          )}
        </div>
        <div
          className={`form-group ${fieldErrors.designation ? "has-error" : ""}`}
        >
          <label htmlFor="designation">Designation</label>
          <input
            type="text"
            id="designation"
            name="designation"
            value={formData.designation}
            onChange={handleChange}
            required
          />
          {fieldErrors.designation && (
            <span className="error-text">{fieldErrors.designation}</span>
          )}
        </div>
        <div className={`form-group ${fieldErrors.address ? "has-error" : ""}`}>
          <label htmlFor="address">Address</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
          {fieldErrors.address && (
            <span className="error-text">{fieldErrors.address}</span>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="dob">Date of Birth</label>
          <input
            type="date"
            id="dob"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="gender">Gender</label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="photo">Photo (Optional)</label>
          <input
            type="file"
            id="photo"
            name="photo"
            onChange={handleChange}
            accept="image/*"
          />
        </div>
        <div
          className={`form-group ${fieldErrors.department ? "has-error" : ""}`}
        >
          <label htmlFor="department">Department</label>
          <input
            type="text"
            id="department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            required
          />
          {fieldErrors.department && (
            <span className="error-text">{fieldErrors.department}</span>
          )}
        </div>
        <button type="submit" className="btn-submit">
          Register Admin
        </button>
      </form>
      {/* Modal for Success Message */}
      {/* Modal for Success Message */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Admin Registered Successfully</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Display photo if available */}
          {successData?.photo && (
            <div
              className="photo-section"
              style={{ textAlign: "center", marginBottom: "20px" }}
            >
              <img
                src={`http://localhost:5000/uploads/Admin/${successData.photo}`}
                alt={`${successData?.name || "Admin"}'s profile`}
                style={{
                  width: "150px",
                  height: "150px",
                  borderRadius: "50%",
                  border: "3px solid #000",
                }}
              />
            </div>
          )}

          <div className="modal-content" id="modalContent">
            <p>
              <strong>Name:</strong> {successData?.name || "N/A"}
            </p>
            <p>
              <strong>Admin ID:</strong> {successData?.adminID || "N/A"}
            </p>
            <p>
              <strong>Password:</strong> {successData?.defaultPassword || "N/A"}
              <span className="password-warning">
                {" "}
                (Please change after first login)
              </span>
            </p>
            <p>
              <strong>Designation:</strong> {successData?.designation || "N/A"}
            </p>
            <p>
              <strong>Department:</strong> {successData?.department || "N/A"}
            </p>
            <p>
              <strong>Date of Birth:</strong> {successData?.dob || "N/A"}
            </p>
            <p>
              <strong>Gender:</strong> {successData?.gender || "N/A"}
            </p>
            <p>
              <strong>Registration Date:</strong>{" "}
              {successData?.createdAt
                ? new Date(successData?.createdAt).toLocaleString()
                : "N/A"}
            </p>
            <p>
              <strong>Registered By:</strong> {user?.name || "N/A"}
            </p>
          </div>

          <Button onClick={handlePrint} variant="primary" className="btn-print">
            Print Details
          </Button>
        </Modal.Body>

        <Modal.Footer>
          <div style={{ textAlign: "left", width: "100%" }}>
            <p>
              <strong>Registered By:</strong> {user?.name || "N/A"} -{" "}
              {user?.role || "N/A"}
            </p>
          </div>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminRegisterForm;
