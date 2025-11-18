import { useEffect, useState } from "react";
import api from "../api";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

function AdminRecipes() {
    const [recipes, setRecipes] = useState([]);

    useEffect(() => {
        api.get("admin-dashboard/recipes/")
           .then(res => setRecipes(res.data))
           .catch(err => {
               console.error(err);
               toast.error("Failed to load recipes.");
           });
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this recipe?")) {
            try {
                await api.delete(`recipes/${id}/`); 
                setRecipes(recipes.filter(r => r.id !== id));
                toast.success("Recipe deleted successfully.");
            } catch (err) {
                toast.error("Failed to delete recipe.");
            }
        }
    };

    return (
        <div className="container mt-4">
            <h2>Recipe Management</h2>
            <table className="table table-striped mt-3">
                {/* ✅ FIX: Use Brand Color instead of table-dark */}
                <thead className="text-white" style={{ backgroundColor: 'var(--brand-color)' }}>
                    <tr style={{ backgroundColor: 'inherit' }}>
                        <th style={{ backgroundColor: 'inherit', color: 'white' }}>Title</th>
                        <th style={{ backgroundColor: 'inherit', color: 'white' }}>Author</th>
                        <th style={{ backgroundColor: 'inherit', color: 'white' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {recipes.map(recipe => (
                        <tr key={recipe.id}>
                            <td>
                                <Link to={`/recipe/${recipe.id}`}>{recipe.title}</Link>
                            </td>
                            <td>{recipe.author.username}</td>
                            <td>
                                <button className="btn btn-danger btn-sm" 
                                        onClick={() => handleDelete(recipe.id)}>
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default AdminRecipes;