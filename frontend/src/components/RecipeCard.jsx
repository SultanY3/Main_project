import { Link } from "react-router-dom";

function RecipeCard({ recipe }) {
    return (
        <div className="card h-100 shadow-sm border-0">
            {recipe.image ? (
                <img src={recipe.image} className="card-img-top" style={{height: "200px", objectFit: "cover"}} />
            ) : (
                <div className="bg-light d-flex align-items-center justify-content-center" style={{height: "200px"}}>No Image</div>
            )}
            
            <div className="card-body d-flex flex-column">
                <h5 className="card-title text-truncate">
                    <Link to={`/recipe/${recipe.id}`} className="text-decoration-none text-dark">
                        {recipe.title}
                    </Link>
                </h5>
                <p className="card-text text-muted small">
                    {/* ✅ Link to Public Profile */}
                    By <Link to={`/profile/${recipe.author.username}`} className="text-muted fw-bold text-decoration-none">{recipe.author.username}</Link>
                </p>
                
                <p className="card-text text-secondary flex-grow-1">
                    {recipe.description.substring(0, 80)}...
                </p>

                <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                    <div className="d-flex gap-3 text-muted small">
                        <span title="Rating">
                            <i className="bi bi-star-fill text-warning"></i> {recipe.average_rating.toFixed(1)}
                        </span>
                        <span title="Likes">
                            <i className="bi bi-heart-fill text-danger"></i> {recipe.likes_count}
                        </span>
                        <span title="Comments">
                            <i className="bi bi-chat-fill text-primary"></i> {recipe.comments_count}
                        </span>
                    </div>
                    <Link to={`/recipe/${recipe.id}`} className="btn btn-sm btn-outline-primary">
                        View Recipe
                    </Link>
                </div>
            </div>
        </div>
    );
}
export default RecipeCard;