import axiosInstance from "../..//axiosInstance"; // ✅ centralized axios instance
import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AssignTeacherToSubject.css";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";


const AssignTeacherToClass = () => {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedClasses, setSelectedClasses] = useState([]);
  const navigate = useNavigate();

  // ✅ Fetch all teachers and classes on component mount
  useEffect(() => {
    const fetchTeachersAndClasses = async () => {
      try {
        // Fetch teachers
        const teacherResponse = await axiosInstance.get("/api/admin/auth/teachers");
        if (teacherResponse.data.data) {
          setTeachers(teacherResponse.data.data);
        } else {
          toast.error("Unexpected response format for teachers.");
          console.error("Teachers data missing:", teacherResponse.data);
        }

        // Fetch classes
        const classResponse = await axiosInstance.get("/api/admin/auth/classes");
        if (classResponse.data.classes) {
          setClasses(classResponse.data.classes);
        } else {
          toast.error("Unexpected response format for classes.");
          console.error("Classes data missing:", classResponse.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error.response || error.message || error);
        toast.error("Failed to fetch teachers or classes.");
      }
    };

    fetchTeachersAndClasses();
  }, []);

  // ✅ Handle assigning classes to a teacher
  const handleAssignClasses = async () => {
    if (!selectedTeacher) {
      toast.error("Please select a teacher.");
      return;
    }

    if (selectedClasses.length === 0) {
      toast.error("Please select at least one class.");
      return;
    }

    try {
      const response = await axiosInstance.post(
        "/api/admin/auth/assign-teacher-to-class",
        {
          teacherID: selectedTeacher,
          classId: selectedClasses, // can be multiple
        }
      );

      toast.success(response.data.message || "Classes assigned successfully.");
      setSelectedTeacher("");
      setSelectedClasses([]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to assign classes.");
    }
  };

  // ✅ Back button
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="assign-container">
      <h1>Assign Teacher to Classes</h1>

      {/* Back button */}
      <div style={{ marginBottom: "20px" }}>
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
          style={{ cursor: "pointer", color: "#007bff" }}
        >
          Back
        </span>
      </div>

      {/* Teacher Dropdown */}
      <div className="dropdown-container">
        <label htmlFor="teacher-select">Select Teacher:</label>
        <select
          id="teacher-select"
          value={selectedTeacher}
          onChange={(e) => setSelectedTeacher(e.target.value)}
        >
          <option value="">-- Select Teacher --</option>
          {teachers.map((teacher) => (
            <option key={teacher.teacherID} value={teacher.teacherID}>
              {teacher.name} ({teacher.teacherID})
            </option>
          ))}
        </select>
      </div>

      {/* Class Dropdown */}
      <div className="dropdown-container">
        <label htmlFor="class-select">Select Classes:</label>
        <select
          id="class-select"
          multiple
          value={selectedClasses}
          onChange={(e) =>
            setSelectedClasses(
              Array.from(e.target.selectedOptions, (option) => option.value)
            )
          }
        >
          {classes.map((classItem) => (
            <option key={classItem.classId} value={classItem.classId}>
              {classItem.name} ({classItem.classId})
            </option>
          ))}
        </select>
        <small>
          Hold <strong>Ctrl</strong> (Windows) or <strong>Cmd</strong> (Mac) to select multiple classes.
        </small>
      </div>

      {/* Assign Button */}
      <button className="assign-btn" onClick={handleAssignClasses}>
        Assign Teacher to Class
      </button>

      <ToastContainer />
    </div>
  );
};

export default AssignTeacherToClass;
