import React, { useCallback, useEffect, useState } from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
// Page imports
import About from "./pages/About";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "./components/Navbar";
import ParentDashboardPage from "./pages/Parent/ParentDashboardPage";
import Signin from "./pages/Signin";
import StudentDashboardPage from "./pages/Student/StudentDashboardPage";
import AdminRoutes from "./Routes/Admin/AdminRoutes";
import ParentRoutes from "./Routes/Parent/ParentRoutes";
import StudentRoutes from "./Routes/Student/StudentRoutes";
import TeacherRoutes from "./Routes/Teacher/TeacherRoutes";
import "./toast.css"; // Import custom toast styles

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL =
    process.env.REACT_APP_NODE_ENV === "production"
      ? process.env.REACT_APP_PRODUCTION_URL
      : process.env.REACT_APP_DEVELOPMENT_URL;

  // Wrap validateToken in useCallback to avoid re-creation in useEffect
  const validateToken = useCallback(
    async (token) => {
      console.log("Validating token...");
      try {
        const response = await fetch(`${API_URL}/api/admin/auth/validate`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          console.log("Token is valid.");
          const data = await response.json();
          setIsLoggedIn(true);
          setUserRole(data.role);
          setUser(data);
        } else {
          console.error("Token validation failed. Logging out.");
          localStorage.removeItem("token");
          setIsLoggedIn(false);
          setUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error("Error validating token:", error);
        setIsLoggedIn(false);
        setUser(null);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    },
    [API_URL]
  ); // Dependencies for useCallback

  useEffect(() => {
    console.log("Checking for token in local storage...");
    const token = localStorage.getItem("token");
    if (token) {
      console.log("Token found, validating...");
      validateToken(token);
    } else {
      console.log("No token found, setting loading to false.");
      setIsLoggedIn(false);
      setLoading(false);
    }
  }, [validateToken]); // Now validateToken is stable

  const handleLogout = () => {
    console.log("Logging out...");
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    setIsLoggedIn(false);
    setUser(null);
    setUserRole(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Navbar
        isLoggedIn={isLoggedIn}
        userRole={userRole}
        user={user}
        handleLogout={handleLogout}
      />
      <Routes>
        <Route
          path="/"
          element={
            <Signin setIsLoggedIn={setIsLoggedIn} setUserRole={setUserRole} />
          }
        />
        <Route
          path="/signin"
          element={
            <Signin setIsLoggedIn={setIsLoggedIn} setUserRole={setUserRole} />
          }
        />

        <Route
          path="/about"
          element={
            <About setIsLoggedIn={setIsLoggedIn} setUserRole={setUserRole} />
          }
        />
        {isLoggedIn && userRole === "admin" && (
          <Route
            path="/admin/*"
            element={
              <AdminRoutes isLoggedIn={isLoggedIn} userRole={userRole} />
            }
          />
        )}
        {isLoggedIn && userRole === "teacher" && (
          <Route
            path="/teacher/*"
            element={
              <TeacherRoutes isLoggedIn={isLoggedIn} userRole={userRole} />
            }
          />
        )}
        {isLoggedIn && userRole === "student" && (
          <Route
            path="/student/*"
            element={
              <StudentRoutes isLoggedIn={isLoggedIn} userRole={userRole} />
            }
          />
        )}
        {isLoggedIn && userRole === "parent" && (
          <Route
            path="/parent/*"
            element={
              <ParentRoutes isLoggedIn={isLoggedIn} userRole={userRole} />
            }
          />
        )}
        <Route
          path="/student/student-dashboard"
          element={
            isLoggedIn && userRole === "student" ? (
              <StudentDashboardPage />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />
        <Route
          path="/parent/parent-dashboard"
          element={
            isLoggedIn && userRole === "parent" ? (
              <ParentDashboardPage />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        toastStyle={{ color: "white" }}
      />
    </Router>
  );
};

export default App;
