import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../services/api';
import { useAuth } from '../context/AuthContext';
import RecipeCard from '../components/RecipeCard';
import FollowButton from '../components/FollowButton';
import FollowersModal from '../components/FollowersModal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const ProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser, logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  const isOwnProfile = !id || currentUser?.id === Number(id);
  const profileId = id || currentUser?.id;

  useEffect(() => {
    if (profileId) {
      fetchProfile();
      fetchUserRecipes();
    } else {
      // Avoid being stuck in loading state if profileId is not yet available
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [profileId]);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = isOwnProfile
        ? `/auth/user/`
        : `/users/${profileId}/`;
      const response = await axios.get(endpoint);
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error?.response?.data || error.message);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRecipes = async () => {
    try {
      // If using DRF filters, /recipes/?author=<id>
      const response = await axios.get(`/recipes/`, {
        params: { author: profileId }, // Use 'author' (or 'user') depending on backend param
      });
      setRecipes(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (error) {
      console.error('Failed to fetch user recipes:', error?.response?.data || error.message);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  if (!profile)
    return <div className="profile-empty">User profile not found.</div>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        {/* Avatar could be added here if present */}
        <h2>{profile.username}</h2>
        <div className="profile-meta">
          <span>{profile.email}</span>
          {profile.first_name && profile.last_name && (
            <span>
              &nbsp;| {profile.first_name} {profile.last_name}
            </span>
          )}
        </div>
        {/* Allow logout for own profile */}
        {isOwnProfile && (
          <button className="btn logout-btn" onClick={logout}>
            Logout
          </button>
        )}
        {!isOwnProfile && currentUser && profile.id !== currentUser.id && (
          <FollowButton
            targetUserId={profile.id}
            isFollowing={profile.is_following}
            onFollow={fetchProfile}
          />
        )}
        <div className="profile-stats">
          <button onClick={() => setShowFollowersModal(true)}>
            Followers: {profile.follower_count || 0}
          </button>
          <button onClick={() => setShowFollowingModal(true)}>
            Following: {profile.following_count || 0}
          </button>
          <span>Recipes: {profile.recipes_count || recipes.length}</span>
        </div>
      </div>
      <div className="profile-recipes">
        <h3>{isOwnProfile ? "Your Recipes" : `${profile.username}'s Recipes`}</h3>
        {recipes.length === 0 ? (
          <div className="empty-list">No recipes found.</div>
        ) : (
          <div className="recipes-grid">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>
      {showFollowersModal && (
        <FollowersModal
          userId={profile.id}
          mode="followers"
          onClose={() => setShowFollowersModal(false)}
        />
      )}
      {showFollowingModal && (
        <FollowersModal
          userId={profile.id}
          mode="following"
          onClose={() => setShowFollowingModal(false)}
        />
      )}
    </div>
  );
};

export default ProfilePage;
