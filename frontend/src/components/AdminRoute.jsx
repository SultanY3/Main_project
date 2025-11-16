import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    // Check if user exists AND is a superuser
    if (user && user.is_superuser) {
        return children;
    } else {
        // Redirect unauthorized users to home
        return <Navigate to="/" replace />;
    }
}

export default AdminRoute;