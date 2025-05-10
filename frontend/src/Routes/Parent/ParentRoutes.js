import { Navigate, Route, Routes } from "react-router-dom";

// Parent Dashboard
import ParentDashboardPage from "../../pages/Parent/ParentDashboardPage";

// Parent Profile Management
import ParentProfileManage from "../../pages/Parent/ParentProfileManage";

const ParentRoutes = ({ isLoggedIn, userRole }) => {
    if (!isLoggedIn || userRole !== "parent") {
      return <Navigate to="/signin" replace />;
    }
  
    return (
      <Routes>
        {/* Parent Dashboard */}
        <Route path="/" element={<ParentDashboardPage />} />
        <Route path="/dashboard" element={<ParentDashboardPage />} />
  
        {/* Parent Profile */}
        <Route path="/profile" element={<ParentProfileManage />} />
  
        {/* Redirect any unmatched routes to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    );
  };
  
  export default ParentRoutes;