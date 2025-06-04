import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaCheckCircle, FaTimesCircle, FaInfoCircle, FaSpinner, FaClock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './ManageFeeApprovals.css';

const ManageFeeApprovals = () => {
  const [pendingFees, setPendingFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingFeeId, setProcessingFeeId] = useState(null);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_NODE_ENV === 'production'
    ? process.env.REACT_APP_PRODUCTION_URL
    : process.env.REACT_APP_DEVELOPMENT_URL || 'http://localhost:5000';

  const fetchPendingFees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Admin not authenticated. Please login.');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/api/fees/pending-approvals`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setPendingFees(response.data.fees);
      } else {
        setError(response.data.message || 'Failed to fetch pending fees.');
        toast.error(response.data.message || 'Failed to fetch pending fees.');
      }
    } catch (error) {
      console.error('Error fetching pending fees:', error);
      setError(error.response?.data?.message || 'Error fetching pending fees.');
      toast.error(error.response?.data?.message || 'Error fetching pending fees.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingFees();
  }, []);

  const handleApprovalAction = async (feeId, action) => {
    setProcessingFeeId(feeId);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Admin not authenticated.');
        setProcessingFeeId(null);
        return;
      }

      const payload = { action };
      if (action === 'reject') {
        if (!rejectionReason) {
           toast.error('Please provide a rejection reason.');
           setProcessingFeeId(null);
           return;
        }
        payload.rejectionReason = rejectionReason;
      }

      const response = await axios.post(`${API_URL}/api/fees/${feeId}/approve`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setPendingFees(pendingFees.filter(fee => fee._id !== feeId));
        setShowRejectionDialog(false);
        setRejectionReason('');

        // Dispatch event to notify other components about fee status update
        window.dispatchEvent(new Event('feeStatusUpdated'));
      } else {
        toast.error(response.data.message || 'Failed to process approval.');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error(error.response?.data?.message || 'Error processing approval.');
    } finally {
      setProcessingFeeId(null);
    }
  };

  const openRejectionDialog = (fee) => {
    setSelectedFee(fee);
    setShowRejectionDialog(true);
  };

  const closeRejectionDialog = () => {
    setSelectedFee(null);
    setRejectionReason('');
    setShowRejectionDialog(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return <div className="loading-indicator">Loading pending fee approvals...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="manage-fee-approvals-container">
      <h2>Manage Fee Approvals</h2>

      {pendingFees.length === 0 ? (
        <div className="no-approvals">
          <FaInfoCircle size={50} />
          <p>No pending fee approval requests found.</p>
        </div>
      ) : (
        <div className="approvals-list">
          {pendingFees.map((fee) => (
            <div key={fee._id} className="approval-card">
              <div className="card-header">
                <h3>Fee Payment Approval</h3>
                <span className="status-badge pending"><FaClock /> Pending</span>
              </div>
              <div className="card-details">
                <p><strong>Student:</strong> {fee.student?.studentName || 'N/A'}</p>
                <p><strong>Class:</strong> {fee.class?.className || 'N/A'}</p>
                <p><strong>Fee Type:</strong> {fee.feeType?.charAt(0).toUpperCase() + fee.feeType?.slice(1) || 'N/A'}</p>
                <p><strong>Amount:</strong> ₹{fee.totalAmount}</p>
                <p><strong>Transaction ID:</strong> {fee.transactionId || 'N/A'}</p>
                <p><strong>Submitted On:</strong> {formatDate(fee.paymentDate)}</p>
              </div>
              <div className="card-actions">
                <button 
                  className="approve-button"
                  onClick={() => handleApprovalAction(fee._id, 'approve')}
                  disabled={processingFeeId === fee._id}
                >
                  {processingFeeId === fee._id ? <FaSpinner className="spinner" /> : <FaCheckCircle />} Approve
                </button>
                <button 
                  className="reject-button"
                  onClick={() => openRejectionDialog(fee)}
                  disabled={processingFeeId === fee._id}
                >
                  {processingFeeId === fee._id ? <FaSpinner className="spinner" /> : <FaTimesCircle />} Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showRejectionDialog && (
        <div className="rejection-dialog-overlay">
          <div className="rejection-dialog-content">
            <h2>Reason for Rejection</h2>
            <textarea
              rows="4"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection"
            ></textarea>
            <div className="dialog-actions">
              <button className="cancel-button" onClick={closeRejectionDialog}>Cancel</button>
              <button 
                className="submit-reject-button"
                onClick={() => handleApprovalAction(selectedFee._id, 'reject')}
                disabled={processingFeeId === selectedFee._id || !rejectionReason.trim()}
              >
                 {processingFeeId === selectedFee._id ? <FaSpinner className="spinner" /> : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default ManageFeeApprovals; 