import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AssignTeacherToSubject.css";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../axiosInstance"; // ✅ centralized axios instance

const AssignTeacherToSubject = () => {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const navigate = useNavigate();

  // ✅ Fetch teachers & subjects
  useEffect(() => {
    const fetchTeachersAndSubjects = async () => {
      try {
        // Fetch teachers
        const teacherResponse = await axiosInstance.get("/api/admin/auth/teachers");
        if (teacherResponse.data.data) {
          setTeachers(teacherResponse.data.data);
        } else {
          toast.error("Unexpected response format for teachers.");
          console.error("Teachers data missing:", teacherResponse.data);
        }

        // Fetch subjects
        const subjectResponse = await axiosInstance.get("/api/admin/auth/subjects");
        if (subjectResponse.data.subjects) {
          setSubjects(subjectResponse.data.subjects);
        } else {
          toast.error("Unexpected response format for subjects.");
          console.error("Subjects data missing:", subjectResponse.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error.response || error.message || error);
        toast.error("Failed to fetch teachers or subjects.");
      }
    };

    fetchTeachersAndSubjects();
  }, []);

  // ✅ Handle assigning subjects to a teacher
  const handleAssignSubjects = async () => {
    if (!selectedTeacher) {
      toast.error("Please select a teacher.");
      return;
    }

    if (selectedSubjects.length === 0) {
      toast.error("Please select at least one subject.");
      return;
    }

    try {
      const response = await axiosInstance.post("/api/admin/auth/assign-teacher-to-subject", {
        teacherID: selectedTeacher,
        subjectId: selectedSubjects, // multiple allowed
      });

      toast.success(response.data.message || "Subjects assigned successfully.");
      setSelectedTeacher("");
      setSelectedSubjects([]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to assign subjects.");
    }
  };

  // ✅ Back button
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="assign-container">
      <h1>Assign Teacher to Subject</h1>

      {/* Back button */}
      <div style={{ marginBottom: "20px" }}>
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
        <span onClick={handleBack} style={{ cursor: "pointer", color: "#007bff" }}>
          Back
        </span>
      </div>

      {/* Teacher Dropdown */}
      <div className="dropdown-container">
        <label htmlFor="teacher-select">Select Teacher:</label>
        <select
          id="teacher-select"
          value={selectedTeacher}
          onChange={(e) => setSelectedTeacher(e.target.value)}
        >
          <option value="">-- Select Teacher --</option>
          {teachers.map((teacher) => (
            <option key={teacher.teacherID} value={teacher.teacherID}>
              {teacher.name} ({teacher.teacherID})
            </option>
          ))}
        </select>
      </div>

      {/* Subjects Dropdown */}
      <div className="dropdown-container">
        <label htmlFor="subject-select">Select Subjects:</label>
        <select
          id="subject-select"
          multiple
          value={selectedSubjects}
          onChange={(e) =>
            setSelectedSubjects(
              Array.from(e.target.selectedOptions, (option) => option.value)
            )
          }
        >
          {subjects.map((subject) => (
            <option key={subject.subjectId} value={subject.subjectId}>
              {subject.name} ({subject.subjectId})
            </option>
          ))}
        </select>
        <small>
          Hold <strong>Ctrl</strong> (Windows) or <strong>Cmd</strong> (Mac) to select multiple.
        </small>
      </div>

      {/* Assign Button */}
      <button className="assign-btn" onClick={handleAssignSubjects}>
        Assign Teacher to Subject
      </button>

      <ToastContainer />
    </div>
  );
};

export default AssignTeacherToSubject;
