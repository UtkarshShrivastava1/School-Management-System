import { Routes, Route, Navigate } from "react-router-dom";
//Admin Dashboard Management Features:
//Admin Class Management:
import AdminDashboardPage from "../../pages/Admin/AdminDashboardPage";
import ClassManagement from "../../pages/Admin/Admin_Features/AcademicManagement/ClassManagement/ClassManagement";
import CreateClass from "../../pages/Admin/Admin_Features/AcademicManagement/ClassManagement/CreateClass";
import CreateSubject from "../../pages/Admin/Admin_Features/AcademicManagement/ClassManagement/CreateSubject";
import EditClass from "../../pages/Admin/Admin_Features/AcademicManagement/ClassManagement/EditClass";

import AdminManageClasses from "../../pages/Admin/Admin_Features/AcademicManagement/ClassManagement/AssignSubjectToClass";
//Profile Management
import AdminProfileManage from "../../pages/Admin/Admin_Features/MyProfile/AdminProfileManage"; // Admin Profile Manage Page (Ensure this is created)

//User Registration Forms
import RegisterAdminPage from "../../pages/Admin/Admin_Features/UserRegistrations/AdminRegisterForm"; // Admin Register Admin Page (Ensure this is created)
import RegisterTeacherPage from "../../pages/Admin/Admin_Features/UserRegistrations/TeacherRegisterForm"; // Admin Register Admin Page (Ensure this is created)
import RegisterStudentPage from "../../pages/Admin/Admin_Features/UserRegistrations/StudentRegisterForm"; // Admin Register Admin Page (Ensure this is created)

//Admin Teacher Attendance System
import TeacherAttendanceManagement from "../../pages/Admin/Admin_Features/AcademicManagement/TeacherManagement/TeacherAttendanceManagement";
import MarkTeacherAttendance from "../../pages/Admin/Admin_Features/AcademicManagement/TeacherManagement/MarkTeacherAttendance";
import TrackTeacherAttendance from "../../pages/Admin/Admin_Features/AcademicManagement/TeacherManagement/TrackTeacherAttendance";
//Admin Teacher Management System
import AssignStudentToClass from "../../pages/Admin/Admin_Features/AcademicManagement/StudentManagement/AssignStudentToClass";
import TrackStudentProfile from "../../pages/Admin/Admin_Features/AcademicManagement/StudentManagement/TrackStudentProfile";
import TrackStudentAttendance from "../../pages/Admin/Admin_Features/AcademicManagement/StudentManagement/TrackStudentAttendance";
//----------------------------------------------------------------
import StudentManagement from "../../pages/Admin/Admin_Features/AcademicManagement/StudentManagement/StudentManagement";
import TeacherManagement from "../../pages/Admin/Admin_Features/AcademicManagement/TeacherManagement/TeacherManagement";

import AssignTeacherToSubject from "../../pages/Admin/Admin_Features/AcademicManagement/TeacherManagement/AssignTeacherToSubject";
import AssignTeacherToClass from "../../pages/Admin/Admin_Features/AcademicManagement/TeacherManagement/AssignTeacherToClass";

// Import the NotificationCreation component at the top
import NotificationCreation from "../../pages/Admin/Admin_Features/NotificationCreation";

const AdminRoutes = ({ isLoggedIn, userRole }) => {
  if (!isLoggedIn || userRole !== "admin")
    return <Navigate to="/signin" replace />;

  return (
    <Routes>
      <Route path="admin-dashboard" element={<AdminDashboardPage />} />
      {/* Admin Profile Route */}
      <Route path="/profile" element={<AdminProfileManage />} />
      <Route path="/class-management" element={<ClassManagement />} />
      <Route path="/create-class" element={<CreateClass />} />
      <Route path="/assign-subjects-classes" element={<AdminManageClasses />} />
      <Route path="/create-subjects" element={<CreateSubject />} />
      {/* Admin Register Route */}
      <Route path="/register-admin" element={<RegisterAdminPage />} />
      {/* Teacher Register Route */}
      <Route path="/register-teacher" element={<RegisterTeacherPage />} />
      {/* Student Register Route */}
      <Route path="/register-student" element={<RegisterStudentPage />} />
      <Route path="/student-management" element={<StudentManagement />} />
      <Route path="/teacher-management" element={<TeacherManagement />} />
      <Route
        path="/assign-teacher-subjects"
        element={<AssignTeacherToSubject />}
      />
      <Route
        path="/assign-teacher-classes"
        element={<AssignTeacherToClass />}
      />
      <Route
        path="/teacher-attendance"
        element={<TeacherAttendanceManagement />}
      />
      <Route
        path="/mark-teacher-attendance"
        element={<MarkTeacherAttendance />}
      />
      <Route
        path="/track-teacher-attendance"
        element={<TrackTeacherAttendance />}
      />
      <Route
        path="/track-student-attendance"
        element={<TrackStudentAttendance />}
      />
      <Route path="/assign-students-class" element={<AssignStudentToClass />} />
      <Route path="/student-profiles" element={<TrackStudentProfile />} />

      <Route path="/edit-class/:classId" element={<EditClass />} />

      {/* Add the route inside the Routes component */}
      <Route path="/notifications" element={<NotificationCreation />} />
    </Routes>
  );
};

export default AdminRoutes;
