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

        console.log("Full API Response:", response.data); // Log full API response

        if (response.data?.assignedClasses?.length) {
          setAssignedClasses(response.data.assignedClasses);

          response.data.assignedClasses.forEach((cls) => {
            console.log(
              `Class: ${cls.className}, ID: ${cls._id || cls.classID}`
            );
            if (cls.assignedSubjects) {
              console.log("Assigned Subjects:", cls.assignedSubjects);
              cls.assignedSubjects.forEach((sub) => {
                console.log(
                  `Subject ID: ${sub._id}, Subject Name: ${sub.subjectName}`
                );
              });
            } else {
              console.log("No subjects assigned for this class.");
            }
          });
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
      <div className="back-button" onClick={handleBack}>
        <FaArrowLeft size={24} className="back-icon" />
        <span className="back-text">Back</span>
      </div>

      {assignedClasses.length > 0 ? (
        <div className="assigned-classes-to-teacher-list">
          {assignedClasses.map((cls) => (
            <div key={cls._id || cls.classID} className="class-card">
              <h3>{cls.className}</h3>
              {cls.assignedSubjects && cls.assignedSubjects.length > 0 ? (
                <p>
                  <strong>Subjects:</strong>{" "}
                  {cls.assignedSubjects
                    .map((sub) => sub.subjectName || "(No Name)")
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
