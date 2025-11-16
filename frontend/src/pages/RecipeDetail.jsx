import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api";

// --- Helper Components for Stars ---

// 1. Component to DISPLAY stars
const DisplayStars = ({ rating }) => {
    const totalStars = 5;
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = totalStars - fullStars - halfStar;

    return (
        <div className="d-flex align-items-center" style={{ color: "#fdcc0d" }}>
            {[...Array(fullStars)].map((_, i) => (
                <i className="bi bi-star-fill" key={`full-${i}`}></i>
            ))}
            {halfStar > 0 && <i className="bi bi-star-half"></i>}
            {[...Array(emptyStars)].map((_, i) => (
                <i className="bi bi-star" key={`empty-${i}`}></i>
            ))}
            <span className="text-muted ms-2">({rating.toFixed(1)})</span>
        </div>
    );
};

// 2. Component for star RATING INPUT
const RatingInput = ({ currentRating, onRatingSubmit }) => {
    const [hoverRating, setHoverRating] = useState(0);
    const [selectedRating, setSelectedRating] = useState(currentRating);

    const handleRating = (rating) => {
        setSelectedRating(rating);
        onRatingSubmit(rating);
    };

    return (
        <div className="d-flex align-items-center" style={{ fontSize: "1.5rem" }}>
            {[...Array(5)].map((_, i) => {
                const ratingValue = i + 1;
                return (
                    <i 
                        key={ratingValue}
                        className={`bi ${ratingValue <= (hoverRating || selectedRating) ? 'bi-star-fill text-warning' : 'bi-star text-muted'}`}
                        style={{ cursor: "pointer" }}
                        onMouseEnter={() => setHoverRating(ratingValue)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => handleRating(ratingValue)}
                    ></i>
                );
            })}
        </div>
    );
};

// --- Main Recipe Detail Component ---

function RecipeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [recipe, setRecipe] = useState(null);
    const [isFav, setIsFav] = useState(false);
    const [newComment, setNewComment] = useState(""); 
    
    const userStr = localStorage.getItem("user");
    const currentUser = userStr ? JSON.parse(userStr) : null;

    const fetchRecipe = () => {
        api.get(`recipes/${id}/`)
           .then(res => {
                setRecipe(res.data);
                setIsFav(res.data.is_favorite);
           })
           .catch(err => console.error("Error fetching recipe:", err));
    };

    useEffect(() => {
        fetchRecipe();
    }, [id]);

    const toggleFav = () => {
        api.post(`recipes/${id}/favorite/`).then(res => {
            setIsFav(res.data.status === 'added');
        });
    };

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this recipe?")) {
            await api.delete(`recipes/${id}/`);
            alert("Recipe deleted!");
            navigate("/");
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return; 

        try {
            await api.post(`recipes/${id}/comment/`, { text: newComment });
            setNewComment(""); 
            fetchRecipe(); 
        } catch (err) {
            alert("Error posting comment.");
        }
    };

    const handleRatingSubmit = async (score) => {
        try {
            await api.post(`recipes/${id}/rate/`, { score: score });
            alert("Thanks for rating!");
            fetchRecipe(); 
        } catch (err) {
            alert("Error submitting rating.");
        }
    };

    // ✅ --- NEW FOLLOW HANDLER (NO POPUP) ---
    const handleFollowToggle = () => {
        api.post(`users/${recipe.author.id}/follow/`)
           .then(res => {
                // Update the recipe state locally
                setRecipe(prevRecipe => ({
                    ...prevRecipe,
                    author: {
                        ...prevRecipe.author,
                        is_following: res.data.status === 'followed',
                        // Update follower count based on response
                        followers_count: res.data.status === 'followed'
                            ? prevRecipe.author.followers_count + 1
                            : prevRecipe.author.followers_count - 1
                    }
                }));
           })
           .catch(err => alert("Error following user"));
    };

    if (!recipe) return <div>Loading...</div>;

    const isOwnerOrAdmin = currentUser && (
        currentUser.username === recipe.author.username || currentUser.is_superuser
    );

    return (
        <div className="container mt-4">
            <div className="row">
                <div className="col-lg-10 mx-auto">
                    {/* --- HEADER --- */}
                    <h1 className="mb-2">{recipe.title}</h1>
                    
                    <div className="d-flex align-items-center mb-3">
                        <p className="text-muted mb-0 me-3">
                            By <span className="fw-bold text-dark">{recipe.author.username}</span>
                        </p>
                        
                        {/* ✅ UPDATED FOLLOW BUTTON */}
                        {currentUser && currentUser.username !== recipe.author.username && (
                            <button 
                                onClick={handleFollowToggle} // Use the new handler
                                className={`btn btn-sm ${recipe.author.is_following ? 'btn-secondary' : 'btn-primary'}`}
                            >
                                {recipe.author.is_following ? 'Unfollow' : 'Follow'}
                            </button>
                        )}
                    </div>
                    
                    {/* --- STAR RATING DISPLAY --- */}
                    <div className="mb-3 d-flex align-items-center gap-2">
                        <DisplayStars rating={recipe.average_rating} />
                        <span className="text-muted">({recipe.rating_count} ratings)</span>
                    </div>

                    {recipe.image && (
                        <img 
                            src={recipe.image} 
                            className="w-100 rounded mb-4 shadow-sm" 
                            style={{ objectFit: "cover", maxHeight: "450px" }} 
                            alt={recipe.title}
                        />
                    )}
                    
                    {/* --- ACTION BUTTONS --- */}
                    <div className="mb-4 d-flex gap-2">
                        <button 
                            onClick={toggleFav} 
                            className={`btn ${isFav ? 'btn-danger' : 'btn-outline-danger'}`}
                        >
                            {isFav ? '♥ Remove Favorite' : '♡ Add to Favorites'}
                        </button>

                        {isOwnerOrAdmin && (
                            <>
                                <Link to={`/edit-recipe/${recipe.id}`} className="btn btn-primary">Edit</Link>
                                <button onClick={handleDelete} className="btn btn-danger">Delete</button>
                            </>
                        )}
                    </div>

                    {/* --- DESCRIPTION & INGREDIENTS --- */}
                    <p className="lead text-muted mb-4">{recipe.description}</p>
                    <div className="row mt-4">
                        <div className="col-md-5 mb-4">
                            <div className="bg-light p-4 rounded h-100">
                                <h4 className="mb-3">Ingredients</h4>
                                <ul className="list-unstyled">
                                    {recipe.ingredients_list?.map((ing, i) => (
                                        <li key={i} className="mb-2 border-bottom pb-2">• {ing}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="col-md-7">
                            <div className="p-2">
                                <h4 className="mb-3">Instructions</h4>
                                <p style={{whiteSpace: "pre-line", lineHeight: "1.8"}}>{recipe.instructions}</p>
                            </div>
                        </div>
                    </div>

                    <hr className="my-5" />

                    {/* --- RATINGS & COMMENTS SECTION --- */}
                    <div className="row">
                        <div className="col-md-6 mb-4">
                            <h4>Rate this Recipe</h4>
                            <p>Share your thoughts with other chefs.</p>
                            <RatingInput currentRating={0} onRatingSubmit={handleRatingSubmit} />
                        </div>
                        <div className="col-md-6 mb-4">
                            <h4>Leave a Comment</h4>
                            <form onSubmit={handleCommentSubmit}>
                                <div className="mb-3">
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        placeholder="Write your comment..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                    ></textarea>
                                </div>
                                <button type="submit" className="btn btn-success">Post Comment</button>
                            </form>
                        </div>
                    </div>

                    {/* --- COMMENT LIST --- */}
                    <div className="mt-5">
                        <h3 className="mb-4">Comments ({recipe.comments.length})</h3>
                        {recipe.comments.length > 0 ? (
                            recipe.comments.map(comment => (
                                <div className="card mb-3" key={comment.id}>
                                    <div className="card-body">
                                        <h6 className="card-title text-primary">{comment.user}</h6>
                                        <p className="card-text">{comment.text}</p>
                                        <small className="text-muted">
                                            {new Date(comment.created_at).toLocaleString()}
                                        </small>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>Be the first to comment on this recipe!</p>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
export default RecipeDetail;