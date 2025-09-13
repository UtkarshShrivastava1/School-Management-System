//Create a new class with standard name, class strength, and subjects
//Subjects are added dynamically with subject name, subject code, and teacher selection
//Teachers are fetched from the backend and displayed in a dropdown
//Form validation is done for all fields
//On successful submission, the user is redirected to the manage classes page
//Error and success messages are displayed using toast notifications

import React, { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./CreateClass.css";

import adminApi from "../../api/adminApi"; // ✅ use centralized admin service

const CreateClass = () => {
  const [standardName, setStandardName] = useState("");
  const [classStrength, setClassStrength] = useState("");
  const [section, setSection] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [availableSections, setAvailableSections] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // ✅ Fetch teachers for dropdown
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await adminApi.getTeachers();
        setTeachers(res.data.data || []);
      } catch (error) {
        console.error("Error fetching teachers", error);
        setTeachers([]);
        toast.error("Failed to fetch teachers");
      }
    };
    fetchTeachers();
  }, []);

  // ✅ Fetch available sections for a given standard
  const fetchAvailableSections = async (standard) => {
    if (!standard) return;
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await adminApi.getAvailableSections(standard);
      setAvailableSections(response.data.availableSections || []);
      setSection("");
    } catch (error) {
      console.error("Error fetching sections:", error);
      setErrorMessage("Failed to fetch available sections");
      setAvailableSections([]);
      toast.error("Failed to fetch available sections");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Standard change handler
  const handleStandardNameChange = (e) => {
    const value = e.target.value.trim();
    setStandardName(value);

    if (value && !isNaN(value) && parseInt(value) > 0) {
      fetchAvailableSections(value);
    } else {
      setAvailableSections([]);
      setSection("");
    }
  };

  const handleClassStrengthChange = (e) => setClassStrength(e.target.value);

  // ✅ Dynamic subject handling
  const handleSubjectChange = (index, field, value) => {
    const newSubjects = [...subjects];
    newSubjects[index][field] = value;
    setSubjects(newSubjects);
  };

  const addSubjectCard = () => {
    setSubjects([
      ...subjects,
      { subjectName: "", teacherId: "", subjectCode: "" },
    ]);
  };

  const removeSubjectCard = (index) => {
    const newSubjects = [...subjects];
    newSubjects.splice(index, 1);
    setSubjects(newSubjects);
  };

  // ✅ Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!standardName || !classStrength) {
      setErrorMessage("Please provide both standard name and class strength.");
      return;
    }

    for (let subj of subjects) {
      if (!subj.subjectName || !subj.teacherId) {
        setErrorMessage(
          "Each subject must have a subject name and a teacher selected."
        );
        return;
      }
    }

    try {
      const payload = {
        className: `Class ${standardName.trim()}`,
        classId: `CLASS_CLASS_${standardName.trim()}_${section.trim()}`,
        section: section.trim(),
        classStrength: parseInt(classStrength, 10),
        subjects,
        teachers: subjects.map((subj) => subj.teacherId),
      };

      const response = await adminApi.createClass(payload);

      if (response.status === 201) {
        setSuccessMessage("Class created successfully!");
        toast.success("Class created successfully!");
        setErrorMessage("");
        setStandardName("");
        setClassStrength("");
        setSubjects([]);

        setTimeout(() => {
          navigate("/admin/class-management");
        }, 2000);
      }
    } catch (error) {
      const errMsg = error.response
        ? error.response.data.message
        : "Server error";
      setErrorMessage(errMsg);
      toast.error(errMsg);
    }
  };

  const handleBack = () => navigate(-1);

  return (
    <div className="create-class-container">
      <h1>Create New Class</h1>
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
      </div>

      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="standardName">Standard Name (1-12):</label>
          <input
            type="number"
            id="standardName"
            name="standardName"
            value={standardName}
            onChange={handleStandardNameChange}
            placeholder="Enter standard (1-12)"
            min="1"
            max="12"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="section">Section:</label>
          <select
            id="section"
            name="section"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            required
            disabled={!availableSections.length || loading}
          >
            <option value="">Select Section</option>
            {availableSections.map((sec) => (
              <option key={sec} value={sec}>
                Section {sec}
              </option>
            ))}
          </select>
          {loading && <span className="loading-text">Loading sections...</span>}
          {!loading && availableSections.length === 0 && standardName && (
            <span className="no-sections-text">
              No sections available for this standard
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="classStrength">Class Strength (No. of Students):</label>
          <input
            type="number"
            id="classStrength"
            name="classStrength"
            value={classStrength}
            onChange={handleClassStrengthChange}
            placeholder="Enter class strength"
            required
          />
        </div>

        <hr />
        <h3>Subjects</h3>
        {subjects.map((subject, index) => (
          <div key={index} className="subject-card">
            <div className="form-group">
              <label>Subject Name:</label>
              <input
                type="text"
                value={subject.subjectName}
                onChange={(e) =>
                  handleSubjectChange(index, "subjectName", e.target.value)
                }
                placeholder="Enter subject name"
                required
              />
            </div>
            <div className="form-group">
              <label>Subject Code (Optional):</label>
              <input
                type="text"
                value={subject.subjectCode}
                onChange={(e) =>
                  handleSubjectChange(index, "subjectCode", e.target.value)
                }
                placeholder="Enter board provided subject code (if available)"
              />
            </div>
            <div className="form-group">
              <label>Select Teacher:</label>
              <select
                value={subject.teacherId}
                onChange={(e) =>
                  handleSubjectChange(index, "teacherId", e.target.value)
                }
                required
              >
                <option value="">Select Teacher</option>
                {(teachers || []).map((teacher) => (
                  <option key={teacher.teacherID} value={teacher.teacherID}>
                    {teacher.name} ({teacher.teacherID})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="remove-subject-btn"
              onClick={() => removeSubjectCard(index)}
            >
              Remove Subject
            </button>
            <hr />
          </div>
        ))}

        <button
          type="button"
          className="add-subject-btn"
          onClick={addSubjectCard}
        >
          + Add Subject
        </button>
        <button type="submit" className="submit-btn">
          Create Class
        </button>
      </form>

      <ToastContainer />
    </div>
  );
};

export default CreateClass;
