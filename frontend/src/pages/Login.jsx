import { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(""); // ✅ Error state
    const navigate = useNavigate();

    const handleLoginSuccess = (response) => {
        // Helper to handle storage and redirect
        localStorage.setItem("access", response.data.access);
        localStorage.setItem("refresh", response.data.refresh);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        
        if (response.data.user.is_superuser) {
            navigate("/admin");
        } else {
            navigate("/");
        }
    };

    // Standard Login
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            // Get Token
            const res = await api.post("token/", { username, password });
            // Get User Info
            const userRes = await api.get("user/me/", {
                headers: { Authorization: `Bearer ${res.data.access}` } 
            });
            
            // Combine data for success handler
            handleLoginSuccess({ 
                data: { ...res.data, user: userRes.data } 
            });

        } catch (error) {
            setError("Invalid username or password.");
        }
    };

    // Google Login
    const handleGoogleSuccess = async (credentialResponse) => {
        setError("");
        try {
            const res = await api.post("google-login/", { 
                token: credentialResponse.credential 
            });
            handleLoginSuccess(res);
        } catch (err) {
            setError("Google Login failed. Please try again.");
        }
    };

    return (
        <div className="container mt-5" style={{maxWidth: "400px"}}>
            <div className="card p-4 shadow">
                <h2 className="text-center mb-4">Login</h2>
                
                {/* ✅ Inline Error Message */}
                {error && <div className="alert alert-danger py-2 text-center">{error}</div>}

                <div className="d-flex justify-content-center mb-3">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError("Google Login Failed")}
                        useOneTap
                        theme="filled_blue"
                        shape="pill"
                        text="signin_with"
                    />
                </div>

                <div className="d-flex align-items-center mb-3">
                    <hr className="flex-grow-1" />
                    <span className="mx-2 text-muted small">OR</span>
                    <hr className="flex-grow-1" />
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <input 
                            className="form-control" 
                            type="text" 
                            placeholder="Username" 
                            value={username} 
                            onChange={(e) => { setUsername(e.target.value); setError(""); }} 
                            required 
                        />
                    </div>
                    <div className="mb-3">
                        <input 
                            className="form-control" 
                            type="password" 
                            placeholder="Password" 
                            value={password} 
                            onChange={(e) => { setPassword(e.target.value); setError(""); }} 
                            required 
                        />
                        <div className="text-end mt-1">
                            <Link to="/forgot-password" style={{fontSize: "0.9rem", textDecoration: "none"}}>
                                Forgot Password?
                            </Link>
                        </div>
                    </div>
                    <button className="btn btn-primary w-100 mt-2" type="submit">
                        Login
                    </button>
                </form>
                
                <p className="text-center mt-3 mb-0">
                    Don't have an account? <Link to="/register">Register</Link>
                </p>
            </div>
        </div>
    );
}
export default Login;