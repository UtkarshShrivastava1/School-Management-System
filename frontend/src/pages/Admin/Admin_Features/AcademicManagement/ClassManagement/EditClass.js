import axios from "axios";
import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./EditClass.css";

const EditClass = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const API_URL =
    process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL
      : process.env.REACT_APP_DEVELOPMENT_URL;

  const [className, setClassName] = useState("");
  const [subjects, setSubjects] = useState([]); // Array of { subjectName, teacherId, subjectCode }
  const [teachers, setTeachers] = useState([]); // Teacher list for dropdown
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch teacher list for dropdown
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/admin/auth/teachers`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        // API returns { message, data: [...] }
        setTeachers(res.data.data || []);
      } catch (error) {
        console.error("Error fetching teachers", error);
        setTeachers([]);
      }
    };
    fetchTeachers();
  }, [API_URL]);

  // Fetch class details (including subjects) by classId
  useEffect(() => {
    const fetchClassDetails = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${API_URL}/api/admin/auth/classes/${classId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!res.data || !res.data.class) {
          throw new Error("Invalid response format");
        }

        const classData = res.data.class;
        const subjectData = res.data.subjects || [];
        
        setClassName(classData.className);
        
        // Map subjects with their assigned teachers
        const mappedSubjects = subjectData.map((subj) => ({
          subjectName: subj.subjectName,
          subjectCode: subj.subjectCode || "",
          teacherId: subj.assignedTeachers && subj.assignedTeachers.length > 0
            ? subj.assignedTeachers[0].teacherID
            : "",
        }));
        
        setSubjects(mappedSubjects);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching class details:", error);
        setErrorMessage(
          error.response?.data?.message || 
          error.message || 
          "Failed to fetch class details. Please try again."
        );
        setLoading(false);
      }
    };

    if (classId) {
      fetchClassDetails();
    }
  }, [API_URL, classId]);

  const handleClassNameChange = (e) => setClassName(e.target.value);

  // Handle changes in the subject cards
  const handleSubjectChange = (index, field, value) => {
    const newSubjects = [...subjects];
    newSubjects[index][field] = value;
    setSubjects(newSubjects);
  };

  // Add a new subject card
  const addSubjectCard = () => {
    setSubjects([
      ...subjects,
      { subjectName: "", teacherId: "", subjectCode: "" },
    ]);
  };

  // Remove a subject card at the given index
  const removeSubjectCard = (index) => {
    const newSubjects = [...subjects];
    newSubjects.splice(index, 1);
    setSubjects(newSubjects);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!className) {
      setErrorMessage("Please provide a class name.");
      return;
    }
    for (let subj of subjects) {
      if (!subj.subjectName || !subj.teacherId) {
        setErrorMessage(
          "Each subject must have a subject name and a teacher selected."
        );
        return;
      }
    }
    try {
      // Deduplicate teacher IDs from subjects
      const uniqueTeachers = [...new Set(subjects.map((s) => s.teacherId))];
      const payload = {
        className,
        subjects,
        teachers: uniqueTeachers,
      };
      await axios.put(
        `${API_URL}/api/admin/auth/classes/${classId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success("Class updated successfully!");
      navigate("/admin/class-management");
    } catch (error) {
      const errMsg = error.response
        ? error.response.data.message
        : "Server error";
      setErrorMessage(errMsg);
      toast.error(errMsg);
    }
  };

  const handleBack = () => navigate(-1);

  if (loading) {
    return <div className="editClass-loading">Loading class details...</div>;
  }

  return (
    <div className="editClass-container">
      <h1>Edit Class: {classId}</h1>
      <div className="editClass-back-button">
        <FaArrowLeft
          onClick={handleBack}
          size={24}
          className="editClass-back-icon"
        />
      </div>
      {errorMessage && (
        <div className="editClass-error-message">{errorMessage}</div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="editClass-form-group">
          <label htmlFor="className">Class Name:</label>
          <input
            type="text"
            id="className"
            value={className}
            onChange={handleClassNameChange}
            placeholder="Enter class name"
            required
          />
        </div>
        <hr />
        <h3>Subjects</h3>
        {subjects.map((subject, index) => (
          <div key={index} className="editClass-subject-card">
            <div className="editClass-form-group">
              <label>Subject Name:</label>
              <input
                type="text"
                value={subject.subjectName}
                onChange={(e) =>
                  handleSubjectChange(index, "subjectName", e.target.value)
                }
                placeholder="Enter subject name"
                required
              />
            </div>
            <div className="editClass-form-group">
              <label>Subject Code (Optional):</label>
              <input
                type="text"
                value={subject.subjectCode}
                onChange={(e) =>
                  handleSubjectChange(index, "subjectCode", e.target.value)
                }
                placeholder="Enter board provided subject code"
              />
            </div>
            <div className="editClass-form-group">
              <label>Select Teacher:</label>
              <select
                value={subject.teacherId}
                onChange={(e) =>
                  handleSubjectChange(index, "teacherId", e.target.value)
                }
                required
              >
                <option value="">Select Teacher</option>
                {(teachers || []).map((teacher) => (
                  <option key={teacher.teacherID} value={teacher.teacherID}>
                    {teacher.name} ({teacher.teacherID})
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="danger"
              onClick={() => removeSubjectCard(index)}
              className="editClass-remove-subject-btn"
            >
              Remove Subject
            </Button>
            <hr />
          </div>
        ))}
        <Button
          variant="primary"
          onClick={addSubjectCard}
          className="editClass-add-subject-btn"
        >
          + Add Subject
        </Button>
        <br />
        <br />
        <Button
          variant="success"
          type="submit"
          className="editClass-submit-btn"
        >
          Save Changes
        </Button>
      </form>
      <ToastContainer />
    </div>
  );
};

export default EditClass;
