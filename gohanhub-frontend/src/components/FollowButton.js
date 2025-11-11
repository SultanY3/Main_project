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

    // Optimistic update
    const previous = isFollowing;
    const next = !previous;
    setIsFollowing(next);

    try {
      let response;
      if (previous) {
        // Unfollow: use DELETE
        response = await axios.delete(`/users/${targetUserId}/unfollow/`);
      } else {
        // Follow: use POST
        response = await axios.post(`/users/${targetUserId}/follow/`);
      }
      // Reconcile with backend response
      if (response?.data?.is_following !== undefined) {
        setIsFollowing(response.data.is_following);
      }
      if (onFollow) onFollow(); // Callback to parent (profile refresh)
    } catch (error) {
      console.error('Failed to toggle follow:', error?.response?.data || error.message);
      // Rollback optimistic update on error
      setIsFollowing(previous);
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
      className={`btn btn-follow${isFollowing ? ' is-following' : ''}`}
      onClick={handleFollowToggle}
      disabled={loading}
      aria-pressed={isFollowing}
      aria-label={isFollowing ? 'Unfollow user' : 'Follow user'}
    >
      {loading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
    </button>
  );
};

export default FollowButton;
