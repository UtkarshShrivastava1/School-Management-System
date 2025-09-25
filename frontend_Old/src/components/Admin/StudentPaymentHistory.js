import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { 
  FaHistory, 
  FaTimes, 
  FaSpinner, 
  FaCalendarAlt, 
  FaMoneyBillWave,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaRupeeSign,
  FaReceipt,
  FaCreditCard,
  FaPrint
} from "react-icons/fa";
import { Modal, Button, Table, Badge, Card, Row, Col } from "react-bootstrap";
import "./StudentPaymentHistory.css";

const StudentPaymentHistory = ({ 
  show, 
  onHide, 
  student, 
  classData, 
  onRefresh 
}) => {
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [feeHistory, setFeeHistory] = useState([]);
  const [currentFee, setCurrentFee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL = process.env.REACT_APP_NODE_ENV === "production"
    ? process.env.REACT_APP_PRODUCTION_URL
    : process.env.REACT_APP_DEVELOPMENT_URL || "http://localhost:5000";

  useEffect(() => {
    if (show && student && classData) {
      fetchStudentFeeHistory();
    } else if (!show) {
      setPaymentHistory([]);
      setFeeHistory([]);
      setCurrentFee(null);
      setError("");
    }
    // eslint-disable-next-line
  }, [show, student, classData]);

  const fetchStudentFeeHistory = async () => {
    if (!student || !classData) return;
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/api/fees/class/${classData._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Filter for this student
      const allFees = Array.isArray(response.data) ? response.data : response.data.data || [];
      const studentFees = allFees.filter(fee => fee.student?._id === student._id);
      setFeeHistory(studentFees);
      // Set current fee as the most recent (by dueDate)
      if (studentFees.length > 0) {
        const sorted = [...studentFees].sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
        setCurrentFee(sorted[0]);
        // Payment history: paid or under_process
        setPaymentHistory(sorted.filter(fee => fee.status === 'paid' || fee.status === 'under_process'));
      } else {
        setCurrentFee(null);
        setPaymentHistory([]);
      }
    } catch (err) {
      setError("Failed to fetch fee history from server");
      setFeeHistory([]);
      setCurrentFee(null);
      setPaymentHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const processStudentFeeData = () => {
    if (!student || !student.feeDetails) {
      setError("No fee data available for this student");
      return;
    }

    try {
      const feeDetails = student.feeDetails;
      
      // Set current fee from feeDetails
      setCurrentFee({
        status: feeDetails.status,
        amount: feeDetails.monthlyFee,
        totalAmount: feeDetails.totalAmount,
        dueDate: feeDetails.dueDate,
        monthlyFee: feeDetails.monthlyFee
      });

      // Process fee history from student's feeDetails
      const studentFeeHistory = feeDetails.feeHistory || [];
      
      // Debug: Log each fee record to see the actual data structure
      console.log('Raw fee history from student:', studentFeeHistory);
      
      // Process each fee record to determine its status
      const processedFeeHistory = studentFeeHistory.map((fee, index) => {
        console.log(`Fee record ${index} - COMPLETE DATA:`, fee);
        console.log(`Fee record ${index} - SPECIFIC FIELDS:`, {
          month: fee.month,
          year: fee.year,
          amount: fee.amount,
          dueDate: fee.dueDate,
          paymentDate: fee.paymentDate,
          paymentMethod: fee.paymentMethod,
          transactionId: fee.transactionId,
          // Check for alternative field names
          paymentDetails: fee.paymentDetails,
          receiptNumber: fee.receiptNumber,
          // Check for nested payment info
          payment: fee.payment,
          // Check for any other payment-related fields
          ...Object.keys(fee).filter(key => key.toLowerCase().includes('payment') || key.toLowerCase().includes('transaction') || key.toLowerCase().includes('receipt')).reduce((acc, key) => {
            acc[key] = fee[key];
            return acc;
          }, {})
        });
        
        // Determine status based on payment information
        let status = 'pending'; // default
        
        if (fee.paymentDate && fee.paymentMethod && fee.transactionId) {
          status = 'paid';
        } else if (fee.paymentDate && fee.paymentMethod) {
          status = 'under_process';
        } else {
          // Check if overdue
          const dueDate = new Date(fee.dueDate);
          const today = new Date();
          if (dueDate < today) {
            status = 'overdue';
          } else {
            status = 'pending';
          }
        }
        
        return {
          ...fee,
          status: status // Add the determined status
        };
      });
      
      console.log('Processed fee history with status:', processedFeeHistory);
      
      setFeeHistory(processedFeeHistory);

      // Filter payment history (paid records)
      const paidRecords = processedFeeHistory.filter(fee => 
        fee.status === 'paid' || fee.status === 'under_process'
      );
      setPaymentHistory(paidRecords);

      console.log('Final processed data:', {
        currentFee: feeDetails,
        feeHistory: processedFeeHistory,
        paymentHistory: paidRecords
      });

    } catch (error) {
      console.error('Error processing student fee data:', error);
      setError("Failed to process fee data");
    }
  };

  const fetchPaymentHistory = async () => {
    // This function is kept for backward compatibility but now uses processStudentFeeData
    processStudentFeeData();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { variant: "success", icon: <FaCheckCircle /> },
      pending: { variant: "warning", icon: <FaClock /> },
      overdue: { variant: "danger", icon: <FaExclamationTriangle /> },
      under_process: { variant: "info", icon: <FaClock /> },
      cancelled: { variant: "secondary", icon: <FaTimes /> }
    };
    const config = statusConfig[status] || { variant: "secondary", icon: <FaClock /> };
    return (
      <Badge bg={config.variant} className="status-badge">
        {config.icon} {status ? status.replace('_', ' ').toUpperCase() : 'N/A'}
      </Badge>
    );
  };

  const getPaymentMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'online':
        return <FaCreditCard />;
      case 'cash':
        return <FaMoneyBillWave />;
      case 'cheque':
        return <FaReceipt />;
      default:
        return <FaMoneyBillWave />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Not set";
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number' && typeof amount !== 'string') return '₹0.00';
    return `₹${Number(amount || 0).toFixed(2)}`;
  };

  const handlePrintReceipt = (payment) => {
    if (!student || !classData || !payment) return;
    const receiptWindow = window.open('', '_blank');
    receiptWindow.document.write(`
      <html>
        <head>
          <title>Fee Receipt - ${student.studentName || ''}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .receipt-details { margin: 20px 0; }
            .amount { font-size: 18px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>School Management System</h2>
            <h3>Fee Receipt</h3>
          </div>
          <div class="receipt-details">
            <p><strong>Student Name:</strong> ${student.studentName || ''}</p>
            <p><strong>Student ID:</strong> ${student.studentID || ''}</p>
            <p><strong>Class:</strong> ${classData.className || ''}</p>
            <p><strong>Payment Date:</strong> ${formatDate(payment.paymentDate)}</p>
            <p><strong>Amount:</strong> <span class="amount">${formatCurrency(payment.amount)}</span></p>
            <p><strong>Payment Method:</strong> ${payment.paymentMethod || ''}</p>
            <p><strong>Transaction ID:</strong> ${payment.transactionId || 'N/A'}</p>
          </div>
        </body>
      </html>
    `);
    receiptWindow.document.close();
    receiptWindow.print();
  };

  const handleRefresh = async () => {
    await fetchPaymentHistory();
    if (onRefresh) onRefresh();
  };

  // Early return if required props are missing
  if (!student || !classData) {
    return (
      <Modal show={show} onHide={onHide} size="md" centered className="payment-history-modal">
        <Modal.Header closeButton className="modal-header">
          <Modal.Title>
            <FaHistory /> Payment History
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body">
          <div className="text-center py-5">
            <FaExclamationTriangle className="text-danger" size={30} />
            <p className="mt-3 text-danger">Student or class information is missing.</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
        </Modal.Footer>
        <ToastContainer />
      </Modal>
    );
  }

  return (
    <>
      <Modal 
        show={show} 
        onHide={onHide} 
        size="xl" 
        centered
        className="payment-history-modal"
      >
        <Modal.Header closeButton className="modal-header">
          <Modal.Title>
            <FaHistory /> Payment History - {student?.studentName || ''}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="modal-body">
          {loading ? (
            <div className="text-center py-5">
              <FaSpinner className="fa-spin" size={30} />
              <p className="mt-3">Loading payment history...</p>
            </div>
          ) : error ? (
            <div className="text-center py-5">
              <FaExclamationTriangle className="text-danger" size={30} />
              <p className="mt-3 text-danger">{error}</p>
              <Button onClick={handleRefresh} variant="outline-primary">
                Try Again
              </Button>
            </div>
          ) : (
            <>
              {/* Student and Class Info */}
              <Card className="mb-4 info-card">
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <h6><strong>Student Information</strong></h6>
                      <p><strong>Name:</strong> {student?.studentName || ''}</p>
                      <p><strong>ID:</strong> {student?.studentID || ''}</p>
                    </Col>
                    <Col md={6}>
                      <h6><strong>Class Information</strong></h6>
                      <p><strong>Class:</strong> {classData?.className || ''}</p>
                      <p><strong>Current Status:</strong> {currentFee && getStatusBadge(currentFee.status)}</p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Current Fee Status */}
              {currentFee && (
                <Card className="mb-4 current-fee-card">
                  <Card.Header>
                    <h6><FaMoneyBillWave /> Current Fee Status</h6>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={3}>
                        <div className="fee-stat">
                          <label>Monthly Fee:</label>
                          <span className="amount">{formatCurrency(currentFee.monthlyFee)}</span>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="fee-stat">
                          <label>Total Amount:</label>
                          <span className="amount">{formatCurrency(currentFee.totalAmount)}</span>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="fee-stat">
                          <label>Due Date:</label>
                          <span>{formatDate(currentFee.dueDate)}</span>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="fee-stat">
                          <label>Status:</label>
                          <span>{getStatusBadge(currentFee.status)}</span>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

              {/* Payment History */}
              <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h6><FaHistory /> Payment & Fee History</h6>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    onClick={handleRefresh}
                    disabled={loading}
                  >
                    {loading ? <FaSpinner className="fa-spin" /> : "Refresh"}
                  </Button>
                </Card.Header>
                <Card.Body>
                  {feeHistory.length === 0 ? (
                    <div className="text-center py-4">
                      <FaHistory size={40} className="text-muted" />
                      <p className="mt-3 text-muted">No fee records available</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>Month/Year</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Due Date</th>
                            <th>Payment Date</th>
                            <th>Payment Method</th>
                            <th>Transaction ID</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {feeHistory.map((fee, index) => {
                            // Debug: Log the status for each fee record
                            console.log(`Rendering fee ${index}:`, {
                              month: fee?.month,
                              year: fee?.year,
                              status: fee?.status,
                              amount: fee?.amount || fee?.monthlyFee
                            });
                            // Use dueDate to extract month/year if not present
                            let displayMonth = fee?.month;
                            let displayYear = fee?.year;
                            if ((!displayMonth || !displayYear) && fee?.dueDate) {
                              const feeDate = new Date(fee.dueDate);
                              displayMonth = feeDate.toLocaleString('default', { month: 'short' });
                              displayYear = feeDate.getFullYear();
                            }
                            return (
                              <tr key={index}>
                                <td>{displayMonth || '-'}&#47;{displayYear || '-'}</td>
                                <td className="amount-cell">{formatCurrency(fee?.amount || fee?.monthlyFee)}</td>
                                <td>{getStatusBadge(fee?.status)}</td>
                                <td>{formatDate(fee?.dueDate)}</td>
                                <td>{formatDate(fee?.paymentDate)}</td>
                                <td>
                                  <span className="payment-method">
                                    {getPaymentMethodIcon(fee?.paymentMethod)}
                                    {fee?.paymentMethod || 'N/A'}
                                  </span>
                                </td>
                                <td>
                                  <code className="transaction-id">
                                    {fee?.transactionId || 'N/A'}
                                  </code>
                                </td>
                                <td>
                                  {fee?.status === 'paid' && (
                                    <Button
                                      variant="outline-secondary"
                                      size="sm"
                                      onClick={() => handlePrintReceipt(fee)}
                                      title="Print Receipt"
                                    >
                                      <FaPrint />
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
        </Modal.Footer>
        <ToastContainer />
      </Modal>
    </>
  );
};

export default StudentPaymentHistory; 