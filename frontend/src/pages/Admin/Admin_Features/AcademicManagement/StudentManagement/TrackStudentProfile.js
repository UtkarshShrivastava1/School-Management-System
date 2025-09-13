import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axiosInstance from "../..//axiosInstance"; // ✅ centralized axios instance
import "./TrackStudentProfile.css";

const TrackStudentProfile = () => {
  const [students, setStudents] = useState([]);
  const [name, setName] = useState("");
  const [studentID, setStudentID] = useState("");
  const [className, setClassName] = useState("");
  const [gender, setGender] = useState("");
  const [category, setCategory] = useState("");
  const [religion, setReligion] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const navigate = useNavigate();

  // ✅ Fetch Students with filters
  const fetchStudents = async () => {
    try {
      const queryParams = [];

      if (name) queryParams.push(`name=${encodeURIComponent(name)}`);
      if (studentID) queryParams.push(`studentID=${encodeURIComponent(studentID)}`);
      if (className) queryParams.push(`className=${encodeURIComponent(className)}`);
      if (gender) queryParams.push(`gender=${gender}`);
      if (category) queryParams.push(`category=${category}`);
      if (religion) queryParams.push(`religion=${encodeURIComponent(religion)}`);
      if (selectedDate) {
        const formattedDate = selectedDate.toISOString().split("T")[0];
        queryParams.push(`selectedDate=${formattedDate}`);
      }

      const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

      const response = await axiosInstance.get(
        `/api/admin/auth/students/search${queryString}`
      );

      setStudents(response.data.data || []);
      toast.success("Students fetched successfully!");
    } catch (error) {
      setStudents([]);
      toast.error(
        error.response?.data?.message || "Failed to fetch student profiles."
      );
    }
  };

  const handleBack = () => navigate("/admin/student-management");

  return (
    <div className="Get-profile-container">
      <h1>Track Student Profile</h1>

      {/* Back Button */}
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

      {/* Filters Section */}
      <div className="filters">
        <label>Student Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter student name"
        />

        <label>Student ID</label>
        <input
          type="text"
          value={studentID}
          onChange={(e) => setStudentID(e.target.value)}
          placeholder="Enter student ID"
        />

        <label>Class Name</label>
        <input
          type="text"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          placeholder="Enter class name"
        />

        <label>Gender</label>
        <select value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>

        <label>Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Select Category</option>
          <option value="General">General</option>
          <option value="OBC">OBC</option>
          <option value="SC/ST">SC/ST</option>
        </select>

        <label>Religion</label>
        <input
          type="text"
          value={religion}
          onChange={(e) => setReligion(e.target.value)}
          placeholder="Enter religion"
        />

        <label>Admission Date</label>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          dateFormat="yyyy/MM/dd"
          placeholderText="Select Admission Date"
        />

        <button onClick={fetchStudents}>Search</button>
      </div>

      {/* Display Profiles in a Table */}
      <div className="student-profiles">
        {students.length === 0 ? (
          <p>No students found matching your criteria.</p>
        ) : (
          <table className="profile-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Student ID</th>
                <th>Class</th>
                <th>Gender</th>
                <th>Category</th>
                <th>Religion</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Father's Name</th>
                <th>Mother's Name</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.studentID}>
                  <td>
                    <img
                      src={`/uploads/Admin/${student?.photo || "default-photo.jpg"}`}
                      alt={`${student.studentName}'s profile`}
                      className="table-profile-image"
                    />
                  </td>
                  <td>{student.studentName}</td>
                  <td>{student.studentID}</td>
                  <td>{student.className}</td>
                  <td>{student.studentGender}</td>
                  <td>{student.category}</td>
                  <td>{student.religion}</td>
                  <td>{student.studentEmail}</td>
                  <td>{student.studentPhone}</td>
                  <td>{student.studentFatherName}</td>
                  <td>{student.studentMotherName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ToastContainer />
    </div>
  );
};

export default TrackStudentProfile;
