import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Teacher Dashboard
import TeacherDashboardPage from "../../pages/Teacher/TeacherDashboardPage";

// Teacher Profile Management
import TeacherProfileManage from "../../pages/Teacher/TeacherProfileManage";

// Teacher Notifications
import TeacherNotifications from "../../pages/Teacher/Teacher_Features/TeacherNotifications";

// Teacher Attendance Management
import ClassAttendanceManagement from "../../pages/Teacher/Teacher_Features/Attendance/ClassAttendanceManagement";
import TakeClassAttendance from "../../pages/Teacher/Teacher_Features/Attendance/TakeClassAttendance";
import ViewAttendanceHistory from "../../pages/Teacher/Teacher_Features/Attendance/ViewAttendanceHistory";

// Class & Subject Management for Teachers
import GetTeacherClassesAndSubjects from "../../pages/Teacher/Teacher_Features/GetTeacherClassesAndSubjects";

const TeacherRoutes = ({ isLoggedIn, userRole }) => {
  if (!isLoggedIn || userRole !== "teacher") {
    return <Navigate to="/signin" replace />;
  }

  return (
    <Routes>
      {/* Teacher Dashboard */}
      <Route path="/teacher-dashboard" element={<TeacherDashboardPage />} />

      {/* Teacher Profile */}
      <Route path="/profile" element={<TeacherProfileManage />} />

      {/* Teacher Notifications */}
      <Route path="/notifications" element={<TeacherNotifications />} />

      {/* Assigned Classes & Subjects */}
      <Route path="/my-class" element={<GetTeacherClassesAndSubjects />} />

      {/* Teacher Attendance Management */}
      <Route path="/take-class-attendance" element={<TakeClassAttendance />} />
      <Route path="/view-attendance-history" element={<ViewAttendanceHistory />} />
    </Routes>
  );
};

export default TeacherRoutes;
