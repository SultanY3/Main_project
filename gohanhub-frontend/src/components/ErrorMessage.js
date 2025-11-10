import React from 'react';

const ErrorMessage = ({ message }) => {
  if (!message) return null;
  return (
    <div
      className="error-message"
      style={{
        color: '#c00',
        background: '#fee',
        border: '1px solid #c99',
        borderRadius: '6px',
        padding: '1em',
        margin: '1em 0',
        fontWeight: 'bold',
        maxWidth: '500px',
      }}
      role="alert"
    >
      <span role="img" aria-label="Error" style={{ marginRight: '0.5em' }}>⚠️</span>
      {message}
    </div>
  );
};

export default ErrorMessage;
