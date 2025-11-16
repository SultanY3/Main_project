import { useState, useEffect } from "react";
import api from "../api";
import { Link } from "react-router-dom";

function Home() {
    const [recipes, setRecipes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        getRecipes();
        getCategories();
    }, []);

    const getRecipes = (cat = "") => {
        let url = `recipes/`;
        if (search) url += `?search=${search}`;
        if (cat) url += url.includes('?') ? `&category=${cat}` : `?category=${cat}`;
        
        api.get(url).then((res) => setRecipes(res.data))
            .catch((err) => console.error(err));
    };

    const getCategories = () => {
        api.get("categories/").then((res) => setCategories(res.data));
    };

    return (
        <div className="container mt-4">
            {/* Search & Filter */}
            <div className="mb-4 d-flex gap-2">
                <input 
                    className="form-control"
                    placeholder="Search recipes..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button className="btn btn-primary" onClick={() => getRecipes()}>Search</button>
            </div>
            <div className="mb-4 d-flex flex-wrap gap-2">
                <button className="btn btn-secondary" onClick={() => getRecipes()}>All</button>
                {categories.map(cat => (
                    <button key={cat.id} className="btn btn-outline-success" 
                            onClick={() => getRecipes(cat.name)}>
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Recipe Grid */}
            <div className="row g-4">
                {recipes.map((recipe) => (
                    <div className="col-lg-4 col-md-6" key={recipe.id}>
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
                                    By {recipe.author.username}
                                </p>
                                
                                <p className="card-text text-secondary flex-grow-1">
                                    {recipe.description.substring(0, 80)}...
                                </p>

                                {/* ✅ NEW: Social Stats Row */}
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
                    </div>
                ))}
            </div>
        </div>
    );
}
export default Home;