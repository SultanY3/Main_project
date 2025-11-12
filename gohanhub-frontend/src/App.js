import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Chatbot from './components/Chatbot';
import './App.css';

// Pages
import HomePage from './pages/HomePage';
import FeedPage from './pages/FeedPage';
import ExplorePage from './pages/ExplorePage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import AddRecipePage from './pages/AddRecipePage';
import EditRecipePage from './pages/EditRecipePage';
import NotificationsPage from './pages/NotificationsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import FavoritesPage from './pages/FavoritesPage';

// ✅ Sub-component that waits until auth is loaded
function AppContent() {
  const { loading } = useAuth();
  if (loading) {
    // Prevents early unauthorized API calls
    return <div className="app-loading">Loading...</div>;
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/feed" element={
          <ProtectedRoute>
            <FeedPage />
          </ProtectedRoute>
        } />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/recipes/:id" element={<RecipeDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/profile/:id" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/add" element={
          <ProtectedRoute>
            <AddRecipePage />
          </ProtectedRoute>
        } />
        <Route path="/edit/:id" element={
          <ProtectedRoute>
            <EditRecipePage />
          </ProtectedRoute>
        } />
        <Route path="/favorites" element={
          <ProtectedRoute>
            <FavoritesPage />
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        } />
        <Route path="/chatbot" element={<Chatbot />} />
        {/* 404 fallback: */}
        <Route path="*" element={<div className="app-404">404 - Page not found</div>} />
      </Routes>
      {/* Floating chatbot toggle visible across the app */}
      <Chatbot />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
