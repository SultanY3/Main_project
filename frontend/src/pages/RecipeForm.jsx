import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import { toast } from "react-toastify"; // 1. Import Toast

function RecipeForm() {
    const { id } = useParams(); // Get ID from URL (if in edit mode)
    const navigate = useNavigate();

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [instructions, setInstructions] = useState("");
    const [ingredients, setIngredients] = useState(""); // Managed as comma-separated string
    const [category, setCategory] = useState("");
    const [image, setImage] = useState(null);
    const [currentImageUrl, setCurrentImageUrl] = useState(null); // To show existing image in edit mode

    // Data State
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        // 1. Fetch Categories for the dropdown
        api.get("categories/")
            .then((res) => setCategories(res.data))
            .catch((err) => {
                console.error("Error loading categories:", err);
                toast.error("Failed to load categories.");
            });

        // 2. If we have an ID, we are in EDIT mode. Fetch recipe data.
        if (id) {
            api.get(`recipes/${id}/`)
                .then((res) => {
                    const data = res.data;
                    setTitle(data.title);
                    setDescription(data.description);
                    setInstructions(data.instructions);
                    setCategory(data.category); // This assumes serializer sends category ID
                    setCurrentImageUrl(data.image);
                    
                    // Convert the list of ingredients back to a string for the input field
                    if (data.ingredients_list) {
                        setIngredients(data.ingredients_list.join(", "));
                    }
                })
                .catch((err) => {
                    console.error("Error fetching recipe:", err);
                    toast.error("Could not load recipe for editing."); // Replaced alert
                    navigate("/");
                });
        }
    }, [id, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("instructions", instructions);
        formData.append("category", category);

        // Process ingredients: Split string into array and append each individually
        const ingList = ingredients.split(",").map((i) => i.trim()).filter(i => i);
        ingList.forEach((ing) => formData.append("ingredients", ing));

        // Only append image if a new file is selected
        if (image) {
            formData.append("image", image);
        }

        try {
            if (id) {
                // Update existing recipe (PUT)
                await api.put(`recipes/${id}/`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Recipe updated successfully!"); // Replaced alert
                navigate(`/recipe/${id}`); // Go back to detail view
            } else {
                // Create new recipe (POST)
                await api.post("recipes/", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Recipe added successfully!"); // Replaced alert
                navigate("/"); // Go to home
            }
        } catch (err) {
            console.error("Error saving recipe:", err);
            toast.error("Error saving recipe. Please check all fields."); // Replaced alert
        }
    };

    return (
        <div className="container mt-4 mb-5">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <h2 className="text-center mb-4">
                                {id ? "Edit Recipe" : "Add New Recipe"}
                            </h2>

                            <form onSubmit={handleSubmit}>
                                {/* Title */}
                                <div className="mb-3">
                                    <label htmlFor="title" className="form-label">Recipe Title *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g., Chocolate Chip Cookies"
                                        required
                                    />
                                </div>

                                {/* Category */}
                                <div className="mb-3">
                                    <label htmlFor="category" className="form-label">Category *</label>
                                    <select
                                        className="form-control"
                                        id="category"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        required
                                    >
                                        <option value="">Select a category</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Description */}
                                <div className="mb-3">
                                    <label htmlFor="description" className="form-label">Description</label>
                                    <textarea
                                        className="form-control"
                                        id="description"
                                        rows="3"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Brief description..."
                                    ></textarea>
                                </div>

                                {/* Ingredients */}
                                <div className="mb-3">
                                    <label htmlFor="ingredients" className="form-label">Ingredients</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="ingredients"
                                        value={ingredients}
                                        onChange={(e) => setIngredients(e.target.value)}
                                        placeholder="e.g., flour, sugar, eggs (comma separated)"
                                    />
                                    <small className="text-muted">Separate ingredients with commas</small>
                                </div>

                                {/* Instructions */}
                                <div className="mb-3">
                                    <label htmlFor="instructions" className="form-label">Instructions *</label>
                                    <textarea
                                        className="form-control"
                                        id="instructions"
                                        rows="8"
                                        value={instructions}
                                        onChange={(e) => setInstructions(e.target.value)}
                                        placeholder="Step 1: Preheat oven..."
                                        required
                                    ></textarea>
                                </div>

                                {/* Image Upload */}
                                <div className="mb-3">
                                    <label htmlFor="image" className="form-label">Recipe Image</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        id="image"
                                        accept="image/*"
                                        onChange={(e) => setImage(e.target.files[0])}
                                    />
                                    {/* Show current image if editing and no new image selected */}
                                    {id && currentImageUrl && !image && (
                                        <div className="mt-2">
                                            <p className="mb-1">Current Image:</p>
                                            <img 
                                                src={currentImageUrl} 
                                                alt="Current" 
                                                className="img-thumbnail" 
                                                style={{ maxWidth: "150px" }} 
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Buttons */}
                                <div className="d-flex justify-content-between">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary" 
                                        onClick={() => navigate(-1)}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {id ? "Update Recipe" : "Add Recipe"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RecipeForm;