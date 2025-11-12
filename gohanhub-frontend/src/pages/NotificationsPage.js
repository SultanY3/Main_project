import React, { useEffect, useState } from 'react';
import { notificationAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import '../styles/NotificationsPage.css';

const NotificationsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await notificationAPI.getAll();
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setItems(data);
      } catch (e) {
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="notifications-page page-container">
      <h2 className="section-title">Notifications</h2>
      {items.length === 0 ? (
        <div className="empty-list">No notifications</div>
      ) : (
        <ul className="notification-list">
          {items.map((n) => (
            <li key={n.id} className="notification-item">
              <div className="notification-text">{n.message || n.text || 'Notification'}</div>
              <div className="notification-date">
                {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPage;

