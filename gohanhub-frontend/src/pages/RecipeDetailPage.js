import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../services/api';
import { useAuth } from '../context/AuthContext';
import RatingStars from '../components/RatingStars';
import CommentsSection from '../components/CommentsSection';
import FollowButton from '../components/FollowButton';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const RecipeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    fetchRecipe();
    // eslint-disable-next-line
  }, [id, isAuthenticated]);

  const fetchRecipe = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/recipes/${id}/`);
      setRecipe(response.data);
      if (isAuthenticated) {
        setIsFavorite(!!response.data.is_favorite);
        setUserRating(response.data.user_rating || 0);
      }
    } catch (error) {
      console.error('Failed to fetch recipe:', error?.response?.data || error.message);
      setError('Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (rating) => {
    if (!isAuthenticated) {
      alert('Please login to rate recipes');
      return;
    }
    try {
      await axios.post(`/recipes/${id}/rate/`, { rating });
      setUserRating(rating);
      fetchRecipe(); // Get latest avg rating
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to submit rating';
      alert(errorMessage);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      alert('Please login to favorite recipes');
      return;
    }
    setFavoriteLoading(true);
    try {
      await axios.post(`/recipes/${id}/favorite/`);
      setIsFavorite((prev) => !prev);
    } catch (error) {
      alert('Failed to update favorite status');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this recipe?')) return;
    try {
      await axios.delete(`/recipes/${id}/`);
      navigate('/');
    } catch (error) {
      alert('Failed to delete recipe');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!recipe) return <div className="recipe-empty">Recipe not found.</div>;

  const canEdit = user && recipe.author?.id === user.id;

  return (
    <div className="recipe-detail">
      <h2>{recipe.title}</h2>
      <div className="recipe-meta">
        <span>
          By{' '}
          <strong>
            {recipe.author?.username || 'Anonymous'}
          </strong>
        </span>
        {' | '}
        {recipe.category?.name && (
          <span>Category: {recipe.category.name}</span>
        )}
        {' | '}
        <span>Created: {new Date(recipe.created_at).toLocaleString()}</span>
        <br />
        {recipe.author && user && recipe.author.id !== user.id && (
          <FollowButton
            targetUserId={recipe.author.id}
            isFollowing={recipe.author?.is_following}
            onFollow={fetchRecipe}
          />
        )}
      </div>
      <div className="recipe-body">
        <p>{recipe.description}</p>
        <h4>Ingredients:</h4>
        {recipe.ingredients && recipe.ingredients.length > 0 ? (
          <ul>
            {recipe.ingredients.map((ing) => (
              <li key={ing.id}>{ing.name}</li>
            ))}
          </ul>
        ) : (
          <div>No ingredients listed.</div>
        )}
        <div className="favorite-section">
          <button
            className={`favorite-btn${isFavorite ? ' active' : ''}`}
            onClick={handleFavoriteToggle}
            disabled={favoriteLoading}
          >
            {isFavorite ? '★ Favorited' : '☆ Favorite'}
          </button>
          <span>Favorites: {recipe.favorites_count || 0}</span>
        </div>
        <div className="rating-section">
          <RatingStars
            rating={userRating}
            averageRating={recipe.average_rating}
            ratingCount={recipe.rating_count}
            onRate={handleRate}
            editable={isAuthenticated}
          />
        </div>
        <h4>Instructions:</h4>
        <p>{recipe.instructions}</p>
        {canEdit && (
          <div className="recipe-actions">
            <button className="edit-btn" onClick={() => navigate(`/edit/${recipe.id}`)}>
              Edit
            </button>
            <button className="delete-btn" onClick={handleDelete}>
              Delete
            </button>
          </div>
        )}
      </div>
      <CommentsSection recipeId={recipe.id} />
    </div>
  );
};

export default RecipeDetailPage;
