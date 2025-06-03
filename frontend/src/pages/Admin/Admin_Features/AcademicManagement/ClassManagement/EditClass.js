import axios from "axios";
import React, { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { FaArrowLeft, FaInfoCircle } from "react-icons/fa";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./EditClass.css";

const EditClass = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const API_URL =
    process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL
      : process.env.REACT_APP_DEVELOPMENT_URL;

  const [className, setClassName] = useState("");
  const [subjects, setSubjects] = useState([]); // Array of { subjectName, teacherId, subjectCode }
  const [teachers, setTeachers] = useState([]); // Teacher list for dropdown
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [classStrength, setClassStrength] = useState(30);
  const [showDetails, setShowDetails] = useState(false);
  const [classDetails, setClassDetails] = useState(null);

  // Check for showDetails query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('showDetails') === 'true') {
      handleShowDetails();
    }
  }, [location.search]);

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
        const res = await axios.get(
          `${API_URL}/api/admin/auth/classes/${classId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const classData = res.data.class;
        const subjectData = res.data.subjects || [];
        setClassName(classData.className);
        // Map subjects: assume each subject's assignedTeachers is populated (take the first teacher)
        const mappedSubjects = subjectData.map((subj) => ({
          subjectName: subj.subjectName,
          subjectCode: subj.subjectCode || "",
          teacherId:
            subj.assignedTeachers && subj.assignedTeachers.length > 0
              ? subj.assignedTeachers[0].teacherID
              : "",
        }));
        setSubjects(mappedSubjects);
        setClassStrength(classData.classStrength);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching class details", error);
        setErrorMessage("Failed to fetch class details.");
        setLoading(false);
      }
    };
    fetchClassDetails();
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

  const handleClassStrengthChange = (e) => {
    const value = parseInt(e.target.value);
    if (value >= 1) {
      setClassStrength(value);
    }
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
        classStrength,
      };
      await axios.put(
        `${API_URL}/api/admin/auth/edit-class/${classId}`,
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

  const handleShowDetails = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/admin/auth/classes/${classId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      console.log("Class Details Response:", res.data); // Debug log
      setClassDetails(res.data);
      setShowDetails(true);
    } catch (error) {
      console.error("Error fetching class details:", error);
      toast.error("Failed to fetch class details");
    }
  };

  const handleCloseDetails = () => setShowDetails(false);

  if (loading) {
    return <div className="editClass-loading">Loading class details...</div>;
  }

  return (
    <div className="editClass-container">
      <div className="editClass-header">
        <h1>Edit Class: {classId}</h1>
        <div className="editClass-actions">
          <Button
            variant="info"
            onClick={handleShowDetails}
            className="editClass-details-btn"
          >
            <FaInfoCircle /> View Details
          </Button>
          <div className="editClass-back-button">
            <FaArrowLeft
              onClick={handleBack}
              size={24}
              className="editClass-back-icon"
            />
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <Modal show={showDetails} onHide={handleCloseDetails} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Class Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {classDetails && (
            <div className="class-details">
              <div className="details-section">
                <h3>Basic Information</h3>
                <p><strong>Class Name:</strong> {classDetails.class.className}</p>
                <p><strong>Section:</strong> {classDetails.class.section}</p>
                <p><strong>Class Strength:</strong> {classDetails.class.classStrength}</p>
                <p><strong>Class ID:</strong> {classDetails.class.classId}</p>
              </div>

              <div className="details-section">
                <h3>Subjects</h3>
                {classDetails.subjects && classDetails.subjects.length > 0 ? (
                  <div className="subjects-list">
                    {classDetails.subjects.map((subject) => (
                      <div key={subject._id} className="subject-item">
                        <p><strong>Name:</strong> {subject.subjectName}</p>
                        <p><strong>Code:</strong> {subject.subjectCode || 'N/A'}</p>
                        <p><strong>ID:</strong> {subject.subjectId}</p>
                        {subject.assignedTeachers && subject.assignedTeachers.length > 0 ? (
                          <p><strong>Teachers:</strong> {subject.assignedTeachers.map(t => t.name).join(", ")}</p>
                        ) : (
                          <p><strong>Teachers:</strong> No teachers assigned</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No subjects assigned</p>
                )}
              </div>

              <div className="details-section">
                <h3>Teachers</h3>
                {classDetails.class.teachers && classDetails.class.teachers.length > 0 ? (
                  <div className="teachers-list">
                    {classDetails.class.teachers.map((teacher) => (
                      <div key={teacher._id} className="teacher-item">
                        <p><strong>Name:</strong> {teacher.name}</p>
                        <p><strong>ID:</strong> {teacher.teacherID}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No teachers assigned</p>
                )}
              </div>

              <div className="details-section">
                <h3>Students</h3>
                {classDetails.class.students && classDetails.class.students.length > 0 ? (
                  <div className="students-list">
                    {classDetails.class.students.map((student) => (
                      <div key={student._id} className="student-item">
                        <p><strong>Name:</strong> {student.studentName}</p>
                        <p><strong>ID:</strong> {student.studentID}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No students enrolled</p>
                )}
              </div>

              {classDetails.class.attendanceHistory && classDetails.class.attendanceHistory.length > 0 && (
                <div className="details-section">
                  <h3>Recent Attendance</h3>
                  <div className="attendance-list">
                    {classDetails.class.attendanceHistory.slice(0, 5).map((record, index) => (
                      <div key={index} className="attendance-item">
                        <p><strong>Date:</strong> {new Date(record.date).toLocaleDateString()}</p>
                        <p><strong>Present:</strong> {record.records.filter(r => r.status === "Present").length}</p>
                        <p><strong>Absent:</strong> {record.records.filter(r => r.status === "Absent").length}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDetails}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

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
        <div className="editClass-form-group">
          <label htmlFor="classStrength">Class Strength:</label>
          <input
            type="number"
            id="classStrength"
            value={classStrength}
            onChange={handleClassStrengthChange}
            placeholder="Enter class strength"
            min="1"
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
