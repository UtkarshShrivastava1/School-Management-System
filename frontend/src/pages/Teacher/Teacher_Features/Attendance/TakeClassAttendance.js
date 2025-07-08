import axios from "axios";
import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaArrowLeft, FaCheckCircle, FaExclamationTriangle, FaSave, FaSpinner, FaUsers } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./TakeClassAttendance.css";

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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [classLoading, setClassLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Fetch teacher's classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setClassLoading(true);
        const response = await axios.get(`${API_URL}/api/attendance/teacher-classes`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const formattedClasses = response.data.data.map(cls => ({
          ...cls,
          displayName: `${cls.className} - Section ${cls.section}`,
          classNameWithSection: `${cls.className} - Section ${cls.section}`
        }));
        setClasses(formattedClasses);
      } catch (error) {
        toast.error("Failed to fetch classes");
        console.error("Error fetching classes:", error);
      } finally {
        setClassLoading(false);
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
          setAttendance(
            studentsData.map((student) => ({
              studentId: student._id,
              status: "Present",
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

      const requestData = {
        attendanceRecords: attendance,
      };
      
      console.log("Preparing attendance data:", requestData);
      console.log("For class ID:", selectedClass);

      const validAttendance = attendance.filter(record => 
        record.studentId && (record.status === "Present" || record.status === "Absent")
      );
      
      if (validAttendance.length === 0) {
        toast.error("No valid attendance records to save");
        setSubmitLoading(false);
        return;
      }

      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      let existingAttendance = false;
      let existingAttendanceId = null;

      try {
        const checkResponse = await axios.get(
          `${API_URL}/api/attendance/class/${selectedClass}/attendance-history?date=${formattedDate}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        
        if (checkResponse.data.data && checkResponse.data.data.length > 0) {
          existingAttendance = true;
          existingAttendanceId = checkResponse.data.data[0]._id;
          // Show custom modal instead of window.confirm
          setPendingUpdate({ classId: selectedClass, date: formattedDate, records: validAttendance });
          setShowUpdateModal(true);
          setSubmitLoading(false);
          return;
        }
      } catch (checkError) {
        console.log("Error checking existing attendance:", checkError);
      }

      let response;

      if (existingAttendance && existingAttendanceId) {
        console.log(`Updating existing attendance for ${formattedDate}`);
        response = await axios.put(
          `${API_URL}/api/attendance/class/${selectedClass}/attendance/${formattedDate}`,
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
        console.log(`Creating new attendance record for ${formattedDate}`);
        response = await axios.post(
          `${API_URL}/api/attendance/class/${selectedClass}/attendance`,
          {
            attendanceRecords: validAttendance,
            date: formattedDate,
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
      
      if (onAttendanceSaved) {
        onAttendanceSaved();
      }
      
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error("Error saving attendance:", error);
      
      if (error.response) {
        const errorMessage = error.response.data?.message || 
          `Save failed: ${error.response.status} - ${error.response.statusText}`;
        toast.error(errorMessage);
        console.log("Error response data:", error.response.data);
      } else if (error.request) {
        toast.error("Save failed: No response received from server");
      } else {
        toast.error(`Save failed: ${error.message}`);
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

      const formattedFromDate = new Date(fromDate).toISOString().split('T')[0];
      const formattedToDate = new Date(toDate).toISOString().split('T')[0];

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
      
      console.log("Response received:", response);
      
      if (!response.data || response.data.size === 0) {
        toast.error("No data available for the selected date range");
        return;
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = `attendance_report_${selectedClass}_${formattedFromDate}_to_${formattedToDate}.xlsx`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
      
      toast.success("Report downloaded successfully");
    } catch (error) {
      console.error("Download error details:", error);
      
      if (error.response) {
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

  const totalPresent = attendance.filter(a => a.status === "Present").length;
  const totalAbsent = attendance.filter(a => a.status === "Absent").length;
  const totalStudents = students.length;

  const markAllPresent = () => {
    const updatedAttendance = students.map(student => ({
      studentId: student._id,
      status: "Present"
    }));
    setAttendance(updatedAttendance);
    toast.info("All students marked as Present");
  };

  const markAllAbsent = () => {
    const updatedAttendance = students.map(student => ({
      studentId: student._id,
      status: "Absent"
    }));
    setAttendance(updatedAttendance);
    toast.info("All students marked as Absent");
  };

  const handleBack = () => navigate("/teacher/teacher-dashboard");

  return (
    <div className="take-attendance-container">
      <div className="page-header">
        <div className="back-button">
          <FaArrowLeft
            onClick={handleBack}
            size={24}
            style={{ cursor: "pointer", color: "#007bff" }}
          />
          <span
            onClick={handleBack}
            style={{ cursor: "pointer", color: "#007bff", marginLeft: "10px" }}
          >
            Back
          </span>
        </div>
        <h1>Take Class Attendance</h1>
      </div>

      {showSuccess && (
        <div className="success-banner">
          <FaCheckCircle className="success-icon" />
          <span>✓ Attendance saved successfully!</span>
        </div>
      )}

      {showUpdateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Attendance Already Marked</h3>
            <p>Attendance has already been marked for {pendingUpdate?.date}. Do you want to update it?</p>
            <div className="modal-actions">
              <button
                className="modal-btn update"
                onClick={async () => {
                  setUpdateLoading(true);
                  try {
                    await axios.put(
                      `${API_URL}/api/attendance/class/${pendingUpdate.classId}/attendance/${pendingUpdate.date}`,
                      { attendanceRecords: pendingUpdate.records },
                      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                    );
                    toast.success('Attendance updated successfully');
                    setShowUpdateModal(false);
                    setPendingUpdate(null);
                    if (onAttendanceSaved) onAttendanceSaved();
                  } catch (error) {
                    toast.error('Failed to update attendance');
                  } finally {
                    setUpdateLoading(false);
                  }
                }}
                disabled={updateLoading}
              >
                {updateLoading ? 'Updating...' : 'Update Attendance'}
              </button>
              <button className="modal-btn cancel" onClick={() => { setShowUpdateModal(false); setPendingUpdate(null); }} disabled={updateLoading}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="main-content">
        <div className="form-section">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="class">Select Class:</label>
              {classLoading ? (
                <div className="loading-select">
                  <FaSpinner className="spin" />
                  <span>Loading classes...</span>
                </div>
              ) : (
                <select
                  id="class"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  disabled={loading || submitLoading}
                >
                  <option value="">-- Select a class --</option>
                  {classes.map((cls) => (
                    <option key={cls.classId} value={cls.classId}>
                      {cls.displayName || `${cls.className} - Section ${cls.section}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="date">Select Date:</label>
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                dateFormat="yyyy-MM-dd"
                maxDate={new Date()}
                placeholderText="Select date for attendance"
                className="date-picker-input"
                disabled={submitLoading}
              />
            </div>
          </div>
        </div>

        {selectedClass && (
          <div className="attendance-section">
            <div className="section-header">
              <div className="header-info">
                <h3>Mark Attendance for {selectedDate.toDateString()}</h3>
                <div className="student-count">
                  <FaUsers className="count-icon" />
                  <span>{totalStudents} Students</span>
                </div>
              </div>
              {students.length > 0 && (
                <div className="quick-actions">
                  <button
                    type="button"
                    onClick={markAllPresent}
                    className="quick-action-btn present"
                    disabled={submitLoading}
                  >
                    <FaCheckCircle className="action-icon" />
                    Mark All Present
                  </button>
                  <button
                    type="button"
                    onClick={markAllAbsent}
                    className="quick-action-btn absent"
                    disabled={submitLoading}
                  >
                    <FaExclamationTriangle className="action-icon" />
                    Mark All Absent
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="loading-container">
                <FaSpinner className="spin" />
                <span>Loading students...</span>
              </div>
            ) : students.length === 0 ? (
              <div className="no-students">
                <FaUsers className="no-students-icon" />
                <p>No students found for this class.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="table-container">
                  <table className="attendance-table">
                    <thead>
                      <tr>
                        <th className="photo-column">Photo</th>
                        <th className="id-column">Student ID</th>
                        <th className="name-column">Student Name</th>
                        <th className="status-column">Attendance Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student._id}>
                          <td className="student-photo">
                            <img
                              src={`${API_URL}/uploads/Student/${student.photo || "default-photo.jpg"}`}
                              alt={student.studentName}
                              onError={e => {
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='16' r='8' fill='%23ccc'/%3E%3Cpath d='M4,36 C4,29 11,24 20,24 C29,24 36,29 36,36' fill='%23ccc'/%3E%3Crect width='40' height='40' rx='20' stroke='%23ccc' stroke-width='2' fill='none'/%3E%3C/svg%3E";
                              }}
                            />
                          </td>
                          <td className="student-id">{student.studentID}</td>
                          <td className="student-name">{student.studentName}</td>
                          <td className="status-cell">
                            <div className="attendance-toggle">
                              <button
                                type="button"
                                className={`toggle-btn present ${attendance.find(a => a.studentId === student._id)?.status === "Present" ? "active" : ""}`}
                                onClick={() => handleAttendanceChange(student._id, "Present")}
                                disabled={submitLoading}
                              >
                                <span className="toggle-icon">✓</span>
                                Present
                              </button>
                              <button
                                type="button"
                                className={`toggle-btn absent ${attendance.find(a => a.studentId === student._id)?.status === "Absent" ? "active" : ""}`}
                                onClick={() => handleAttendanceChange(student._id, "Absent")}
                                disabled={submitLoading}
                              >
                                <span className="toggle-icon">✗</span>
                                Absent
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="summary-section">
                  <div className="summary-container">
                    <div className="summary-item total">
                      <strong>Total Students:</strong> {totalStudents}
                    </div>
                    <div className="summary-item present">
                      <strong>Present:</strong> {totalPresent}
                    </div>
                    <div className="summary-item absent">
                      <strong>Absent:</strong> {totalAbsent}
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={handleBack}
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

      <ToastContainer />
    </div>
  );
};

export default TakeClassAttendance; 