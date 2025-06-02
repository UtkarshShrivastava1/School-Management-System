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
  FaCheckCircle
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

  const handleBack = () => {
    navigate('/parent/dashboard');
  };

  const handlePaymentClick = (fee) => {
    setSelectedFee(fee);
    setShowPaymentDialog(true);
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
        navigate('/login');
        return;
      }

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

      toast.success('Payment submitted successfully. Waiting for admin approval.');
      setShowPaymentDialog(false);
      setTransactionId('');
      fetchChildFees(); // Refresh the fees list
    } catch (error) {
      console.error('Error processing payment:', error);
      if (error.response?.status === 401) {
        navigate('/login');
        return;
      }
      if (error.response?.status === 403) {
        toast.error('You are not authorized to make this payment. Please contact support.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to process payment. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <span className="badge badge-success"><FaCheckCircle /> Paid</span>;
      case 'under_process':
        return <span className="badge badge-warning"><FaClock /> Under Process</span>;
      case 'cancelled':
        return <span className="badge badge-danger"><FaTimes /> Cancelled</span>;
      case 'overdue':
        return <span className="badge badge-danger"><FaExclamationTriangle /> Overdue</span>;
      default:
        return <span className="badge badge-secondary"><FaClock /> Pending</span>;
    }
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

  return (
    <div className="pay-fee-container">
      <div className="header">
        <button className="back-button" onClick={handleBack}>
          <FaArrowLeft /> Back to Dashboard
        </button>
        <h1>Pay Fees</h1>
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
          </div>

          <div className="fees-list">
            {filteredFees.map((fee) => (
              <div key={fee._id} className="fee-card">
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
                    <p><strong>Amount:</strong> {formatCurrency(fee.totalAmount)}</p>
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

                {(fee.status === 'pending' || fee.status === 'overdue' || fee.status === 'cancelled') && (
                  <button
                    className="pay-button"
                    onClick={() => handlePaymentClick(fee)}
                    disabled={submitting}
                  >
                    {submitting ? <FaSpinner className="spinner" /> : 'Pay Now'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {showPaymentDialog && (
        <div className="payment-dialog">
          <div className="payment-dialog-content">
            <h2>Submit Payment</h2>
            <form onSubmit={handlePaymentSubmit}>
              <div className="form-group">
                <label>Transaction ID:</label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter your transaction ID"
                  required
                  disabled={submitting}
                />
                <small className="help-text">
                  <FaInfoCircle /> Please enter the transaction ID from your payment gateway
                </small>
              </div>
              <div className="dialog-buttons">
                <button 
                  type="button" 
                  onClick={() => setShowPaymentDialog(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? <FaSpinner className="spinner" /> : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default PayFee; 