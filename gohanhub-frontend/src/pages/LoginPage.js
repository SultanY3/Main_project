import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    const result = await login(data.email, data.password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Login failed.');
    }
    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    const result = await loginWithGoogle(credentialResponse);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Google login failed.');
    }
    setLoading(false);
  };

  const handleGoogleError = () => {
    setError('Google login failed. Please try again.');
  };

  return (
    <div className="login-page">
      <h2>Sign In</h2>
      <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
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
            {...register('password', { required: 'Password is required' })}
            disabled={loading}
          />
          {errors.password && (
            <div className="error-msg">{errors.password.message}</div>
          )}
        </div>
        {error && <div className="form-error">{error}</div>}
        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      <div className="google-login-wrapper" style={{ margin: "1em 0" }}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          width={256}
        />
      </div>
      <div className="login-footer">
        Don't have an account?{' '}
        <Link to="/register">Sign up</Link>
      </div>
    </div>
  );
};

export default LoginPage;
