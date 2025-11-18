import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import { ToastContainer } from 'react-toastify'; // ✅ Import Toast Container
import 'react-toastify/dist/ReactToastify.css'; // ✅ Import Toast CSS

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
import Favorites from "./pages/Favorites"; 
import ForgotPassword from "./pages/ForgotPassword";
import Chatbot from "./components/Chatbot";
import Feed from "./pages/Feed";
import PublicProfile from "./pages/PublicProfile";
import { useAuth } from "./context/AuthContext"; // ✅ Import Context for ProtectedRoute

// ✅ Updated ProtectedRoute to use Context (No more localStorage checks!)
function ProtectedRoute({ children }) {
  const { isAuth } = useAuth();
  // We allow a brief moment for auth to load, or redirect
  // For simplicity, if not auth, send to login
  return isAuth ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      {/* ✅ Add the Toaster here so it works everywhere */}
      <ToastContainer 
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored" 
      />
      
      <Navbar />
      
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/recipe/:id" element={<RecipeDetail />} />
        
        {/* Public Profile */}
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