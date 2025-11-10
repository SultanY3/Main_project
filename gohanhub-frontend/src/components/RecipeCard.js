import React from 'react';
import { Link } from 'react-router-dom';

const RecipeCard = ({ recipe }) => {
  return (
    <div className="recipe-card">
      <Link to={`/recipes/${recipe.id}`}>
        <div className="card-header">
          <h3>{recipe.title}</h3>
          {recipe.category && <span className="card-category">{recipe.category.name || recipe.category}</span>}
        </div>
        <div className="card-body">
          <p>
            {recipe.description
              ? recipe.description.substring(0, 100) + (recipe.description.length > 100 ? '...' : '')
              : 'No description provided.'}
          </p>
        </div>
      </Link>
      <div className="card-meta">
        <span className="card-author">
          By <strong>{recipe.author?.username || 'Unknown'}</strong>
        </span>
        <span className="card-date">
          {recipe.created_at ? new Date(recipe.created_at).toLocaleDateString() : ''}
        </span>
      </div>
      <div className="card-stats">
        <span title="Favorites">★ {recipe.favorites_count || 0}</span>
        <span title="Comments">💬 {recipe.comments_count || 0}</span>
        <span title="Avg Rating">⭐ {recipe.average_rating ? recipe.average_rating.toFixed(1) : '-'}</span>
      </div>
    </div>
  );
};

export default RecipeCard;
