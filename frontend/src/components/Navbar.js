import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import axios from "axios"; // Import axios
import "bootstrap/dist/css/bootstrap.min.css";
import "./Navbar.css"; // Ensure custom CSS exists

const NavBar = ({ isLoggedIn, userRole, handleLogout }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isLoggedIn) return; // If not logged in, no need to fetch data

      console.log("Fetching user data...");
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("Authentication token is missing.");
        setLoading(false);
        return;
      }

      try {
        let response;
        if (userRole === "admin") {
          response = await axios.get(
            "http://localhost:5000/api/admin/auth/adminprofile", // Admin endpoint
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        } else if (userRole === "teacher") {
          response = await axios.get(
            "http://localhost:5000/api/teacher/auth/teacherprofile", // Teacher endpoint
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        } else if (userRole === "student") {
          response = await axios.get(
            "http://localhost:5000/api/student/auth/studentprofile", // Student endpoint
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        } else if (userRole === "parent") {
          response = await axios.get(
            "http://localhost:5000/api/parent/auth/parentprofile", // Parent endpoint
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        }

        const fetchedData = response.data[userRole]; // Adjust based on the actual response format
        console.log(`${userRole} data fetched successfully:`, fetchedData);
        setUser(fetchedData);
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData(); // Fetch data when the component mounts
  }, [isLoggedIn, userRole]); // Re-run if `isLoggedIn` or `userRole` changes

  // Handle login button
  const handleLoginClick = () => {
    navigate("/signin");
  };

  // Handle profile button
  const handleProfileClick = () => {
    switch (userRole) {
      case "admin":
        navigate("/admin/profile"); // Navigate to the admin profile page
        break;
      case "teacher":
        navigate("/teacher/profile"); // Navigate to the teacher profile page
        break;
      case "student":
        navigate("/student/profile"); // Navigate to the student profile page
        break;
      case "parent":
        navigate("/parent/profile"); // Navigate to the parent profile page
        break;
      default:
        navigate("/signin"); // Fallback to login if role is unknown
        break;
    }
  };

  return (
    <Navbar
      expand="lg"
      bg="dark"
      variant="dark"
      className="custom-navbar shadow fixed-top"
    >
      <Container>
        {/* Branding */}
        <Navbar.Brand as={Link} to="/" className="brand">
          <span className="brand-highlight">Zager </span>Management System
        </Navbar.Brand>

        {/* Navbar Toggle for mobile view */}
        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav">
          {/* Navigation Links */}
          <Nav className="ms-auto align-items-center">
            <Nav.Link as={Link} to="/" className="custom-nav-link">
              Home
            </Nav.Link>
            <Nav.Link as={Link} to="/about-zms" className="custom-nav-link">
              About ZMS
            </Nav.Link>
            <Nav.Link as={Link} to="/contact-us" className="custom-nav-link">
              Contact Us
            </Nav.Link>
            {/* Role-based Links */}
            {/* Role-based Links */}
            {isLoggedIn && (
              <Nav.Link
                as={Link}
                to={
                  userRole === "admin"
                    ? "/admin-dashboard"
                    : userRole === "teacher"
                    ? "/teacher-dashboard"
                    : userRole === "student"
                    ? "/student-dashboard"
                    : userRole === "parent"
                    ? "/parent-dashboard"
                    : "/signin" // Fallback if role is unknown
                }
                className="custom-nav-link"
              >
                Dashboard
              </Nav.Link>
            )}
          </Nav>

          {/* Authentication Buttons */}
          <div className="d-flex align-items-center">
            {!isLoggedIn ? (
              <Button
                variant="outline-light"
                className="login-btn me-2"
                onClick={handleLoginClick}
              >
                Login
              </Button>
            ) : (
              <>
                <Button
                  variant="outline-light"
                  className="profile-btn me-2"
                  onClick={handleProfileClick}
                >
                  {loading
                    ? "Loading..."
                    : `${userRole?.toUpperCase()}: ${
                        user?.name || "Profile"
                      }`}{" "}
                  {/* Safe to call toUpperCase() */}
                </Button>
                <Button
                  variant="outline-danger"
                  className="logout-btn"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            )}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar;
