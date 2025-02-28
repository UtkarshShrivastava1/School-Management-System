import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./MarkTeacherAttendance.css";

const MarkTeacherAttendance = () => {
  const [teachers, setTeachers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const API_URL =
    process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL
      : process.env.REACT_APP_DEVELOPMENT_URL;

  // Fetch teachers when component mounts
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/admin/auth/teachers`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.data.data) {
          setTeachers(response.data.data);
          setAttendance(
            response.data.data.map(() => ({ status: "Absent", remarks: "" }))
          );
        } else {
          toast.error("Unexpected response format for teachers.");
        }
      } catch (error) {
        toast.error("Failed to fetch teacher data.");
      }
    };

    fetchTeachers();
  }, [API_URL]);

  // Handle attendance input change
  const handleAttendanceChange = (index, field, value) => {
    const updatedAttendance = [...attendance];
    updatedAttendance[index][field] = value;
    setAttendance(updatedAttendance);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (attendance.length === 0) {
      setErrorMessage("Please select attendance for all teachers.");
      return;
    }

    try {
      const attendanceData = attendance.map((att, index) => ({
        teacherID: teachers[index].teacherID,
        status: att.status,
        remarks: att.remarks,
      }));

      await axios.post(
        `${API_URL}/api/admin/auth/teacher-attendance-mark`,
        { attendanceData },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setSuccessMessage("Attendance marked successfully!");
      toast.success("Attendance marked successfully!");
      setErrorMessage("");

      setTimeout(() => {
        navigate("/admin/teacher-attendance");
      }, 2000);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Server error");
      setSuccessMessage("");
      toast.error(error.response?.data?.message || "Server error");
    }
  };

  const handleBack = () => {
    navigate("/admin/teacher-attendance");
  };

  return (
    <div className="mark-attendance-container">
      <h1>Mark Teacher Attendance</h1>

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

      {/* Current date */}
      <div className="current-date-time" style={{ marginBottom: "20px" }}>
        <h3>{new Date().toLocaleString()}</h3>
        <p>Attendance being marked for: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Error and success messages */}
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      {/* Attendance Table */}
      <form onSubmit={handleSubmit}>
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Teacher Name</th>
              <th>Teacher ID</th>
              <th>Designation</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher, index) => (
              <tr key={teacher.teacherID}>
                <td>{teacher.name}</td>
                <td>{teacher.teacherID}</td>
                <td>{teacher.designation || "N/A"}</td>
                <td>
                  <select
                    value={attendance[index]?.status || "Absent"}
                    onChange={(e) =>
                      handleAttendanceChange(index, "status", e.target.value)
                    }
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                  </select>
                </td>
                <td>
                  <textarea
                    placeholder="Remarks (optional)"
                    value={attendance[index]?.remarks || ""}
                    onChange={(e) =>
                      handleAttendanceChange(index, "remarks", e.target.value)
                    }
                  ></textarea>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button type="submit" className="submit-btn">
          Submit Attendance
        </button>
      </form>

      <ToastContainer />
    </div>
  );
};

export default MarkTeacherAttendance;
