import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./GetTeacherClassesAndSubjects.css";

const GetTeacherClassesAndSubjects = () => {
  const navigate = useNavigate();
  const [assignedClasses, setAssignedClasses] = useState([]);

  const API_URL =
    process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL
      : process.env.REACT_APP_DEVELOPMENT_URL;

  useEffect(() => {
    const fetchAssignedClasses = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/teacher/auth/assigned-classes`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        console.log("API Response:", response.data); // Debugging

        if (response.data?.assignedClasses?.length) {
          setAssignedClasses(response.data.assignedClasses);
        } else {
          toast.error("No assigned classes found.");
        }
      } catch (error) {
        console.error("Error fetching assigned classes and subjects:", error);
        toast.error("Failed to fetch assigned classes and subjects.");
      }
    };

    fetchAssignedClasses();
  }, [API_URL]);

  const handleBack = () => {
    navigate("/teacher/teacher-dashboard");
  };

  return (
    <div className="teachers-assignment-container">
      <h1>Assigned Classes and Subjects</h1>
      <div className="back-button">
        <FaArrowLeft onClick={handleBack} size={24} className="back-icon" />
        <span onClick={handleBack} className="back-text">
          Back
        </span>
      </div>

      {assignedClasses.length > 0 ? (
        <div className="assigned-classes-to-teacher-list">
          {assignedClasses.map((cls) => (
            <div key={cls.classID} className="class-card">
              <h3>{cls.className}</h3>
              {cls.assignedSubjects && cls.assignedSubjects.length > 0 ? (
                <p>
                  <strong>Subjects:</strong>{" "}
                  {cls.assignedSubjects
                    .map((sub) => sub.subjectName)
                    .join(", ")}
                </p>
              ) : (
                <p>
                  <strong>Subjects:</strong> No subjects assigned
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>No assigned classes found.</p>
      )}

      <ToastContainer />
    </div>
  );
};

export default GetTeacherClassesAndSubjects;
