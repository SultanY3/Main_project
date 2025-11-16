import { useState, useEffect } from "react";
import api from "../api";
import { Link } from "react-router-dom";

function Profile() {
    const [recipes, setRecipes] = useState([]);
    const [user, setUser] = useState(null);
    const [editing, setEditing] = useState(false);

    // Helper state for the edit form
    const [editData, setEditData] = useState({
        first_name: "", last_name: "", email: ""
    });

    useEffect(() => {
        // 1. Fetch User Details (includes follower counts now)
        api.get("user/me/").then(res => {
            setUser(res.data);
            setEditData({
                first_name: res.data.first_name,
                last_name: res.data.last_name,
                email: res.data.email
            });
        });
        
        // 2. Fetch My Recipes
        api.get("recipes/mine/").then(res => setRecipes(res.data));
    }, []);

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put("user/me/", editData);
            setUser(res.data); // Update local display
            alert("Profile updated!");
            setEditing(false);
        } catch (err) {
            alert("Error updating profile.");
        }
    };

    const handleDeleteRecipe = (id) => {
        if(window.confirm("Delete this recipe?")) {
            api.delete(`recipes/${id}/`).then(() => {
                setRecipes(recipes.filter(r => r.id !== id));
            });
        }
    };

    if (!user) return <div className="text-center mt-5">Loading Profile...</div>;

    return (
        <div className="container mt-4">
            <div className="row">
                {/* LEFT: User Details Card */}
                <div className="col-md-4 mb-4">
                    <div className="card shadow-sm">
                        <div className="card-body text-center">
                            <h3 className="mb-1">{user.first_name} {user.last_name}</h3>
                            <p className="text-muted mb-3">@{user.username}</p>

                            {/* ✅ NEW: Social Stats Row */}
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
                            
                            {!editing ? (
                                <div>
                                    <p><strong>Email:</strong> {user.email}</p>
                                    <button onClick={() => setEditing(true)} className="btn btn-outline-primary w-100">
                                        Edit Profile
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleUpdateUser} className="text-start">
                                    <div className="mb-2">
                                        <label>First Name</label>
                                        <input className="form-control" value={editData.first_name} 
                                            onChange={e => setEditData({...editData, first_name: e.target.value})} />
                                    </div>
                                    <div className="mb-2">
                                        <label>Last Name</label>
                                        <input className="form-control" value={editData.last_name} 
                                            onChange={e => setEditData({...editData, last_name: e.target.value})} />
                                    </div>
                                    <div className="mb-2">
                                        <label>Email</label>
                                        <input className="form-control" value={editData.email} 
                                            onChange={e => setEditData({...editData, email: e.target.value})} />
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button type="submit" className="btn btn-success flex-grow-1">Save</button>
                                        <button type="button" onClick={() => setEditing(false)} className="btn btn-secondary">Cancel</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT: My Recipes List */}
                <div className="col-md-8">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h3>My Recipes</h3>
                        <Link to="/add-recipe" className="btn btn-primary">+ New Recipe</Link>
                    </div>
                    
                    {recipes.length === 0 && <div className="alert alert-info">No recipes yet.</div>}

                    <div className="row g-3">
                        {recipes.map(recipe => (
                            <div className="col-md-6" key={recipe.id}>
                                <div className="card h-100">
                                     {recipe.image ? (
                                        <img src={recipe.image} className="card-img-top" style={{height: "150px", objectFit: "cover"}} />
                                     ) : (
                                        <div className="bg-light d-flex align-items-center justify-content-center" style={{height: "150px"}}>No Image</div>
                                     )}
                                    <div className="card-body">
                                        <h5 className="card-title text-truncate">{recipe.title}</h5>
                                        
                                        {/* ✅ NEW: Card Stats (Stars, Likes, Comments) */}
                                        <div className="d-flex gap-3 text-muted small mb-3">
                                            <span><i className="bi bi-star-fill text-warning"></i> {recipe.average_rating.toFixed(1)}</span>
                                            <span><i className="bi bi-heart-fill text-danger"></i> {recipe.likes_count}</span>
                                            <span><i className="bi bi-chat-fill text-primary"></i> {recipe.comments_count}</span>
                                        </div>

                                        <div className="d-flex gap-2">
                                            <Link to={`/recipe/${recipe.id}`} className="btn btn-info btn-sm text-white">View</Link>
                                            <Link to={`/edit-recipe/${recipe.id}`} className="btn btn-warning btn-sm">Edit</Link>
                                            <button onClick={() => handleDeleteRecipe(recipe.id)} className="btn btn-danger btn-sm">Delete</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
export default Profile;