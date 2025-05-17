import { Routes, Route, Navigate } from "react-router-dom";
import ParentDashboardPage from "../../pages/Parent/ParentDashboardPage";
import ParentNotifications from "../../pages/Parent/Parent_Features/ParentNotifications";
import ParentProfileManage from "../../pages/Parent/ParentProfileManage";

const ParentRoutes = ({ isLoggedIn, userRole }) => {
  if (!isLoggedIn || userRole !== "parent") {
    return <Navigate to="/signin" replace />;
  }

  return (
    <Routes>
      <Route path="/parent-dashboard" element={<ParentDashboardPage />} />
      <Route path="/notifications" element={<ParentNotifications />} />
      <Route path="/profile" element={<ParentProfileManage />} />
      <Route path="*" element={<Navigate to="/parent/parent-dashboard" replace />} />
    </Routes>
  );
};

export default ParentRoutes; 