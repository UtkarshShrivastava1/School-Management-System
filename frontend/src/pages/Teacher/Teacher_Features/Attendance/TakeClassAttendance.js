import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "./TakeClassAttendance.css";
import { FaCalendarAlt, FaDownload, FaSave, FaSpinner } from "react-icons/fa";

const API_URL = process.env.REACT_APP_NODE_ENV === "production"
  ? process.env.REACT_APP_PRODUCTION_URL
  : process.env.REACT_APP_DEVELOPMENT_URL;

const TakeClassAttendance = ({ onAttendanceSaved }) => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch teacher's classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/attendance/teacher-classes`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setClasses(response.data.data);
      } catch (error) {
        toast.error("Failed to fetch classes");
        console.error("Error fetching classes:", error);
      }
    };

    fetchClasses();
  }, []);

  // Fetch students when class is selected
  useEffect(() => {
    if (selectedClass) {
      const fetchStudents = async () => {
        try {
          setLoading(true);
          const response = await axios.get(
            `${API_URL}/api/attendance/class/${selectedClass}/students`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          const studentsData = response.data.data;
          setStudents(studentsData);
          // Initialize attendance status for all students
          setAttendance(
            studentsData.map((student) => ({
              studentId: student._id,
              status: "Present", // Default status
            }))
          );
        } catch (error) {
          toast.error("Failed to fetch students");
          console.error("Error fetching students:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchStudents();
    }
  }, [selectedClass]);

  const handleAttendanceChange = (studentId, status) => {
    setAttendance((prev) =>
      prev.map((record) =>
        record.studentId === studentId ? { ...record, status } : record
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass) {
      toast.error("Please select a class");
      return;
    }

    try {
      setSubmitLoading(true);

      // Log the request data for debugging
      const requestData = {
        attendanceRecords: attendance,
      };
      
      console.log("Preparing attendance data:", requestData);
      console.log("For class ID:", selectedClass);

      // Ensure every student has a valid record
      const validAttendance = attendance.filter(record => 
        record.studentId && (record.status === "Present" || record.status === "Absent")
      );
      
      if (validAttendance.length === 0) {
        toast.error("No valid attendance records to save");
        setSubmitLoading(false);
        return;
      }

      // Format today's date for consistency
      const today = new Date().toISOString().split("T")[0];
      let existingAttendance = false;
      let existingAttendanceId = null;

      // Check if attendance already exists for today
      try {
        const checkResponse = await axios.get(
          `${API_URL}/api/attendance/class/${selectedClass}/attendance-history?date=${today}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        
        // If we have attendance records for today already
        if (checkResponse.data.data && checkResponse.data.data.length > 0) {
          existingAttendance = true;
          existingAttendanceId = checkResponse.data.data[0]._id;
          
          const confirmUpdate = window.confirm(
            "Attendance has already been marked for today. Do you want to update it?"
          );
          
          if (!confirmUpdate) {
            setSubmitLoading(false);
            return;
          }
        }
      } catch (checkError) {
        console.log("Error checking existing attendance:", checkError);
      }

      let response;

      if (existingAttendance && existingAttendanceId) {
        // Update existing attendance record
        console.log("Updating existing attendance for today");
        response = await axios.put(
          `${API_URL}/api/attendance/class/${selectedClass}/attendance/${today}`,
          {
            attendanceRecords: validAttendance,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      } else {
        // Create new attendance record
        console.log("Creating new attendance record for today");
        response = await axios.post(
          `${API_URL}/api/attendance/class/${selectedClass}/attendance`,
          {
            attendanceRecords: validAttendance,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      }

      console.log("Attendance save response:", response.data);
      
      if (existingAttendance) {
        toast.success("Attendance updated successfully");
      } else {
        toast.success("Attendance marked successfully");
      }
      
      setShowSuccess(true);
      
      // Call callback if provided (for parent components)
      if (onAttendanceSaved) {
        onAttendanceSaved();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error("Error with attendance operation:", error);
      
      // Provide more specific error messages
      if (error.response) {
        const errorMsg = error.response.data?.message || `Error ${error.response.status}: ${error.response.statusText}`;
        toast.error(errorMsg);
        console.log("Server error details:", error.response.data);
      } else if (error.request) {
        toast.error("No response received from server");
      } else {
        toast.error(`Error: ${error.message}`);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!selectedClass) {
      toast.error("Please select a class first");
      return;
    }
    if (!fromDate || !toDate) {
      toast.error("Please select both From and To dates");
      return;
    }

    try {
      setDownloadLoading(true);
      toast.info("Preparing your report...");

      // Format the dates as YYYY-MM-DD to ensure consistent format
      const formattedFromDate = new Date(fromDate).toISOString().split('T')[0];
      const formattedToDate = new Date(toDate).toISOString().split('T')[0];

      // Log the request for debugging
      console.log(`Requesting report: ${API_URL}/api/attendance/class/${selectedClass}/download-report`, {
        fromDate: formattedFromDate, 
        toDate: formattedToDate
      });

      const response = await axios.get(
        `${API_URL}/api/attendance/class/${selectedClass}/download-report`,
        {
          params: {
            fromDate: formattedFromDate,
            toDate: formattedToDate
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          responseType: 'blob'
        }
      );
      
      // Check response validity and log for debugging
      console.log("Response received:", response);
      
      if (!response.data || response.data.size === 0) {
        toast.error("No data available for the selected date range");
        return;
      }
      
      // Create and trigger the download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = `attendance_report_${selectedClass}_${formattedFromDate}_to_${formattedToDate}.xlsx`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
      
      toast.success("Report downloaded successfully");
    } catch (error) {
      console.error("Download error details:", error);
      
      // More detailed error message
      if (error.response) {
        // If we have a response message from server, show it
        const errorMessage = error.response.data?.message || 
          `Download failed: ${error.response.status} - ${error.response.statusText}`;
        toast.error(errorMessage);
        console.log("Error response data:", error.response.data);
      } else if (error.request) {
        toast.error("Download failed: No response received from server");
      } else {
        toast.error(`Download failed: ${error.message}`);
      }
    } finally {
      setDownloadLoading(false);
    }
  };

  // Attendance summary
  const totalPresent = attendance.filter(a => a.status === "Present").length;
  const totalAbsent = attendance.filter(a => a.status === "Absent").length;

  return (
    <div className="take-attendance-container">
      <div className="attendance-header">
        <h2>Take Class Attendance</h2>
        <div className="date-display">
          <FaCalendarAlt className="calendar-icon" />
          <span>{new Date().toDateString()}</span>
        </div>
      </div>
      
      {showSuccess && (
        <div className="success-banner">
          <span>✓ Attendance saved successfully!</span>
        </div>
      )}
      
      <div className="attendance-card">
        <div className="attendance-form">
          <div className="form-group class-selector">
            <label htmlFor="class">Select Class:</label>
            <select
              id="class"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              disabled={loading || submitLoading}
            >
              <option value="">Select a class</option>
              {classes.map((cls) => (
                <option key={cls.classId} value={cls.classId}>
                  {cls.className}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedClass && (
          <div className="students-list">
            <h3>Mark Attendance for Today</h3>
            {loading ? (
              <div className="loading-container">
                <FaSpinner className="spin" />
                <span>Loading students...</span>
              </div>
            ) : students.length === 0 ? (
              <div className="no-students">
                <p>No students found for this class.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="attendance-table-container">
                  <table className="attendance-table">
                    <thead>
                      <tr>
                        <th>Photo</th>
                        <th>Student ID</th>
                        <th>Name</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student._id}>
                          <td className="student-photo">
                            <img
                              src={`${API_URL}/uploads/Admin/${student.photo || "default-photo.jpg"}`}
                              alt={student.studentName}
                              onError={e => {
                                // Use a data URI instead of an external URL
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='16' r='8' fill='%23ccc'/%3E%3Cpath d='M4,36 C4,29 11,24 20,24 C29,24 36,29 36,36' fill='%23ccc'/%3E%3Crect width='40' height='40' rx='20' stroke='%23ccc' stroke-width='2' fill='none'/%3E%3C/svg%3E";
                              }}
                            />
                          </td>
                          <td>{student.studentID}</td>
                          <td className="student-name">{student.studentName}</td>
                          <td className="status-cell">
                            <div className="status-wrapper">
                              <span className={`status-badge ${attendance.find(a => a.studentId === student._id)?.status === "Present" ? "present" : "absent"}`}>
                                {attendance.find(a => a.studentId === student._id)?.status || "Present"}
                              </span>
                              <select
                                value={
                                  attendance.find(
                                    (a) => a.studentId === student._id
                                  )?.status || "Present"
                                }
                                onChange={(e) =>
                                  handleAttendanceChange(student._id, e.target.value)
                                }
                                disabled={submitLoading}
                                className="status-select"
                              >
                                <option value="Present">Present</option>
                                <option value="Absent">Absent</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={4} className="attendance-summary">
                          <div className="summary-container">
                            <div className="summary-item present">
                              <strong>Total Present:</strong> {totalPresent}
                            </div>
                            <div className="summary-item absent">
                              <strong>Total Absent:</strong> {totalAbsent}
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => navigate("/teacher/teacher-dashboard")}
                    disabled={submitLoading}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitLoading} 
                    className="save-btn"
                  >
                    {submitLoading ? <><FaSpinner className="spin" /> Saving...</> : <><FaSave /> Save Attendance</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TakeClassAttendance; 