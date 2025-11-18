import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext"; 

function Navbar() {
    const navigate = useNavigate();
    const { isAuth, user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme(); 
    const isAdmin = user?.is_superuser; 

    // Notification State
    const [notifications, setNotifications] = useState([]);
    const [showNotifs, setShowNotifs] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (isAuth && !isAdmin) { 
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 5000); 
            return () => clearInterval(interval);
        }
    }, [isAuth, isAdmin]);

    const fetchNotifications = () => {
        api.get("notifications/")
            .then(res => {
                setNotifications(res.data);
                const unread = res.data.filter(n => !n.is_read).length;
                setUnreadCount(unread);
            })
            .catch(err => console.error("Error fetching notifications"));
    };
    
    const toggleNotifications = () => {
        if (!showNotifs && unreadCount > 0) {
            api.post("notifications/read_all/")
                .then(() => {
                    setUnreadCount(0);
                    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
                });
        }
        setShowNotifs(!showNotifs);
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <nav className="navbar navbar-expand-lg shadow-sm mb-4 sticky-top">
            <div className="container">
                <Link className="navbar-brand fw-bold" style={{ color: 'var(--brand-color)' }} to={isAdmin ? "/admin" : "/"}>
                    <i className="bi bi-bowl-rice me-2"></i>GohanHub
                </Link>

                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon" style={{ filter: theme === 'dark' ? 'invert(1)' : 'none' }}></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarNav">
                    <div className="navbar-nav ms-auto align-items-center">
                        
                        {/* 🌓 THEME TOGGLE BUTTON (No Dropdown) */}
                        <button 
                            className="btn nav-link me-3" 
                            onClick={() => toggleTheme(theme === 'light' ? 'dark' : 'light')}
                            title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
                        >
                            <i 
                                className={`bi ${theme === 'light' ? 'bi-moon-stars-fill' : 'bi-sun-fill'}`} 
                                style={{ fontSize: "1.2rem" }}
                            ></i>
                        </button>

                        {isAuth ? (
                            <>
                                {isAdmin ? (
                                    <>
                                        <span className="nav-link fw-bold">Admin Mode</span>
                                        <button onClick={handleLogout} className="btn nav-link text-danger">Logout</button>
                                    </>
                                ) : (
                                    <>
                                        <Link className="nav-link fw-bold" to="/feed">Feed</Link>
                                        <Link className="nav-link" to="/add-recipe">Add Recipe</Link>
                                        <Link className="nav-link" to="/favorites">Saved</Link>
                                        <Link className="nav-link" to="/profile">
                                            {user?.username || "Profile"}
                                        </Link>

                                        {/* NOTIFICATION BELL */}
                                        <div className="nav-item dropdown position-relative mx-2">
                                            <button className="btn nav-link position-relative" onClick={toggleNotifications}>
                                                <i className={`bi ${unreadCount > 0 ? 'bi-bell-fill' : 'bi-bell'}`} style={{ fontSize: "1.2rem", color: unreadCount > 0 ? 'var(--brand-color)' : 'inherit' }}></i>
                                                {unreadCount > 0 && (
                                                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: "0.6rem" }}>
                                                        {unreadCount}
                                                    </span>
                                                )}
                                            </button>

                                            {showNotifs && (
                                                <div className="card position-absolute end-0 mt-2 shadow" style={{ width: "300px", zIndex: 1000, maxHeight: "400px", overflowY: "auto" }}>
                                                    <div className="card-header py-2">
                                                        <small className="fw-bold">Notifications</small>
                                                    </div>
                                                    <ul className="list-group list-group-flush">
                                                        {notifications.length > 0 ? (
                                                            notifications.map(n => (
                                                                <li key={n.id} className="list-group-item">
                                                                    <small className="d-block text-muted mb-1" style={{ fontSize: "0.75rem" }}>
                                                                        {new Date(n.created_at).toLocaleDateString()}
                                                                    </small>
                                                                    <span style={{ fontSize: "0.9rem" }}>{n.text}</span>
                                                                </li>
                                                            ))
                                                        ) : (
                                                            <li className="list-group-item text-center text-muted p-3">
                                                                <small>No notifications yet</small>
                                                            </li>
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>

                                        <button onClick={handleLogout} className="btn nav-link text-danger ms-2">Logout</button>
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