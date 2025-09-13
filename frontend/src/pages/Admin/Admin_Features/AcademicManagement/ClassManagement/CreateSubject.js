import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaArrowLeft } from "react-icons/fa";
import adminApi from "../../api/adminApi"; // ✅ centralized API
import "./CreateSubject.css";

const CreateSubject = () => {
  const [subjectName, setSubjectName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  // Handle input change
  const handleSubjectNameChange = (e) => {
    setSubjectName(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!subjectName) {
      setErrorMessage("Please provide a subject name.");
      return;
    }

    try {
      const response = await adminApi.createSubject({ subjectName }); // ✅ using service

      if (response.status === 201) {
        setSuccessMessage("Subject created successfully!");
        toast.success("Subject created successfully!");
        setErrorMessage("");
        setSubjectName("");

        setTimeout(() => {
          navigate("/admin/create-subjects"); // redirect after success
        }, 2000);
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Server error");
      setSuccessMessage("");
      toast.error(error.response?.data?.message || "Server error");
    }
  };

  // Handle back button
  const handleBack = () => {
    navigate("/admin/class-management");
  };

  return (
    <div className="create-subject-container">
      <h1>Create New Subject</h1>

      {/* Back button */}
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
          style={{ cursor: "pointer", color: "#007bff" }}
        >
          Back
        </span>
      </div>

      {/* Error and success messages */}
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="subjectName">Subject Name</label>
          <input
            type="text"
            id="subjectName"
            value={subjectName}
            onChange={handleSubjectNameChange}
            placeholder="Enter subject name"
          />
        </div>

        <button type="submit">Create Subject</button>
      </form>

      <ToastContainer />
    </div>
  );
};

export default CreateSubject;
