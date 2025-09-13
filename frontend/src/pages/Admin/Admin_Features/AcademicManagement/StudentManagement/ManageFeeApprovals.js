import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaSpinner,
  FaClock,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./ManageFeeApprovals.css";

// Import from feeApi
import feeApi from "../api/feeApi";

const ManageFeeApprovals = () => {
  const [pendingFees, setPendingFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingFeeId, setProcessingFeeId] = useState(null);
  const navigate = useNavigate();

  // Fetch all pending approvals
  const fetchPendingFees = async () => {
    try {
      setLoading(true);
      const response = await feeApi.getPendingApprovals();

      if (response.success) {
        setPendingFees(response.fees || []);
      } else {
        setError(response.message || "Failed to fetch pending fees.");
        toast.error(response.message || "Failed to fetch pending fees.");
      }
    } catch (err) {
      console.error("Error fetching pending fees:", err);
      setError(err.message || "Error fetching pending fees.");
      toast.error(err.message || "Error fetching pending fees.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingFees();
  }, []);

  // Approve / Reject
  const handleApprovalAction = async (feeId, action) => {
    setProcessingFeeId(feeId);
    try {
      const payload = { action };

      if (action === "reject") {
        if (!rejectionReason.trim()) {
          toast.error("Please provide a rejection reason.");
          setProcessingFeeId(null);
          return;
        }
        payload.rejectionReason = rejectionReason.trim();
      }

      const response = await feeApi.approveOrRejectFee(feeId, payload);

      if (response.success) {
        toast.success(response.message);
        setPendingFees((prev) => prev.filter((fee) => fee._id !== feeId));
        setShowRejectionDialog(false);
        setRejectionReason("");

        // Notify other components
        window.dispatchEvent(new Event("feeStatusUpdated"));
      } else {
        toast.error(response.message || "Failed to process approval.");
      }
    } catch (err) {
      console.error("Error processing approval:", err);
      toast.error(err.message || "Error processing approval.");
    } finally {
      setProcessingFeeId(null);
    }
  };

  // Reject modal handlers
  const openRejectionDialog = (fee) => {
    setSelectedFee(fee);
    setShowRejectionDialog(true);
  };

  const closeRejectionDialog = () => {
    setSelectedFee(null);
    setRejectionReason("");
    setShowRejectionDialog(false);
  };

  // Format dates for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // -------------------------
  // Render
  // -------------------------
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
                <span className="status-badge pending">
                  <FaClock /> Pending
                </span>
              </div>
              <div className="card-details">
                <p>
                  <strong>Student:</strong>{" "}
                  {fee.student?.studentName || "N/A"}
                </p>
                <p>
                  <strong>Class:</strong> {fee.class?.className || "N/A"}
                </p>
                <p>
                  <strong>Fee Type:</strong>{" "}
                  {fee.feeType
                    ? fee.feeType.charAt(0).toUpperCase() +
                      fee.feeType.slice(1)
                    : "N/A"}
                </p>
                <p>
                  <strong>Amount:</strong> ₹{fee.totalAmount}
                </p>
                <p>
                  <strong>Transaction ID:</strong> {fee.transactionId || "N/A"}
                </p>
                <p>
                  <strong>Submitted On:</strong> {formatDate(fee.paymentDate)}
                </p>
              </div>
              <div className="card-actions">
                <button
                  className="approve-button"
                  onClick={() => handleApprovalAction(fee._id, "approve")}
                  disabled={processingFeeId === fee._id}
                >
                  {processingFeeId === fee._id ? (
                    <FaSpinner className="spinner" />
                  ) : (
                    <FaCheckCircle />
                  )}{" "}
                  Approve
                </button>
                <button
                  className="reject-button"
                  onClick={() => openRejectionDialog(fee)}
                  disabled={processingFeeId === fee._id}
                >
                  {processingFeeId === fee._id ? (
                    <FaSpinner className="spinner" />
                  ) : (
                    <FaTimesCircle />
                  )}{" "}
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
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
              <button className="cancel-button" onClick={closeRejectionDialog}>
                Cancel
              </button>
              <button
                className="submit-reject-button"
                onClick={() => handleApprovalAction(selectedFee._id, "reject")}
                disabled={
                  processingFeeId === selectedFee._id ||
                  !rejectionReason.trim()
                }
              >
                {processingFeeId === selectedFee._id ? (
                  <FaSpinner className="spinner" />
                ) : (
                  "Submit"
                )}
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
