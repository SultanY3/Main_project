import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../services/api';
import { useAuth } from '../context/AuthContext';
import RecipeCard from '../components/RecipeCard';
import FollowButton from '../components/FollowButton';
import FollowersModal from '../components/FollowersModal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import '../styles/ProfilePage.css';

const ProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser, logout, loading: authLoading, isAuthenticated } = useAuth();

  const [profile, setProfile] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  const isOwnProfile = !id || currentUser?.id === Number(id);
  const profileId = id || currentUser?.id || currentUser?.pk;

  useEffect(() => {
    if (authLoading) return; // wait until auth resolves
    if (profileId) {
      fetchProfile();
      fetchUserRecipes();
    } else {
      // If not authenticated and no route id, avoid spinner lock
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [profileId, authLoading]);


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
      const raw = Array.isArray(response.data) ? response.data : response.data.results || [];
      const filtered = profileId
        ? raw.filter((recipe) => Number(recipe.author?.id) === Number(profileId))
        : raw;
      setRecipes(filtered);
    } catch (error) {
      console.error('Failed to fetch user recipes:', error?.response?.data || error.message);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  if (!profile)
    return <div className="profile-empty">User profile not found.</div>;

  const followerTotal = profile.follower_count ?? profile.followers_count ?? 0;
  const followingTotal = profile.following_count ?? profile.followers_total ?? 0;
  const recipeTotal = recipes.length;

  return (
    <div className="profile-page page-container">
      <div className="profile-header">
        {/* Avatar could be added here if present */}
        <h2 className="section-title">{profile.username}</h2>
        <div className="profile-meta">
          <span>{profile.email}</span>
          {profile.first_name && profile.last_name && (
            <span>
              &nbsp;| {profile.first_name} {profile.last_name}
            </span>
          )}
        </div>
        {/* Allow logout for own profile */}
        {/* {isOwnProfile && (
          // <button className="btn logout-btn" onClick={logout}>
          //   Logout
          // </button>
        )} */}
        {!isOwnProfile && currentUser && profile.id !== currentUser.id && (
          <FollowButton
            targetUserId={profile.id}
            isFollowing={profile.is_following}
            onFollow={fetchProfile}
          />
        )}
        <div className="profile-stats">
          <button type="button" className="stat-pill stat-action" onClick={() => setShowFollowersModal(true)}>
            <strong>{followerTotal}</strong> Followers
          </button>
          <button type="button" className="stat-pill stat-action" onClick={() => setShowFollowingModal(true)}>
            <strong>{followingTotal}</strong> Following
          </button>
          <span className="stat-pill">
            <strong>{recipeTotal}</strong> Recipes
          </span>
        </div>
      </div>
      <div className="profile-recipes">
        <h3 className="section-title" style={{ fontSize: '1.6rem' }}>
          {isOwnProfile ? "Your Recipes" : `${profile.username}'s Recipes`}
        </h3>
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
