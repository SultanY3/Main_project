import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from '../services/api';
import { googleLogout } from '@react-oauth/google';

const AuthContext = createContext();

// Helper hook for easy access
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Attach token to axios on change
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Token ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load current user on startup
  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      if (token) {
        try {
          const response = await axios.get(`/auth/user/`);
          setUser(response.data);
        } catch (error) {
          console.error('Failed to load user:', error?.response?.data || error.message);
          logout();
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);


  // Login method (JWT)
  const login = async (email, password) => {
  try {
    const response = await axios.post(`/auth/login/`, { email, password });
    // Token from `key` field!
    const access = response?.data?.key;
    if (access) {
      localStorage.setItem('token', access);
      axios.defaults.headers.common['Authorization'] = `Token ${access}`;
      setToken(access);

      // Now fetch user info, now header is set
      try {
        const me = await axios.get(`/auth/user/`);
        setUser(me?.data || null);
      } catch (e) {
        console.error('Failed to fetch user after login:', e);
        logout();
      }
      return { success: true };
    } else {
      return { success: false, error: 'No authentication token received' };
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail
        || error.response?.data?.non_field_errors?.[0]
        || 'Login failed',
    };
  }
};



  // Registration method
  const register = async ({ username, email, password1, password2 }) => {
    try {
      const response = await axios.post(`/auth/registration/`, {
        username, email, password1, password2,
      });
      if (response.status === 201 || response.status === 200) {
        // Some setups may return access token directly
        const access = response.data?.access || response.data?.access_token;
        if (access) {
          localStorage.setItem('token', access);
          setToken(access);
          try {
            const me = await axios.get(`/auth/user/`);
            setUser(me?.data || null);
          } catch (e) {
            console.error('Failed to fetch user after registration:', e);
          }
        }
        return { success: true, data: response.data };
      } else {
        return { success: false, error: 'Unexpected response from server.' };
      }
    } catch (error) {
      // Better display for all possible validation errors
      const errorData = error.response?.data;
      let errorMessage = 'Registration failed';
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.username) {
          errorMessage = `Username: ${errorData.username[0]}`;
        } else if (errorData.email) {
          errorMessage = `Email: ${errorData.email[0]}`;
        } else if (errorData.password1) {
          errorMessage = `Password: ${errorData.password1[0]}`;
        } else if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors[0];
        }
      }
      return { success: false, error: errorMessage };
    }
  };

  // Google OAuth login
  const loginWithGoogle = async (credentialResponse) => {
    try {
      const response = await axios.post(`/auth/google/`, {
        token: credentialResponse.credential,
      });
      const { access, user: userData } = response.data;
      localStorage.setItem('token', access);
      setToken(access);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Google login failed',
      };
    }
  };

  // Logout (JWT + Google)
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    try {
      googleLogout();
    } catch {
      // Ignore Google logout error
    }
  };

  // Provided context
  const value = {
    user,
    token,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
