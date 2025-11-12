import React, { useState } from 'react';
import axios from '../services/api';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const requestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await axios.post('/auth/request-reset-otp/', { email });
      setMessage('OTP sent to your email.');
      setStep(2);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await axios.post('/auth/verify-reset-otp/', { email, otp, new_password: newPassword });
      setMessage('Password reset successful. You can now sign in with your new password.');
      setStep(3);
      setTimeout(() => {
        navigate('/login'); // <<---- Redirect after 2 seconds
      }, 2000);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page page-container" style={{ maxWidth: 480 }}>
      <h2 className="section-title">Forgot Password</h2>
      {step === 1 && (
        <form onSubmit={requestOtp} className="forgot-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          {message && <div className="form-success">{message}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={verifyOtp} className="verify-form">
          <div className="form-group">
            <label>OTP</label>
            <input
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          {message && <div className="form-success">{message}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Reset Password'}
          </button>
        </form>
      )}
      {step === 3 && (
        <div className="reset-complete">
          {message && <div className="form-success">{message}</div>}
        </div>
      )}
    </div>
  );
};

export default ForgotPasswordPage;

