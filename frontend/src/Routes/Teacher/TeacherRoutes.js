import { Routes, Route, Navigate } from "react-router-dom";

// Teacher Dashboard
import TeacherDashboardPage from "../../pages/Teacher/TeacherDashboardPage";

// Teacher Profile Management
import TeacherProfileManage from "../../pages/Teacher/TeacherProfileManage";

// Teacher Notifications
import TeacherNotifications from "../../pages/Teacher/Teacher_Features/TeacherNotifications";

// Teacher Attendance Management
//import MarkTeacherAttendance from "../../pages/Teacher/Teacher_Features/Attendance/MarkTeacherAttendance";
//import TrackTeacherAttendance from "../../pages/Teacher/Teacher_Features/Attendance/TrackTeacherAttendance";

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
    </Routes>
  );
};

export default TeacherRoutes;
