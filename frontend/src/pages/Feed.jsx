import { useState, useEffect } from "react";
import api from "../api";
import RecipeCard from "../components/RecipeCard";
import { Link } from "react-router-dom";

function Feed() {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("recipes/feed/")
           .then(res => setRecipes(res.data))
           .catch(err => console.error(err))
           .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-center mt-5">Loading your feed...</div>;

    return (
        <div className="container mt-4">
            <h2 className="mb-4">Your Feed</h2>
            <p className="text-muted">New recipes from authors you follow.</p>
            <hr />
            <div className="row g-4">
                {recipes.length > 0 ? (
                    recipes.map((recipe) => (
                        <div className="col-lg-4 col-md-6" key={recipe.id}>
                            <RecipeCard recipe={recipe} />
                        </div>
                    ))
                ) : (
                    <div className="col-12">
                        <div className="alert alert-info">
                            Your feed is empty. <Link to="/">Explore recipes</Link> and follow authors to see their latest creations here.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
export default Feed;