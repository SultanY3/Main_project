import React, { useState, useRef } from 'react';
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

  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(initialData.image || '');
  const dropRef = useRef(null);

  const handleFormSubmit = async (data) => {
    try {
      // Build multipart form data for possible image upload
      const formData = new FormData();
      formData.append('title', data.title?.trim() || '');
      formData.append('description', data.description?.trim() || '');
      formData.append('instructions', data.instructions?.trim() || '');
      formData.append('category', data.category);
      const ingredients = (data.ingredients || '')
        .split(/[,\n]+/)
        .map(s => s.trim())
        .filter(Boolean);
      // Send as JSON string if backend expects array parsing
      formData.append('ingredients', JSON.stringify(ingredients));
      if (imageFile) {
        formData.append('image', imageFile);
      }
      await onSubmit(formData);
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

  const handleFile = (file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) {
      alert('Please select a JPG or PNG image.');
      return;
    }
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
  };

  const onFileInputChange = (e) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
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
        <label>Recipe Image (JPG/PNG):</label>
        <div
          ref={dropRef}
          className="image-dropzone"
          onDrop={onDrop}
          onDragOver={onDragOver}
          role="button"
          tabIndex={0}
          aria-label="Upload recipe image"
        >
          <input
            type="file"
            accept="image/png, image/jpeg"
            onChange={onFileInputChange}
          />
          <span>Drag & drop an image here, or click to select</span>
        </div>
        {imagePreviewUrl && (
          <div className="image-preview">
            <img src={imagePreviewUrl} alt="Recipe preview" />
          </div>
        )}
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
      <button className="btn btn-primary" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}

export default RecipeForm;
