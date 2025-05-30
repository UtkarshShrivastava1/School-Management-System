import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './StudentNotifications.css';

const StudentNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Determine API URL based on environment
  const API_URL = process.env.REACT_APP_NODE_ENV === "production"
    ? process.env.REACT_APP_PRODUCTION_URL
    : process.env.REACT_APP_DEVELOPMENT_URL;

  // Create a memoized fetch function to avoid recreating on each render
  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const userRole = localStorage.getItem('userRole');

      if (!token || !userRole) {
        setError('Authentication token or role not found. Please log in again.');
        setLoading(false);
        return;
      }

      if (userRole !== 'student') {
        setError('Unauthorized access. Student role required.');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/api/notifications/student`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-User-Role': 'student'
        },
      });
      
      setNotifications(response.data.notifications);
      setLoading(false);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Error fetching student notifications:', err);
      
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        // Redirect to login after short delay
        setTimeout(() => {
          window.location.href = '/signin';
        }, 2000);
      } else if (err.response?.status === 403) {
        setError('You do not have permission to access this resource.');
        setTimeout(() => {
          window.location.href = '/signin';
        }, 2000);
      } else {
        setError(err.response?.data?.message || 'Error fetching notifications. Please try again.');
      }
      setLoading(false);
    }
  }, [API_URL]);

  // Set up polling when component mounts
  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Set up polling every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    setRefreshInterval(interval);

    // Cleanup on unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fetchNotifications]);

  // Add manual refresh function
  const handleRefresh = () => {
    fetchNotifications();
  };

  // Render loading state
  if (loading) {
    return (
      <div className="student-notifications">
        <div className="loading">
          <span className="loading-spinner"></span>
          Loading notifications...
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="student-notifications">
        <div className="error">
          <p>{error}</p>
          <button onClick={handleRefresh} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render notifications list
  return (
    <div className="student-notifications">
      <div className="notifications-header">
        <h2>Notifications</h2>
        <button onClick={handleRefresh} className="refresh-button">
          Refresh
        </button>
      </div>
      
      {notifications.length === 0 ? (
        <div className="no-notifications">
          <p>No notifications found.</p>
        </div>
      ) : (
        <ul className="notifications-list">
          {notifications.map((notification) => (
            <li key={notification._id} className="notification-item">
              <h3>{notification.title}</h3>
              <p className="notification-message">{notification.message}</p>
              
              {notification.file && (
                <a 
                  href={`${API_URL}/uploads/notifications/${notification.file}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="attachment-link"
                >
                  View Attachment
                </a>
              )}
              
              <div className="notification-meta">
                <span className="sender">From: {notification.creator.name}</span>
                <span className="date">
                  {new Date(notification.createdAt).toLocaleString()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StudentNotifications;