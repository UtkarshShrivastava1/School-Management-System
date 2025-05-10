import { Routes, Route, Navigate } from "react-router-dom";

// Student Dashboard
import StudentDashboardPage from "../../pages/Student/StudentDashboardPage";

// Student Profile Management
import StudentProfileManage from "../../pages/Student/StudentProfileManage";

const StudentRoutes = ({ isLoggedIn, userRole }) => {
    if (!isLoggedIn || userRole !== "student") {
      return <Navigate to="/signin" replace />;
    }
  
    return (
      <Routes>
        {/* Teacher Dashboard */}
        <Route path="/student-dashboard" element={<StudentDashboardPage />} />
  
        {/* Teacher Profile */}
        <Route path="/profile" element={<StudentProfileManage />} />
  
      </Routes>
    );
  };
  
  export default StudentRoutes;
  