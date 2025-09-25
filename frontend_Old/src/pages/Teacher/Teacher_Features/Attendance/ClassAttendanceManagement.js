import React, { useState } from "react";
import TakeClassAttendance from "./TakeClassAttendance";
import ViewAttendanceHistory from "./ViewAttendanceHistory";
import "./ClassAttendanceManagement.css";

const TABS = [
  {
    id: "take",
    label: "Take Class Attendance",
  },
  {
    id: "view",
    label: "View Attendance History",
  },
];

const ClassAttendanceManagement = () => {
  const [activeTab, setActiveTab] = useState("take");

  return (
    <div className="attendance-management-container">
      <h2 className="text-center mb-5">Class Attendance Management</h2>
      <div className="attendance-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`attendance-tab-btn${activeTab === tab.id ? " active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="attendance-tab-content">
        {activeTab === "take" && <TakeClassAttendance />}
        {activeTab === "view" && <ViewAttendanceHistory />}
      </div>
    </div>
  );
};

export default ClassAttendanceManagement; 