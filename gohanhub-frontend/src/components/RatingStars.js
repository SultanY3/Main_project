import React, { useState } from 'react';

/**
 * RatingStars component
 * @param {number} rating - Current rating value (1-5)
 * @param {function} onRate - Function to call with new rating (if editable)
 * @param {boolean} readonly - If true, disables interaction (default: false)
 * @param {'small'|'medium'|'large'} size - Star size
 */
const RatingStars = ({
  rating = 0,
  onRate,
  readonly = false,
  size = 'medium'
}) => {
  const [hover, setHover] = useState(0);

  const sizeClasses = {
    small: 'tw-text-lg',
    medium: 'tw-text-2xl',
    large: 'tw-text-4xl',
  };
  const starClass = sizeClasses[size] || sizeClasses.medium;

  // For accessibility: allow keyboard control if not readonly
  const handleKeyDown = (idx) => (e) => {
    if (readonly) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onRate) onRate(idx + 1);
    }
  };

  return (
    <div
      className="rating-stars"
      aria-label={`Rating: ${rating} out of 5`}
      role={readonly ? "img" : "radiogroup"}
    >
      {[...Array(5)].map((_, idx) => {
        const starValue = idx + 1;
        return (
          <span
            key={idx}
            tabIndex={readonly ? -1 : 0}
            aria-label={`Rate ${starValue}`}
            className={`star ${starClass} ${starValue <= (hover || rating) ? 'filled' : ''} ${readonly ? 'readonly' : 'interactive'}`}
            style={{ cursor: readonly ? 'default' : 'pointer', color: starValue <= (hover || rating) ? '#FFC600' : '#BDBDBD' }}
            onMouseEnter={() => !readonly && setHover(starValue)}
            onMouseLeave={() => !readonly && setHover(0)}
            onClick={() => !readonly && onRate && onRate(starValue)}
            onKeyDown={handleKeyDown(idx)}
          >
            ★
          </span>
        );
      })}
    </div>
  );
};

export default RatingStars;
