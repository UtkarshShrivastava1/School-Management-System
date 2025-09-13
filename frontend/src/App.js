import React from "react";
import { Route, BrowserRouter as Router, Routes, Navigate } from "react-router-dom";

// Page imports
import About from "./pages/About";
import Signin from "./pages/Signin";
import AdminRoutes from "./Routes/Admin/AdminRoutes";
import ParentRoutes from "./Routes/Parent/ParentRoutes";
import StudentRoutes from "./Routes/Student/StudentRoutes";
import TeacherRoutes from "./Routes/Teacher/TeacherRoutes";
import Navbar from "./components/Navbar";
import { ToastContainer } from "react-toastify";

import { AuthProvider, useAuth } from "./context/useAuth"; // ✅ useAuth is now the context

import "react-toastify/dist/ReactToastify.css";
import { Spinner } from "react-bootstrap";

function AppRoutes() {
  const { role, token, loading } = useAuth(); // ✅ renamed from userRole/isLoggedIn

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" role="status" />
        <span className="ms-2">Loading...</span>
      </div>
    );
  }

  const isLoggedIn = !!token;

  return (
    <>
      <Navbar />
      <Routes>
        {/* Redirect root based on login */}
        <Route
          path="/"
          element={
            isLoggedIn ? (
              <Navigate to={`/${role}/${role}-dashboard`} replace />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />

        <Route path="/signin" element={<Signin />} />
        <Route path="/about" element={<About />} />

        {role === "admin" && <Route path="/admin/*" element={<AdminRoutes />} />}
        {role === "teacher" && (
          <Route path="/teacher/*" element={<TeacherRoutes />} />
        )}
        {role === "student" && (
          <Route path="/student/*" element={<StudentRoutes />} />
        )}
        {role === "parent" && (
          <Route path="/parent/*" element={<ParentRoutes />} />
        )}
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
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
