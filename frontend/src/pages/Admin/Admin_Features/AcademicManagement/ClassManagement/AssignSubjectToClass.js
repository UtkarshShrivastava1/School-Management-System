import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AssignSubjectToClass.css";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  getAllClasses,
  getAllSubjects,
  assignSubjectsToClass,
} from "../../api/adminApi";

const AssignSubjectToClass = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Fetch all classes and subjects on mount
  useEffect(() => {
    const fetchClassesAndSubjects = async () => {
      try {
        const [classRes, subjectRes] = await Promise.all([
          getAllClasses(),
          getAllSubjects(),
        ]);
        setClasses(classRes.classes || []);
        setSubjects(subjectRes.subjects || []);
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to fetch classes or subjects.");
      }
    };

    fetchClassesAndSubjects();
  }, []);

  // ✅ Assign subjects to class
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
      setLoading(true);
      const res = await assignSubjectsToClass(selectedClass, selectedSubjects);

      toast.success(res.message || "Subjects assigned successfully.");
      setSelectedClass("");
      setSelectedSubjects([]);
    } catch (error) {
      console.error("Assign subjects error:", error);
      toast.error(
        error.response?.data?.message || "Failed to assign subjects."
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Back button
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="admin-manage-classes-container">
      <h1>Manage Class Assignments</h1>

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

      {/* Class Dropdown */}
      <div className="form-group">
        <label htmlFor="classDropdown">Select Class:</label>
        <select
          id="classDropdown"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          disabled={loading}
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
          disabled={loading}
        >
          {subjects.map((subj) => (
            <option key={subj.subjectId} value={subj.subjectId}>
              {subj.subjectName} ({subj.subjectId})
            </option>
          ))}
        </select>
      </div>

      {/* Assign Button */}
      <button
        className="assign-btn"
        onClick={handleAssignSubjects}
        disabled={loading}
      >
        {loading ? "Assigning..." : "Assign Subjects to Class"}
      </button>

      <ToastContainer />
    </div>
  );
};

export default AssignSubjectToClass;
