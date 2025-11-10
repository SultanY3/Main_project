import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-spinner" style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', gap: '0.75em', padding: '1.5em' }}>
      <svg
        className="spinner"
        style={{ width: '2.5em', height: '2.5em' }}
        viewBox="0 0 50 50"
      >
        <circle
          className="spinner-path"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="#FFC600"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
      <div className="spinner-msg">{message}</div>
      <style>
        {`
          .spinner {
            animation: spinner-rotate 1s linear infinite;
          }
          @keyframes spinner-rotate {
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingSpinner;
