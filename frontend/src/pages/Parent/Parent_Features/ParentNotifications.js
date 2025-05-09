import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './ParentNotifications.css';

const ParentNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Determine API URL based on environment
  const API_URL = process.env.REACT_APP_NODE_ENV === "production"
    ? process.env.REACT_APP_PRODUCTION_URL
    : process.env.REACT_APP_DEVELOPMENT_URL;

  // Create a memoized fetch function
  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/api/notifications/parent`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-User-Role': 'parent'
        },
      });
      
      setNotifications(response.data.notifications);
      setLoading(false);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Error fetching parent notifications:', err);
      
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
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

  if (loading) return <div className="loading">Loading notifications...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="parent-notifications">
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

export default ParentNotifications; 