import React, { useState } from "react";
import axios from "axios";
import "./AdminRegisterForm.css";
import { Modal, Button, Image } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaArrowLeft } from "react-icons/fa";

const AdminRegisterForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    designation: "",
    address: "",
    dob: "",
    gender: "",
    department: "",
    religion: "",
    category: "",
    bloodgroup: "",
    emergencyContact: {
      name: "",
      relation: "",
      phone: "",
    },
    experience: "",
    highestQualification: "",
    AADHARnumber: "",
    salary: "",
    bankDetails: {
      accountNumber: "",
      bankName: "",
      ifscCode: "",
    },
    photo: null,
  });

  // Server-side errors
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // Client-side field errors and touched state for validation feedback
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  // API URL controller
  const API_URL =
    process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL
      : process.env.REACT_APP_DEVELOPMENT_URL;

  // Navigate back to dashboard
  const handleBack = () => {
    navigate("/admin/admin-dashboard", {
      state: { activeTab: "User Registration" },
    });
  };

  // Validate simple fields
  const validateField = (name, value) => {
    let error = "";
    if (!value || value.trim() === "") {
      error = "This field is required";
    } else {
      switch (name) {
        case "email":
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            error = "Invalid email format";
          }
          break;
        case "phone":
          if (!/^[+\d]?(?:[\d\s\-().]*)$/.test(value)) {
            error = "Invalid phone number";
          }
          break;
        case "AADHARnumber":
          if (!/^\d{12}$/.test(value)) {
            error = "AADHAR number must be 12 digits";
          }
          break;
        case "experience":
        case "salary":
          if (isNaN(value) || Number(value) < 0) {
            error = "Invalid number";
          }
          break;
        default:
          break;
      }
    }
    return error;
  };

  // Validate nested fields (e.g., emergencyContact, bankDetails)
  const validateNestedField = (parent, name, value) => {
    let error = "";
    if (!value || value.trim() === "") {
      error = "This field is required";
    } else {
      if (parent === "emergencyContact" && name === "phone") {
        if (!/^[+\d]?(?:[\d\s\-().]*)$/.test(value)) {
          error = "Invalid phone number";
        }
      }
      // Additional nested validations can be added here.
    }
    return error;
  };

  // Validate the entire form and update fieldErrors state
  const validateForm = () => {
    const newErrors = {};

    Object.keys(formData).forEach((key) => {
      if (key === "emergencyContact" || key === "bankDetails") {
        Object.keys(formData[key]).forEach((subKey) => {
          const fieldName = `${key}.${subKey}`;
          const error = validateNestedField(key, subKey, formData[key][subKey]);
          if (error) {
            newErrors[fieldName] = error;
          }
        });
      } else if (key === "photo") {
        if (formData.photo) {
          const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
          if (!allowedTypes.includes(formData.photo.type)) {
            newErrors.photo = "Only JPG, JPEG, and PNG files are allowed";
          }
        }
      } else {
        const error = validateField(key, formData[key]);
        if (error) {
          newErrors[key] = error;
        }
      }
    });

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change for both simple and nested fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
      const error = validateNestedField(parent, child, value);
      setFieldErrors((prev) => ({ ...prev, [name]: error }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      const error = validateField(name, value);
      setFieldErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  // Handle file selection and validate file type
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setTouched((prev) => ({ ...prev, photo: true }));
    if (file) {
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!allowedTypes.includes(file.type)) {
        setFieldErrors((prev) => ({
          ...prev,
          photo: "Only JPG, JPEG, and PNG files are allowed",
        }));
        setFormData((prev) => ({ ...prev, photo: null }));
        return;
      } else {
        setFieldErrors((prev) => ({ ...prev, photo: "" }));
      }
      setFormData((prev) => ({ ...prev, photo: file }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors in the form.", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
      return;
    }
    setLoading(true);

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === "emergencyContact" || key === "bankDetails") {
        Object.keys(formData[key]).forEach((subKey) => {
          formDataToSend.append(`${key}.${subKey}`, formData[key][subKey]);
        });
      } else {
        formDataToSend.append(key, formData[key]);
      }
    });

    try {
      const response = await axios.post(
        `${API_URL}/api/admin/auth/createadmin`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setSuccessData(response.data);
      setShowModal(true);
      toast.success("Admin created successfully!", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
    } catch (error) {
      const errData = error.response?.data || {
        errors: [{ msg: error.message }],
      };
      setErrors(errData.errors || [{ msg: error.message }]);
      toast.error("Failed to create admin. Please try again.", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
    } finally {
      setLoading(false);
    }
  };

  // Close modal and navigate back to admin dashboard
  const handleCloseModal = () => {
    setShowModal(false);
    setTimeout(() => navigate("/admin/admin-dashboard"), 300);
  };

  // Print modal content
  const handlePrint = () => {
    const printContent = document.getElementById("modalContent");
    if (printContent) {
      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Details</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .photo-section { text-align: center; margin-bottom: 20px; }
            .photo-section img { width: 150px; height: 150px; object-fit: cover; border-radius: 50%; border: 2px solid #007bff; margin-bottom: 20px; }
            p { margin: 10px 0; font-size: 16px; }
            strong { color: #007bff; }
            span { color: red; }
            button { display: none; }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
        </body>
      </html>
    `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Determine input class for visual feedback
  const inputClass = (name) => {
    if (touched[name]) {
      return fieldErrors[name] ? "invalid" : "valid";
    }
    return "";
  };

  return (
    <div className="admin-register-form">
      <div className="back-button" style={{ marginBottom: "20px" }}>
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
          style={{
            cursor: "pointer",
            fontSize: "18px",
            fontWeight: "bold",
            verticalAlign: "middle",
            color: "#007bff",
          }}
        >
          Back
        </span>
      </div>
      <h2>Create New Admin</h2>
      <form onSubmit={handleSubmit} noValidate>
        {errors.length > 0 && (
          <div className="error-messages">
            {errors.map((error, index) => (
              <p key={index} style={{ color: "red" }}>
                {error.msg}
              </p>
            ))}
          </div>
        )}

        <div>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
            className={inputClass("name")}
            required
          />
          {touched.name && fieldErrors.name && (
            <span className="error-text">{fieldErrors.name}</span>
          )}
        </div>

        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
            className={inputClass("email")}
            required
          />
          {touched.email && fieldErrors.email && (
            <span className="error-text">{fieldErrors.email}</span>
          )}
        </div>

        <div>
          <label htmlFor="phone">Phone</label>
          <input
            id="phone"
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
            className={inputClass("phone")}
            required
          />
          {touched.phone && fieldErrors.phone && (
            <span className="error-text">{fieldErrors.phone}</span>
          )}
        </div>

        <div>
          <label htmlFor="designation">Designation</label>
          <input
            id="designation"
            type="text"
            name="designation"
            value={formData.designation}
            onChange={handleChange}
            onBlur={() =>
              setTouched((prev) => ({ ...prev, designation: true }))
            }
            className={inputClass("designation")}
            required
          />
          {touched.designation && fieldErrors.designation && (
            <span className="error-text">{fieldErrors.designation}</span>
          )}
        </div>

        <div>
          <label htmlFor="address">Address</label>
          <input
            id="address"
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            onBlur={() => setTouched((prev) => ({ ...prev, address: true }))}
            className={inputClass("address")}
            required
          />
          {touched.address && fieldErrors.address && (
            <span className="error-text">{fieldErrors.address}</span>
          )}
        </div>

        <div>
          <label htmlFor="dob">Date of Birth</label>
          <input
            id="dob"
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            onBlur={() => setTouched((prev) => ({ ...prev, dob: true }))}
            className={inputClass("dob")}
            required
          />
          {touched.dob && fieldErrors.dob && (
            <span className="error-text">{fieldErrors.dob}</span>
          )}
        </div>

        <div>
          <label htmlFor="gender">Gender</label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            onBlur={() => setTouched((prev) => ({ ...prev, gender: true }))}
            className={inputClass("gender")}
            required
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          {touched.gender && fieldErrors.gender && (
            <span className="error-text">{fieldErrors.gender}</span>
          )}
        </div>

        <div>
          <label htmlFor="department">Department</label>
          <input
            id="department"
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            onBlur={() => setTouched((prev) => ({ ...prev, department: true }))}
            className={inputClass("department")}
            required
          />
          {touched.department && fieldErrors.department && (
            <span className="error-text">{fieldErrors.department}</span>
          )}
        </div>

        <div>
          <label htmlFor="religion">Religion</label>
          <input
            id="religion"
            type="text"
            name="religion"
            value={formData.religion}
            onChange={handleChange}
            onBlur={() => setTouched((prev) => ({ ...prev, religion: true }))}
            className={inputClass("religion")}
            required
          />
          {touched.religion && fieldErrors.religion && (
            <span className="error-text">{fieldErrors.religion}</span>
          )}
        </div>

        <div>
          <label htmlFor="category">Category</label>
          <input
            id="category"
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            onBlur={() => setTouched((prev) => ({ ...prev, category: true }))}
            className={inputClass("category")}
            required
          />
          {touched.category && fieldErrors.category && (
            <span className="error-text">{fieldErrors.category}</span>
          )}
        </div>

        <div>
          <label htmlFor="bloodgroup">Blood Group</label>
          <input
            id="bloodgroup"
            type="text"
            name="bloodgroup"
            value={formData.bloodgroup}
            onChange={handleChange}
            onBlur={() => setTouched((prev) => ({ ...prev, bloodgroup: true }))}
            className={inputClass("bloodgroup")}
            required
          />
          {touched.bloodgroup && fieldErrors.bloodgroup && (
            <span className="error-text">{fieldErrors.bloodgroup}</span>
          )}
        </div>

        <div>
          <label htmlFor="emergencyContact.name">Emergency Contact Name</label>
          <input
            id="emergencyContact.name"
            type="text"
            name="emergencyContact.name"
            value={formData.emergencyContact.name}
            onChange={handleChange}
            onBlur={() =>
              setTouched((prev) => ({
                ...prev,
                "emergencyContact.name": true,
              }))
            }
            className={inputClass("emergencyContact.name")}
            required
          />
          {touched["emergencyContact.name"] &&
            fieldErrors["emergencyContact.name"] && (
              <span className="error-text">
                {fieldErrors["emergencyContact.name"]}
              </span>
            )}
        </div>

        <div>
          <label htmlFor="emergencyContact.relation">
            Emergency Contact Relation
          </label>
          <input
            id="emergencyContact.relation"
            type="text"
            name="emergencyContact.relation"
            value={formData.emergencyContact.relation}
            onChange={handleChange}
            onBlur={() =>
              setTouched((prev) => ({
                ...prev,
                "emergencyContact.relation": true,
              }))
            }
            className={inputClass("emergencyContact.relation")}
            required
          />
          {touched["emergencyContact.relation"] &&
            fieldErrors["emergencyContact.relation"] && (
              <span className="error-text">
                {fieldErrors["emergencyContact.relation"]}
              </span>
            )}
        </div>

        <div>
          <label htmlFor="emergencyContact.phone">
            Emergency Contact Phone
          </label>
          <input
            id="emergencyContact.phone"
            type="text"
            name="emergencyContact.phone"
            value={formData.emergencyContact.phone}
            onChange={handleChange}
            onBlur={() =>
              setTouched((prev) => ({
                ...prev,
                "emergencyContact.phone": true,
              }))
            }
            className={inputClass("emergencyContact.phone")}
            required
          />
          {touched["emergencyContact.phone"] &&
            fieldErrors["emergencyContact.phone"] && (
              <span className="error-text">
                {fieldErrors["emergencyContact.phone"]}
              </span>
            )}
        </div>

        <div>
          <label htmlFor="experience">Experience</label>
          <input
            id="experience"
            type="number"
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            onBlur={() => setTouched((prev) => ({ ...prev, experience: true }))}
            className={inputClass("experience")}
            required
          />
          {touched.experience && fieldErrors.experience && (
            <span className="error-text">{fieldErrors.experience}</span>
          )}
        </div>

        <div>
          <label htmlFor="highestQualification">Highest Qualification</label>
          <input
            id="highestQualification"
            type="text"
            name="highestQualification"
            value={formData.highestQualification}
            onChange={handleChange}
            onBlur={() =>
              setTouched((prev) => ({ ...prev, highestQualification: true }))
            }
            className={inputClass("highestQualification")}
            required
          />
          {touched.highestQualification && fieldErrors.highestQualification && (
            <span className="error-text">
              {fieldErrors.highestQualification}
            </span>
          )}
        </div>

        <div>
          <label htmlFor="AADHARnumber">AADHAR Number</label>
          <input
            id="AADHARnumber"
            type="text"
            name="AADHARnumber"
            value={formData.AADHARnumber}
            onChange={handleChange}
            onBlur={() =>
              setTouched((prev) => ({ ...prev, AADHARnumber: true }))
            }
            className={inputClass("AADHARnumber")}
            required
          />
          {touched.AADHARnumber && fieldErrors.AADHARnumber && (
            <span className="error-text">{fieldErrors.AADHARnumber}</span>
          )}
        </div>

        <div>
          <label htmlFor="salary">Salary</label>
          <input
            id="salary"
            type="number"
            name="salary"
            value={formData.salary}
            onChange={handleChange}
            onBlur={() => setTouched((prev) => ({ ...prev, salary: true }))}
            className={inputClass("salary")}
            required
          />
          {touched.salary && fieldErrors.salary && (
            <span className="error-text">{fieldErrors.salary}</span>
          )}
        </div>

        <div>
          <label htmlFor="bankDetails.accountNumber">Bank Account Number</label>
          <input
            id="bankDetails.accountNumber"
            type="text"
            name="bankDetails.accountNumber"
            value={formData.bankDetails.accountNumber}
            onChange={handleChange}
            onBlur={() =>
              setTouched((prev) => ({
                ...prev,
                "bankDetails.accountNumber": true,
              }))
            }
            className={inputClass("bankDetails.accountNumber")}
            required
          />
          {touched["bankDetails.accountNumber"] &&
            fieldErrors["bankDetails.accountNumber"] && (
              <span className="error-text">
                {fieldErrors["bankDetails.accountNumber"]}
              </span>
            )}
        </div>

        <div>
          <label htmlFor="bankDetails.bankName">Bank Name</label>
          <input
            id="bankDetails.bankName"
            type="text"
            name="bankDetails.bankName"
            value={formData.bankDetails.bankName}
            onChange={handleChange}
            onBlur={() =>
              setTouched((prev) => ({
                ...prev,
                "bankDetails.bankName": true,
              }))
            }
            className={inputClass("bankDetails.bankName")}
            required
          />
          {touched["bankDetails.bankName"] &&
            fieldErrors["bankDetails.bankName"] && (
              <span className="error-text">
                {fieldErrors["bankDetails.bankName"]}
              </span>
            )}
        </div>

        <div>
          <label htmlFor="bankDetails.ifscCode">IFSC Code</label>
          <input
            id="bankDetails.ifscCode"
            type="text"
            name="bankDetails.ifscCode"
            value={formData.bankDetails.ifscCode}
            onChange={handleChange}
            onBlur={() =>
              setTouched((prev) => ({
                ...prev,
                "bankDetails.ifscCode": true,
              }))
            }
            className={inputClass("bankDetails.ifscCode")}
            required
          />
          {touched["bankDetails.ifscCode"] &&
            fieldErrors["bankDetails.ifscCode"] && (
              <span className="error-text">
                {fieldErrors["bankDetails.ifscCode"]}
              </span>
            )}
        </div>

        <div>
          <label htmlFor="photo">Upload Photo</label>
          <input
            id="photo"
            type="file"
            name="photo"
            onChange={handleFileChange}
            onBlur={() => setTouched((prev) => ({ ...prev, photo: true }))}
            className={inputClass("photo")}
            accept="image/jpeg,image/png,image/jpg"
          />
          {touched.photo && fieldErrors.photo && (
            <span className="error-text">{fieldErrors.photo}</span>
          )}
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Admin"}
        </button>
      </form>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Admin Registered Successfully</Modal.Title>
        </Modal.Header>
        <Modal.Body id="modalContent">
          {successData?.data ? (
            <>
              <div
                className="photo-section"
                style={{ textAlign: "center", marginBottom: "20px" }}
              >
                <Image
                  src={`${API_URL}/uploads/Admin/${successData.data.photo}`}
                  alt="Admin Profile"
                  onError={(e) =>
                    (e.target.src = "https://via.placeholder.com/150")
                  }
                  style={{
                    width: "150px",
                    height: "150px",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              </div>
              <div>
                <h2>Admin Details</h2>
                <div
                  style={{
                    borderBottom: "1px solid #ddd",
                    paddingBottom: "5px",
                    marginBottom: "10px",
                  }}
                >
                  <h3>Basic Information</h3>
                  <p>
                    <strong>Name:</strong> {successData.data.name}
                  </p>
                  <p>
                    <strong>Admin ID:</strong> {successData.data.adminID}
                  </p>
                  <p>
                    <strong>Email:</strong>{" "}
                    {successData.data.email || "Not Provided"}
                  </p>
                  <p>
                    <strong>Phone:</strong>{" "}
                    {successData.data.phone || "Not Provided"}
                  </p>
                  <p>
                    <strong>Role:</strong> {successData.data.role || "Admin"}
                  </p>
                  <p>
                    <strong>Password:</strong>{" "}
                    {successData.data.password || "admin123"}{" "}
                    <span style={{ color: "red", fontWeight: "bold" }}>
                      (Please change after first login)
                    </span>
                  </p>
                </div>
                <div
                  style={{
                    borderBottom: "1px solid #ddd",
                    paddingBottom: "5px",
                    marginBottom: "10px",
                  }}
                >
                  <h3>Professional Information</h3>
                  <p>
                    <strong>Designation:</strong>{" "}
                    {successData.data.designation || "Not Provided"}
                  </p>
                  <p>
                    <strong>Department:</strong>{" "}
                    {successData.data.department || "Not Provided"}
                  </p>
                  <p>
                    <strong>Highest Qualification:</strong>{" "}
                    {successData.data.highestQualification || "Not Provided"}
                  </p>
                </div>
                <div
                  style={{
                    borderBottom: "1px solid #ddd",
                    paddingBottom: "5px",
                    marginBottom: "10px",
                  }}
                >
                  <h3>Personal Information</h3>
                  <p>
                    <strong>Address:</strong>{" "}
                    {successData.data.address || "Not Provided"}
                  </p>
                  <p>
                    <strong>Date of Birth:</strong>{" "}
                    {successData.data.dob
                      ? new Date(successData.data.dob).toLocaleDateString()
                      : "Not Provided"}
                  </p>
                  <p>
                    <strong>Gender:</strong>{" "}
                    {successData.data.gender || "Not Provided"}
                  </p>
                  <p>
                    <strong>Religion:</strong>{" "}
                    {successData.data.religion || "Not Provided"}
                  </p>
                  <p>
                    <strong>Category:</strong>{" "}
                    {successData.data.category || "Not Provided"}
                  </p>
                  <p>
                    <strong>Blood Group:</strong>{" "}
                    {successData.data.bloodgroup || "Not Provided"}
                  </p>
                  <p>
                    <strong>AADHAR Number:</strong>{" "}
                    {successData.data.AADHARnumber || "Not Provided"}
                  </p>
                </div>
                <div
                  style={{
                    borderBottom: "1px solid #ddd",
                    paddingBottom: "5px",
                    marginBottom: "10px",
                  }}
                >
                  <h3>Registration Information</h3>
                  <p>
                    <strong>Registered By:</strong>{" "}
                    {successData.data.registeredBy
                      ? `${successData.data.registeredBy.name} (ID: ${successData.data.registeredBy.adminID})`
                      : "Unknown"}
                  </p>
                  <p>
                    <strong>Registered At:</strong>{" "}
                    {new Date(successData.data.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                onClick={handlePrint}
                style={{
                  marginTop: "20px",
                  display: "block",
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                Print Details
              </Button>
            </>
          ) : (
            <p>Loading...</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      <ToastContainer />
    </div>
  );
};

export default AdminRegisterForm;
