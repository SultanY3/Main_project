import { Link, useNavigate } from "react-router-dom";

function Navbar() {
    const navigate = useNavigate();
    const isAuth = !!localStorage.getItem("access");
    
    // Get user info to check for admin status
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const isAdmin = user && user.is_superuser;

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm mb-4">
            <div className="container">
                {/* Admin goes to /admin, User goes to / */}
                <Link className="navbar-brand" to={isAdmin ? "/admin" : "/"}>
                    GohanHub
                </Link>
                
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                </button>
                
                <div className="collapse navbar-collapse" id="navbarNav">
                    <div className="navbar-nav ms-auto">
                        {isAuth ? (
                            <>
                                {isAdmin ? (
                                    // ✅ ADMIN VIEW: Clean, just Logout
                                    <>
                                        <span className="nav-link text-success fw-bold">Admin Mode</span>
                                        <button onClick={handleLogout} className="btn nav-link text-danger">Logout</button>
                                    </>
                                ) : (
                                    // ✅ REGULAR USER VIEW: Standard Links
                                    <>
                                        <Link className="nav-link" to="/profile">Profile</Link>
                                        <Link className="nav-link" to="/favorites">Favorites</Link>
                                        <Link className="nav-link" to="/add-recipe">Add Recipe</Link>
                                        <button onClick={handleLogout} className="btn nav-link text-danger">Logout</button>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <Link className="nav-link" to="/login">Login</Link>
                                <Link className="nav-link" to="/register">Register</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;