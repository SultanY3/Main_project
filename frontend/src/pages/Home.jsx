import { useState, useEffect } from "react";
import api from "../api";
import { Link, useSearchParams } from "react-router-dom";
import RecipeCard from "../components/RecipeCard"; // Using the reusable component

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

        // ✅ FIX: Sync the input box state to the URL search param
        // This clears the box when the 'search' param is removed (e.g., clicking Home)
        setSearchInput(searchParams.get("search") || "");

    }, [searchParams]); // Re-runs whenever the URL params change

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

    // This function now ONLY removes the category param
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
                    value={searchInput} // This is now correctly synced by useEffect
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
                {recipes.map((recipe) => (
                    <div className="col-lg-4 col-md-6" key={recipe.id}>
                        {/* Use the reusable RecipeCard component */}
                        <RecipeCard recipe={recipe} />
                    </div>
                ))}
            </div>
        </div>
    );
}
export default Home;