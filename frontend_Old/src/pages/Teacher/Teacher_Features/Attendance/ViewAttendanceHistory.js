import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaCalendarAlt, FaDownload } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./ViewAttendanceHistory.css";

const API_URL = process.env.REACT_APP_NODE_ENV === "production"
  ? process.env.REACT_APP_PRODUCTION_URL
  : process.env.REACT_APP_DEVELOPMENT_URL;

const ViewAttendanceHistory = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [showDownloadRange, setShowDownloadRange] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");

  // Fetch teacher's classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/attendance/teacher-classes`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        // Format classes to show section information
        const formattedClasses = response.data.data.map(cls => ({
          ...cls,
          displayName: `${cls.className} - Section ${cls.section}`,
          classNameWithSection: `${cls.className} - Section ${cls.section}`
        }));
        setClasses(formattedClasses);
      } catch (error) {
        toast.error("Failed to fetch classes");
        console.error("Error fetching classes:", error);
      }
    };
    fetchClasses();
  }, []);

  // Fetch attendance history when class or date changes
  useEffect(() => {
    if (selectedClass && selectedDate) {
      const fetchAttendanceHistory = async () => {
        try {
          setLoading(true);
          const queryParams = `?date=${selectedDate}`;
          const response = await axios.get(
            `${API_URL}/api/attendance/class/${selectedClass}/attendance-history${queryParams}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          // Filter to only show the exact selected date
          const filtered = (response.data.data || []).filter(record => {
            const recordDate = new Date(record.date).toISOString().split("T")[0];
            return recordDate === selectedDate;
          });
          setAttendanceHistory(filtered);
        } catch (error) {
          toast.error("Failed to fetch attendance history");
          console.error("Error fetching attendance history:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchAttendanceHistory();
    } else {
      setAttendanceHistory([]);
    }
  }, [selectedClass, selectedDate]);

  // Fetch students when class is selected
  useEffect(() => {
    if (selectedClass) {
      const fetchStudents = async () => {
        try {
          const response = await axios.get(
            `${API_URL}/api/attendance/class/${selectedClass}/students`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          setStudents(response.data.data);
        } catch (error) {
          setStudents([]);
        }
      };
      fetchStudents();
    } else {
      setStudents([]);
    }
  }, [selectedClass]);

  const handleDownload = async () => {
    if (!selectedClass || !fromDate || !toDate) {
      toast.error("Please select a class and date range");
      return;
    }
    try {
      setDownloadLoading(true);
      const response = await axios.get(
        `${API_URL}/api/attendance/class/${selectedClass}/download-report`,
        {
          params: {
            fromDate,
            toDate
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          responseType: 'blob'
        }
      );
      if (!response.data || response.data.size === 0) {
        toast.error("No data available for the selected date range");
        return;
      }
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_report_${selectedClass}_${fromDate}_to_${toDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
      toast.success("Report downloaded successfully");
      setShowDownloadRange(false);
      setFromDate("");
      setToDate("");
    } catch (error) {
      toast.error("Failed to download report");
      console.error("Download error details:", error);
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleDownloadStudent = async () => {
    if (!selectedClass || !selectedStudent || !fromDate || !toDate) {
      toast.error("Please select a class, student, and date range");
      return;
    }
    try {
      setDownloadLoading(true);
      const response = await axios.get(
        `${API_URL}/api/attendance/class/${selectedClass}/download-report`,
        {
          params: {
            fromDate,
            toDate,
            studentId: selectedStudent
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          responseType: 'blob'
        }
      );
      if (!response.data || response.data.size === 0) {
        toast.error("No data available for the selected student and date range");
        return;
      }
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_report_${selectedClass}_${selectedStudent}_${fromDate}_to_${toDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
      toast.success("Student report downloaded successfully");
      setShowDownloadRange(false);
      setFromDate("");
      setToDate("");
      setSelectedStudent("");
    } catch (error) {
      toast.error("Failed to download student report");
      console.error("Download error details:", error);
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <div className="view-attendance-container">
      <div className="attendance-header">
        <h2>View Attendance History</h2>
        <button
          className="download-attendance-btn"
          onClick={() => setShowDownloadRange(v => !v)}
          disabled={!selectedClass}
        >
          <FaDownload /> Download Attendance
        </button>
      </div>
      {showDownloadRange && (
        <div className="download-range-modal">
          <div className="form-group">
            <label>From:</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>To:</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Student (optional):</label>
            <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
              <option value="">All Students</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.studentName} ({student.studentID})
                </option>
              ))}
            </select>
          </div>
          <button
            className="download-attendance-btn"
            onClick={selectedStudent ? handleDownloadStudent : handleDownload}
            disabled={!fromDate || !toDate || downloadLoading}
          >
            {downloadLoading ? "Downloading..." : selectedStudent ? "Download Student Attendance" : "Download"}
          </button>
        </div>
      )}
      <div className="attendance-filters">
        <div className="form-group">
          <label htmlFor="class">Select Class:</label>
          <select
            id="class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            disabled={loading}
          >
            <option value="">Select a class</option>
            {classes.map((cls) => (
              <option key={cls.classId} value={cls.classId}>
                {cls.displayName || `${cls.className} - Section ${cls.section}`}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="date">Select Date:</label>
          <div className="date-picker-wrapper">
            <FaCalendarAlt className="calendar-icon" />
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
      </div>
      <div className="attendance-history-section">
        {!selectedClass || !selectedDate ? (
          <div className="no-records">Please select a class and date to view attendance.</div>
        ) : loading ? (
          <div className="loading">Loading attendance history...</div>
        ) : attendanceHistory.length > 0 ? (
          attendanceHistory.map((record) => {
            const totalPresent = record.records.filter(r => r.status === "Present").length;
            const totalAbsent = record.records.filter(r => r.status === "Absent").length;
            return (
              <div key={record.date} className="attendance-record-card">
                <div className="attendance-record-header">
                  <h3>Attendance for {new Date(record.date).toLocaleDateString()}</h3>
                  <div className="attendance-summary">
                    <span className="present">Present: {totalPresent}</span>
                    <span className="absent">Absent: {totalAbsent}</span>
                  </div>
                </div>
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Name</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.records.map((studentRecord) => (
                      <tr key={studentRecord.studentId._id}>
                        <td>{studentRecord.studentId.studentID}</td>
                        <td>{studentRecord.studentId.studentName}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              studentRecord.status.toLowerCase()
                            }`}
                          >
                            {studentRecord.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })
        ) : (
          <div className="no-records">
            No attendance records found for the selected class and date.
          </div>
        )}
      </div>
      <div className="form-actions">
        <button onClick={() => navigate('/teacher/teacher-dashboard')} disabled={loading}>
          Back to Attendance Management
        </button>
      </div>
    </div>
  );
};

export default ViewAttendanceHistory; 