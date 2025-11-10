import React from 'react';
import { useForm } from 'react-hook-form';
// Use a helper to format error objects/messages if desired
// import { parseApiError } from '../utils/errorParser';

function RecipeForm({
  initialData = {},
  onSubmit,
  submitLabel = "Submit"
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: initialData });

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit({
        // Defensive trim and fallback for required fields
        title: data.title?.trim(),
        description: data.description?.trim(),
        instructions: data.instructions?.trim(),
        category: data.category,
        // Ingredients: allow comma or line breaks
        ingredients: (data.ingredients || "")
          .split(/[,\n]+/)
          .map(s => s.trim())
          .filter(Boolean),
      });
    } catch (error) {
      // Use helper to parse errors (or fallback to string)
      alert(
        // parseApiError ? parseApiError(error)
        error?.response?.data?.detail ||
        error?.message ||
        "Submission failed."
      );
    }
  };

  return (
    <form className="recipe-form" onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="form-group">
        <label>Title:</label>
        <input
          type="text"
          {...register('title', {
            required: 'Title is required',
            minLength: { value: 3, message: 'Minimum 3 characters' },
            maxLength: { value: 100, message: 'Maximum 100 characters' },
          })}
        />
        {errors.title && <div className="error-msg">{errors.title.message}</div>}
      </div>
      <div className="form-group">
        <label>Description:</label>
        <textarea
          {...register('description', {
            required: 'Description is required'
          })}
          rows={3}
        />
        {errors.description && <div className="error-msg">{errors.description.message}</div>}
      </div>
      <div className="form-group">
        <label>Category:</label>
        <input
          type="text"
          {...register('category', {
            required: 'Category is required'
          })}
        />
        {errors.category && <div className="error-msg">{errors.category.message}</div>}
      </div>
      <div className="form-group">
        <label>Ingredients (comma or new-line separated):</label>
        <textarea
          {...register('ingredients', {
            required: 'At least one ingredient is required'
          })}
          rows={3}
        />
        {errors.ingredients && <div className="error-msg">{errors.ingredients.message}</div>}
      </div>
      <div className="form-group">
        <label>Instructions:</label>
        <textarea
          {...register('instructions', {
            required: 'Instructions are required'
          })}
          rows={5}
        />
        {errors.instructions && <div className="error-msg">{errors.instructions.message}</div>}
      </div>
      <button className="btn" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}

export default RecipeForm;
