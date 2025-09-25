import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaArrowLeft } from "react-icons/fa"; // Importing the back arrow icon
import "./CreateSubject.css";

const CreateSubject = () => {
  const [subjectName, setSubjectName] = useState(""); // Corrected from standardName
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate(); // for navigation after success

  const API_URL =
    process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL
      : process.env.REACT_APP_DEVELOPMENT_URL;

  // Handle input change for subjectName
  const handleSubjectNameChange = (e) => {
    setSubjectName(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate input
    if (!subjectName) {
      setErrorMessage("Please provide a subject name.");
      return;
    }

    try {
      // Updated API URL based on the correct route
      const response = await axios.post(
        `${API_URL}/api/admin/auth/createsubject`, // Corrected route
        { subjectName }, // Pass the correct data
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Handle success response
      if (response.status === 201) {
        setSuccessMessage("Subject created successfully!");
        toast.success("Subject created successfully!"); // Show toast on success
        setErrorMessage(""); // Clear error message
        setSubjectName("");

        // Redirect after subject is created
        setTimeout(() => {
          navigate("/admin/create-subjects"); // Replace with your desired redirect path
        }, 2000);
      }
    } catch (error) {
      // Handle error response
      setErrorMessage(error.response?.data?.message || "Server error");
      setSuccessMessage(""); // Clear success message
      toast.error(
        error.response?.data?.message || "Server error" // Show toast on error
      );
    }
  };

  // Handle back button click
  const handleBack = () => {
    navigate("/admin/class-management"); // Navigate back to the previous page
  };

  return (
    <div className="create-subject-container">
      <h1>Create New Subject</h1>

      {/* Back button with icon */}
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

      {/* Form to create subject */}
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

      {/* ToastContainer to display the toast notifications */}
      <ToastContainer />
    </div>
  );
};

export default CreateSubject;
