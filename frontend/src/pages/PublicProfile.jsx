import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import RecipeCard from "../components/RecipeCard";

function PublicProfile() {
    const { username } = useParams(); // Get username from URL
    const [user, setUser] = useState(null);
    const [recipes, setRecipes] = useState([]);
    
    const userStr = localStorage.getItem("user");
    const currentUser = userStr ? JSON.parse(userStr) : null;

    useEffect(() => {
        // Fetch user details by username
        api.get(`users/${username}/`)
           .then(res => setUser(res.data))
           .catch(err => console.error("Error fetching user", err));
        
        // Fetch user's recipes by username
        api.get(`users/${username}/recipes/`)
           .then(res => setRecipes(res.data))
           .catch(err => console.error("Error fetching recipes", err));
    }, [username]); // Re-run if username in URL changes

    const handleFollowToggle = () => {
        // Note: Follow action still uses username in URL
        api.post(`users/${username}/follow/`) 
           .then(res => {
                setUser(prev => ({
                    ...prev,
                    is_following: res.data.status === 'followed',
                    followers_count: res.data.status === 'followed'
                        ? prev.followers_count + 1
                        : prev.followers_count - 1
                }));
           });
    };

    if (!user) return <div className="text-center mt-5">Loading Profile...</div>;

    // Check if this is the logged-in user's own profile
    const isSelf = currentUser && currentUser.username === user.username;

    return (
        <div className="container mt-4">
            <div className="row">
                {/* User Card */}
                <div className="col-md-4 mb-4">
                    <div className="card shadow-sm">
                        <div className="card-body text-center">
                            <h3 className="mb-1">{user.first_name} {user.last_name}</h3>
                            <p className="text-muted mb-3">@{user.username}</p>

                            <div className="d-flex justify-content-center gap-4 mb-4 border-top border-bottom py-3">
                                <div>
                                    <h5 className="mb-0 fw-bold">{recipes.length}</h5>
                                    <small className="text-muted">Recipes</small>
                                </div>
                                <div>
                                    <h5 className="mb-0 fw-bold">{user.followers_count}</h5>
                                    <small className="text-muted">Followers</small>
                                </div>
                                <div>
                                    <h5 className="mb-0 fw-bold">{user.following_count}</h5>
                                    <small className="text-muted">Following</small>
                                </div>
                            </div>
                            
                            {/* Show Follow or Edit Profile button */}
                            {isSelf ? (
                                <Link to="/profile" className="btn btn-outline-primary w-100">Edit Your Profile</Link>
                            ) : (
                                <button onClick={handleFollowToggle} className={`btn w-100 ${user.is_following ? 'btn-secondary' : 'btn-primary'}`}>
                                    {user.is_following ? 'Unfollow' : 'Follow'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recipe List */}
                <div className="col-md-8">
                    <h3 className="mb-3">{user.first_name}'s Recipes</h3>
                    <div className="row g-3">
                        {recipes.length > 0 ? (
                            recipes.map(recipe => (
                                <div className="col-md-6" key={recipe.id}>
                                    <RecipeCard recipe={recipe} />
                                </div>
                            ))
                        ) : (
                             <div className="col-12">
                                <div className="alert alert-info">This user hasn't posted any recipes yet.</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
export default PublicProfile;