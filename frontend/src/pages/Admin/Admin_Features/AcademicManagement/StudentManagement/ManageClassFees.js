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
  FaSearch
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Row, Col, Card, Spinner, ProgressBar, Form } from "react-bootstrap";
import "./ManageClassFees.css";

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
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_NODE_ENV === "production"
    ? process.env.REACT_APP_PRODUCTION_URL
    : process.env.REACT_APP_DEVELOPMENT_URL || "http://localhost:5000";

  useEffect(() => {
    fetchClasses();
  }, [page]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
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

  const calculateFeeDetails = (student, classData) => {
    if (!classData) return null;

    const baseFee = Number(classData.baseFee) || 0;
    const monthlyFee = calculateMonthlyFee(baseFee);
    const lateFeePerDay = Number(classData.lateFeePerDay) || 0;
    const dueDate = classData.feeDueDate ? new Date(classData.feeDueDate) : null;
    const today = new Date();
    const currentMonth = getCurrentMonth();
    
    // Get fee details for this class
    const classId = classData._id.toString();
    const feeDetails = student.feeDetails?.get?.(classId) || {};
    
    // If fee is already paid or under process, return those details
    if (feeDetails.status === 'paid' || feeDetails.status === 'under_process') {
      return {
        ...feeDetails,
        classFee: baseFee,
        monthlyFee: monthlyFee,
        totalAmount: feeDetails.totalAmount || monthlyFee,
        lateFeeAmount: feeDetails.lateFeeAmount || 0,
        status: feeDetails.status,
        dueDate: feeDetails.dueDate || (dueDate ? dueDate.toISOString() : null),
        lastUpdated: feeDetails.lastUpdated || new Date().toISOString(),
        paymentDate: feeDetails.paymentDate,
        paymentMethod: feeDetails.paymentMethod,
        transactionId: feeDetails.transactionId,
        paidMonth: feeDetails.paidMonth || currentMonth.month,
        paidYear: feeDetails.paidYear || currentMonth.year,
        paymentApproval: feeDetails.paymentApproval
      };
    }
    
    // If fee is cancelled, return cancelled status
    if (feeDetails.status === 'cancelled') {
      return {
        ...feeDetails,
        classFee: baseFee,
        monthlyFee: monthlyFee,
        totalAmount: monthlyFee,
        lateFeeAmount: 0,
        status: 'cancelled',
        dueDate: feeDetails.dueDate || (dueDate ? dueDate.toISOString() : null),
        lastUpdated: feeDetails.lastUpdated || new Date().toISOString(),
        rejectionReason: feeDetails.rejectionReason,
        paymentApproval: feeDetails.paymentApproval
      };
    }
    
    // Calculate late fee and status for pending fees
    let lateFeeAmount = 0;
    let status = 'pending';
    
    if (dueDate) {
      const diffDays = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        lateFeeAmount = diffDays * lateFeePerDay;
        status = 'overdue';
      }
    }
    
    return {
      ...feeDetails,
      classFee: baseFee,
      monthlyFee: monthlyFee,
      totalAmount: monthlyFee + lateFeeAmount,
      lateFeeAmount: lateFeeAmount,
      status: status,
      dueDate: dueDate ? dueDate.toISOString() : null,
      lastUpdated: new Date().toISOString(),
      currentMonth: currentMonth.month,
      currentYear: currentMonth.year
    };
  };

  const updateFeeStatus = (students, classData) => {
    return students.map(student => {
      const feeDetails = calculateFeeDetails(student, classData);
      return {
        ...student,
        feeDetails
      };
    });
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
      
      const currentClass = classes.find(c => c._id === classId || c.classId === classId);
      
      if (!currentClass) {
        throw new Error("Class data not found");
      }

      if (!response.data || !Array.isArray(response.data.data)) {
        throw new Error("Invalid API response format");
      }

      const updatedStudents = response.data.data.map(student => {
        const existingFeeDetails = student.feeDetails || {};
        const calculatedFeeDetails = calculateFeeDetails(student, currentClass);
        
        if (!calculatedFeeDetails) return student;

        // Preserve the original status if it's paid, under_process, or cancelled
        let status = calculatedFeeDetails.status;
        if (existingFeeDetails.status === 'paid' || 
            existingFeeDetails.status === 'under_process' || 
            existingFeeDetails.status === 'cancelled') {
          status = existingFeeDetails.status;
        }

        return {
          ...student,
          classId: currentClass.classId,
          feeDetails: {
            ...calculatedFeeDetails,
            status,
            lastUpdated: new Date().toISOString(),
            paymentDate: existingFeeDetails.paymentDate,
            paymentMethod: existingFeeDetails.paymentMethod,
            transactionId: existingFeeDetails.transactionId,
            rejectionReason: existingFeeDetails.rejectionReason,
            paymentApproval: existingFeeDetails.paymentApproval
          }
        };
      });
      
      console.log('Updated Students with Fee Details:', updatedStudents);
      setStudents(updatedStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to fetch students");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeeUpdate = async (e) => {
    e.preventDefault();
    if (!selectedClass) return;

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
        
        // Update the class in the classes list
        setClasses(classes.map(c => 
          c._id === selectedClass._id ? updatedClass : c
        ));
        
        // Update student fee details locally
        const updatedStudents = students.map(student => {
          const existingFeeDetails = student.feeDetails || {};
          const calculatedFeeDetails = calculateFeeDetails(student, updatedClass);
          
          if (!calculatedFeeDetails) return student;

          let status = 'pending';
          if (existingFeeDetails.status === 'paid') {
            status = 'paid';
          } else if (calculatedFeeDetails.status === 'overdue') {
            status = 'overdue';
          } else {
            status = 'pending';
          }

          return {
            ...student,
            feeDetails: {
              ...calculatedFeeDetails,
              status,
              lastUpdated: new Date().toISOString()
            }
          };
        });
        
        // Update the students state
        setStudents(updatedStudents);
        setSelectedClass(updatedClass);
        
        toast.success("Fee settings updated successfully");
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
    const paid = students.filter(s => 
      s.feeDetails?.status === "paid" && 
      s.feeDetails?.paidMonth === currentMonth.month &&
      s.feeDetails?.paidYear === currentMonth.year
    ).length;
    const pending = students.filter(s => 
      s.feeDetails?.status === "pending" && 
      s.feeDetails?.currentMonth === currentMonth.month &&
      s.feeDetails?.currentYear === currentMonth.year
    ).length;
    const overdue = students.filter(s => 
      s.feeDetails?.status === "overdue" && 
      s.feeDetails?.currentMonth === currentMonth.month &&
      s.feeDetails?.currentYear === currentMonth.year
    ).length;

    const monthlyTotal = students.reduce((sum, student) => 
      sum + (student.feeDetails?.monthlyFee || 0), 0
    );
    const paidAmount = students
      .filter(s => 
        s.feeDetails?.status === "paid" && 
        s.feeDetails?.paidMonth === currentMonth.month &&
        s.feeDetails?.paidYear === currentMonth.year
      )
      .reduce((sum, student) => sum + (student.feeDetails?.totalAmount || 0), 0);
    const pendingAmount = students
      .filter(s => 
        s.feeDetails?.status === "pending" && 
        s.feeDetails?.currentMonth === currentMonth.month &&
        s.feeDetails?.currentYear === currentMonth.year
      )
      .reduce((sum, student) => sum + (student.feeDetails?.totalAmount || 0), 0);
    const overdueAmount = students
      .filter(s => 
        s.feeDetails?.status === "overdue" && 
        s.feeDetails?.currentMonth === currentMonth.month &&
        s.feeDetails?.currentYear === currentMonth.year
      )
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

  // Add refresh interval for fee status updates
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (selectedClass) {
        fetchStudents(selectedClass._id);
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [selectedClass]);

  // Add function to refresh student data
  const refreshStudentData = async () => {
    if (selectedClass) {
      await fetchStudents(selectedClass._id);
    }
  };

  // Add event listener for fee status updates
  useEffect(() => {
    const handleFeeUpdate = () => {
      refreshStudentData();
    };

    window.addEventListener('feeStatusUpdated', handleFeeUpdate);
    return () => {
      window.removeEventListener('feeStatusUpdated', handleFeeUpdate);
    };
  }, [selectedClass]);

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
                <div className="mb-3">
                  <div className="input-group">
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
                </div>
                <div className="table-responsive">
                  <table className="fee-table">
                    <thead>
                      <tr>
                        <th>Student ID</th>
                        <th>Name</th>
                        <th>Monthly Fee</th>
                        <th>Total Amount</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => (
                        <tr key={student._id}>
                          <td>{student.studentID}</td>
                          <td>{student.studentName}</td>
                          <td>₹{student.feeDetails?.monthlyFee?.toFixed(2) || "0.00"}</td>
                          <td>₹{student.feeDetails?.totalAmount?.toFixed(2) || "0.00"}</td>
                          <td>
                            <span className={`due-date ${getDueDateClass(student.feeDetails?.dueDate)}`}>
                              {student.feeDetails?.dueDate 
                                ? new Date(student.feeDetails.dueDate).toLocaleDateString() 
                                : "Not set"}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${getStatusBadgeClass(student.feeDetails?.status)}`}>
                              {student.feeDetails?.status || "pending"}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="action-button view" 
                              onClick={() => navigate(`/admin/student/${student._id}`)}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default ManageClassFees; 