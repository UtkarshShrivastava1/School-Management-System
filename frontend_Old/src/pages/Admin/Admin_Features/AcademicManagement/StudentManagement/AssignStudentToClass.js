import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AssignStudentToClass.css";

const AssignStudentToClass = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [conflictData, setConflictData] = useState(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [loading, setLoading] = useState(false);
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

    setLoading(true);
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
      setConflictData(null);
      setShowConflictModal(false);
    } catch (error) {
      console.error("Assignment error:", error.response?.data);
      
      // Handle conflict - student already enrolled in another class
      if (error.response?.status === 409 && error.response?.data?.conflict) {
        setConflictData(error.response.data);
        setShowConflictModal(true);
      } else {
        toast.error(
          error.response?.data?.message || "Failed to assign student to class."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle reassigning student to a different class
  const handleReassignStudent = async () => {
    if (!conflictData) return;

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/auth/reassign-student-class`,
        {
          studentID: conflictData.student.studentID,
          newClassId: selectedClass,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      toast.success(response.data.message || "Student reassigned successfully.");
      // Reset selections
      setSelectedStudent("");
      setSelectedClass("");
      setConflictData(null);
      setShowConflictModal(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to reassign student to class."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle removing student from current class
  const handleRemoveStudent = async () => {
    if (!conflictData) return;

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/auth/remove-student-class`,
        {
          studentID: conflictData.student.studentID,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      toast.success(response.data.message || "Student removed from class successfully.");
      // Reset selections
      setSelectedStudent("");
      setSelectedClass("");
      setConflictData(null);
      setShowConflictModal(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to remove student from class."
      );
    } finally {
      setLoading(false);
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
              {classItem.displayName || `${classItem.className} - Section ${classItem.section}`} ({classItem.classId})
            </option>
          ))}
        </select>
      </div>

      {/* Assign Button */}
      <button 
        className="assign-btn" 
        onClick={handleAssignStudent}
        disabled={loading}
      >
        {loading ? "Processing..." : "Assign Student to Class"}
      </button>

      {/* Conflict Modal */}
      {showConflictModal && conflictData && (
        <div className="conflict-modal-overlay">
          <div className="conflict-modal">
            <h3>Student Already Enrolled</h3>
            <p>
              <strong>{conflictData.student.studentName}</strong> ({conflictData.student.studentID}) 
              is already enrolled in <strong>{conflictData.currentClass.className} - Section {conflictData.currentClass.section}</strong>.
            </p>
            <p>What would you like to do?</p>
            
            <div className="conflict-actions">
              <button 
                className="reassign-btn"
                onClick={handleReassignStudent}
                disabled={loading}
              >
                {loading ? "Processing..." : `Reassign to ${conflictData.targetClass.className} - Section ${conflictData.targetClass.section}`}
              </button>
              
              <button 
                className="remove-btn"
                onClick={handleRemoveStudent}
                disabled={loading}
              >
                {loading ? "Processing..." : "Remove from Current Class"}
              </button>
              
              <button 
                className="cancel-btn"
                onClick={() => {
                  setShowConflictModal(false);
                  setConflictData(null);
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default AssignStudentToClass;
