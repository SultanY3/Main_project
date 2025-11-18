import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // ✅ Import Context

function AdminRoute({ children }) {
    // ✅ Use context to check permissions
    const { user, isAuth } = useAuth();

    // Check if authenticated AND is a superuser
    if (isAuth && user?.is_superuser) {
        return children;
    } else {
        // Redirect unauthorized users to home
        return <Navigate to="/" replace />;
    }
}

export default AdminRoute;