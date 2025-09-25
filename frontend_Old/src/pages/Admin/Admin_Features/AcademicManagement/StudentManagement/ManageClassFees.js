import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { 
  FaArrowLeft, 
  FaMoneyBillWave, 
  FaCog, 
  FaChartBar, 
  FaCalendarAlt, 
  FaSpinner,
  FaUsers,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaRupeeSign,
  FaSearch,
  FaHistory
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Row, Col, Card, Spinner, ProgressBar, Form } from "react-bootstrap";
import "./ManageClassFees.css";
import { parseDate, formatDate, isAfter, isBefore, isSameDay } from '../../../../../utils/dateUtils';
import StudentPaymentHistory from '../../../../../components/Admin/StudentPaymentHistory';

// feeDetails is a plain JS object: { [classId]: { ...fee info } }
// Always access as student.feeDetails[classId]

const ManageClassFees = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [classesPerPage] = useState(12);
  const [error, setError] = useState("");
  const [feeSettings, setFeeSettings] = useState({
    baseFee: "",
    lateFeePerDay: "",
    feeDueDate: ""
  });
  
  // Payment history modal state
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [classFeeRecords, setClassFeeRecords] = useState([]);
  
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_NODE_ENV === "production"
    ? process.env.REACT_APP_PRODUCTION_URL
    : process.env.REACT_APP_DEVELOPMENT_URL || "http://localhost:5000";

  // Helper function to safely access fee details from Map structure
  const getFeeDetails = (student, classId) => {
    if (!student.feeDetails) return null;
    
    // Handle both Map and plain object structures
    if (student.feeDetails instanceof Map) {
      return student.feeDetails.get(classId) || null;
    } else if (typeof student.feeDetails === 'object') {
      return student.feeDetails[classId] || null;
    }
    return null;
  };

  useEffect(() => {
    fetchClasses();
  }, [page]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError("");
      console.log('Fetching classes from:', `${API_URL}/api/admin/auth/classes`);
      
      const response = await axios.get(
        `${API_URL}/api/admin/auth/classes`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      
      console.log('Raw API Response:', response);
      console.log('Response Data:', response.data);
      
      let classesData = [];
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        classesData = response.data;
      } else if (response.data && Array.isArray(response.data.classes)) {
        classesData = response.data.classes;
      } else if (response.data && Array.isArray(response.data.data)) {
        classesData = response.data.data;
      }

      console.log('Extracted Classes Data:', classesData);

      if (classesData.length === 0) {
        console.log('No classes found in response, trying alternative endpoint');
        try {
          const allClassesResponse = await axios.get(
            `${API_URL}/api/admin/auth/get-all-classes`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          
          console.log('Alternative endpoint response:', allClassesResponse.data);
          
          if (Array.isArray(allClassesResponse.data)) {
            classesData = allClassesResponse.data;
          } else if (allClassesResponse.data && Array.isArray(allClassesResponse.data.classes)) {
            classesData = allClassesResponse.data.classes;
          } else if (allClassesResponse.data && Array.isArray(allClassesResponse.data.data)) {
            classesData = allClassesResponse.data.data;
          }
        } catch (error) {
          console.error("Error fetching from alternative endpoint:", error);
        }
      }

      if (classesData.length > 0) {
        // Sort classes by name
        const sortedClasses = [...classesData].sort((a, b) => {
          const numA = parseInt(a.className, 10);
          const numB = parseInt(b.className, 10);
          if (!isNaN(numA) && !isNaN(numB)) {
            if (numA !== numB) return numA - numB;
            const letterA = a.className.replace(numA.toString(), "");
            const letterB = b.className.replace(numB.toString(), "");
            return letterA.localeCompare(letterB);
          } else if (!isNaN(numA)) {
            return -1;
          } else if (!isNaN(numB)) {
            return 1;
          } else {
            return a.className.localeCompare(b.className);
          }
        });

        console.log('Final sorted classes:', sortedClasses);
        setClasses(sortedClasses);
        setError("");
      } else {
        console.error('No classes found in any response');
        toast.error("No classes found");
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      if (error.response) {
        console.error("Error response:", error.response);
        toast.error(error.response.data.message || "Failed to fetch classes");
      } else {
        toast.error("Failed to fetch classes");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Current classes state:', classes);
  }, [classes]);

  const calculateMonthlyFee = (baseFee) => {
    return Number((baseFee / 12).toFixed(2));
  };

  const getCurrentMonth = () => {
    const now = new Date();
    return {
      month: now.getMonth() + 1,
      year: now.getFullYear()
    };
  };

  const handleClassSelect = async (classData) => {
    try {
      setSelectedClass(classData);
      setFeeSettings({
        baseFee: classData.baseFee || "",
        lateFeePerDay: classData.lateFeePerDay || "",
        feeDueDate: classData.feeDueDate ? new Date(classData.feeDueDate).toISOString().split('T')[0] : ""
      });
      await fetchStudents(classData._id);
    } catch (error) {
      console.error("Error selecting class:", error);
      toast.error("Failed to select class");
    }
  };

  const fetchStudents = async (classId) => {
    try {
      setLoading(true);
      console.log('Fetching students for class:', classId);
      
      const response = await axios.get(
        `${API_URL}/api/admin/auth/students/class/${classId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      
      console.log('Students API Response:', response.data);
      console.log('Response data structure:', {
        hasData: !!response.data,
        hasDataArray: !!response.data.data,
        dataLength: response.data.data?.length,
        firstStudent: response.data.data?.[0]
      });
      
      const currentClass = classes.find(c => c._id === classId);
      
      if (!currentClass) {
        throw new Error("Class data not found");
      }

      if (!response.data) {
        toast.error('No data received from server.');
        setStudents([]);
        return;
      }

      if (!Array.isArray(response.data.data)) {
        console.error('Invalid response format:', response.data);
        toast.error('Invalid API response format. Please try refreshing.');
        setStudents([]);
        return;
      }

      if (response.data.data.length === 0) {
        console.log('No students found for class:', classId);
        toast.info(`No students found in ${currentClass.className}. Please add students to this class first.`);
        setStudents([]);
        return;
      }

      const updatedStudents = response.data.data.map(student => {
        // The backend now returns feeDetails directly, not wrapped in an object
        const feeDetails = student.feeDetails || {
          status: 'pending',
          lastUpdated: new Date().toISOString(),
          monthlyFee: currentClass.baseFee ? currentClass.baseFee / 12 : 0,
          totalAmount: currentClass.baseFee || 0,
          dueDate: currentClass.feeDueDate,
          lateFeePerDay: currentClass.lateFeePerDay || 0
        };
        
        return {
          ...student,
          classId: currentClass.classId,
          feeDetails: feeDetails
        };
      });
      
      console.log('Updated Students with Fee Details:', updatedStudents);
      console.log('Sample student fee details:', updatedStudents[0]?.feeDetails);
      setStudents(updatedStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to fetch students");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to update all current month Fee records for the class
  const updateCurrentMonthFeesForClass = async () => {
    if (!selectedClass) return;
    try {
      setUpdating(true);
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      // Fetch all current month fee records for the class
      const feeRes = await axios.get(
        `${API_URL}/api/fees/class/${selectedClass._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const feeRecords = feeRes.data || [];
      // For each fee record for the current month/year, PATCH it
      await Promise.all(feeRecords.map(async (fee) => {
        const feeDate = new Date(fee.dueDate);
        if (
          feeDate.getMonth() + 1 === currentMonth &&
          feeDate.getFullYear() === currentYear
        ) {
          await axios.patch(
            `${API_URL}/api/fees/${fee._id}`,
            {
              amount: feeSettings.baseFee ? Number(feeSettings.baseFee) / 12 : 0,
              totalAmount: feeSettings.baseFee ? Number(feeSettings.baseFee) / 12 : 0,
              dueDate: feeSettings.feeDueDate,
              // Optionally update lateFeePerDay if stored in Fee model
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
        }
      }));
      toast.success("All current month fee records updated to match new settings");
      await fetchClassFeeRecords(selectedClass._id);
      await fetchStudents(selectedClass._id);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update current month fee records");
    } finally {
      setUpdating(false);
    }
  };

  const handleFeeUpdate = async (e) => {
    e.preventDefault();
    if (!selectedClass) {
      toast.error("Please select a class first");
      return;
    }

    // Validate required fields
    if (!feeSettings.baseFee || feeSettings.baseFee <= 0) {
      toast.error("Base fee must be greater than 0");
      return;
    }

    if (!feeSettings.lateFeePerDay || feeSettings.lateFeePerDay < 0) {
      toast.error("Late fee per day cannot be negative");
      return;
    }

    if (!feeSettings.feeDueDate) {
      toast.error("Fee due date is required");
      return;
    }

    try {
      setUpdating(true);
      // Update class fee settings
      const response = await axios.post(
        `${API_URL}/api/fees/class-fee/update`,
        {
          classId: selectedClass._id,
          baseFee: Number(feeSettings.baseFee),
          lateFeePerDay: Number(feeSettings.lateFeePerDay),
          feeDueDate: feeSettings.feeDueDate
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response && response.data) {
        const updatedClass = {
          ...selectedClass,
          baseFee: Number(feeSettings.baseFee),
          lateFeePerDay: Number(feeSettings.lateFeePerDay),
          feeDueDate: feeSettings.feeDueDate
        };
        setClasses(classes.map(c => 
          c._id === selectedClass._id ? updatedClass : c
        ));
        // Update student fee details locally
        const updatedStudents = students.map(student => {
          const existingFeeDetails = student.feeDetails || {};
          return {
            ...student,
            feeDetails: {
              ...existingFeeDetails,
              status: existingFeeDetails.status || 'pending',
              lastUpdated: new Date().toISOString()
            }
          };
        });
        setStudents(updatedStudents);
        setSelectedClass(updatedClass);
        toast.success(`Fee settings updated successfully for ${selectedClass.className}. ${students.length} students affected.`);
        // Automatically update all current month Fee records for the class
        await updateCurrentMonthFeesForClass();
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error updating fee settings:", error);
      if (error.response) {
        toast.error(error.response.data.message || "Failed to update fee settings");
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update fee settings");
      }
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "paid";
      case "pending":
        return "pending";
      case "overdue":
        return "overdue";
      default:
        return "pending";
    }
  };

  const getDueDateClass = (dueDate) => {
    if (!dueDate) return "secondary";
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "danger";
    if (diffDays <= 7) return "warning";
    return "success";
  };

  const filteredStudents = students.filter(student => 
    student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentID.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalFees = students.reduce((total, student) => total + (student.feeDetails?.totalAmount || 0), 0);
  const collectedFees = students.reduce((total, student) => 
    total + (student.feeDetails?.status === "paid" ? (student.feeDetails?.totalAmount || 0) : 0), 0
  );
  const collectionPercentage = totalFees > 0 ? (collectedFees / totalFees) * 100 : 0;

  const feeStats = React.useMemo(() => {
    if (!students.length) return { 
      total: 0, 
      paid: 0, 
      pending: 0, 
      overdue: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      monthlyTotal: 0
    };

    const currentMonth = getCurrentMonth();
    const total = students.length;
    
    // Count students by status (simplified logic)
    const paid = students.filter(s => s.feeDetails?.status === "paid").length;
    const pending = students.filter(s => s.feeDetails?.status === "pending").length;
    const overdue = students.filter(s => s.feeDetails?.status === "overdue").length;

    const monthlyTotal = students.reduce((sum, student) => 
      sum + (student.feeDetails?.monthlyFee || 0), 0
    );
    const paidAmount = students
      .filter(s => s.feeDetails?.status === "paid")
      .reduce((sum, student) => sum + (student.feeDetails?.totalAmount || 0), 0);
    const pendingAmount = students
      .filter(s => s.feeDetails?.status === "pending")
      .reduce((sum, student) => sum + (student.feeDetails?.totalAmount || 0), 0);
    const overdueAmount = students
      .filter(s => s.feeDetails?.status === "overdue")
      .reduce((sum, student) => sum + (student.feeDetails?.totalAmount || 0), 0);

    console.log('Monthly Fee Statistics:', {
      month: currentMonth.month,
      year: currentMonth.year,
      total,
      paid,
      pending,
      overdue,
      monthlyTotal,
      paidAmount,
      pendingAmount,
      overdueAmount,
      students: students.map(s => ({
        id: s._id,
        name: s.studentName,
        status: s.feeDetails?.status,
        monthlyFee: s.feeDetails?.monthlyFee,
        totalAmount: s.feeDetails?.totalAmount,
        paidMonth: s.feeDetails?.paidMonth,
        paidYear: s.feeDetails?.paidYear,
        currentMonth: s.feeDetails?.currentMonth,
        currentYear: s.feeDetails?.currentYear
      }))
    });

    return { 
      total, 
      paid, 
      pending, 
      overdue,
      totalAmount: monthlyTotal,
      paidAmount,
      pendingAmount,
      overdueAmount,
      monthlyTotal
    };
  }, [students]);

  const formatDueDate = (date) => {
    if (!date) return "Not set";
    const dueDate = new Date(date);
    return dueDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDueDateStatus = (dueDate) => {
    if (!dueDate) return { status: 'secondary', message: 'No due date set' };
    
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return {
        status: 'danger',
        message: 'Overdue',
        details: `${Math.abs(diffDays)} days overdue`
      };
    }
    if (diffDays === 0) {
      return {
        status: 'warning',
        message: 'Due Today',
        details: 'Last day to pay'
      };
    }
    if (diffDays <= 7) {
      return {
        status: 'warning',
        message: 'Due Soon',
        details: `${diffDays} days remaining`
      };
    }
    return {
      status: 'success',
      message: 'Upcoming',
      details: `${diffDays} days remaining`
    };
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="pagination-controls">
        <button 
          className="pagination-button"
          onClick={() => setPage(prev => Math.max(prev - 1, 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span className="pagination-info">
          Page {page} of {totalPages}
        </span>
        <button 
          className="pagination-button"
          onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    );
  };

  const renderClassItem = (classData) => {
    return (
      <div
        key={classData._id}
        className={`class-item ${selectedClass?._id === classData._id ? "selected" : ""}`}
        onClick={() => handleClassSelect(classData)}
      >
        <div className="class-item-header">
          <h6>{classData.className}</h6>
          <span className="class-id">ID: {classData.classId}</span>
        </div>
        <div className="class-info">
          {classData.baseFee && (
            <div className="class-fee-info">
              <FaMoneyBillWave className="fee-icon" />
              <span>Base Fee: ₹{classData.baseFee}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Fetch fee records for the selected class
  const fetchClassFeeRecords = async (classId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/fees/class/${classId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (Array.isArray(response.data)) {
        setClassFeeRecords(response.data);
      } else if (Array.isArray(response.data.data)) {
        setClassFeeRecords(response.data.data);
      } else {
        setClassFeeRecords([]);
      }
    } catch (error) {
      setClassFeeRecords([]);
    }
  };

  // Fetch students and fee records when class changes
  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass._id);
      fetchClassFeeRecords(selectedClass._id);
    }
    // eslint-disable-next-line
  }, [selectedClass]);

  // Helper to get latest fee status for a student from classFeeRecords
  const getLatestFeeStatus = (studentId) => {
    // Find the most recent fee record for this student in this class
    const records = classFeeRecords.filter(fee => fee.student?._id === studentId);
    if (records.length === 0) return null;
    // Sort by dueDate descending
    records.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
    return records[0];
  };

  // Add refresh interval for fee status updates
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (selectedClass) {
        fetchStudents(selectedClass._id);
        fetchClassFeeRecords(selectedClass._id);
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [selectedClass]);

  // Add function to refresh student data
  const refreshStudentData = async () => {
    if (selectedClass) {
      await fetchStudents(selectedClass._id);
      await fetchClassFeeRecords(selectedClass._id);
    }
  };

  const handleViewPaymentHistory = (student) => {
    setSelectedStudent(student);
    setShowPaymentHistory(true);
  };

  const handleClosePaymentHistory = () => {
    setShowPaymentHistory(false);
    setSelectedStudent(null);
  };

  // Add event listener for fee status updates
  useEffect(() => {
    const handleFeeStatusUpdated = () => {
      if (selectedClass) {
        fetchStudents(selectedClass._id);
        fetchClassFeeRecords(selectedClass._id);
      }
    };
    window.addEventListener('feeStatusUpdated', handleFeeStatusUpdated);
    return () => {
      window.removeEventListener('feeStatusUpdated', handleFeeStatusUpdated);
    };
  }, [selectedClass]);

  // Helper to get the fee record for the current month/year for a student
  const getCurrentMonthFee = (studentId) => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    // Find a fee record for this student in this class for the current month/year
    return classFeeRecords.find(fee => {
      const feeDate = new Date(fee.dueDate);
      return (
        fee.student?._id === studentId &&
        feeDate.getMonth() + 1 === currentMonth &&
        feeDate.getFullYear() === currentYear
      );
    });
  };

  // Helper to generate a missing fee record for a student
  const generateFeeForStudent = async (studentId) => {
    if (!selectedClass) return;
    try {
      setLoading(true);
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const dueDate = new Date(currentYear, now.getMonth(), selectedClass.feeDueDate ? new Date(selectedClass.feeDueDate).getDate() : 15);
      await axios.post(
        `${API_URL}/api/fees/`,
        {
          student: studentId,
          class: selectedClass._id,
          academicYear: currentYear.toString(),
          feeType: "monthly",
          amount: selectedClass.baseFee ? selectedClass.baseFee / 12 : 0,
          dueDate,
          status: "pending",
          totalAmount: selectedClass.baseFee ? selectedClass.baseFee / 12 : 0,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success("Fee record generated for student");
      await fetchClassFeeRecords(selectedClass._id);
      await fetchStudents(selectedClass._id);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to generate fee record");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !selectedClass) {
    return (
      <div className="manage-class-fees-container">
        <div className="loading-spinner">
          <Spinner animation="border" variant="primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="manage-class-fees-container">
      <div className="header-section">
        <button className="back-button" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>
        <h1 className="page-title">Manage Class Fees</h1>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
      <Row className="mt-4">
        <Col md={4}>
          <Card className="class-selection-card">
            <Card.Header>
              <h5 className="mb-0">Select Class</h5>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : (
                <div className="class-list">
                  {classes.length === 0 ? (
                    <div className="no-classes-message">
                      No classes found
                    </div>
                  ) : (
                    classes.map(renderClassItem)
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={8}>
          {selectedClass && (
            <>
              <div className="fee-overview-section">
                <Row>
                  <Col md={3}>
                    <Card className="stat-card total-students">
                      <Card.Body>
                        <div className="stat-icon">
                          <FaUsers />
                        </div>
                        <div className="stat-content">
                          <h3>Total Students</h3>
                          <p>{feeStats.total}</p>
                          <small>Monthly Fee: ₹{feeStats.monthlyTotal.toFixed(2)}</small>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="stat-card paid-fees">
                      <Card.Body>
                        <div className="stat-icon">
                          <FaCheckCircle />
                        </div>
                        <div className="stat-content">
                          <h3>Paid Fees</h3>
                          <p>{feeStats.paid}</p>
                          <small>Amount: ₹{feeStats.paidAmount.toFixed(2)}</small>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="stat-card pending-fees">
                      <Card.Body>
                        <div className="stat-icon">
                          <FaClock />
                        </div>
                        <div className="stat-content">
                          <h3>Pending Fees</h3>
                          <p>{feeStats.pending}</p>
                          <small>Amount: ₹{feeStats.pendingAmount.toFixed(2)}</small>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="stat-card overdue-fees">
                      <Card.Body>
                        <div className="stat-icon">
                          <FaExclamationTriangle />
                        </div>
                        <div className="stat-content">
                          <h3>Overdue Fees</h3>
                          <p>{feeStats.overdue}</p>
                          <small>Amount: ₹{feeStats.overdueAmount.toFixed(2)}</small>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Row className="mt-4">
                  <Col md={6}>
                    <Card className="collection-progress">
                      <Card.Body>
                        <h3>Fee Collection Progress</h3>
                        <div className="progress-stats">
                          <div className="progress-label">
                            <span>Collected</span>
                            <span>₹{collectedFees.toFixed(2)}</span>
                          </div>
                          <ProgressBar>
                            <ProgressBar 
                              variant="success" 
                              now={collectionPercentage} 
                              label={`${Math.round(collectionPercentage)}%`} 
                            />
                          </ProgressBar>
                          <div className="progress-label">
                            <span>Total</span>
                            <span>₹{totalFees.toFixed(2)}</span>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="due-date-warning">
                      <Card.Body>
                        <h3>Due Date Status</h3>
                        {selectedClass?.feeDueDate ? (
                          <div className="due-date-status-container">
                            <div className={`due-date-status ${getDueDateStatus(selectedClass.feeDueDate).status}`}>
                              <div className="due-date-icon">
                                <FaCalendarAlt />
                              </div>
                              <div className="due-date-info">
                                <div className="due-date-main">
                                  <span className="due-date-label">Due Date:</span>
                                  <span className="due-date-value">{formatDueDate(selectedClass.feeDueDate)}</span>
                                </div>
                                <div className="due-date-secondary">
                                  <span className="due-date-message">{getDueDateStatus(selectedClass.feeDueDate).message}</span>
                                  <span className="due-date-details">{getDueDateStatus(selectedClass.feeDueDate).details}</span>
                                </div>
                              </div>
                            </div>
                            <div className="due-date-actions">
                              <button 
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => {
                                  const newDate = new Date(selectedClass.feeDueDate);
                                  newDate.setDate(newDate.getDate() + 7);
                                  setFeeSettings({
                                    ...feeSettings,
                                    feeDueDate: newDate.toISOString().split('T')[0]
                                  });
                                }}
                              >
                                Extend by 1 Week
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="due-date-status secondary">
                            <FaCalendarAlt />
                            <span>No due date set</span>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>

              <div className="fee-settings-section">
                <h2>
                  <FaMoneyBillWave /> Fee Settings for {selectedClass.className}
                </h2>
                <form onSubmit={handleFeeUpdate}>
                  <div className="form-group">
                    <label>Base Fee (₹)</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <FaRupeeSign />
                      </span>
                      <input
                        type="number"
                        className="form-control"
                        value={feeSettings.baseFee}
                        onChange={(e) => setFeeSettings({ ...feeSettings, baseFee: e.target.value })}
                        required
                        min="0"
                        step="0.01"
                        placeholder="Enter base fee amount"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Late Fee per Day (₹)</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <FaRupeeSign />
                      </span>
                      <input
                        type="number"
                        className="form-control"
                        value={feeSettings.lateFeePerDay}
                        onChange={(e) => setFeeSettings({ ...feeSettings, lateFeePerDay: e.target.value })}
                        required
                        min="0"
                        step="0.01"
                        placeholder="Enter late fee amount"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Fee Due Date</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <FaCalendarAlt />
                      </span>
                      <input
                        type="date"
                        className="form-control"
                        value={feeSettings.feeDueDate}
                        onChange={(e) => setFeeSettings({ ...feeSettings, feeDueDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="update-button"
                    disabled={updating}
                  >
                    {updating ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <FaCheckCircle /> Update Fee Settings
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="fee-table-container">
                <h2>
                  <FaUsers /> Student Fee Details for {selectedClass.className}
                </h2>
                <div className="mb-3 d-flex justify-content-between align-items-center">
                  <div className="input-group" style={{ maxWidth: '400px' }}>
                    <span className="input-group-text">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by student name or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button 
                    className="btn btn-outline-primary"
                    onClick={refreshStudentData}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <FaCog /> Refresh Data
                      </>
                    )}
                  </button>
                </div>
                
                {loading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Loading student data...</p>
                  </div>
                ) : (
                <div className="table-responsive">
                  <table className="fee-table">
                    <thead>
                      <tr>
                        <th>Student ID</th>
                        <th>Name</th>
                        <th>Month/Year</th>
                        <th>Monthly Fee</th>
                        <th>Total Amount</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => {
                        // Find all fee records for this student in this class
                        const studentFees = classFeeRecords.filter(fee => fee.student?._id === student._id);
                        // Prefer fee with due date matching the class's current feeDueDate
                        let currentFee = null;
                        if (selectedClass && selectedClass.feeDueDate) {
                          const classDueDate = new Date(selectedClass.feeDueDate);
                          currentFee = studentFees.find(fee => {
                            const feeDue = new Date(fee.dueDate);
                            return feeDue.getFullYear() === classDueDate.getFullYear() && feeDue.getMonth() === classDueDate.getMonth();
                          });
                        }
                        // If not found, use the fee with the latest due date
                        if (!currentFee && studentFees.length > 0) {
                          currentFee = studentFees.reduce((latest, fee) => {
                            return (!latest || new Date(fee.dueDate) > new Date(latest.dueDate)) ? fee : latest;
                          }, null);
                        }
                        const now = new Date();
                        let status, monthlyFee, totalAmount, dueDate, monthYear;
                        if (currentFee) {
                          status = currentFee.status || "pending";
                          monthlyFee = currentFee.amount || 0;
                          totalAmount = currentFee.totalAmount || 0;
                          dueDate = currentFee.dueDate;
                          const feeDate = new Date(currentFee.dueDate);
                          monthYear = `${feeDate.toLocaleString('default', { month: 'short' })} ${feeDate.getFullYear()}`;
                        } else {
                          status = "No record";
                          monthlyFee = "N/A";
                          totalAmount = "N/A";
                          dueDate = null;
                          monthYear = selectedClass && selectedClass.feeDueDate ? `${new Date(selectedClass.feeDueDate).toLocaleString('default', { month: 'short' })} ${new Date(selectedClass.feeDueDate).getFullYear()}` : `${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;
                        }
                        return (
                          <tr key={student._id} className={!currentFee ? "missing-fee-record" : ""}>
                            <td>{student.studentID}</td>
                            <td>{student.studentName}</td>
                            <td>{monthYear}</td>
                            <td>{monthlyFee !== "N/A" ? ` ₹${Number(monthlyFee).toFixed(2)}` : <span className="text-danger">N/A</span>}</td>
                            <td>{totalAmount !== "N/A" ? ` ₹${Number(totalAmount).toFixed(2)}` : <span className="text-danger">N/A</span>}</td>
                            <td>
                              <span className={`due-date ${getDueDateClass(dueDate)}`}>{dueDate ? new Date(dueDate).toLocaleDateString() : <span className="text-danger">N/A</span>}</span>
                            </td>
                            <td>
                              <span className={`status-badge ${getStatusBadgeClass(status)}`}>{status}</span>
                              {!currentFee && (
                                <span className="text-danger ms-2">Missing</span>
                              )}
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button 
                                  className="action-button view" 
                                  onClick={() => navigate(`/admin/student/${student._id}`)}
                                >
                                  View Details
                                </button>
                                <button 
                                  className="action-button history" 
                                  onClick={() => handleViewPaymentHistory(student)}
                                  title="View Payment History"
                                >
                                  <FaHistory /> History
                                </button>
                                {!currentFee && (
                                  <button
                                    className="action-button generate"
                                    onClick={() => generateFeeForStudent(student._id)}
                                    title="Generate Fee Record"
                                  >
                                    Generate Fee
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </Col>
      </Row>
      {/* Payment History Modal */}
      <StudentPaymentHistory
        show={showPaymentHistory}
        onHide={handleClosePaymentHistory}
        student={selectedStudent}
        classData={selectedClass}
        onRefresh={refreshStudentData}
      />
    </div>
  );
};

export default ManageClassFees;