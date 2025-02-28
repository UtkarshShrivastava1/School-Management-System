import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Navbar.css";

const NavBar = ({ isLoggedIn, userRole, handleLogout }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_URL = useMemo(() => {
    return process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL
      : process.env.REACT_APP_DEVELOPMENT_URL;
  }, []);

  console.log("API_URL:", API_URL);

  const handleLogoutClick = () => {
    console.log("Logging out...");
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    handleLogout(); // Ensure any additional logout logic runs
    navigate("/signin"); // Redirect to signin page
  };

  // Role configuration wrapped inside useMemo
  const roleConfig = useMemo(
    () => ({
      admin: {
        profileEndpoint: `${API_URL}/api/admin/auth/adminprofile`,
        dashboardRoute: "/admin/admin-dashboard",
        profileRoute: "/admin/profile",
      },
      teacher: {
        profileEndpoint: `${API_URL}/api/teacher/auth/teacherprofile`,
        dashboardRoute: "/teacher/teacher-dashboard",
        profileRoute: "/teacher/profile",
      },
      student: {
        profileEndpoint: `${API_URL}/api/student/auth/studentprofile`,
        dashboardRoute: "/student/student-dashboard",
        profileRoute: "/student/profile",
      },
      parent: {
        profileEndpoint: `${API_URL}/api/parent/auth/parentprofile`,
        dashboardRoute: "/parent/parent-dashboard",
        profileRoute: "/parent/profile",
      },
    }),
    [API_URL]
  );

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isLoggedIn || !userRole || !roleConfig[userRole]) {
        console.log("User is not logged in or role is invalid.");
        return;
      }

      console.log("Fetching user data for role:", userRole);
      setLoading(true);

      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Authentication token is missing.");
        setLoading(false);
        return;
      }

      try {
        const endpoint = roleConfig[userRole].profileEndpoint;
        console.log("API endpoint for userRole:", endpoint);

        const response = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log(`API response for ${userRole}:`, response.data);

        // Map the correct name key based on userRole
        const fetchedData = response.data[userRole] || response.data;

        const nameKeyMap = {
          admin: "name",
          teacher: "name",
          student: "studentName",
          parent: "parentName",
        };

        const userName = fetchedData[nameKeyMap[userRole]] || "Profile";
        setUser({ ...fetchedData, displayName: userName }); // Store a unified key
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isLoggedIn, userRole, roleConfig]);

  const handleLoginClick = () => {
    navigate("/signin");
  };

  const handleProfileClick = () => {
    if (userRole && roleConfig[userRole]?.profileRoute) {
      navigate(roleConfig[userRole].profileRoute);
    } else {
      console.warn("Unknown or invalid userRole. Navigating to signin.");
      navigate("/signin");
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
        <Navbar.Brand as={Link} to="/" className="brand">
          <span className="brand-highlight">Zager </span>Management System
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav">
          <Nav className="ms-auto align-items-center">
            <Nav.Link as={Link} to="/about" className="custom-nav-link">
              About
            </Nav.Link>
            <Nav.Link as={Link} to="/contact-us" className="custom-nav-link">
              Connect
            </Nav.Link>
            {isLoggedIn && roleConfig[userRole]?.dashboardRoute && (
              <Nav.Link
                as={Link}
                to={roleConfig[userRole].dashboardRoute}
                className="custom-nav-link"
              >
                Dashboard
              </Nav.Link>
            )}
          </Nav>

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
                        user?.displayName || "Profile"
                      }`}{" "}
                </Button>
                <Button
                  variant="outline-danger"
                  className="logout-btn"
                  onClick={handleLogoutClick}
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
