import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from '../services/api'; // adjust path if needed
import { googleLogout } from '@react-oauth/google';

const AuthContext = createContext();

// Helper hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set/clear axios header when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Token ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user info on startup/token change
  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      if (token) {
        try {
          const response = await axios.get('/auth/user/');
          setUser(response.data);
        } catch (error) {
          console.error('Failed to load user:', error?.response?.data || error.message);
          logout();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  // Login function (token auth)
  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login/', { email, password });
      const access = response?.data?.key;
      if (access) {
        localStorage.setItem('token', access);
        axios.defaults.headers.common['Authorization'] = `Token ${access}`;
        setToken(access);
        // Fetch user info right after login (header now set)
        try {
          const me = await axios.get('/auth/user/');
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
        error:
          error.response?.data?.detail ||
          error.response?.data?.non_field_errors?.[0] ||
          'Login failed',
      };
    }
  };

  // Registration function (token response)
  const register = async ({ username, email, password1, password2 }) => {
    try {
      const response = await axios.post('/auth/registration/', {
        username,
        email,
        password1,
        password2,
      });
      const access = response.data?.key;
      if (access) {
        localStorage.setItem('token', access);
        axios.defaults.headers.common['Authorization'] = `Token ${access}`;
        setToken(access);
        try {
          const me = await axios.get('/auth/user/');
          setUser(me?.data || null);
        } catch (e) {
          console.error('Failed to fetch user after registration:', e);
        }
        return { success: true, data: response.data };
      } else {
        return { success: false, error: 'Unexpected response from server.' };
      }
    } catch (error) {
      // Detailed error message
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
    const response = await axios.post('/auth/google/', {
      id_token: credentialResponse.credential, // Google @react-oauth/google provides an ID token (JWT)
    });
    const access = response.data?.key;
    const userData = response.data?.user;
    if (access) {
      localStorage.setItem('token', access);
      axios.defaults.headers.common['Authorization'] = `Token ${access}`;
      setToken(access);
      setUser(userData);
      return { success: true };
    } else {
      return { success: false, error: 'No authentication token received from Google' };
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Google login failed',
    };
  }
};


  // Logout
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
