import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const password = watch('password', '');

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    const result = await registerUser({
      username: data.username,
      email: data.email,
      password1: data.password,
      password2: data.confirmPassword,
    });
    if (result.success) {
      navigate('/explore');
    } else {
      // Handle errors
      if (typeof result.error === 'object') {
        const errorMessages = Object.entries(result.error)
          .map(([key, value]) =>
            Array.isArray(value)
              ? `${key}: ${value.join(', ')}`
              : `${key}: ${value}`
          )
          .join('; ');
        setError(errorMessages);
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="register-page">
      <h2>Create an Account</h2>
      <form className="register-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label>Username:</label>
          <input
            type="text"
            {...register('username', {
              required: 'Username is required',
              minLength: { value: 3, message: 'Min length: 3' },
              maxLength: { value: 150, message: 'Max length: 150' },
              pattern: {
                value: /^[a-zA-Z0-9@.+_-]+$/,
                message:
                  'Only letters, numbers, and @/./+/-/_ are allowed',
              },
            })}
            disabled={loading}
          />
          {errors.username && (
            <div className="error-msg">{errors.username.message}</div>
          )}
        </div>
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^\S+@\S+\.\S+$/,
                message: 'Enter a valid email address',
              },
            })}
            disabled={loading}
          />
          {errors.email && (
            <div className="error-msg">{errors.email.message}</div>
          )}
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Min length: 8' },
            })}
            disabled={loading}
          />
          {errors.password && (
            <div className="error-msg">{errors.password.message}</div>
          )}
        </div>
        <div className="form-group">
          <label>Confirm Password:</label>
          <input
            type="password"
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) =>
                value === password || 'Passwords do not match',
            })}
            disabled={loading}
          />
          {errors.confirmPassword && (
            <div className="error-msg">{errors.confirmPassword.message}</div>
          )}
        </div>
        {error && <div className="form-error">{error}</div>}
        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <div className="register-footer">
        Already have an account? <Link to="/login">Login</Link>
      </div>
    </div>
  );
};

export default RegisterPage;
