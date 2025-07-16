import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./ManageStudentFees.css";

const ManageStudentFees = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  const [dueDate, setDueDate] = useState(new Date());
  const [feeStatus, setFeeStatus] = useState("pending");
  const [paymentDate, setPaymentDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const API_URL =
    process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL
      : process.env.REACT_APP_DEVELOPMENT_URL;

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/admin/auth/students`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setStudents(response.data.data || []);
    } catch (error) {
      toast.error("Failed to fetch students");
    }
  };

  const handleBack = () => {
    navigate("/admin/student-management");
  };

  const handleUpdateFeeStatus = async (studentId) => {
    if (!feeAmount || !dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // TODO: Get the correct classId for the selected student
      // For now, try to get it from the student object (if available)
      const studentObj = students.find(s => s._id === studentId);
      const classId = studentObj?.enrolledClasses?.[0] || studentObj?.class?._id;
      if (!classId) {
        toast.error("Class ID not found for selected student");
        return;
      }

      // 1. Try to find an existing Fee record for this student, class, and dueDate
      const feeRes = await axios.get(
        `${API_URL}/api/fees/class/${classId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const feeRecords = feeRes.data || [];
      const existingFee = feeRecords.find(
        fee =>
          fee.student._id === studentId &&
          new Date(fee.dueDate).toDateString() === new Date(dueDate).toDateString()
      );

      if (existingFee) {
        // 2. PATCH the existing Fee record
        await axios.patch(
          `${API_URL}/api/fees/${existingFee._id}`,
          {
            status: feeStatus,
            amount: feeAmount,
            dueDate,
            paymentDate: feeStatus === "paid" ? paymentDate : null,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      } else {
        // 3. POST a new Fee record
        await axios.post(
          `${API_URL}/api/fees/`,
          {
            student: studentId,
            class: classId,
            academicYear: new Date().getFullYear().toString(),
            feeType: "monthly",
            amount: feeAmount,
            dueDate,
            status: feeStatus,
            paymentDate: feeStatus === "paid" ? paymentDate : null,
            totalAmount: feeAmount,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      }

      toast.success("Fee status updated successfully");
      fetchStudents(); // Refresh the student list
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update fee status");
    }
  };

  const filteredStudents = students.filter((student) =>
    student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentID.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fee-management-container">
      <h1>Manage Student Fees</h1>

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

      <div className="search-container">
        <input
          type="text"
          placeholder="Search by student name or ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="fee-management-content">
        <div className="fee-form">
          <h2>Update Fee Status</h2>
          <div className="form-group">
            <label>Select Student:</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              <option value="">Select a student</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.studentName} ({student.studentID})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Fee Amount:</label>
            <input
              type="number"
              value={feeAmount}
              onChange={(e) => setFeeAmount(e.target.value)}
              placeholder="Enter fee amount"
            />
          </div>

          <div className="form-group">
            <label>Due Date:</label>
            <DatePicker
              selected={dueDate}
              onChange={(date) => setDueDate(date)}
              dateFormat="yyyy/MM/dd"
            />
          </div>

          <div className="form-group">
            <label>Fee Status:</label>
            <select
              value={feeStatus}
              onChange={(e) => setFeeStatus(e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {feeStatus === "paid" && (
            <div className="form-group">
              <label>Payment Date:</label>
              <DatePicker
                selected={paymentDate}
                onChange={(date) => setPaymentDate(date)}
                dateFormat="yyyy/MM/dd"
              />
            </div>
          )}

          <button
            className="update-button"
            onClick={() => handleUpdateFeeStatus(selectedStudent)}
          >
            Update Fee Status
          </button>
        </div>

        <div className="fee-list">
          <h2>Student Fee Status</h2>
          <table className="fee-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Student ID</th>
                <th>Fee Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Payment Date</th>
                <th>Parent Contact</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student._id}>
                  <td>{student.studentName}</td>
                  <td>{student.studentID}</td>
                  <td>{student.feeAmount || "Not set"}</td>
                  <td>
                    {student.dueDate
                      ? new Date(student.dueDate).toLocaleDateString()
                      : "Not set"}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        student.feeStatus || "pending"
                      }`}
                    >
                      {student.feeStatus || "Pending"}
                    </span>
                  </td>
                  <td>
                    {student.paymentDate
                      ? new Date(student.paymentDate).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td>
                    {student.parent?.phone || "Not available"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default ManageStudentFees; 