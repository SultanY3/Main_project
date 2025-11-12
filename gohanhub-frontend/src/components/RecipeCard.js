import React from 'react';
import { Link } from 'react-router-dom';

const RecipeCard = ({ recipe }) => {
  const imageUrl = recipe.image || 'https://via.placeholder.com/600x400?text=Recipe+Image';
  const authorName =
    (recipe.author && (recipe.author.username || recipe.author.name)) ||
    recipe.author_username ||
    recipe.author_name ||
    'Unknown';
  const favoritesCount = recipe.favorites_count ?? recipe.favorite_count ?? recipe.likes_count ?? 0;
  const commentsCount = recipe.comment_count ?? recipe.comments_count ?? 0;
  return (
    <div className="recipe-card">
      <Link to={`/recipes/${recipe.id}`}>
        <div className="card-media">
          <img className="recipe-card-img" src={imageUrl} alt={recipe.title} />
        </div>
        <div className="card-header">
          <h3>{recipe.title}</h3>
          {recipe.category && <span className="card-category">{recipe.category.name || recipe.category}</span>}
        </div>
        <div className="card-body">
          {/* <p>
            {recipe.description
              ? recipe.description.substring(0, 100) + (recipe.description.length > 100 ? '...' : '')
              : 'No description provided.'}
          </p> */}
        </div>
      </Link>
      <div className="card-meta">
        <span className="card-author">
          By <strong>{authorName}</strong>
        </span>
        <span className="card-date">
          {recipe.created_at ? new Date(recipe.created_at).toLocaleDateString() : ''}
        </span>
      </div>
      <div className="card-stats">
        <span title="Favorites">★ {favoritesCount}</span>
        <span title="Comments">💬 {commentsCount}</span>
        <span title="Avg Rating">⭐ {recipe.average_rating ? recipe.average_rating.toFixed(1) : '-'}</span>
      </div>
    </div>
  );
};

export default RecipeCard;
