import { Routes, Route, Navigate } from "react-router-dom";
import StudentDashboardPage from "../../pages/Student/StudentDashboardPage";
import StudentNotifications from "../../pages/Student/Student_Features/StudentNotifications";
import StudentProfileManage from "../../pages/Student/StudentProfileManage";

const StudentRoutes = ({ isLoggedIn, userRole }) => {
  if (!isLoggedIn || userRole !== "student") {
    return <Navigate to="/signin" replace />;
  }

  return (
    <Routes>
      <Route path="/student-dashboard" element={<StudentDashboardPage />} />
      <Route path="/notifications" element={<StudentNotifications />} />
      <Route path="/notice-board" element={<StudentNotifications />} />
      <Route path="/profile" element={<StudentProfileManage />} />
      <Route path="*" element={<Navigate to="/student/student-dashboard" replace />} />
    </Routes>
  );
};

export default StudentRoutes; 