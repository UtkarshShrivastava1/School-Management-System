import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FaArrowLeft, 
  FaCheck, 
  FaTimes, 
  FaSpinner, 
  FaInfoCircle, 
  FaMoneyBillWave,
  FaCalendarAlt,
  FaUserGraduate,
  FaSchool,
  FaBook,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaHistory,
  FaChartLine,
  FaReceipt,
  FaCreditCard
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './PayFee.css';

const PayFee = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFee, setSelectedFee] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFeeHistory, setShowFeeHistory] = useState(false);
  const [feeHistory, setFeeHistory] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [historyMonth, setHistoryMonth] = useState('');
  const [historyYear, setHistoryYear] = useState('');
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_NODE_ENV === 'production'
    ? process.env.REACT_APP_PRODUCTION_URL
    : 'http://localhost:5000';

  useEffect(() => {
    fetchChildFees();
  }, []);

  const fetchChildFees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to continue');
        navigate('/login');
        return;
      }

      console.log('Fetching fees from:', `${API_URL}/api/parent/auth/child-fees`);
      const response = await axios.get(
        `${API_URL}/api/parent/auth/child-fees`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );
      
      console.log('Fees response:', response.data);
      
      if (!response.data || !response.data.fees) {
        setError('No fee data received from server');
        toast.error('No fee data available');
        return;
      }
      
      setFees(response.data.fees);
      setError('');
    } catch (error) {
      console.error('Error fetching fees:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again');
        navigate('/login');
        return;
      }
      const errorMessage = error.response?.data?.message || 'Failed to fetch fees. Please try again later.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeeHistory = async (studentId, classId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/fees/student/${studentId}/class/${classId}/fee-history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setFeeHistory(response.data.data || []);
    } catch (error) {
      console.error('Error fetching fee history:', error);
    }
  };

  const handleBack = () => {
    navigate('/parent/dashboard');
  };

  const handlePaymentClick = (fee) => {
    setSelectedFee(fee);
    setShowPaymentDialog(true);
  };

  const handleViewHistory = async (fee) => {
    setSelectedChild(fee.childName);
    await fetchFeeHistory(fee.student, fee.class._id);
    setShowFeeHistory(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!transactionId) {
      toast.error('Please enter transaction ID');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
        return;
      }

      console.log('Submitting payment:', {
        feeId: selectedFee._id,
        paymentMethod: 'online',
        transactionId
      });

      const response = await axios.post(
        `${API_URL}/api/parent/auth/pay-fee`,
        {
          feeId: selectedFee._id,
          paymentMethod: 'online',
          transactionId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || 'Payment submitted successfully. Waiting for admin approval.');
        setShowPaymentDialog(false);
        setTransactionId('');
        fetchChildFees(); // Refresh the fees list
      } else {
        throw new Error(response.data.message || 'Failed to process payment');
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit payment. Please try again.';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { label: 'PAID', className: 'status-paid', icon: <FaCheck /> },
      pending: { label: 'PENDING', className: 'status-pending', icon: <FaClock /> },
      overdue: { label: 'OVERDUE', className: 'status-overdue', icon: <FaExclamationTriangle /> },
      under_process: { label: 'UNDER PROCESS', className: 'status-under-process', icon: <FaSpinner /> },
      cancelled: { label: 'CANCELLED', className: 'status-cancelled', icon: <FaTimes /> }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`status-badge ${config.className}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const filteredFees = fees.filter(fee => {
    if (filterStatus === 'all') return true;
    return fee.status === filterStatus;
  });

  const calculateMonthlyFee = (totalAmount) => {
    // Assuming monthly fee is total amount divided by 12
    return totalAmount / 12;
  };

  return (
    <div className="pay-fee-container">
      <div className="header">
        <button className="back-button" onClick={handleBack}>
          <FaArrowLeft /> Back to Dashboard
        </button>
        <h1>Enhanced Fee Management</h1>
      </div>

      {loading ? (
        <div className="loading">
          <FaSpinner className="spinner" /> Loading fees...
        </div>
      ) : error ? (
        <div className="error">
          <FaTimes /> {error}
        </div>
      ) : fees.length === 0 ? (
        <div className="no-fees">
          <FaInfoCircle /> No fees found for your children.
        </div>
      ) : (
        <>
          <div className="filters">
            <button 
              className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              All Fees
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
              onClick={() => setFilterStatus('pending')}
            >
              Pending
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'paid' ? 'active' : ''}`}
              onClick={() => setFilterStatus('paid')}
            >
              Paid
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'under_process' ? 'active' : ''}`}
              onClick={() => setFilterStatus('under_process')}
            >
              Under Process
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'overdue' ? 'active' : ''}`}
              onClick={() => setFilterStatus('overdue')}
            >
              Overdue
            </button>
          </div>

          <div className="fees-list">
            {filteredFees.map((fee) => (
              <div key={fee._id} className="fee-card enhanced">
                <div className="fee-header">
                  <h3>Fee Payment</h3>
                  {getStatusBadge(fee.status)}
                </div>
                <div className="fee-details">
                  <div className="fee-info-section">
                    <h4><FaUserGraduate /> Basic Information</h4>
                    <p><strong>Student:</strong> {fee.childName}</p>
                    <p><strong>Class:</strong> {fee.class?.className || 'N/A'}</p>
                    <p><strong>Fee Type:</strong> {fee.feeType?.charAt(0).toUpperCase() + fee.feeType?.slice(1) || 'N/A'}</p>
                    <p><strong>Academic Year:</strong> {fee.academicYear || 'N/A'}</p>
                  </div>

                  <div className="fee-info-section">
                    <h4><FaMoneyBillWave /> Payment Details</h4>
                    <p><strong>Monthly Fee:</strong> {formatCurrency(calculateMonthlyFee(fee.totalAmount))}</p>
                    <p><strong>Total Amount:</strong> {formatCurrency(fee.totalAmount)}</p>
                    <p><strong>Due Date:</strong> {formatDate(fee.dueDate)}</p>
                    {fee.lateFeeAmount > 0 && (
                      <p className="late-fee"><strong>Late Fee:</strong> {formatCurrency(fee.lateFeeAmount)}</p>
                    )}
                  </div>

                  {fee.status === 'under_process' && (
                    <div className="fee-info-section full-width">
                      <h4><FaClock /> Payment Status</h4>
                      <p><strong>Transaction ID:</strong> {fee.transactionId}</p>
                      <p><strong>Submitted On:</strong> {formatDate(fee.paymentDate)}</p>
                    </div>
                  )}

                  {fee.status === 'cancelled' && fee.paymentApproval?.rejectionReason && (
                    <div className="fee-info-section rejection-info full-width">
                      <h4><FaExclamationTriangle /> Rejection Details</h4>
                      <p><strong>Reason:</strong> {fee.paymentApproval.rejectionReason}</p>
                      <p><strong>Rejected On:</strong> {formatDate(fee.paymentApproval.approvedAt)}</p>
                    </div>
                  )}

                  {fee.status === 'paid' && (
                    <div className="fee-info-section success-info full-width">
                      <h4><FaCheckCircle /> Payment Confirmation</h4>
                      <p><strong>Paid On:</strong> {formatDate(fee.paymentDate)}</p>
                      <p><strong>Receipt Number:</strong> {fee.receiptNumber}</p>
                    </div>
                  )}
                </div>

                <div className="fee-actions">
                  {(fee.status === 'pending' || fee.status === 'overdue' || fee.status === 'cancelled') && (
                    <button
                      className="pay-button"
                      onClick={() => handlePaymentClick(fee)}
                      disabled={submitting}
                    >
                      {submitting ? <FaSpinner className="spinner" /> : 'Pay Now'}
                    </button>
                  )}
                  <button
                    className="history-button"
                    onClick={() => handleViewHistory(fee)}
                  >
                    <FaHistory /> View History
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Payment Dialog */}
      {showPaymentDialog && selectedFee && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Make Payment</h3>
              <button 
                className="close-button"
                onClick={() => setShowPaymentDialog(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="payment-summary">
                <h4>Payment Summary</h4>
                <p><strong>Student:</strong> {selectedFee.childName}</p>
                <p><strong>Class:</strong> {selectedFee.class?.className}</p>
                <p><strong>Amount:</strong> {formatCurrency(selectedFee.totalAmount)}</p>
                <p><strong>Due Date:</strong> {formatDate(selectedFee.dueDate)}</p>
              </div>
              
              <form onSubmit={handlePaymentSubmit}>
                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                  >
                    <option value="">Select Payment Method</option>
                    <option value="online">Online Payment</option>
                    <option value="card">Credit/Debit Card</option>
                    <option value="upi">UPI</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Transaction ID</label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter transaction ID"
                    required
                  />
                </div>
                
                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => setShowPaymentDialog(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-button"
                    disabled={submitting}
                  >
                    {submitting ? <FaSpinner className="spinner" /> : 'Submit Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Fee History Dialog */}
      {showFeeHistory && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3>Fee History - {selectedChild}</h3>
              <button 
                className="close-button"
                onClick={() => setShowFeeHistory(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="fee-history">
                <h4><FaHistory /> Payment History</h4>
                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                  <select value={historyMonth} onChange={e => setHistoryMonth(e.target.value)}>
                    <option value="">All Months</option>
                    {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, idx) => (
                      <option key={m} value={idx+1}>{m}</option>
                    ))}
                  </select>
                  <select value={historyYear} onChange={e => setHistoryYear(e.target.value)}>
                    <option value="">All Years</option>
                    {Array.from(new Set((feeHistory.paymentHistory||[]).map(p=>p.year))).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                {feeHistory.paymentHistory && feeHistory.paymentHistory.length > 0 ? (
                  <div className="history-list">
                    {feeHistory.paymentHistory.filter(payment => {
                      const matchMonth = historyMonth ? String(payment.month) === String(historyMonth) : true;
                      const matchYear = historyYear ? String(payment.year) === String(historyYear) : true;
                      return matchMonth && matchYear;
                    }).map((payment, index) => (
                      <div key={index} className="history-item">
                        <div className="history-date">
                          <FaCalendarAlt />
                          {formatDate(payment.paymentDate)}
                        </div>
                        <div className="history-details">
                          <p><strong>Month:</strong> {payment.month} {payment.year}</p>
                          <p><strong>Amount:</strong> {formatCurrency(payment.amount)}</p>
                          <p><strong>Status:</strong> {payment.status}</p>
                          {payment.transactionId && (
                            <p><strong>Transaction ID:</strong> {payment.transactionId}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {feeHistory.paymentHistory.filter(payment => {
                      const matchMonth = historyMonth ? String(payment.month) === String(historyMonth) : true;
                      const matchYear = historyYear ? String(payment.year) === String(historyYear) : true;
                      return matchMonth && matchYear;
                    }).length === 0 && (
                      <p>No payment history for selected month/year</p>
                    )}
                  </div>
                ) : (
                  <p>No payment history available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default PayFee; 