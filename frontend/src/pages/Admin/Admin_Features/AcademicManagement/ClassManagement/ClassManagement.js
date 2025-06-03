import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import React, { useEffect, useState } from "react";
import { Button, Card, ListGroup } from "react-bootstrap";
import {
  FaArrowLeft,
  FaBook,
  FaChalkboard,
  FaEdit,
  FaPlusCircle,
  FaTrash,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./ClassManagement.css";

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Define API_URL based on environment variables
  const API_URL =
    process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL
      : process.env.REACT_APP_DEVELOPMENT_URL;

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/admin/auth/classes`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (!res.data || !Array.isArray(res.data.classes)) {
          throw new Error("Invalid API response format");
        }
        // Sort classes:
        // If className begins with digits, extract and compare those; otherwise, compare full className.
        const sortedClasses = [...res.data.classes].sort((a, b) => {
          const numA = parseInt(a.className, 10);
          const numB = parseInt(b.className, 10);
          if (!isNaN(numA) && !isNaN(numB)) {
            if (numA !== numB) return numA - numB;
            const letterA = a.className.replace(numA.toString(), "");
            const letterB = b.className.replace(numB.toString(), "");
            return letterA.localeCompare(letterB);
          } else if (!isNaN(numA)) {
            return -1;
          } else if (!isNaN(numB)) {
            return 1;
          } else {
            return a.className.localeCompare(b.className);
          }
        });
        setClasses(sortedClasses);
        setError("");
      } catch (err) {
        console.error("Error fetching classes:", err);
        setError("Failed to fetch classes.");
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [API_URL]);

  // Navigation handlers
  const handleAddClass = () => {
    navigate("/admin/create-class");
  };

  const handleViewDetails = (classId) => {
    navigate(`/admin/edit-class/${classId}?showDetails=true`);
  };

  const handleEdit = (classId) => {
    navigate(`/admin/edit-class/${classId}`);
  };

  const handleDelete = async (classId) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      try {
        await axios.delete(`${API_URL}/api/admin/auth/classes/${classId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setClasses((prevClasses) =>
          prevClasses.filter((cls) => cls.classId !== classId)
        );
        toast.success("Class deleted successfully!");
      } catch (err) {
        console.error("Error deleting class:", err);
        toast.error("Failed to delete class.");
      }
    }
  };

  const handleBack = () => {
    navigate("/admin/admin-dashboard", {
      state: { activeTab: "Academic Management" },
    });
  };

  // Function to get group key from className.
  // For classNames that start with digits, we extract the number and group as "Class X".
  // For those starting with "KG", we group them under "Kindergarten".
  const getGroupKey = (cls) => {
    const name = cls.className;
    if (!name) return "Unknown";
    const digitMatch = name.match(/^(\d+)/);
    if (digitMatch) {
      return `Class ${digitMatch[1]}`;
    }
    if (name.toUpperCase().startsWith("KG")) {
      return "Kindergarten";
    }
    return name;
  };

  // Group classes based on the group key
  const groupedClasses = classes.reduce((acc, cls) => {
    const key = getGroupKey(cls);
    if (!acc[key]) acc[key] = [];
    acc[key].push(cls);
    return acc;
  }, {});

  return (
    <div className="classManagement-container">
      <div className="classManagement-header d-flex justify-content-between align-items-center">
        <FaArrowLeft
          onClick={handleBack}
          size={24}
          className="classManagement-back-icon"
        />
        <h1>
          <FaChalkboard /> Class Management
        </h1>
        <Button
          variant="primary"
          onClick={handleAddClass}
          className="classManagement-add-btn"
        >
          <FaPlusCircle /> Add Class
        </Button>
      </div>

      {error && <div className="classManagement-error-message">{error}</div>}
      {loading ? (
        <div className="classManagement-loading">Loading classes...</div>
      ) : classes.length === 0 ? (
        <div className="classManagement-no-classes">No classes found.</div>
      ) : (
        Object.keys(groupedClasses).map((groupKey) => (
          <div key={groupKey} className="class-group">
            <h3 className="class-group-title">{groupKey}</h3>
            <ListGroup>
              {groupedClasses[groupKey].map((cls) => (
                <ListGroup.Item key={cls.classId} className="class-item">
                  <Card className="class-card">
                    <Card.Body className="d-flex justify-content-between align-items-center">
                      <div>
                        <Card.Title>{cls.className}</Card.Title>
                        <Card.Subtitle className="mb-2">
                          {cls.classId}
                        </Card.Subtitle>
                        <Card.Text>
                          Subjects: {cls.subjects ? cls.subjects.length : 0}
                          <br />
                          Teachers: {cls.teachers ? cls.teachers.length : 0}
                        </Card.Text>
                      </div>
                      <div className="classManagement-card-actions d-flex justify-content-between">
                        <Button
                          variant="info"
                          onClick={() => handleViewDetails(cls.classId)}
                        >
                          <FaBook /> Details
                        </Button>
                        <Button
                          variant="warning"
                          onClick={() => handleEdit(cls.classId)}
                        >
                          <FaEdit /> Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleDelete(cls.classId)}
                        >
                          <FaTrash /> Delete
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        ))
      )}
    </div>
  );
};

export default ClassManagement;
