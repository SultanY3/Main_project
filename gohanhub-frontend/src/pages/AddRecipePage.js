import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../services/api';
import RecipeForm from '../components/RecipeForm';

// axios instance is configured with baseURL
const AddRecipePage = () => {
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    try {
      const response = await axios.post(`/recipes/`, formData);
      navigate(`/recipes/${response.data.id}`);
    } catch (error) {
      console.error(
        'Failed to create recipe:',
        error?.response?.data || error.message
      );
      alert(
        error?.response?.data?.detail ||
          'Failed to create recipe. Please try again.'
      );
      throw error;
    }
  };

  return (
    <div className="add-recipe-page">
      <h2>Add a New Recipe</h2>
      <RecipeForm onSubmit={handleSubmit} />
    </div>
  );
};

export default AddRecipePage;
