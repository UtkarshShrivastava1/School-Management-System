import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Navbar.css";

import { useAuth } from "../hooks/useAuth"; // ✅ useAuth hook

const NavBar = () => {
  const navigate = useNavigate();
  const { user, role, token, logout, loading } = useAuth();

  const isLoggedIn = !!token;

  // Routes per role
  const roleConfig = useMemo(
    () => ({
      admin: {
        dashboardRoute: "/admin/admin-dashboard",
        profileRoute: "/admin/profile",
      },
      teacher: {
        dashboardRoute: "/teacher/teacher-dashboard",
        profileRoute: "/teacher/profile",
      },
      student: {
        dashboardRoute: "/student/student-dashboard",
        profileRoute: "/student/profile",
      },
      parent: {
        dashboardRoute: "/parent/parent-dashboard",
        profileRoute: "/parent/profile",
      },
    }),
    []
  );

  const handleLoginClick = () => navigate("/signin");

  const handleProfileClick = () => {
    if (role && roleConfig[role]?.profileRoute) {
      navigate(roleConfig[role].profileRoute);
    } else {
      navigate("/signin");
    }
  };

  const handleLogoutClick = async () => {
    await logout();
    navigate("/signin", { replace: true });
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

            {isLoggedIn && roleConfig[role]?.dashboardRoute && (
              <Nav.Link
                as={Link}
                to={roleConfig[role].dashboardRoute}
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
                    : `${role?.toUpperCase()}: ${user?.displayName || "Profile"}`}
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
