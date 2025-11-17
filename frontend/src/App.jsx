import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import RecipeForm from "./pages/RecipeForm";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import RecipeDetail from "./pages/RecipeDetail";
import AdminUsers from "./pages/AdminUsers";
import AdminRecipes from "./pages/AdminRecipes";
import AdminHome from "./pages/AdminHome"; 
import AdminRoute from "./components/AdminRoute";
import Favorites from "./pages/Favorites"; // This is your "Saved Recipes" page
import ForgotPassword from "./pages/ForgotPassword";
import Chatbot from "./components/Chatbot";
import Feed from "./pages/Feed";
import PublicProfile from "./pages/PublicProfile";

function ProtectedRoute({ children }) {
  const isAuth = !!localStorage.getItem("access");
  return isAuth ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/recipe/:id" element={<RecipeDetail />} />
        
        {/* ✅ NEW: Public profile route. Must be before /profile */}
        <Route path="/profile/:username" element={<PublicProfile />} />

        {/* User Protected Routes */}
        <Route path="/add-recipe" element={
          <ProtectedRoute><RecipeForm /></ProtectedRoute>
        } />
        <Route path="/edit-recipe/:id" element={
          <ProtectedRoute><RecipeForm /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />
        <Route path="/favorites" element={
          <ProtectedRoute><Favorites /></ProtectedRoute>
        } />
        
        {/* ✅ NEW: Following Feed route */}
        <Route path="/feed" element={
          <ProtectedRoute><Feed /></ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute><AdminHome /></AdminRoute>
        } />
        <Route path="/admin/users" element={
          <AdminRoute><AdminUsers /></AdminRoute>
        } />
        <Route path="/admin/recipes" element={
          <AdminRoute><AdminRecipes /></AdminRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <Chatbot />
      
    </BrowserRouter>
  );
}

export default App;