import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
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

  const API_URL =
    process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL
      : process.env.REACT_APP_DEVELOPMENT_URL;

  const fetchStudents = async () => {
    try {
      let queryString = "?";

      if (name) queryString += `name=${name}&`;
      if (studentID) queryString += `studentID=${studentID}&`;
      if (className) queryString += `className=${className}&`;
      if (gender) queryString += `gender=${gender}&`;
      if (category) queryString += `category=${category}&`;
      if (religion) queryString += `religion=${religion}&`;
      if (selectedDate)
        queryString += `selectedDate=${
          selectedDate.toISOString().split("T")[0]
        }&`;

      if (queryString.endsWith("&")) queryString = queryString.slice(0, -1);

      const response = await axios.get(
        `${API_URL}/api/admin/auth/students/search${queryString}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
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
                      src={`${API_URL}/uploads/Admin/${
                        student?.photo || "default-photo.jpg"
                      }`}
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
