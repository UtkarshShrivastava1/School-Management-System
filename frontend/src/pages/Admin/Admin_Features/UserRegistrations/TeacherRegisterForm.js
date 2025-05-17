import React, { useState } from "react";
import axios from "axios";
import "./TeacherRegisterForm.css";
import { Modal, Button, Image } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaArrowLeft } from "react-icons/fa"; // Importing the back arrow icon

const TeacherRegisterForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    designation: "",
    address: "",
    dob: "",
    gender: "",
    department: "",
    religion: "",
    category: "",
    bloodgroup: "",
    emergencyContact: {
      name: "",
      relation: "",
      phone: "",
    },
    experience: "0",
    highestQualification: "",
    AADHARnumber: "",
    salary: "0",
    bankDetails: {
      accountNumber: "",
      bankName: "",
      ifscCode: "",
    },
    photo: null,
  });

  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [successData, setSuccessData] = useState(null);
  //--------------------------------------------------------------------------------------------------------------------------------
  //API URL controller
  const API_URL =
    process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL
      : process.env.REACT_APP_DEVELOPMENT_URL;
  //--------------------------------------------------------------------------------------------------------------------------------
  // Handle the back button click
  // Handle the back button click
  const handleBack = () => {
    navigate("/admin/admin-dashboard", {
      state: { activeTab: "User Registration" },
    });
  };
  //------------------------------------------------------------------------------------------------------------
  // Handles change
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("emergencyContact") || name.startsWith("bankDetails")) {
      const fieldName = name.split(".")[1];
      setFormData((prev) => {
        const updatedData = {
          ...prev,
          [name.split(".")[0]]: {
            ...prev[name.split(".")[0]],
            [fieldName]: value,
          },
        };
        console.log(`Form data updated: ${name} = ${value}`); // Log nested data change
        return updatedData;
      });
    } else {
      setFormData((prev) => {
        const updatedData = {
          ...prev,
          [name]: value,
        };
        console.log(`Form data updated: ${name} = ${value}`); // Log simple data change
        return updatedData;
      });
    }
  };
  //------------------------------------------------------------------------------------------------------------

  // Handles file change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData((prev) => {
      const updatedData = {
        ...prev,
        photo: file,
      };
      console.log(`File uploaded: photo = ${file?.name}`); // Log file upload
      return updatedData;
    });
  };
  //--------------------------------------------------------------------------------------------------------------------------------
  //Handles Form Submit and create new teacher
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submission initiated.");
    setLoading(true);
    setErrors([]); // Clear previous errors

    const formDataToSend = new FormData();

    // Populate FormData with nested and array data
    Object.keys(formData).forEach((key) => {
      if (key === "emergencyContact" || key === "bankDetails") {
        // Parse nested objects differently - needed for proper backend handling
        if (key === "emergencyContact") {
          formDataToSend.append("emergencyContact.name", formData.emergencyContact.name || "");
          formDataToSend.append("emergencyContact.relation", formData.emergencyContact.relation || "");
          formDataToSend.append("emergencyContact.phone", formData.emergencyContact.phone || "");
          console.log("Added emergencyContact fields");
        } else if (key === "bankDetails") {
          formDataToSend.append("bankDetails.accountNumber", formData.bankDetails.accountNumber || "");
          formDataToSend.append("bankDetails.bankName", formData.bankDetails.bankName || "");
          formDataToSend.append("bankDetails.ifscCode", formData.bankDetails.ifscCode || "");
          console.log("Added bankDetails fields");
        }
      } else if (key === "salary" || key === "experience") {
        // Ensure these are sent as numbers
        const numValue = parseFloat(formData[key]) || 0;
        formDataToSend.append(key, numValue.toString());
        console.log(`Adding numeric field ${key}:`, numValue);
      } else if (Array.isArray(formData[key])) {
        formData[key].forEach((item, index) => {
          formDataToSend.append(`${key}[${index}]`, item || "");
        });
      } else {
        // Handle null/undefined values
        const value = formData[key] || "";
        formDataToSend.append(key, value);
        console.log(`Adding field ${key}:`, value);
      }
    });

    // Double-check required fields
    const requiredFields = ["name", "email", "phone", "designation", "address", "dob", "gender", "department", "salary"];
    const missingFields = requiredFields.filter(field => !formData[field] || formData[field] === "");
    
    if (missingFields.length > 0) {
      setErrors(missingFields.map(field => ({ msg: `${field} is required` })));
      setLoading(false);
      toast.error(`Missing required fields: ${missingFields.join(", ")}`, {
        position: "top-center",
        theme: "colored",
      });
      return;
    }

    try {
      // Log each key-value pair in formDataToSend for debugging
      console.log("Form data being sent:");
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0], pair[1]);
      }
      
      const response = await axios.post(
        `${API_URL}/api/admin/auth/createteacher`,
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
      toast.success("Teacher created successfully!", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });

      // Redirect to admin dashboard after 3 seconds
      // setTimeout(() => {
      //   navigate("/admin/admin-dashboard", {
      //     state: { activeTab: "User Registration" }
      //   });
      // }, 3000);
    } catch (error) {
      console.error("Form submission error:", error);
      console.error("Error response data:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      // Display detailed error information for debugging
      const errorResponse = error.response?.data || {};
      const errorMessage = errorResponse.message || "Unknown error occurred";
      const validationErrors = errorResponse.errors || [];
      const detailedError = errorResponse.error || "";
      
      console.log("Error message:", errorMessage);
      console.log("Validation errors:", validationErrors);
      console.log("Detailed error:", detailedError);
      
      // Handle validation errors
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        
        // Show all validation errors in the toast
        validationErrors.forEach(error => {
          toast.error(error.msg, {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "colored",
          });
        });
      } else {
        // Handle other types of errors
        let displayErrorMessage = errorMessage;
        
        if (detailedError.includes("duplicate key error")) {
          if (detailedError.includes("AADHARnumber")) {
            displayErrorMessage = "A teacher with this AADHAR number already exists.";
            setFormData(prev => ({ ...prev, AADHARnumber: "" }));
          } else if (detailedError.includes("phone")) {
            displayErrorMessage = "A teacher with this phone number already exists.";
            setFormData(prev => ({ ...prev, phone: "" }));
          } else if (detailedError.includes("email")) {
            displayErrorMessage = "A teacher with this email already exists.";
            setFormData(prev => ({ ...prev, email: "" }));
          }
        }
        
        setErrors([{ msg: displayErrorMessage }]);
        toast.error(displayErrorMessage, {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  //-------------------------------------------------------------------------------------------------
  // Handles closing modal and navigation back to teacher dashboard
  const handleCloseModal = () => {
    setShowModal(false);
    // setTimeout(() => navigate("/admin-dashboard"), 300);
    navigate("/admin-dashboard");
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
    <div className="teacher-register-form">
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
      <h2>Create New Teacher</h2>
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

        <div>
          <label>Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Phone</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            pattern="[0-9]{10}"
            maxLength="10"
            placeholder="10-digit phone number"
          />
          {formData.phone && formData.phone.length !== 10 && (
            <span style={{ color: "red", fontSize: "0.8rem" }}>
              Phone number must be exactly 10 digits
            </span>
          )}
        </div>

        <div>
          <label>Designation</label>
          <input
            type="text"
            name="designation"
            value={formData.designation}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Date of Birth</label>
          <input
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Gender</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label>Department</label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Religion</label>
          <input
            type="text"
            name="religion"
            value={formData.religion}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Category</label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Blood Group</label>
          <input
            type="text"
            name="bloodgroup"
            value={formData.bloodgroup}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Emergency Contact Name</label>
          <input
            type="text"
            name="emergencyContact.name"
            value={formData.emergencyContact.name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Emergency Contact Relation</label>
          <input
            type="text"
            name="emergencyContact.relation"
            value={formData.emergencyContact.relation}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Emergency Contact Phone</label>
          <input
            type="text"
            name="emergencyContact.phone"
            value={formData.emergencyContact.phone}
            onChange={handleChange}
            required
            pattern="[0-9]{10}"
            maxLength="10"
            placeholder="10-digit phone number"
          />
          {formData.emergencyContact.phone && formData.emergencyContact.phone.length !== 10 && (
            <span style={{ color: "red", fontSize: "0.8rem" }}>
              Emergency contact phone must be exactly 10 digits
            </span>
          )}
        </div>

        <div>
          <label>Experience</label>
          <input
            type="number"
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Highest Qualification</label>
          <input
            type="text"
            name="highestQualification"
            value={formData.highestQualification}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>AADHAR Number</label>
          <input
            type="text"
            name="AADHARnumber"
            value={formData.AADHARnumber}
            onChange={handleChange}
            required
            pattern="[0-9]{12}"
            maxLength="12"
            placeholder="12-digit AADHAR number"
          />
          {formData.AADHARnumber && formData.AADHARnumber.length !== 12 && (
            <span style={{ color: "red", fontSize: "0.8rem" }}>
              AADHAR number must be exactly 12 digits
            </span>
          )}
        </div>

        <div>
          <label>Salary</label>
          <input
            type="number"
            name="salary"
            value={formData.salary}
            onChange={handleChange}
            required
            min="0"
            placeholder="Enter salary amount"
          />
        </div>

        <div>
          <label>Bank Account Number</label>
          <input
            type="text"
            name="bankDetails.accountNumber"
            value={formData.bankDetails.accountNumber}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Bank Name</label>
          <input
            type="text"
            name="bankDetails.bankName"
            value={formData.bankDetails.bankName}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>IFSC Code</label>
          <input
            type="text"
            name="bankDetails.ifscCode"
            value={formData.bankDetails.ifscCode}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Upload Photo</label>
          <input type="file" name="photo" onChange={handleFileChange} />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Teacher"}
        </button>
      </form>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Teacher Registered Successfully</Modal.Title>
        </Modal.Header>
        <Modal.Body id="modalContent">
          {successData?.data ? (
            <>
              {/* teacher Photo */}
              <div
                className="photo-section"
                style={{
                  textAlign: "center",
                  marginBottom: "20px",
                }}
              >
                <Image
                  src={successData?.data?.photo ? 
                    `${API_URL}/uploads/Teacher/${successData.data.photo}` : 
                    `${process.env.PUBLIC_URL}/placeholders/user-placeholder.png`
                  }
                  alt="Teacher Profile"
                  onError={(e) => {
                    console.log("Teacher image load error, using data URI placeholder");
                    // Using a simple data URI for a gray square with a person icon
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%23cccccc'/%3E%3Cpath d='M75 75 Q95 45 115 75 L115 115 L35 115 L35 75 Q55 45 75 75' fill='%23888888'/%3E%3Ccircle cx='75' cy='45' r='20' fill='%23888888'/%3E%3C/svg%3E";
                  }}
                  style={{
                    width: "150px",
                    height: "150px",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              </div>

              <div>
                <h2>Teacher Details</h2>
                <div
                  style={{
                    borderBottom: "1px solid #ddd",
                    paddingBottom: "5px",
                    marginBottom: "10px",
                  }}
                >
                  <h3>Basic Information</h3>
                  <p>
                    <strong>Name:</strong> {successData.data.name}
                  </p>
                  <p>
                    <strong>Teacher ID:</strong> {successData.data.teacherID}
                  </p>
                  <p>
                    <strong>Email:</strong>{" "}
                    {successData.data.email || "Not Provided"}
                  </p>
                  <p>
                    <strong>Phone:</strong>{" "}
                    {successData.data.phone || "Not Provided"}
                  </p>
                  <p>
                    <strong>Role:</strong> {successData.data.role || "teacher"}
                  </p>
                  <p>
                    <strong>Password:</strong>{" "}
                    {successData.data.password || "teacher123"}{" "}
                    <span style={{ color: "red", fontWeight: "bold" }}>
                      (Please change after first login)
                    </span>
                  </p>
                </div>

                <div
                  style={{
                    borderBottom: "1px solid #ddd",
                    paddingBottom: "5px",
                    marginBottom: "10px",
                  }}
                >
                  <h3>Professional Information</h3>
                  <p>
                    <strong>Designation:</strong>{" "}
                    {successData.data.designation || "Not Provided"}
                  </p>
                  <p>
                    <strong>Department:</strong>{" "}
                    {successData.data.department || "Not Provided"}
                  </p>
                  <p>
                    <strong>Highest Qualification:</strong>{" "}
                    {successData.data.highestQualification || "Not Provided"}
                  </p>
                </div>

                <div
                  style={{
                    borderBottom: "1px solid #ddd",
                    paddingBottom: "5px",
                    marginBottom: "10px",
                  }}
                >
                  <h3>Personal Information</h3>
                  <p>
                    <strong>Address:</strong>{" "}
                    {successData.data.address || "Not Provided"}
                  </p>
                  <p>
                    <strong>Date of Birth:</strong>{" "}
                    {successData.data.dob
                      ? new Date(successData.data.dob).toLocaleDateString()
                      : "Not Provided"}
                  </p>
                  <p>
                    <strong>Gender:</strong>{" "}
                    {successData.data.gender || "Not Provided"}
                  </p>
                  <p>
                    <strong>Religion:</strong>{" "}
                    {successData.data.religion || "Not Provided"}
                  </p>
                  <p>
                    <strong>Category:</strong>{" "}
                    {successData.data.category || "Not Provided"}
                  </p>
                  <p>
                    <strong>Blood Group:</strong>{" "}
                    {successData.data.bloodgroup || "Not Provided"}
                  </p>
                  <p>
                    <strong>AADHAR Number:</strong>{" "}
                    {successData.data.AADHARnumber || "Not Provided"}
                  </p>
                </div>

                <div
                  style={{
                    borderBottom: "1px solid #ddd",
                    paddingBottom: "5px",
                    marginBottom: "10px",
                  }}
                >
                  <h3>Registration Information</h3>
                  <p>
                    <strong>Registered By:</strong>{" "}
                    {successData.data.registeredBy
                      ? `${successData.data.registeredBy.name} (ID: ${successData.data.registeredBy.adminID})`
                      : "Unknown"}
                  </p>
                  <p>
                    <strong>Registered At:</strong>{" "}
                    {new Date(successData.data.createdAt).toLocaleString()}
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
            </>
          ) : (
            <p>Loading...</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Toast notifications container */}
      <ToastContainer />
    </div>
  );
};

export default TeacherRegisterForm;
