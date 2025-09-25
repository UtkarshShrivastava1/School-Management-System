import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./TrackTeacherAttendance.css";

const TrackTeacherAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [teacherID, setTeacherID] = useState(""); // Teacher ID filter
  const [teacherName, setTeacherName] = useState(""); // Teacher Name filter
  const [month, setMonth] = useState(""); // Month filter
  const [year, setYear] = useState(""); // Year filter
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();

  const API_URL =
    process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL
      : process.env.REACT_APP_DEVELOPMENT_URL;

  // Fetch attendance records based on filters
  const fetchTeachersAttendanceRecord = useCallback(async () => {
    try {
      const queryParams = [];

      // Build query parameters based on provided filters
      if (teacherID) queryParams.push(`teacherID=${teacherID}`);
      if (teacherName) queryParams.push(`teacherName=${teacherName}`);
      if (month) queryParams.push(`month=${month}`);
      if (year) queryParams.push(`year=${year}`);
      if (selectedDate) {
        const formattedDate = selectedDate?.toISOString().split("T")[0]; // Format date as YYYY-MM-DD
        queryParams.push(`date=${formattedDate}`);
      }

      const queryString =
        queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

      const response = await axios.get(
        `${API_URL}/api/admin/auth/teacher-attendance-records${queryString}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setAttendance(response.data.data || []);
      toast.success("Attendance records fetched successfully!");
    } catch (error) {
      setAttendance([]);
      toast.error(
        error.response?.data?.message || "Failed to fetch attendance records."
      );
    }
  }, [teacherID, teacherName, month, year, selectedDate, API_URL]);

  // Effect to trigger API call when filters change
  useEffect(() => {
    fetchTeachersAttendanceRecord();
  }, [fetchTeachersAttendanceRecord]);

  const handleBack = () => navigate("/admin/teacher-attendance");

  return (
    <div className="track-attendance-container">
      <h1>Track Teacher Attendance</h1>

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

      {/* Filter Inputs */}
      <div className="filter-container">
        <div>
          <label>Teacher ID:</label>
          <input
            type="text"
            value={teacherID}
            onChange={(e) => setTeacherID(e.target.value)}
            placeholder="Enter Teacher ID"
          />
        </div>
        <div>
          <label>Teacher Name:</label>
          <input
            type="text"
            value={teacherName}
            onChange={(e) => setTeacherName(e.target.value)}
            placeholder="Enter Teacher Name"
          />
        </div>
        <div>
          <label>Month:</label>
          <input
            type="number"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            placeholder="Enter Month (1-12)"
            min="1"
            max="12"
          />
        </div>
        <div>
          <label>Year:</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Enter Year (e.g., 2025)"
          />
        </div>
        <div className="date-picker-container">
          <label>Select Date:</label>
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            dateFormat="yyyy-MM-dd"
          />
        </div>
      </div>

      {/* Display Attendance Records */}
      <div className="attendance-records">
        <h3>Attendance Records</h3>
        {attendance.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Teacher ID</th>
                <th>Name</th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((record, index) => (
                <tr key={index}>
                  <td>{record.teacher?.teacherID || "N/A"}</td>
                  <td>{record.teacher?.name || "N/A"}</td>
                  <td>{record.status}</td>
                  <td>{record.remarks || "N/A"}</td>
                  <td>{new Date(record.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No attendance records found for the selected filters.</p>
        )}
      </div>

      <ToastContainer />
    </div>
  );
};

export default TrackTeacherAttendance;
