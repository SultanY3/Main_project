import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import RecipeCard from "../components/RecipeCard";
import { useAuth } from "../context/AuthContext"; 

function PublicProfile() {
    const { username } = useParams(); 
    const [user, setUser] = useState(null);
    const [recipes, setRecipes] = useState([]);
    
    const { user: currentUser } = useAuth();

    useEffect(() => {
        api.get(`users/${username}/`)
           .then(res => setUser(res.data))
           .catch(err => console.error("Error fetching user", err));
        
        api.get(`users/${username}/recipes/`)
           .then(res => setRecipes(res.data))
           .catch(err => console.error("Error fetching recipes", err));
    }, [username]); 

    const handleFollowToggle = () => {
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

    // Check if this profile belongs to the currently logged-in user
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
                            
                            {/* Logic: 
                                1. If it's ME -> Show Edit Button
                                2. If it's NOT ME but I am logged in -> Show Follow Button
                                3. If I am a GUEST -> Show Nothing 
                            */}
                            {isSelf ? (
                                <Link to="/profile" className="btn btn-outline-primary w-100">Edit Your Profile</Link>
                            ) : currentUser ? (
                                <button onClick={handleFollowToggle} className={`btn w-100 ${user.is_following ? 'btn-secondary' : 'btn-primary'}`}>
                                    {user.is_following ? 'Unfollow' : 'Follow'}
                                </button>
                            ) : null}
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