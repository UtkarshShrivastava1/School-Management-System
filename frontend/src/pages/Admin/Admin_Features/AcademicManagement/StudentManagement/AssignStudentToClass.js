import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AssignStudentToClass.css";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const AssignStudentToClass = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const navigate = useNavigate();

  const API_URL =
    process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL
      : process.env.REACT_APP_DEVELOPMENT_URL;

  // Fetch all students and classes on component mount
  useEffect(() => {
    const fetchStudentsAndClasses = async () => {
      try {
        // Fetch students
        const studentResponse = await axios.get(
          `${API_URL}/api/admin/auth/students`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        console.log("Fetched Students:", studentResponse.data);

        if (studentResponse.data.data) {
          setStudents(studentResponse.data.data);
        } else {
          toast.error("Unexpected response format for students.");
          console.error(
            "Students data missing in response:",
            studentResponse.data
          );
        }

        // Fetch classes
        const classResponse = await axios.get(
          `${API_URL}/api/admin/auth/classes`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        console.log("Fetched Classes:", classResponse.data);

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
        toast.error("Failed to fetch students or classes.");
      }
    };

    fetchStudentsAndClasses();
  }, [API_URL]);

  // Handle assigning student to a class
  const handleAssignStudent = async () => {
    if (!selectedStudent) {
      toast.error("Please select a student.");
      return;
    }

    if (!selectedClass) {
      toast.error("Please select a class.");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/admin/auth/assign-students-class`,
        {
          studentID: selectedStudent,
          classId: selectedClass,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      toast.success(response.data.message || "Student assigned successfully.");
      // Reset selections
      setSelectedStudent("");
      setSelectedClass("");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to assign student to class."
      );
    }
  };

  // Handle back button click
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="assign-container">
      <h1>Assign Student to Class</h1>
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

      {/* Student Dropdown */}
      <div className="dropdown-container">
        <label htmlFor="student-select">Select Student:</label>
        <select
          id="student-select"
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
        >
          <option value="">-- Select Student --</option>
          {students.map((student) => (
            <option key={student.studentID} value={student.studentID}>
              {student.studentName} ({student.studentID})
            </option>
          ))}
        </select>
      </div>

      {/* Class Dropdown */}
      <div className="dropdown-container">
        <label htmlFor="class-select">Select Class:</label>
        <select
          id="class-select"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="">-- Select Class --</option>
          {classes.map((classItem) => (
            <option key={classItem.classId} value={classItem.classId}>
              {classItem.className} ({classItem.classId})
            </option>
          ))}
        </select>
      </div>

      {/* Assign Button */}
      <button className="assign-btn" onClick={handleAssignStudent}>
        Assign Student to Class
      </button>

      <ToastContainer />
    </div>
  );
};

export default AssignStudentToClass;
