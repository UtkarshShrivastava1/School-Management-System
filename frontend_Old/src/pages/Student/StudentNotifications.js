import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StudentNotifications.css';

const StudentNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found. Please log in again.');
          setLoading(false);
          return;
        }

        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/notifications/student`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-User-Role': 'student'
          },
        });
        setNotifications(response.data.notifications);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching notifications');
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="student-notifications">
      <h2>Notifications</h2>
      {notifications.length === 0 ? (
        <p>No notifications found.</p>
      ) : (
        <ul>
          {notifications.map((notification) => (
            <li key={notification._id}>
              <h3>{notification.title}</h3>
              <p>{notification.message}</p>
              {notification.file && (
                <a href={`/uploads/notifications/${notification.file}`} target="_blank" rel="noopener noreferrer">
                  View Attachment
                </a>
              )}
              <small>Sent by: {notification.creator.name} on {new Date(notification.createdAt).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StudentNotifications; 