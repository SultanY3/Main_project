import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../services/api';
import RecipeForm from '../components/RecipeForm';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

// axios instance is configured with baseURL
const EditRecipePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecipe();
    // eslint-disable-next-line
  }, [id]);

  const fetchRecipe = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/recipes/${id}/`);
      setRecipe(response.data);
    } catch (error) {
      console.error('Failed to fetch recipe:', error?.response?.data || error.message);
      setError('Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      await axios.put(`/recipes/${id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate(`/recipes/${id}`);
    } catch (error) {
      console.error('Failed to update recipe:', error?.response?.data || error.message);
      alert(
        error?.response?.data?.detail ||
          'Failed to update recipe. Please try again.'
      );
      throw error;
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!recipe) return <div className="edit-empty">Recipe not found.</div>;

  return (
    <div className="edit-recipe-page">
      <h2>Edit Recipe</h2>
      <RecipeForm initialData={recipe} onSubmit={handleSubmit} />
    </div>
  );
};

export default EditRecipePage;
