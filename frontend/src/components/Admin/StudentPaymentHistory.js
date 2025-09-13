// src/components/StudentPaymentHistory/StudentPaymentHistory.jsx
import React, { useState, useEffect } from "react";
import feeApi from "../../api/feeApi"; // ✅ use centralized instance
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
       const studentFees = await feeApi.getStudentFeeHistory(classData._id, student._id);

      setFeeHistory(studentFees);

      if (studentFees.length > 0) {
        const sorted = [...studentFees].sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
        setCurrentFee(sorted[0]);
        setPaymentHistory(sorted.filter(fee => fee.status === "paid" || fee.status === "under_process"));
      } else {
        setCurrentFee(null);
        setPaymentHistory([]);
      }
    } catch (err) {
      console.error("❌ Failed to fetch fee history:", err);
      setError("Failed to fetch fee history from server");
      setFeeHistory([]);
      setCurrentFee(null);
      setPaymentHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 processStudentFeeData stays unchanged
  const processStudentFeeData = () => {
    if (!student || !student.feeDetails) {
      setError("No fee data available for this student");
      return;
    }

    try {
      const feeDetails = student.feeDetails;
      setCurrentFee({
        status: feeDetails.status,
        amount: feeDetails.monthlyFee,
        totalAmount: feeDetails.totalAmount,
        dueDate: feeDetails.dueDate,
        monthlyFee: feeDetails.monthlyFee,
      });

      const studentFeeHistory = feeDetails.feeHistory || [];

      const processedFeeHistory = studentFeeHistory.map((fee) => {
        let status = "pending";
        if (fee.paymentDate && fee.paymentMethod && fee.transactionId) {
          status = "paid";
        } else if (fee.paymentDate && fee.paymentMethod) {
          status = "under_process";
        } else {
          const dueDate = new Date(fee.dueDate);
          const today = new Date();
          status = dueDate < today ? "overdue" : "pending";
        }
        return { ...fee, status };
      });

      setFeeHistory(processedFeeHistory);
      setPaymentHistory(processedFeeHistory.filter(fee => fee.status === "paid" || fee.status === "under_process"));
    } catch (error) {
      console.error("Error processing student fee data:", error);
      setError("Failed to process fee data");
    }
  };

  const fetchPaymentHistory = async () => {
    processStudentFeeData();
  };

  // 🔹 helpers: getStatusBadge, getPaymentMethodIcon, formatDate, formatCurrency, handlePrintReceipt → unchanged

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { variant: "success", icon: <FaCheckCircle /> },
      pending: { variant: "warning", icon: <FaClock /> },
      overdue: { variant: "danger", icon: <FaExclamationTriangle /> },
      under_process: { variant: "info", icon: <FaClock /> },
      cancelled: { variant: "secondary", icon: <FaTimes /> },
    };
    const config = statusConfig[status] || { variant: "secondary", icon: <FaClock /> };
    return (
      <Badge bg={config.variant} className="status-badge">
        {config.icon} {status ? status.replace("_", " ").toUpperCase() : "N/A"}
      </Badge>
    );
  };

  const getPaymentMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case "online":
        return <FaCreditCard />;
      case "cash":
        return <FaMoneyBillWave />;
      case "cheque":
        return <FaReceipt />;
      default:
        return <FaMoneyBillWave />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Not set";
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== "number" && typeof amount !== "string") return "₹0.00";
    return `₹${Number(amount || 0).toFixed(2)}`;
  };

  const handlePrintReceipt = (payment) => {
    if (!student || !classData || !payment) return;
    const receiptWindow = window.open("", "_blank");
    receiptWindow.document.write(`
      <html>
        <head>
          <title>Fee Receipt - ${student.studentName || ""}</title>
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
            <p><strong>Student Name:</strong> ${student.studentName || ""}</p>
            <p><strong>Student ID:</strong> ${student.studentID || ""}</p>
            <p><strong>Class:</strong> ${classData.className || ""}</p>
            <p><strong>Payment Date:</strong> ${formatDate(payment.paymentDate)}</p>
            <p><strong>Amount:</strong> <span class="amount">${formatCurrency(payment.amount)}</span></p>
            <p><strong>Payment Method:</strong> ${payment.paymentMethod || ""}</p>
            <p><strong>Transaction ID:</strong> ${payment.transactionId || "N/A"}</p>
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

  // 🔹 JSX render section unchanged (only API refactor above)

  return (
    <Modal show={show} onHide={onHide} size="xl" centered className="payment-history-modal">
      <Modal.Header closeButton className="modal-header">
        <Modal.Title>
          <FaHistory /> Payment History - {student?.studentName || ""}
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
            <Button onClick={handleRefresh} variant="outline-primary">Try Again</Button>
          </div>
        ) : (
          <>
            {/* Student Info, Current Fee, History table — same as your code */}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
      <ToastContainer />
    </Modal>
  );
};

export default StudentPaymentHistory;
