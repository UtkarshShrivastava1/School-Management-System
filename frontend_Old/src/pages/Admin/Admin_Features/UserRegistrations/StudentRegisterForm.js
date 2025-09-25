// src/pages/StudentRegisterForm.js
import React, { useMemo, useState } from "react";
import "./StudentRegisterForm.css";
import { Modal, Button, Image } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaArrowLeft } from "react-icons/fa";

// ✅ centralized API client (fix this relative path for your project)
import api from "../../../../services/api";

const StudentRegisterForm = () => {
  const navigate = useNavigate();

  // Base URL ONLY for showing uploaded images in the modal
  const API_URL = useMemo(
    () =>
      (process.env.REACT_APP_NODE_ENV || process.env.NODE_ENV) === "production"
        ? process.env.REACT_APP_PRODUCTION_URL
        : process.env.REACT_APP_DEVELOPMENT_URL,
    []
  );

  const [formData, setFormData] = useState({
    studentName: "",
    studentEmail: "",
    studentPhone: "",
    studentAddress: "",
    studentDOB: "",
    studentGender: "Male",
    religion: "",
    category: "",
    bloodgroup: "",
    studentFatherName: "",
    studentMotherName: "",
    relationship: "Mother",
    parentName: "",
    parentContactNumber: "",
    parentEmail: "",
    parentAddress: "",
    parentOccupation: "",
    photo: null,
    parentPhoto: null,
    className: "",
  });

  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const fieldLabels = {
    studentName: "Student Name",
    className: "Class",
    studentEmail: "Student Email",
    studentPhone: "Student Phone",
    studentAddress: "Student Address",
    studentDOB: "Student Date of Birth",
    studentGender: "Student Gender",
    studentFatherName: "Father's Name",
    studentMotherName: "Mother's Name",
    parentName: "Parent Name",
    parentContactNumber: "Parent Contact Number",
    parentEmail: "Parent Email",
    relationship: "Relationship",
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "photo" || name === "parentPhoto") {
      setFormData((prev) => ({ ...prev, [name]: files?.[0] || null }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBack = () => {
    navigate("/admin/admin-dashboard", {
      state: { activeTab: "User Registration" },
    });
  };

  const validate = () => {
    const clientErrors = [];

    [
      "studentName",
      "className",
      "studentEmail",
      "studentPhone",
      "studentAddress",
      "studentDOB",
      "studentGender",
      "studentFatherName",
      "studentMotherName",
      "parentName",
      "parentContactNumber",
      "parentEmail",
      "relationship",
    ].forEach((key) => {
      if (!formData[key] || String(formData[key]).trim() === "") {
        clientErrors.push({
          field: key,
          msg: `${fieldLabels[key] || key} is required`,
        });
      }
    });

    if (formData.studentPhone && !/^\d{10}$/.test(formData.studentPhone)) {
      clientErrors.push({
        field: "studentPhone",
        msg: "Student Phone must be 10 digits",
      });
    }
    if (
      formData.parentContactNumber &&
      !/^\d{10}$/.test(formData.parentContactNumber)
    ) {
      clientErrors.push({
        field: "parentContactNumber",
        msg: "Parent Contact Number must be 10 digits",
      });
    }
    if (
      formData.studentEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.studentEmail)
    ) {
      clientErrors.push({
        field: "studentEmail",
        msg: "Invalid Student Email format",
      });
    }
    if (
      formData.parentEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parentEmail)
    ) {
      clientErrors.push({
        field: "parentEmail",
        msg: "Invalid Parent Email format",
      });
    }

    setErrors(clientErrors);
    if (clientErrors.length) {
      toast.error(
        `Please fix ${clientErrors.length} error${
          clientErrors.length > 1 ? "s" : ""
        } in the form.`,
        { position: "top-center", theme: "colored" }
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors([]);

    const fd = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if ((key === "photo" || key === "parentPhoto") && value) {
        fd.append(key, value);
      } else {
        fd.append(key, value ?? "");
      }
    });

    try {
      const data = await api.upload("/api/admin/auth/createstudent", fd, {
        headers: { "X-User-Role": "admin" },
      });
      setSuccessData(data);
      setShowModal(true);

      toast.success("Student created successfully!", {
        position: "top-center",
        theme: "colored",
      });
    } catch (err) {
      const serverErrors =
        err?.data?.errors?.map((e) => ({
          field: e.param || e.field || "unknown",
          msg: e.msg || e.message || `${e.param || "Field"} is invalid`,
        })) || [];

      if (!serverErrors.length) {
        serverErrors.push({
          field: "server",
          msg: err?.message || "Failed to create student",
        });
      }

      setErrors(serverErrors);
      const headline =
        err?.data?.message ||
        (serverErrors.length
          ? serverErrors[0].msg
          : "Failed to create student.");
      toast.error(headline, { position: "top-center", theme: "colored" });
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
      <!doctype html><html><head><title>Print Details</title>
      <style>
        body{font-family:Arial,sans-serif;margin:20px}
        .photo-section{ text-align:center; margin-bottom:20px; }
        .photo-section img{ width:150px;height:150px;object-fit:cover;border-radius:50%;border:2px solid #007bff;margin-bottom:20px }
        p{ margin:8px 0; font-size:14px }
        strong{ color:#007bff }
        button{ display:none }
      </style>
      </head><body>${el.outerHTML}</body></html>
    `);
    w.document.close();
    w.print();
  };

  // ---- Data for modal (match backend shape) ----
  const student = successData?.student || null; // full student doc
  const parent = successData?.parent || null; // minimal: { parentID, parentEmail, parentContactNumber, parentName }
  // passwords from backend (fallbacks for dev convenience)
  const studentPassword = successData?.studentPassword || "student123";
  const parentPassword = successData?.parentPassword || "parent123";
  // Image URLs (student only; parent image not provided by backend payload)
  const studentPhotoURL = student?.photo
    ? `${API_URL}/uploads/Student/${student.photo}`
    : `${process.env.PUBLIC_URL}/placeholders/user-placeholder.png`;

  return (
    <div className="student-register-form">
      <div className="back-button" style={{ marginBottom: 20 }}>
        <FaArrowLeft
          onClick={handleBack}
          size={24}
          style={{ cursor: "pointer", color: "#007bff", marginRight: 10 }}
        />
        <span
          onClick={handleBack}
          style={{
            cursor: "pointer",
            fontSize: 18,
            fontWeight: "bold",
            color: "#007bff",
          }}
        >
          Back
        </span>
      </div>

      <h2>Register Student</h2>

      {errors.length > 0 && (
        <div className="error-messages">
          {errors.map((e, idx) => (
            <p key={idx} style={{ color: "red" }}>
              {e.field !== "server" ? <strong>{e.field}:</strong> : null}{" "}
              {e.msg}
            </p>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <h3>Student Information</h3>

        <div>
          <label>Student Name</label>
          <input
            name="studentName"
            value={formData.studentName}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Class</label>
          <select
            name="className"
            value={formData.className}
            onChange={handleChange}
            required
          >
            <option value="">Select a class</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={`Class ${i + 1}`}>
                {`Class ${i + 1}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Email</label>
          <input
            name="studentEmail"
            type="email"
            value={formData.studentEmail}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Phone</label>
          <input
            name="studentPhone"
            type="tel"
            value={formData.studentPhone}
            onChange={handleChange}
            required
            maxLength={10}
            placeholder="10-digit phone"
          />
        </div>

        <div>
          <label>Address</label>
          <input
            name="studentAddress"
            value={formData.studentAddress}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Date of Birth</label>
          <input
            name="studentDOB"
            type="date"
            value={formData.studentDOB}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Gender</label>
          <select
            name="studentGender"
            value={formData.studentGender}
            onChange={handleChange}
            required
          >
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>

        <div>
          <label>Religion</label>
          <input
            name="religion"
            value={formData.religion}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Category</label>
          <input
            name="category"
            value={formData.category}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Blood Group</label>
          <input
            name="bloodgroup"
            value={formData.bloodgroup}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Father's Name</label>
          <input
            name="studentFatherName"
            value={formData.studentFatherName}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Mother's Name</label>
          <input
            name="studentMotherName"
            value={formData.studentMotherName}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Upload Photo of Student</label>
          <input name="photo" type="file" onChange={handleChange} />
        </div>

        <h3>Parent Information</h3>
        <p style={{ color: "blue" }}>
          A parent account will be created automatically with a unique ID &
          password.
        </p>

        <div>
          <label>Relationship</label>
          <select
            name="relationship"
            value={formData.relationship}
            onChange={handleChange}
            required
          >
            <option value="Mother">Mother</option>
            <option value="Father">Father</option>
            <option value="Guardian">Guardian</option>
          </select>
        </div>

        <div>
          <label>Parent Name</label>
          <input
            name="parentName"
            value={formData.parentName}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Parent Contact</label>
          <input
            name="parentContactNumber"
            type="tel"
            value={formData.parentContactNumber}
            onChange={handleChange}
            required
            maxLength={10}
            placeholder="10-digit phone"
          />
        </div>

        <div>
          <label>Parent Email</label>
          <input
            name="parentEmail"
            type="email"
            value={formData.parentEmail}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Parent Address</label>
          <input
            name="parentAddress"
            value={formData.parentAddress}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Parent Occupation</label>
          <input
            name="parentOccupation"
            value={formData.parentOccupation}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Upload Photo of Parent</label>
          <input name="parentPhoto" type="file" onChange={handleChange} />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Student"}
        </button>
      </form>

      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {successData?.parent
              ? "Student and Parent Profiles Created"
              : "Student Profile Created"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body id="modalContent">
          {/* Student */}
          {student ? (
            <>
              <div
                className="photo-section"
                style={{ textAlign: "center", marginBottom: 20 }}
              >
                <Image
                  src={
                    student.photo
                      ? studentPhotoURL
                      : `${process.env.PUBLIC_URL}/placeholders/user-placeholder.png`
                  }
                  alt="Student"
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

              <h2>Student Details</h2>
              <div
                style={{
                  borderBottom: "1px solid #ddd",
                  paddingBottom: 5,
                  marginBottom: 10,
                }}
              >
                <p>
                  <strong>Name:</strong> {student.studentName || "—"}
                </p>
                <p>
                  <strong>Student ID:</strong> {student.studentID || "—"}
                </p>

                <p>
                  <strong>Password:</strong> {studentPassword}{" "}
                  <span style={{ color: "red", fontWeight: "bold" }}>
                    (Please change after first login)
                  </span>
                </p>
                <p>
                  <strong>Email:</strong> {student.studentEmail || "—"}
                </p>
                <p>
                  <strong>Phone:</strong> {student.studentPhone || "—"}
                </p>
                <p>
                  <strong>Class (requested):</strong>{" "}
                  {student.intendedClassName || "—"}
                </p>
                <p>
                  <strong>Address:</strong> {student.studentAddress || "—"}
                </p>
                <p>
                  <strong>Gender:</strong> {student.studentGender || "—"}
                </p>
                <p>
                  <strong>Blood Group:</strong> {student.bloodgroup || "—"}
                </p>
                <p>
                  <strong>Category:</strong> {student.category || "—"}
                </p>
                <p>
                  <strong>Religion:</strong> {student.religion || "—"}
                </p>
                <p>
                  <strong>Father's Name:</strong>{" "}
                  {student.studentFatherName || "—"}
                </p>
                <p>
                  <strong>Mother's Name:</strong>{" "}
                  {student.studentMotherName || "—"}
                </p>
                <p>
                  <strong>Registered By:</strong>{" "}
                  {student?.registeredBy
                    ? `${student.registeredBy.name} (ID: ${student.registeredBy.adminID})`
                    : "—"}
                </p>
                <p>
                  <strong>Registered At:</strong>{" "}
                  {student?.createdAt
                    ? new Date(student.createdAt).toLocaleString()
                    : new Date().toLocaleString()}
                </p>
              </div>
            </>
          ) : (
            <p>Loading student details...</p>
          )}

          {/* Parent (minimal payload) */}
          {parent && (
            <>
              <h2>Parent Details</h2>
              <div
                style={{
                  borderBottom: "1px solid #ddd",
                  paddingBottom: 5,
                  marginBottom: 10,
                }}
              >
                <p>
                  <strong>Name:</strong> {parent.parentName || "—"}
                </p>
                <p>
                  <strong>Parent ID:</strong> {parent.parentID || "—"}
                </p>
                <p>
                  <strong>Password:</strong> {parentPassword}{" "}
                  <span style={{ color: "red", fontWeight: "bold" }}>
                    (Please change after first login)
                  </span>
                </p>
                <p>
                  <strong>Email:</strong> {parent.parentEmail || "—"}
                </p>
                <p>
                  <strong>Phone:</strong> {parent.parentContactNumber || "—"}
                </p>
              </div>
            </>
          )}

          <Button
            variant="primary"
            onClick={handlePrint}
            style={{ marginTop: 20, display: "block", marginInline: "auto" }}
          >
            Print Details
          </Button>
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

export default StudentRegisterForm;
