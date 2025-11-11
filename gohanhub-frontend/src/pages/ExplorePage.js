import React, { useState, useEffect } from 'react';
import axios from '../services/api';
import RecipeCard from '../components/RecipeCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

// Protects against API returning plain or paginated shapes
const extractArray = (data, key = 'results') =>
  Array.isArray(data)
    ? data
    : (data && Array.isArray(data[key]) && data[key]) || [];

const ExplorePage = () => {
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchRecipes();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchRecipes();
    // eslint-disable-next-line
  }, [selectedCategory, searchTerm]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`/categories/`);
      // Be flexible to handle array, paginated 'results', or nested 'categories'
      const arr = Array.isArray(response.data)
        ? response.data
        : (Array.isArray(response.data?.results) && response.data.results) ||
          (Array.isArray(response.data?.categories) && response.data.categories) ||
          [];
      setCategories(arr);
    } catch (error) {
      console.error('Failed to fetch categories:', error?.response?.data || error.message);
      setCategories([]);
    }
  };

  const fetchRecipes = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (selectedCategory) params.category = selectedCategory;
      if (searchTerm) params.search = searchTerm;
      const response = await axios.get(`/recipes/`, { params });
      setRecipes(extractArray(response.data));
    } catch (error) {
      console.error('Failed to fetch recipes:', error?.response?.data || error.message);
      setError('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="explore-page">
      <h2>Explore Recipes</h2>
      <form
        className="explore-filters"
        onSubmit={(e) => {
          e.preventDefault();
          fetchRecipes();
        }}
      >
        <input
          type="text"
          placeholder="Search recipes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={loading}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          disabled={loading}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn" disabled={loading}>
          Search
        </button>
      </form>
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : recipes.length === 0 ? (
        <div className="empty-list">No recipes found.</div>
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

export default ExplorePage;
