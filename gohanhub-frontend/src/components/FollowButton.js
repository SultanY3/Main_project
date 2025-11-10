import React, { useState, useEffect } from 'react';
import axios from '../services/api';
import { useAuth } from '../context/AuthContext';

// axios instance is configured with baseURL
const FollowButton = ({ targetUserId, isFollowing: initialFollowing = false, onFollow }) => {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    setIsFollowing(initialFollowing);
  }, [initialFollowing]);

  // Defensive: prevent following yourself, must be logged in
  if (!isAuthenticated || user?.id === targetUserId) {
    return null;
  }

  const handleFollowToggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      let response;
      if (isFollowing) {
        // Unfollow: use DELETE
        response = await axios.delete(`/users/${targetUserId}/unfollow/`);
      } else {
        // Follow: use POST
        response = await axios.post(`/users/${targetUserId}/follow/`);
      }
      // Prefer backend response, fallback to toggle
      if (response?.data?.is_following !== undefined) {
        setIsFollowing(response.data.is_following);
      } else {
        setIsFollowing(!isFollowing);
      }
      if (onFollow) onFollow(); // Callback to parent (profile refresh)
    } catch (error) {
      console.error('Failed to toggle follow:', error?.response?.data || error.message);
      alert(
        error?.response?.data?.detail ||
        'Failed to update follow status'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`follow-btn${isFollowing ? ' following' : ''}`}
      onClick={handleFollowToggle}
      disabled={loading}
      style={{
        padding: '0.4em 1.2em',
        borderRadius: '4px',
        background: isFollowing ? '#ffc600' : '#e0e0e0',
        color: isFollowing ? '#222' : '#444',
        cursor: loading ? 'wait' : 'pointer',
        border: 'none',
        fontWeight: 'bold'
      }}
    >
      {loading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
    </button>
  );
};

export default FollowButton;
