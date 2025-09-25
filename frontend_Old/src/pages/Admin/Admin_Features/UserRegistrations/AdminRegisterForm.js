// src/pages/AdminRegisterForm.js
import React, { useState } from "react";
import "./AdminRegisterForm.css";
import { Modal, Button, Image } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaArrowLeft } from "react-icons/fa";

// ✅ centralized API client
import api from "../../../../services/api";

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

  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Where uploads are served from (server.js mounts /uploads to ./uploads)
  const API_BASE =
    process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL
      : process.env.REACT_APP_DEVELOPMENT_URL;

  const handleBack = () => {
    navigate("/admin/admin-dashboard", {
      state: { activeTab: "User Registration" },
    });
  };

  /* ------------------------------- Validation ------------------------------ */
  const validateField = (name, value) => {
    let error = "";
    if (!value || String(value).trim() === "") {
      error = "This field is required";
    } else {
      switch (name) {
        case "email":
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            error = "Invalid email format";
          }
          break;
        case "phone":
          if (!/^\d{10}$/.test(value)) {
            error = "Phone must be 10 digits";
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

  const validateNestedField = (parent, name, value) => {
    let error = "";
    if (!value || String(value).trim() === "") {
      error = "This field is required";
    } else if (parent === "emergencyContact" && name === "phone") {
      if (!/^\d{10}$/.test(value)) {
        error = "Invalid phone number (10 digits)";
      }
    }
    return error;
  };

  const validateForm = () => {
    const newErrors = {};

    Object.keys(formData).forEach((key) => {
      if (key === "emergencyContact" || key === "bankDetails") {
        Object.keys(formData[key]).forEach((subKey) => {
          const err = validateNestedField(key, subKey, formData[key][subKey]);
          if (err) newErrors[`${key}.${subKey}`] = err;
        });
      } else if (key === "photo") {
        if (formData.photo) {
          const allowed = ["image/jpeg", "image/png", "image/jpg"];
          if (!allowed.includes(formData.photo.type)) {
            newErrors.photo = "Only JPG, JPEG, and PNG files are allowed";
          }
        }
      } else {
        const err = validateField(key, formData[key]);
        if (err) newErrors[key] = err;
      }
    });

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* -------------------------------- Handlers ------------------------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
      setFieldErrors((prev) => ({
        ...prev,
        [name]: validateNestedField(parent, child, value),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      setFieldErrors((prev) => ({
        ...prev,
        [name]: validateField(name, value),
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setTouched((prev) => ({ ...prev, photo: true }));

    if (file) {
      const allowed = ["image/jpeg", "image/png", "image/jpg"];
      if (!allowed.includes(file.type)) {
        setFieldErrors((prev) => ({
          ...prev,
          photo: "Only JPG, JPEG, and PNG files are allowed",
        }));
        setFormData((prev) => ({ ...prev, photo: null }));
        return;
      }
      setFieldErrors((prev) => ({ ...prev, photo: "" }));
      setFormData((prev) => ({ ...prev, photo: file }));
    } else {
      setFormData((prev) => ({ ...prev, photo: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form.", {
        position: "top-center",
        theme: "colored",
      });
      return;
    }

    setLoading(true);
    setErrors([]);

    try {
      // Build multipart form data
      const fd = new FormData();

      // Simple fields
      [
        "name",
        "email",
        "phone",
        "designation",
        "address",
        "dob",
        "gender",
        "department",
        "religion",
        "category",
        "bloodgroup",
        "experience",
        "highestQualification",
        "AADHARnumber",
        "salary",
      ].forEach((key) => fd.append(key, formData[key] ?? ""));

      // Nested as JSON strings — controller should JSON.parse them if they’re strings
      fd.append(
        "emergencyContact",
        JSON.stringify(formData.emergencyContact || {})
      );
      fd.append("bankDetails", JSON.stringify(formData.bankDetails || {}));

      // Photo (optional)
      if (formData.photo) {
        fd.append("photo", formData.photo);
      }

      // POST using centralized api client
      const data = await api.upload("/api/admin/auth/createadmin", fd);

      setSuccessData(data);
      setShowModal(true);

      toast.success("Admin created successfully!", {
        position: "top-center",
        theme: "colored",
      });
    } catch (err) {
      const serverErrors = err?.data?.errors || [];
      const message =
        err?.message || "Failed to create admin. Please try again.";
      setErrors(serverErrors.length ? serverErrors : [{ msg: message }]);

      toast.error(message, { position: "top-center", theme: "colored" });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    navigate("/admin/admin-dashboard");
  };

  const handlePrint = () => {
    const printContent = document.getElementById("modalContent");
    if (!printContent) return;

    const w = window.open("", "_blank");
    w.document.write(`
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
        <body>${printContent.outerHTML}</body>
      </html>
    `);
    w.document.close();
    w.print();
  };

  const inputClass = (name) =>
    touched[name] ? (fieldErrors[name] ? "invalid" : "valid") : "";

  const created = successData?.data; // backend returns { message, token, data, defaultPassword? }
  const defaultPwd = successData?.defaultPassword || "admin123"; // will show real one in non-prod if backend sends it
  const photoURL = created?.photo
    ? `${API_BASE}/uploads/Admin/${created.photo}`
    : `${process.env.PUBLIC_URL}/placeholders/user-placeholder.png`;

  return (
    <div className="admin-register-form">
      <div className="back-button" style={{ marginBottom: "20px" }}>
        <FaArrowLeft
          onClick={handleBack}
          size={24}
          style={{ cursor: "pointer", color: "#007bff", marginRight: "10px" }}
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

      {errors.length > 0 && (
        <div className="error-messages">
          {errors.map((e, i) => (
            <p key={i} style={{ color: "red" }}>
              {e.msg || e.message}
            </p>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Basic fields */}
        <div>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
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
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
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
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
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
            name="designation"
            value={formData.designation}
            onChange={handleChange}
            onBlur={() => setTouched((t) => ({ ...t, designation: true }))}
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
            name="address"
            value={formData.address}
            onChange={handleChange}
            onBlur={() => setTouched((t) => ({ ...t, address: true }))}
            className={inputClass("address")}
            required
          />
        </div>

        <div>
          <label htmlFor="dob">Date of Birth</label>
          <input
            id="dob"
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            onBlur={() => setTouched((t) => ({ ...t, dob: true }))}
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
            onBlur={() => setTouched((t) => ({ ...t, gender: true }))}
            className={inputClass("gender")}
            required
          >
            <option value="">Select Gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
          {touched.gender && fieldErrors.gender && (
            <span className="error-text">{fieldErrors.gender}</span>
          )}
        </div>

        <div>
          <label htmlFor="department">Department</label>
          <input
            id="department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            onBlur={() => setTouched((t) => ({ ...t, department: true }))}
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
            name="religion"
            value={formData.religion}
            onChange={handleChange}
            onBlur={() => setTouched((t) => ({ ...t, religion: true }))}
            className={inputClass("religion")}
            required
          />
        </div>

        <div>
          <label htmlFor="category">Category</label>
          <input
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            onBlur={() => setTouched((t) => ({ ...t, category: true }))}
            className={inputClass("category")}
            required
          />
        </div>

        <div>
          <label htmlFor="bloodgroup">Blood Group</label>
          <input
            id="bloodgroup"
            name="bloodgroup"
            value={formData.bloodgroup}
            onChange={handleChange}
            onBlur={() => setTouched((t) => ({ ...t, bloodgroup: true }))}
            className={inputClass("bloodgroup")}
            required
          />
        </div>

        {/* Emergency Contact */}
        <div>
          <label htmlFor="emergencyContact.name">Emergency Contact Name</label>
          <input
            id="emergencyContact.name"
            name="emergencyContact.name"
            value={formData.emergencyContact.name}
            onChange={handleChange}
            onBlur={() =>
              setTouched((t) => ({ ...t, "emergencyContact.name": true }))
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
            name="emergencyContact.relation"
            value={formData.emergencyContact.relation}
            onChange={handleChange}
            onBlur={() =>
              setTouched((t) => ({ ...t, "emergencyContact.relation": true }))
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
            name="emergencyContact.phone"
            value={formData.emergencyContact.phone}
            onChange={handleChange}
            onBlur={() =>
              setTouched((t) => ({ ...t, "emergencyContact.phone": true }))
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

        {/* Other fields */}
        <div>
          <label htmlFor="experience">Experience</label>
          <input
            id="experience"
            type="number"
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            onBlur={() => setTouched((t) => ({ ...t, experience: true }))}
            className={inputClass("experience")}
            required
          />
        </div>

        <div>
          <label htmlFor="highestQualification">Highest Qualification</label>
          <input
            id="highestQualification"
            name="highestQualification"
            value={formData.highestQualification}
            onChange={handleChange}
            onBlur={() =>
              setTouched((t) => ({ ...t, highestQualification: true }))
            }
            className={inputClass("highestQualification")}
            required
          />
        </div>

        <div>
          <label htmlFor="AADHARnumber">AADHAR Number</label>
          <input
            id="AADHARnumber"
            name="AADHARnumber"
            value={formData.AADHARnumber}
            onChange={handleChange}
            onBlur={() => setTouched((t) => ({ ...t, AADHARnumber: true }))}
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
            onBlur={() => setTouched((t) => ({ ...t, salary: true }))}
            className={inputClass("salary")}
            required
          />
        </div>

        {/* Bank */}
        <div>
          <label htmlFor="bankDetails.accountNumber">Bank Account Number</label>
          <input
            id="bankDetails.accountNumber"
            name="bankDetails.accountNumber"
            value={formData.bankDetails.accountNumber}
            onChange={handleChange}
            onBlur={() =>
              setTouched((t) => ({ ...t, "bankDetails.accountNumber": true }))
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
            name="bankDetails.bankName"
            value={formData.bankDetails.bankName}
            onChange={handleChange}
            onBlur={() =>
              setTouched((t) => ({ ...t, "bankDetails.bankName": true }))
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
            name="bankDetails.ifscCode"
            value={formData.bankDetails.ifscCode}
            onChange={handleChange}
            onBlur={() =>
              setTouched((t) => ({ ...t, "bankDetails.ifscCode": true }))
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

        {/* Photo */}
        <div>
          <label htmlFor="photo">Upload Photo</label>
          <input
            id="photo"
            type="file"
            name="photo"
            onChange={handleFileChange}
            onBlur={() => setTouched((t) => ({ ...t, photo: true }))}
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

      {/* Success modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Admin Registered Successfully</Modal.Title>
        </Modal.Header>
        <Modal.Body id="modalContent">
          {created ? (
            <>
              <div
                className="photo-section"
                style={{ textAlign: "center", marginBottom: 20 }}
              >
                <Image
                  src={photoURL}
                  alt="Admin Profile"
                  onError={(e) => {
                    e.currentTarget.src = `${process.env.PUBLIC_URL}/placeholders/user-placeholder.png`;
                  }}
                  style={{
                    width: 150,
                    height: 150,
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
                    paddingBottom: 5,
                    marginBottom: 10,
                  }}
                >
                  <h3>Basic Information</h3>
                  <p>
                    <strong>Name:</strong> {created.name}
                  </p>
                  <p>
                    <strong>Admin ID:</strong> {created.adminID}
                  </p>
                  <p>
                    <strong>Email:</strong> {created.email || "Not Provided"}
                  </p>
                  <p>
                    <strong>Phone:</strong> {created.phone || "Not Provided"}
                  </p>
                  <p>
                    <strong>Role:</strong> {created.role || "Admin"}
                  </p>
                  <p>
                    <strong>Default Password:</strong> {defaultPwd}{" "}
                    <span style={{ color: "red", fontWeight: "bold" }}>
                      (Please change after first login)
                    </span>
                  </p>
                </div>

                <div
                  style={{
                    borderBottom: "1px solid #ddd",
                    paddingBottom: 5,
                    marginBottom: 10,
                  }}
                >
                  <h3>Professional Information</h3>
                  <p>
                    <strong>Designation:</strong>{" "}
                    {created.designation || "Not Provided"}
                  </p>
                  <p>
                    <strong>Department:</strong>{" "}
                    {created.department || "Not Provided"}
                  </p>
                  <p>
                    <strong>Highest Qualification:</strong>{" "}
                    {created.highestQualification || "Not Provided"}
                  </p>
                </div>

                <div
                  style={{
                    borderBottom: "1px solid #ddd",
                    paddingBottom: 5,
                    marginBottom: 10,
                  }}
                >
                  <h3>Personal Information</h3>
                  <p>
                    <strong>Address:</strong>{" "}
                    {created.address || "Not Provided"}
                  </p>
                  <p>
                    <strong>Date of Birth:</strong>{" "}
                    {created.dob
                      ? new Date(created.dob).toLocaleDateString()
                      : "Not Provided"}
                  </p>
                  <p>
                    <strong>Gender:</strong> {created.gender || "Not Provided"}
                  </p>
                  <p>
                    <strong>Religion:</strong>{" "}
                    {created.religion || "Not Provided"}
                  </p>
                  <p>
                    <strong>Category:</strong>{" "}
                    {created.category || "Not Provided"}
                  </p>
                  <p>
                    <strong>Blood Group:</strong>{" "}
                    {created.bloodgroup || "Not Provided"}
                  </p>
                  <p>
                    <strong>AADHAR Number:</strong>{" "}
                    {created.AADHARnumber || "Not Provided"}
                  </p>
                </div>

                <div
                  style={{
                    borderBottom: "1px solid #ddd",
                    paddingBottom: 5,
                    marginBottom: 10,
                  }}
                >
                  <h3>Registration Information</h3>
                  <p>
                    <strong>Registered By:</strong>{" "}
                    {created.registeredBy
                      ? `${created.registeredBy.name} (ID: ${created.registeredBy.adminID})`
                      : "Unknown"}
                  </p>
                  <p>
                    <strong>Registered At:</strong>{" "}
                    {new Date(created.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={handlePrint}
                style={{
                  marginTop: 20,
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
