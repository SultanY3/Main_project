import React, { useState, useEffect } from 'react';
import axios from '../services/api';
import { useAuth } from '../context/AuthContext';
import CommentForm from './CommentForm';

const CommentsSection = ({ recipeId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line
  }, [recipeId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/recipes/${recipeId}/comments/`);
      setComments(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (error) {
      console.error('Failed to fetch comments:', error?.response?.data || error.message);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  // Called after a successful comment post
  const handleCommentAdded = (newComment) => {
    if (!newComment) return;
    setComments(prev => [newComment, ...(Array.isArray(prev) ? prev : [])]);
  };

  return (
    <div className="comments-section">
      <h3>Comments</h3>
      {loading ? (
        <div>Loading comments...</div>
      ) : (
        <>
          {isAuthenticated && (
            <CommentForm recipeId={recipeId} onCommentAdded={handleCommentAdded} />
          )}
          {comments.length === 0 ? (
            <div className="comments-empty">No comments yet. Be the first to comment!</div>
          ) : (
            <ul className="comments-list">
              {comments.map((comment) => (
                <li key={comment.id} className="comment-item">
                  <div className="comment-author">
                    <strong>{comment.author?.username || 'Anonymous'}</strong>
                    {comment.created_at && (
                      <span className="comment-date">
                        {' '}
                        · {new Date(comment.created_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="comment-text">{comment.text}</div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default CommentsSection;
