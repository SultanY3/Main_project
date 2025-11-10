import React, { useState } from 'react';
import axios from '../services/api';

// axios instance is configured with baseURL
const CommentForm = ({ recipeId, onCommentAdded }) => {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Comment cannot be empty');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const response = await axios.post(`/recipes/${recipeId}/comment/`, {
        text: text.trim(),
      });
      onCommentAdded(response.data);
      setText('');
    } catch (error) {
      console.error('Failed to post comment:', error?.response?.data || error.message);
      const errorMessage = error.response?.data?.detail || 'Failed to post comment. Please try again.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="comment-form" onSubmit={handleSubmit} style={{ margin: '1em 0' }}>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Write your comment..."
        rows={3}
        disabled={submitting}
        style={{ width: '97%', borderRadius: '6px', padding: '0.6em', resize: 'vertical' }}
      />
      {error && (
        <div style={{ color: '#c00', marginTop: '0.5em', fontWeight: 'bold' }}>
          {error}
        </div>
      )}
      <button
        type="submit"
        className="btn"
        disabled={submitting || !text.trim()}
        style={{
          marginTop: '0.8em',
          background: submitting ? '#ccc' : '#ffc600',
          color: '#333',
          padding: '0.5em 1.2em',
          fontWeight: 'bold',
          borderRadius: '5px'
        }}
      >
        {submitting ? 'Posting...' : 'Add Comment'}
      </button>
    </form>
  );
};

export default CommentForm;
