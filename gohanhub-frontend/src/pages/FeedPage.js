import React, { useState, useEffect } from 'react';
import axios from '../services/api';
import RecipeCard from '../components/RecipeCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const FeedPage = () => {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFeed();
    // eslint-disable-next-line
  }, []);

  const fetchFeed = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/feed/`);
      setFeed(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (error) {
      console.error('Failed to fetch feed:', error?.response?.data || error.message);
      setError('Failed to load your feed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="feed-page page-container">
      <h2 className="section-title">Your Personalized Feed</h2>
      {feed.length === 0 ? (
        <div className="empty-list">Follow some users to see their recipes in your feed.</div>
      ) : (
        <div className="recipes-grid">
          {feed.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedPage;
