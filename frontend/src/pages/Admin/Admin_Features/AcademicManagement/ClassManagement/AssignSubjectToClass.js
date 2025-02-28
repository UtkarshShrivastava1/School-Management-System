import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AssignSubjectToClass.css";
import { FaArrowLeft } from "react-icons/fa"; // Importing the back arrow icon
import { useNavigate } from "react-router-dom";

const AssignSubjectToClass = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const navigate = useNavigate(); // for navigation after success

  const API_URL =
    process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL
      : process.env.REACT_APP_DEVELOPMENT_URL;

  // Fetch all classes and subjects on component mount
  useEffect(() => {
    const fetchClassesAndSubjects = async () => {
      try {
        // Fetch classes
        const classResponse = await axios.get(
          `${API_URL}/api/admin/auth/classes`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        // Fetch subjects
        const subjectResponse = await axios.get(
          `${API_URL}/api/admin/auth/subjects`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        setClasses(classResponse.data.classes || []);
        setSubjects(subjectResponse.data.subjects || []);
      } catch (error) {
        toast.error("Failed to fetch classes or subjects.");
      }
    };

    fetchClassesAndSubjects();
  }, [API_URL]);

  // Handle assigning subjects to a class
  const handleAssignSubjects = async () => {
    if (!selectedClass) {
      toast.error("Please select a class.");
      return;
    }

    if (selectedSubjects.length === 0) {
      toast.error("Please select at least one subject.");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/admin/auth/class/${selectedClass}/assign-subjects`,
        { subjectIds: selectedSubjects },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      toast.success(response.data.message || "Subjects assigned successfully.");
      // Optionally reset selections
      setSelectedClass("");
      setSelectedSubjects([]);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to assign subjects."
      );
    }
  };
  // Handle back button click
  const handleBack = () => {
    navigate(-1); // Navigate back to the previous page
  };
  return (
    <div className="admin-manage-classes-container">
      <h1>Manage Class Assignments</h1>
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
      {/* Class Dropdown */}
      <div className="form-group">
        <label htmlFor="classDropdown">Select Class:</label>
        <select
          id="classDropdown"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="">-- Select Class --</option>
          {classes.map((cls) => (
            <option key={cls.classId} value={cls.classId}>
              {cls.className} ({cls.classId})
            </option>
          ))}
        </select>
      </div>

      {/* Subjects Dropdown */}
      <div className="form-group">
        <label htmlFor="subjectDropdown">Select Subjects:</label>
        <select
          id="subjectDropdown"
          multiple
          value={selectedSubjects}
          onChange={(e) =>
            setSelectedSubjects(
              Array.from(e.target.selectedOptions, (option) => option.value)
            )
          }
        >
          {subjects.map((subj) => (
            <option key={subj.subjectId} value={subj.subjectId}>
              {subj.subjectName} ({subj.subjectId})
            </option>
          ))}
        </select>
      </div>

      {/* Assign Button */}
      <button className="assign-btn" onClick={handleAssignSubjects}>
        Assign Subjects to Class
      </button>

      <ToastContainer />
    </div>
  );
};

export default AssignSubjectToClass;
