import React, { useState, useEffect } from 'react';
import axios from '../services/api';
import RecipeCard from '../components/RecipeCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const HomePage = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecipes();
    // eslint-disable-next-line
  }, []);

  const fetchRecipes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/recipes/`);
      setRecipes(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (error) {
      console.error('Failed to fetch recipes:', error?.response?.data || error.message);
      setError('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="homepage page-container">
      <h2 className="section-title">Discover and share amazing recipes from around the world</h2>
      {recipes.length === 0 ? (
        <div className="empty-list">No recipes found. Be the first to add one!</div>
      ) : (
        <div className="recipes-grid">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;
