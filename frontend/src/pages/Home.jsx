import { useState, useEffect } from "react";
import api from "../api";
import { Link, useSearchParams } from "react-router-dom";
import RecipeCard, { RecipeCardSkeleton } from "../components/RecipeCard"; // ✅ Import Skeleton

function Home() {
    const [recipes, setRecipes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true); // ✅ Added loading state
    
    // Get URL search params
    const [searchParams, setSearchParams] = useSearchParams();
    
    // This state is just for the <input> box
    const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

    useEffect(() => {
        setLoading(true); // Start loading
        
        // Run both fetches in parallel
        Promise.all([getRecipes(), getCategories()])
            .finally(() => setLoading(false)); // Stop loading when both are done

        // Sync the input box state to the URL search param
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

        // Return the promise so we can use .finally() in useEffect
        return api.get(`${url}?${params.toString()}`)
           .then((res) => setRecipes(res.data))
           .catch((err) => console.error(err));
    };

    const getCategories = () => {
        // Return the promise here too
        return api.get("categories/")
            .then((res) => setCategories(res.data))
            .catch((err) => console.error(err));
    };

    // --- HANDLERS ---
    
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
    
    const handleCategoryClick = (catName) => {
        const params = new URLSearchParams(searchParams);
        params.set("category", catName);
        setSearchParams(params);
    };

    const handleAllCategory = () => {
        const params = new URLSearchParams(searchParams);
        params.delete("category"); 
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

            {/* Recipe Grid */}
            <div className="row g-4">
                {loading ? (
                    // ✅ Show 6 Skeletons while loading
                    [...Array(6)].map((_, index) => (
                        <div className="col-lg-4 col-md-6" key={index}>
                            <RecipeCardSkeleton />
                        </div>
                    ))
                ) : (
                    // Show real recipes when loaded
                    recipes.map((recipe) => (
                        <div className="col-lg-4 col-md-6" key={recipe.id}>
                            <RecipeCard recipe={recipe} />
                        </div>
                    ))
                )}
                
                {!loading && recipes.length === 0 && (
                    <div className="col-12 text-center mt-5">
                        <h3>No recipes found.</h3>
                        <p className="text-muted">Try adjusting your search or filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
export default Home;