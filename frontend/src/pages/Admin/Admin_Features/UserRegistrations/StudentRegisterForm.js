import React, { useState } from "react";
import axios from "axios";
import "./StudentRegisterForm.css";
import { Modal, Button, Image } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaArrowLeft } from "react-icons/fa"; // Importing the back arrow icon

const StudentRegisterForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    studentName: "",
    studentEmail: "",
    studentPhone: "",
    studentAddress: "",
    studentDOB: "",
    studentGender: "Male", // Default value for gender
    religion: "",
    category: "",
    bloodgroup: "",
    studentFatherName: "",
    studentMotherName: "",
    relationship: "Mother", // Default value for relationship
    parentName: "",
    parentContactNumber: "",
    parentEmail: "",
    photo: null,
    className: "", // Add this line for class selection
  });

  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const API_URL =
    process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL
      : process.env.REACT_APP_DEVELOPMENT_URL;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle the back button click
  const handleBack = () => {
    navigate("/admin/admin-dashboard", {
      state: { activeTab: "User Registration" },
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData((prev) => ({ ...prev, photo: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formDataToSend = new FormData();

    Object.keys(formData).forEach((key) => {
      formDataToSend.append(key, formData[key]);
    });

    try {
      const response = await axios.post(
        `${API_URL}/api/admin/auth/createstudent`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-User-Role": "admin"
          },
        }
      );

      setSuccessData(response.data);
      setShowModal(true);

      // Show success notification
      toast.success("Student created successfully!", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });

      // Redirect to admin dashboard after 5 seconds
      setTimeout(() => {
        navigate("/admin/admin-dashboard", {
          state: { activeTab: "User Registration" }
        });
      }, 5000);
    } catch (error) {
      console.error('Error creating student:', error.response?.data || error);
      setErrors(error.response?.data?.errors || [{ msg: error.response?.data?.message || error.message }]);
      toast.error(error.response?.data?.message || "Failed to create student. Please try again.", {
        theme: "colored",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setTimeout(() => navigate("/admin-dashboard"), 300);
  };

  //--------------------------------------------------------------------------------------------------------------------------------
  //Handles Print Modal
  const handlePrint = () => {
    const printContent = document.getElementById("modalContent");
    if (printContent) {
      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Details</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
            }
            .photo-section {
              text-align: center;
              margin-bottom: 20px;
            }
            .photo-section img {
              width: 150px;
              height: 150px;
              object-fit: cover;
              border-radius: 50%;
              border: 2px solid #007bff;
              margin-bottom: 20px;
            }
            p {
              margin: 10px 0;
              font-size: 16px;
            }
            strong {
              color: #007bff;
            }
            span {
              color: red;
            }
            button {
              display: none; /* Hide buttons in print view */
            }
          </style>
        </head>
        <body>
          ${printContent.outerHTML} <!-- Use outerHTML to include the content and its wrapping element -->
        </body>
      </html>
    `);
      printWindow.document.close();
      printWindow.print();
    }
  };
  //------------------------------------------------------------------------------------------------------------
  return (
    <div className="student-register-form">
      {/* Back button with icon */}
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
          style={{
            cursor: "pointer",
            fontSize: "18px",
            fontWeight: "bold",
            verticalAlign: "middle",
            color: "#007bff",
          }}
        >
          Back
        </span>
      </div>
      <h2>Register Student</h2>
      <form onSubmit={handleSubmit}>
        {errors.length > 0 && (
          <div className="error-messages">
            {errors.map((error, index) => (
              <p key={index} style={{ color: "red" }}>
                {error.msg}
              </p>
            ))}
          </div>
        )}

        {/* Student Information Section */}
        <div>
          <h3>Student Information</h3>
          <div>
            <label>Student Name</label>
            <input
              type="text"
              name="studentName"
              value={formData.studentName}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Class</label>
            <select
              name="className"
              value={formData.className}
              onChange={handleChange}
              required
            >
              <option value="">Select a class</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={`Class ${i + 1}`}>
                  Class {i + 1}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Email</label>
            <input
              type="email"
              name="studentEmail"
              value={formData.studentEmail}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Phone</label>
            <input
              type="tel"
              name="studentPhone"
              value={formData.studentPhone}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Address</label>
            <input
              type="text"
              name="studentAddress"
              value={formData.studentAddress}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Date of Birth</label>
            <input
              type="date"
              name="studentDOB"
              value={formData.studentDOB}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Gender</label>
            <select
              name="studentGender"
              value={formData.studentGender}
              onChange={handleChange}
              required
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label>Religion</label>
            <input
              type="text"
              name="religion"
              value={formData.religion}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Category</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Blood Group</label>
            <input
              type="text"
              name="bloodgroup"
              value={formData.bloodgroup}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Father's Name</label>
            <input
              type="text"
              name="studentFatherName"
              value={formData.studentFatherName}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Mother's Name</label>
            <input
              type="text"
              name="studentMotherName"
              value={formData.studentMotherName}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        {/* Photo Upload Section */}
        <div>
          <label>Upload Photo of Student</label>
          <input type="file" name="photo" onChange={handleFileChange} />
        </div>
        {/* Parent Information Section */}
        <div>
          <h3>Parent Information</h3>
          <p style={{ color: "blue" }}>
            Parent information will be used to create a parent profile. The
            Parent/Guardian will be granted a unique Parent ID and password for
            accessing the system.
          </p>
          <div>
            <label>Relationship</label>
            <select
              name="relationship"
              value={formData.relationship}
              onChange={handleChange}
              required
            >
              <option value="Mother">Mother</option>
              <option value="Father">Father</option>
              <option value="Guardian">Guardian</option>
            </select>
          </div>
          <div>
            <label>Parent Name</label>
            <input
              type="text"
              name="parentName"
              value={formData.parentName}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Parent Contact</label>
            <input
              type="tel"
              name="parentContactNumber"
              value={formData.parentContactNumber}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Parent Email</label>
            <input
              type="email"
              name="parentEmail"
              value={formData.parentEmail}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Submit Button */}
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Student"}
        </button>
      </form>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            Student and Parent Profiles Created Successfully
          </Modal.Title>
        </Modal.Header>
        <Modal.Body id="modalContent">
          {/* Log the successData to inspect */}
          {console.log("Success Data:", successData)}

          {/* Display Student Photo */}
          <div
            className="photo-section"
            style={{
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            <Image
              src={`${API_URL}/uploads/Admin/${
                successData?.student?.photo || "default-photo.jpg"
              }`}
              alt="Student Profile"
              onError={(e) =>
                (e.target.src = "https://via.placeholder.com/150")
              } // Fallback image
              style={{
                width: "150px",
                height: "150px",
                objectFit: "cover",
                borderRadius: "50%",
              }}
            />
          </div>

          {/* Display Student Details */}
          <div>
            <h2>Student Details</h2>
            <div
              style={{
                borderBottom: "1px solid #ddd",
                paddingBottom: "5px",
                marginBottom: "10px",
              }}
            >
              <h3>Basic Information</h3>
              <p>
                <strong>Name:</strong>{" "}
                {successData?.student?.name || "Not Provided"}
              </p>
              <p>
                <strong>Class:</strong>{" "}
                {successData?.student?.className || "Not Provided"}
              </p>
              <p>
                <strong>Student ID:</strong>{" "}
                {successData?.student?.studentID || "Not Provided"}
              </p>
              <p>
                <strong>Student Password:</strong>{" "}
                {successData?.student?.studentPassword || "N/A"}
                <span style={{ color: "red", fontWeight: "bold" }}>
                  (Please change after first login)
                </span>
              </p>
              <p>
                <strong>Email:</strong>{" "}
                {successData?.student?.email || "Not Provided"}
              </p>
              <p>
                <strong>Phone:</strong>{" "}
                {successData?.student?.phone || "Not Provided"}
              </p>
              <p>
                <strong>Address:</strong>{" "}
                {successData?.student?.address || "Not Provided"}
              </p>
              <p>
                <strong>Blood Group:</strong>{" "}
                {successData?.student?.bloodgroup || "Not Provided"}
              </p>
              <p>
                <strong>Category:</strong>{" "}
                {successData?.student?.category || "Not Provided"}
              </p>
              <p>
                <strong>Date of Admission:</strong>{" "}
                {successData?.student?.dateOfAdmission
                  ? new Date(
                      successData.student.dateOfAdmission
                    ).toLocaleDateString()
                  : "Not Provided"}
              </p>
              <p>
                <strong>Father's Name:</strong>{" "}
                {successData?.student?.fatherName || "Not Provided"}
              </p>
              <p>
                <strong>Mother's Name:</strong>{" "}
                {successData?.student?.motherName || "Not Provided"}
              </p>
              <p>
                <strong>Religion:</strong>{" "}
                {successData?.student?.religion || "Not Provided"}
              </p>
              {/* Display Registered By */}
              <p>
                <strong>Registered By:</strong>{" "}
                {successData?.student?.registeredBy
                  ? `${successData.student.registeredBy.name} (ID: ${successData.student.registeredBy.adminID})`
                  : "Unknown"}
              </p>
              {/* Display Registered At */}
              <p>
                <strong>Registered At:</strong> {new Date().toLocaleString()}
              </p>
            </div>
          </div>

          {/* Display Parent Details */}
          <div>
            <h2>Parent Details</h2>
            <div
              style={{
                borderBottom: "1px solid #ddd",
                paddingBottom: "5px",
                marginBottom: "10px",
              }}
            >
              <h3>Basic Information</h3>
              <p>
                <strong>Parent Name:</strong>{" "}
                {successData?.parent?.name || "Not Provided"}
              </p>
              <p>
                <strong>Parent ID:</strong>{" "}
                {successData?.parent?.parentID || "Not Provided"}
              </p>
              <p>
                <strong>Parent Password:</strong>{" "}
                {successData?.parent?.parentPassword || "Not Provided"}
                <span style={{ color: "red", fontWeight: "bold" }}>
                  (Please change after first login)
                </span>
              </p>
              <p>
                <strong>Email:</strong>{" "}
                {successData?.parent?.email || "Not Provided"}
              </p>
              <p>
                <strong>Phone:</strong>{" "}
                {successData?.parent?.contactNumber || "Not Provided"}
              </p>
            </div>
          </div>

          {/* Print Button */}
          <Button
            variant="primary"
            onClick={handlePrint}
            style={{
              marginTop: "20px",
              display: "block",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Print Details
          </Button>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer />
    </div>
  );
};

export default StudentRegisterForm;
