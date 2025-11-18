import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { RecipeCardSkeleton } from "../components/RecipeCard"; // 1. Import Skeleton

function Favorites() {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true); // 2. Loading State

    useEffect(() => {
        setLoading(true);
        api.get("my-favorites/")
           .then(res => setFavorites(res.data))
           .catch(err => console.error("Error fetching favorites:", err))
           .finally(() => setLoading(false));
    }, []);

    return (
        <div className="container mt-4">
            <h2 className="text-center mb-4">My Saved Recipes</h2>
            <div className="row g-4">
                {loading ? (
                     // 3. Show Skeletons
                    [...Array(4)].map((_, index) => (
                        <div className="col-md-6 col-lg-4" key={index}>
                            <RecipeCardSkeleton />
                        </div>
                    ))
                ) : favorites.length > 0 ? (
                    favorites.map(recipe => (
                        <div className="col-md-6 col-lg-4" key={recipe.id}>
                            <div className="card h-100 shadow-sm">
                                 {recipe.image ? (
                                    <img src={recipe.image} className="card-img-top" style={{height: "200px", objectFit: "cover"}} />
                                 ) : (
                                    <div className="bg-light d-flex align-items-center justify-content-center" style={{height: "200px"}}>No Image</div>
                                 )}
                                <div className="card-body">
                                    <h5 className="card-title">
                                        <Link to={`/recipe/${recipe.id}`} className="text-decoration-none text-dark">
                                            {recipe.title}
                                        </Link>
                                    </h5>
                                    <p className="text-muted small">By {recipe.author.username}</p>
                                    <Link to={`/recipe/${recipe.id}`} className="btn btn-primary btn-sm">View Recipe</Link>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-12 text-center">
                        <div className="alert alert-info">No saved recipes yet.</div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Favorites;