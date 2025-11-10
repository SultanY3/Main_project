import React, { useState, useEffect } from 'react';
import axios from '../services/api';
import RecipeCard from '../components/RecipeCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

// Defensive array extraction helper
const extractArray = (data, key = 'results') =>
  Array.isArray(data)
    ? data
    : (data && Array.isArray(data[key]) && data[key]) || [];

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFavorites();
    // eslint-disable-next-line
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/users/me/favorites/`);
      setFavorites(extractArray(response.data));
    } catch (error) {
      console.error('Failed to fetch favorites:', error?.response?.data || error.message);
      setError('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="favorites-page">
      <h2>Your Favorite Recipes</h2>
      {favorites.length === 0 ? (
        <div className="empty-list">Start adding recipes to your favorites to see them here.</div>
      ) : (
        <div className="recipes-grid">
          {favorites.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
