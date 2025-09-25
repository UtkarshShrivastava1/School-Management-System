import React, { useMemo, useState } from "react";
import "./TeacherRegisterForm.css";
import { Modal, Button, Image } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaArrowLeft } from "react-icons/fa";

// ⬅️ Centralized API client
import api from "../../../../services/api";

const TeacherRegisterForm = () => {
  const navigate = useNavigate();

  // Base URL (for showing uploaded image in modal)
  const API_URL = useMemo(
    () =>
      process.env.REACT_APP_NODE_ENV === "production"
        ? process.env.REACT_APP_PRODUCTION_URL
        : process.env.REACT_APP_DEVELOPMENT_URL,
    []
  );

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
    experience: "0",
    highestQualification: "",
    AADHARnumber: "",
    salary: "0",
    bankDetails: {
      accountNumber: "",
      bankName: "",
      ifscCode: "",
    },
    photo: null,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [serverErrors, setServerErrors] = useState([]); // express-validator errors
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const handleBack = () => {
    navigate("/admin/admin-dashboard", {
      state: { activeTab: "User Registration" },
    });
  };

  // ---------- client-side validation ----------
  const validators = {
    email: (v) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Invalid email format",
    phone: (v) =>
      /^\d{10}$/.test(v) ? "" : "Phone number must be exactly 10 digits",
    "emergencyContact.phone": (v) =>
      /^\d{10}$/.test(v)
        ? ""
        : "Emergency contact phone must be exactly 10 digits",
    AADHARnumber: (v) =>
      /^\d{12}$/.test(v) ? "" : "AADHAR number must be exactly 12 digits",
    salary: (v) =>
      !isNaN(v) && Number(v) >= 0 ? "" : "Salary must be a non-negative number",
    experience: (v) =>
      !isNaN(v) && Number(v) >= 0
        ? ""
        : "Experience must be a non-negative number",
  };

  const required = [
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
    "emergencyContact.name",
    "emergencyContact.relation",
    "emergencyContact.phone",
    "experience",
    "highestQualification",
    "AADHARnumber",
    "salary",
    "bankDetails.accountNumber",
    "bankDetails.bankName",
    "bankDetails.ifscCode",
  ];

  const getValue = (path) => {
    const parts = path.split(".");
    return parts.reduce((acc, k) => (acc ? acc[k] : undefined), formData);
  };

  const setValue = (path, value) => {
    const parts = path.split(".");
    if (parts.length === 1) {
      setFormData((p) => ({ ...p, [path]: value }));
    } else {
      setFormData((p) => {
        const clone = { ...p };
        let cur = clone;
        for (let i = 0; i < parts.length - 1; i++) {
          cur[parts[i]] = { ...(cur[parts[i]] || {}) };
          cur = cur[parts[i]];
        }
        cur[parts[parts.length - 1]] = value;
        return clone;
      });
    }
  };

  const validateForm = () => {
    const errs = {};

    // required check
    required.forEach((key) => {
      const val = getValue(key);
      if (val === null || val === undefined || String(val).trim() === "") {
        errs[key] = "This field is required";
      }
    });

    // format checks
    Object.entries(validators).forEach(([k, fn]) => {
      const v = getValue(k);
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        const msg = fn(String(v).trim());
        if (msg) errs[k] = msg;
      }
    });

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ---------- handlers ----------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setServerErrors([]);
    setValue(name, value);

    // live-validate that single field
    const check =
      validators[name] ||
      (required.includes(name)
        ? (v) => (String(v).trim() ? "" : "This field is required")
        : null);
    if (check) {
      const msg = check(value);
      setFieldErrors((p) => ({ ...p, [name]: msg || "" }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setServerErrors([]);
    setFormData((p) => ({ ...p, photo: file }));
  };

  // Build FormData with dot-notation for nested fields (matches your backend)
  const buildFormData = (data) => {
    const fd = new FormData();
    const append = (prefix, val) => {
      if (val === undefined || val === null) return;
      if (val instanceof File) {
        fd.append(prefix, val);
      } else if (Array.isArray(val)) {
        val.forEach((v, i) => append(`${prefix}[${i}]`, v));
      } else if (typeof val === "object") {
        Object.keys(val).forEach((k) => append(`${prefix}.${k}`, val[k]));
      } else {
        fd.append(prefix, val);
      }
    };
    Object.keys(data).forEach((k) => append(k, data[k]));
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerErrors([]);
    if (!validateForm()) {
      toast.error("Please correct the highlighted errors.", {
        position: "top-center",
        theme: "colored",
      });
      return;
    }

    setLoading(true);
    try {
      const body = buildFormData({
        ...formData,
        // normalize numeric inputs
        salary: String(parseFloat(formData.salary || "0") || 0),
        experience: String(parseFloat(formData.experience || "0") || 0),
      });

      // ⬅️ central api client handles token header automatically
      const data = await api.upload("/api/admin/auth/createteacher", body, {
        headers: { "X-User-Role": "admin" },
      });

      // success payload is { message, teacher }
      setSuccessData(data);
      setShowModal(true);
      toast.success("Teacher created successfully!", {
        position: "top-center",
        theme: "colored",
      });
    } catch (err) {
      // Our api.js normalizes errors to { status, message, data, raw }
      const backend = err?.data || {};
      const valErrors = backend?.errors || [];

      // express-validator detailed errors
      if (Array.isArray(valErrors) && valErrors.length) {
        setServerErrors(valErrors);
        valErrors.forEach((e) => {
          // e.param, e.msg, e.value
          toast.error(`${e.param}: ${e.msg}`, {
            position: "top-center",
            theme: "colored",
          });
          // highlight field inline if it exists on the form
          if (e.param) {
            setFieldErrors((p) => ({ ...p, [e.param]: e.msg }));
          }
        });
      } else {
        // other errors (dup key etc.)
        const msg = backend?.message || err?.message || "Request failed";
        setServerErrors([{ msg }]);
        toast.error(msg, { position: "top-center", theme: "colored" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    navigate("/admin/admin-dashboard", {
      state: { activeTab: "User Registration" },
    });
  };

  const handlePrint = () => {
    const el = document.getElementById("modalContent");
    if (!el) return;
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
        <body>${el.outerHTML}</body>
      </html>
    `);
    w.document.close();
    w.print();
  };

  // helper for input classes
  const cls = (name) =>
    fieldErrors[name] ? "invalid" : fieldErrors[name] === "" ? "valid" : "";

  return (
    <div className="teacher-register-form">
      {/* back */}
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

      <h2>Create New Teacher</h2>

      <form onSubmit={handleSubmit} noValidate>
        {!!serverErrors.length && (
          <div className="error-messages">
            {serverErrors.map((e, i) => (
              <p key={i} style={{ color: "red" }}>
                {e.param ? `${e.param}: ${e.msg}` : e.msg}
              </p>
            ))}
          </div>
        )}

        {/* Basic fields */}
        <div>
          <label>Name</label>
          <input
            className={cls("name")}
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          {fieldErrors.name && (
            <span className="error-text">{fieldErrors.name}</span>
          )}
        </div>

        <div>
          <label>Email</label>
          <input
            className={cls("email")}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          {fieldErrors.email && (
            <span className="error-text">{fieldErrors.email}</span>
          )}
        </div>

        <div>
          <label>Phone</label>
          <input
            className={cls("phone")}
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            maxLength={10}
            placeholder="10-digit phone number"
          />
          {fieldErrors.phone && (
            <span className="error-text">{fieldErrors.phone}</span>
          )}
        </div>

        <div>
          <label>Designation</label>
          <input
            className={cls("designation")}
            type="text"
            name="designation"
            value={formData.designation}
            onChange={handleChange}
            required
          />
          {fieldErrors.designation && (
            <span className="error-text">{fieldErrors.designation}</span>
          )}
        </div>

        <div>
          <label>Address</label>
          <input
            className={cls("address")}
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
          {fieldErrors.address && (
            <span className="error-text">{fieldErrors.address}</span>
          )}
        </div>

        <div>
          <label>Date of Birth</label>
          <input
            className={cls("dob")}
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            required
          />
          {fieldErrors.dob && (
            <span className="error-text">{fieldErrors.dob}</span>
          )}
        </div>

        <div>
          <label>Gender</label>
          <select
            className={cls("gender")}
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
          >
            <option value="">Select Gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
          {fieldErrors.gender && (
            <span className="error-text">{fieldErrors.gender}</span>
          )}
        </div>

        <div>
          <label>Department</label>
          <input
            className={cls("department")}
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            required
          />
          {fieldErrors.department && (
            <span className="error-text">{fieldErrors.department}</span>
          )}
        </div>

        <div>
          <label>Religion</label>
          <input
            className={cls("religion")}
            type="text"
            name="religion"
            value={formData.religion}
            onChange={handleChange}
            required
          />
          {fieldErrors.religion && (
            <span className="error-text">{fieldErrors.religion}</span>
          )}
        </div>

        <div>
          <label>Category</label>
          <input
            className={cls("category")}
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          />
          {fieldErrors.category && (
            <span className="error-text">{fieldErrors.category}</span>
          )}
        </div>

        <div>
          <label>Blood Group</label>
          <input
            className={cls("bloodgroup")}
            type="text"
            name="bloodgroup"
            value={formData.bloodgroup}
            onChange={handleChange}
            required
          />
          {fieldErrors.bloodgroup && (
            <span className="error-text">{fieldErrors.bloodgroup}</span>
          )}
        </div>

        {/* Emergency Contact */}
        <div>
          <label>Emergency Contact Name</label>
          <input
            className={cls("emergencyContact.name")}
            type="text"
            name="emergencyContact.name"
            value={formData.emergencyContact.name}
            onChange={handleChange}
            required
          />
          {fieldErrors["emergencyContact.name"] && (
            <span className="error-text">
              {fieldErrors["emergencyContact.name"]}
            </span>
          )}
        </div>

        <div>
          <label>Emergency Contact Relation</label>
          <input
            className={cls("emergencyContact.relation")}
            type="text"
            name="emergencyContact.relation"
            value={formData.emergencyContact.relation}
            onChange={handleChange}
            required
          />
          {fieldErrors["emergencyContact.relation"] && (
            <span className="error-text">
              {fieldErrors["emergencyContact.relation"]}
            </span>
          )}
        </div>

        <div>
          <label>Emergency Contact Phone</label>
          <input
            className={cls("emergencyContact.phone")}
            type="text"
            name="emergencyContact.phone"
            value={formData.emergencyContact.phone}
            onChange={handleChange}
            required
            maxLength={10}
            placeholder="10-digit phone number"
          />
          {fieldErrors["emergencyContact.phone"] && (
            <span className="error-text">
              {fieldErrors["emergencyContact.phone"]}
            </span>
          )}
        </div>

        {/* Professional */}
        <div>
          <label>Experience</label>
          <input
            className={cls("experience")}
            type="number"
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            required
          />
          {fieldErrors.experience && (
            <span className="error-text">{fieldErrors.experience}</span>
          )}
        </div>

        <div>
          <label>Highest Qualification</label>
          <input
            className={cls("highestQualification")}
            type="text"
            name="highestQualification"
            value={formData.highestQualification}
            onChange={handleChange}
            required
          />
          {fieldErrors.highestQualification && (
            <span className="error-text">
              {fieldErrors.highestQualification}
            </span>
          )}
        </div>

        <div>
          <label>AADHAR Number</label>
          <input
            className={cls("AADHARnumber")}
            type="text"
            name="AADHARnumber"
            value={formData.AADHARnumber}
            onChange={handleChange}
            required
            maxLength={12}
            placeholder="12-digit AADHAR number"
          />
          {fieldErrors.AADHARnumber && (
            <span className="error-text">{fieldErrors.AADHARnumber}</span>
          )}
        </div>

        <div>
          <label>Salary</label>
          <input
            className={cls("salary")}
            type="number"
            name="salary"
            value={formData.salary}
            onChange={handleChange}
            required
            min="0"
            placeholder="Enter salary amount"
          />
          {fieldErrors.salary && (
            <span className="error-text">{fieldErrors.salary}</span>
          )}
        </div>

        {/* Bank */}
        <div>
          <label>Bank Account Number</label>
          <input
            className={cls("bankDetails.accountNumber")}
            type="text"
            name="bankDetails.accountNumber"
            value={formData.bankDetails.accountNumber}
            onChange={handleChange}
            required
          />
          {fieldErrors["bankDetails.accountNumber"] && (
            <span className="error-text">
              {fieldErrors["bankDetails.accountNumber"]}
            </span>
          )}
        </div>

        <div>
          <label>Bank Name</label>
          <input
            className={cls("bankDetails.bankName")}
            type="text"
            name="bankDetails.bankName"
            value={formData.bankDetails.bankName}
            onChange={handleChange}
            required
          />
          {fieldErrors["bankDetails.bankName"] && (
            <span className="error-text">
              {fieldErrors["bankDetails.bankName"]}
            </span>
          )}
        </div>

        <div>
          <label>IFSC Code</label>
          <input
            className={cls("bankDetails.ifscCode")}
            type="text"
            name="bankDetails.ifscCode"
            value={formData.bankDetails.ifscCode}
            onChange={handleChange}
            required
          />
          {fieldErrors["bankDetails.ifscCode"] && (
            <span className="error-text">
              {fieldErrors["bankDetails.ifscCode"]}
            </span>
          )}
        </div>

        {/* Photo */}
        <div>
          <label>Upload Photo</label>
          <input type="file" name="photo" onChange={handleFileChange} />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Teacher"}
        </button>
      </form>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Teacher Registered Successfully</Modal.Title>
        </Modal.Header>
        <Modal.Body id="modalContent">
          {successData?.teacher ? (
            <>
              <div
                className="photo-section"
                style={{ textAlign: "center", marginBottom: 20 }}
              >
                <Image
                  src={
                    successData.teacher.photo
                      ? `${API_URL}/uploads/Teacher/${successData.teacher.photo}`
                      : `${process.env.PUBLIC_URL}/placeholders/user-placeholder.png`
                  }
                  alt="Teacher Profile"
                  onError={(e) => {
                    e.currentTarget.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%23cccccc'/%3E%3Cpath d='M75 75 Q95 45 115 75 L115 115 L35 115 L35 75 Q55 45 75 75' fill='%23888888'/%3E%3Ccircle cx='75' cy='45' r='20' fill='%23888888'/%3E%3C/svg%3E";
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
                <h2>Teacher Details</h2>

                <div
                  style={{
                    borderBottom: "1px solid #ddd",
                    paddingBottom: 5,
                    marginBottom: 10,
                  }}
                >
                  <h3>Basic Information</h3>
                  <p>
                    <strong>Name:</strong> {successData.teacher.name}
                  </p>
                  <p>
                    <strong>Teacher ID:</strong> {successData.teacher.teacherID}
                  </p>
                  <p>
                    <strong>Email:</strong>{" "}
                    {successData.teacher.email || "Not Provided"}
                  </p>
                  <p>
                    <strong>Phone:</strong>{" "}
                    {successData.teacher.phone || "Not Provided"}
                  </p>
                  <p>
                    <strong>Role:</strong> teacher
                  </p>
                  <p>
                    <strong>Password:</strong> {"teacher123"}
                    <span style={{ color: "red", fontWeight: "bold" }}>
                      {"  (Please change after first login)"}
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
                    {successData.teacher.designation || "Not Provided"}
                  </p>
                  <p>
                    <strong>Department:</strong>{" "}
                    {successData.teacher.department || "Not Provided"}
                  </p>
                  <p>
                    <strong>Highest Qualification:</strong>{" "}
                    {successData.teacher.highestQualification || "Not Provided"}
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
                    {successData.teacher.address || "Not Provided"}
                  </p>
                  <p>
                    <strong>Date of Birth:</strong>{" "}
                    {successData.teacher.dob
                      ? new Date(successData.teacher.dob).toLocaleDateString()
                      : "Not Provided"}
                  </p>
                  <p>
                    <strong>Gender:</strong>{" "}
                    {successData.teacher.gender || "Not Provided"}
                  </p>
                  <p>
                    <strong>Religion:</strong>{" "}
                    {successData.teacher.religion || "Not Provided"}
                  </p>
                  <p>
                    <strong>Category:</strong>{" "}
                    {successData.teacher.category || "Not Provided"}
                  </p>
                  <p>
                    <strong>Blood Group:</strong>{" "}
                    {successData.teacher.bloodgroup || "Not Provided"}
                  </p>
                  <p>
                    <strong>AADHAR Number:</strong>{" "}
                    {successData.teacher.AADHARnumber || "Not Provided"}
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
                    {successData.teacher.registeredBy
                      ? `${successData.teacher.registeredBy.name} (ID: ${successData.teacher.registeredBy.adminID})`
                      : "Unknown"}
                  </p>
                  <p>
                    <strong>Registered At:</strong>{" "}
                    {successData.teacher.createdAt
                      ? new Date(successData.teacher.createdAt).toLocaleString()
                      : new Date().toLocaleString()}
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

export default TeacherRegisterForm;
