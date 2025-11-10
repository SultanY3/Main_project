import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../services/api';

// axios instance is configured with baseURL
const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotificationCount();
    }
    // eslint-disable-next-line
  }, [isAuthenticated]);

  const fetchNotificationCount = async () => {
    try {
      const response = await axios.get(`/notifications/count/`);
      setNotificationCount(response.data.count || 0);
    } catch (error) {
      console.error(
        'Failed to fetch notification count:',
        error?.response?.data || error.message
      );
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <span role="img" aria-label="logo">🍜</span> GohanHub
      </Link>
      <ul className="navbar-links">
        <li>
          <Link to="/">Home</Link>
        </li>
        {isAuthenticated && (
          <>
            <li>
              <Link to="/feed">Feed</Link>
            </li>
            <li>
              <Link to="/favorites">Favorites</Link>
            </li>
          </>
        )}
        <li>
          <Link to="/explore">Explore</Link>
        </li>
        {isAuthenticated ? (
          <>
            <li>
              <Link to="/add">Add Recipe</Link>
            </li>
            <li>
              <Link to="/notifications" className="navbar-notification-link">
                Notifications
                {notificationCount > 0 && (
                  <span className="navbar-notification-count">{notificationCount}</span>
                )}
              </Link>
            </li>
            <li>
              <Link to="/profile">{user?.username || 'Profile'}</Link>
            </li>
            <li>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/register">Sign Up</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
