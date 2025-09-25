import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AssignTeacherToSubject.css";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const AssignTeacherToClass = () => {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]); // Renamed from 'subjects' to 'classes'
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedClasses, setSelectedClasses] = useState([]); // Fixed typo
  const navigate = useNavigate();

  const API_URL =
    process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL
      : process.env.REACT_APP_DEVELOPMENT_URL;

  // Fetch all teachers and classes on component mount
  useEffect(() => {
    const fetchTeachersAndClasses = async () => {
      try {
        // Fetch teachers
        const teacherResponse = await axios.get(
          `${API_URL}/api/admin/auth/teachers`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        console.log("Fetched Teachers:", teacherResponse.data); // Debugging

        // Extract `data` for teachers
        if (teacherResponse.data.data) {
          setTeachers(teacherResponse.data.data);
        } else {
          toast.error("Unexpected response format for teachers.");
          console.error(
            "Teachers data missing in response:",
            teacherResponse.data
          );
        }

        // Fetch classes (Corrected class fetching API)
        const classResponse = await axios.get(
          `${API_URL}/api/admin/auth/classes`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        console.log("Fetched Classes:", classResponse.data); // Debugging

        // Extract `data` for classes
        if (classResponse.data.classes) {
          setClasses(classResponse.data.classes);
        } else {
          toast.error("Unexpected response format for classes.");
          console.error(
            "Classes data missing in response:",
            classResponse.data
          );
        }
      } catch (error) {
        console.error(
          "Error fetching data:",
          error.response || error.message || error
        );
        toast.error("Failed to fetch teachers or classes.");
      }
    };

    fetchTeachersAndClasses();
  }, [API_URL]);

  // Handle assigning classes to a teacher
  const handleAssignClasses = async () => {
    if (!selectedTeacher) {
      toast.error("Please select a teacher.");
      return;
    }

    if (selectedClasses.length === 0) {
      toast.error("Please select at least one class.");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/admin/auth/assign-teacher-to-class`,
        {
          teacherID: selectedTeacher,
          classId: selectedClasses, // For multiple classes
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      toast.success(response.data.message || "Classes assigned successfully.");
      // Reset selections
      setSelectedTeacher("");
      setSelectedClasses([]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to assign classes.");
    }
  };

  // Handle back button click
  const handleBack = () => {
    navigate(-1); // Navigate back to the previous page
  };

  return (
    <div className="assign-container">
      <h1>Assign Teacher to Classes</h1>
      {/* Back button with icon */}
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
        <span
          onClick={handleBack}
          style={{ cursor: "pointer", color: "#007bff" }}
        >
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

      {/* Class Dropdown */}
      <div className="dropdown-container">
        <label htmlFor="class-select">Select Classes:</label>
        <select
          id="class-select"
          multiple
          value={selectedClasses}
          onChange={(e) =>
            setSelectedClasses(
              Array.from(e.target.selectedOptions, (option) => option.value)
            )
          }
        >
          {classes.map((classItem) => (
            <option key={classItem.classId} value={classItem.classId}>
              {classItem.name} ({classItem.classId})
            </option>
          ))}
        </select>
        <small>
          Hold <strong>Ctrl</strong> (Windows) or <strong>Cmd</strong> (Mac) to
          select multiple classes.
        </small>
      </div>

      {/* Assign Button */}
      <button className="assign-btn" onClick={handleAssignClasses}>
        Assign Teacher to Class
      </button>

      <ToastContainer />
    </div>
  );
};
//ss
export default AssignTeacherToClass;
