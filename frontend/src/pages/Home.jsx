import { useState, useEffect } from "react";
import api from "../api";
import { Link, useSearchParams } from "react-router-dom";

function Home() {
    const [recipes, setRecipes] = useState([]);
    const [categories, setCategories] = useState([]);
    
    // Get URL search params
    const [searchParams, setSearchParams] = useSearchParams();
    
    // This state is just for the <input> box
    const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

    useEffect(() => {
        getRecipes();
        getCategories();

        setSearchInput(searchParams.get("search") || "");
        
    }, [searchParams]);

    const getRecipes = () => {
        const category = searchParams.get("category");
        const search = searchParams.get("search");

        let url = `recipes/`;
        const params = new URLSearchParams();

        if (search) {
            params.append("search", search);
        }
        if (category) {
            params.append("category", category);
        }

        api.get(`${url}?${params.toString()}`)
           .then((res) => setRecipes(res.data))
           .catch((err) => console.error(err));
    };

    const getCategories = () => {
        api.get("categories/").then((res) => setCategories(res.data));
    };

    // --- HANDLERS ---
    
    // This function updates the search param
    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams);
        if (searchInput) {
            params.set("search", searchInput);
        } else {
            params.delete("search");
        }
        setSearchParams(params);
    };
    
    // This function updates the category param
    const handleCategoryClick = (catName) => {
        const params = new URLSearchParams(searchParams);
        params.set("category", catName);
        setSearchParams(params);
    };

    // ✅ FIXED: This function now ONLY removes the category param
    const handleAllCategory = () => {
        const params = new URLSearchParams(searchParams);
        params.delete("category"); // Keep other params like 'search'
        setSearchParams(params);
    };

    return (
        <div className="container mt-4">
            {/* Search & Filter Section */}
            <form className="mb-4 d-flex gap-2" onSubmit={handleSearch}>
                <input 
                    className="form-control"
                    placeholder="Search recipes..." 
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                />
                <button className="btn btn-primary" type="submit">Search</button>
            </form>
            
            <div className="mb-4 d-flex flex-wrap gap-2">
                {/* ✅ This button now calls the corrected function */}
                <button className="btn btn-secondary" onClick={handleAllCategory}>
                    All
                </button>
                {categories.map(cat => (
                    <button 
                        key={cat.id} 
                        className="btn btn-outline-success" 
                        onClick={() => handleCategoryClick(cat.name)}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Recipe Grid (No changes) */}
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