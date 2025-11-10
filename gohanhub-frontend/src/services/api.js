import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api';

// ✅ Create a dedicated Axios instance (avoid global side effects)
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Attach token dynamically before each request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// === API Groups ===

// Recipe API
export const recipeAPI = {
  getAll: (params) => api.get('/recipes/', { params }),
  getById: (id) => api.get(`/recipes/${id}/`),
  create: (data) => api.post('/recipes/', data),
  update: (id, data) => api.put(`/recipes/${id}/`, data),
  delete: (id) => api.delete(`/recipes/${id}/`),
  rate: (id, rating) => api.post(`/recipes/${id}/rate/`, { rating }),
  favorite: (id) => api.post(`/recipes/${id}/favorite/`),
  getComments: (id) => api.get(`/recipes/${id}/comments/`),
  postComment: (id, text) => api.post(`/recipes/${id}/comments/`, { text }),
};

// Category API
export const categoryAPI = {
  getAll: () => api.get('/categories/'),
  getById: (id) => api.get(`/categories/${id}/`),
};

// User/Follow API
export const userAPI = {
  getProfile: (id) => api.get(`/users/${id}/`),
  getCurrentUser: () => api.get('/auth/user/'),
  follow: (id) => api.post(`/users/${id}/follow/`),
  getFollowers: (id) => api.get(`/users/${id}/followers/`),
  getFollowing: (id) => api.get(`/users/${id}/following/`),
  getFavorites: () => api.get('/users/me/favorites/'),
};

// Feed API
export const feedAPI = {
  get: () => api.get('/feed/'),
};

// Notification API
export const notificationAPI = {
  getAll: () => api.get('/notifications/'),
  getCount: () => api.get('/notifications/count/'),
};

// Chatbot API
export const chatbotAPI = {
  sendMessage: (message) => api.post('/chatbot/', { message }),
};

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login/', { email, password }),
  register: (email, password) =>
    api.post('/auth/registration/', { email, password1: password, password2: password }),
  googleLogin: (token) => api.post('/auth/google/', { token }),
  logout: () => api.post('/auth/logout/'),
  getUser: () => api.get('/auth/user/'),
};

// ✅ Export the configured instance for internal use
export default api;
