import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../services/api';

const FollowersModal = ({ userId, mode = 'followers', show, onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (show) {
      fetchUsers();
    }
    // eslint-disable-next-line
  }, [show, userId, mode]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const endpoint =
        mode === 'followers'
          ? `/users/${userId}/followers/`
          : `/users/${userId}/following/`;
      const response = await axios.get(endpoint);
      setUsers(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (error) {
      console.error(
        `Failed to fetch ${mode}:`,
        error?.response?.data || error.message
      );
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.3)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="modal-dialog" style={{ background: '#fff', padding: '2em', borderRadius: '8px', minWidth: '320px', maxHeight: '70vh', overflow: 'auto' }}>
        <h3>{mode === 'followers' ? 'Followers' : 'Following'}</h3>
        <button className="modal-close-btn" onClick={onClose} style={{
          position: 'absolute',
          top: '1.2em', right: '2em', fontSize: '1.2em', background: 'none', border: 'none', cursor: 'pointer'
        }}>✕</button>
        {loading ? (
          <div>Loading...</div>
        ) : users.length === 0 ? (
          <div>No {mode} yet.</div>
        ) : (
          <ul className="modal-user-list">
            {users.map((user) => (
              <li key={user.id}>
                <Link to={`/profile/${user.id}`}>
                  <strong>{user.username}</strong>
                  {user.first_name && ` (${user.first_name}${user.last_name ? ' ' + user.last_name : ''})`}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FollowersModal;
