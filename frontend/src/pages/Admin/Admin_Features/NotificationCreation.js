import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './NotificationCreation.css';

const NotificationCreation = () => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    recipientGroup: 'all',
    file: null,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userRole, setUserRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine API URL based on environment
  const API_URL = process.env.REACT_APP_NODE_ENV === "production"
    ? process.env.REACT_APP_PRODUCTION_URL
    : process.env.REACT_APP_DEVELOPMENT_URL;

  useEffect(() => {
    const verifyAdminAccess = async () => {
      try {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');
        
        if (!token || !role) {
          setError('Authentication token or role not found. Please log in again.');
          return;
        }

        // Verify admin access with backend
        const response = await axios.post(
          `${API_URL}/api/admin/auth/validate`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-User-Role': 'admin'
            }
          }
        );

        if (response.status === 200) {
          setUserRole('admin');
        } else {
          setError('Only administrators can create notifications.');
        }
      } catch (err) {
        console.error('Admin verification error:', err);
        setError('Failed to verify admin access. Please log in again.');
        // Clear invalid credentials
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        // Redirect to login after short delay
        setTimeout(() => {
          window.location.href = '/signin';
        }, 2000);
      }
    };

    verifyAdminAccess();
  }, [API_URL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, file: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    // Check if user is admin
    if (userRole !== 'admin') {
      setError('Only administrators can create notifications.');
      setIsSubmitting(false);
      return;
    }

    // Get token and validate
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token not found. Please log in again.');
      setIsSubmitting(false);
      return;
    }

    // Create FormData object for file upload
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('message', formData.message);
    formDataToSend.append('recipientGroup', formData.recipientGroup);
    if (formData.file) {
      formDataToSend.append('file', formData.file);
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/notifications/send`, 
        formDataToSend, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-User-Role': 'admin'
          },
        }
      );
      
      // Clear form and show success message
      setSuccess('Notification sent successfully!');
      setFormData({ title: '', message: '', recipientGroup: 'all', file: null });
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
    } catch (err) {
      console.error('Notification submission error:', err);
      
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        // Clear credentials
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        // Redirect to login after short delay
        setTimeout(() => {
          window.location.href = '/signin';
        }, 2000);
      } else {
        setError(err.response?.data?.message || 'Error sending notification. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userRole !== 'admin') {
    return <div className="notification-creation error-container">
      <h2>Access Denied</h2>
      <div className="error">{error || 'Only administrators can create notifications.'}</div>
      <p>Please log in with an administrator account to access this feature.</p>
    </div>;
  }

  return (
    <div className="notification-creation">
      <h2>Create Notification</h2>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="message">Message:</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="recipientGroup">Recipient Group:</label>
          <select
            id="recipientGroup"
            name="recipientGroup"
            value={formData.recipientGroup}
            onChange={handleChange}
            disabled={isSubmitting}
          >
            <option value="teachers">Teachers</option>
            <option value="students">Students</option>
            <option value="parents">Parents</option>
            <option value="all">All</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="file">File (optional):</label>
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
            accept="image/*,.pdf"
            disabled={isSubmitting}
          />
        </div>
        
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send Notification'}
        </button>
      </form>
    </div>
  );
};

export default NotificationCreation;