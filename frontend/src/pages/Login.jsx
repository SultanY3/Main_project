import { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from "../context/AuthContext"; // 1. Import Context
import { toast } from "react-toastify";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    
    const navigate = useNavigate();
    const { login } = useAuth(); // 2. Get login function

    const handleLoginSuccess = (data) => {
        // 3. Use context function instead of setting localStorage manually
        login(data);
        
        toast.success("Welcome back!");
        
        if (data.user.is_superuser) {
            navigate("/admin");
        } else {
            // Change this to "/feed" if you want them to go to their Feed instead
            navigate("/"); 
        }
    };

    // Standard Login
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Get Token
            const res = await api.post("token/", { username, password });
            
            // Get User Info (needed because token endpoint usually just gives access/refresh)
            const userRes = await api.get("user/me/", {
                headers: { Authorization: `Bearer ${res.data.access}` } 
            });
            
            // Combine data and login
            handleLoginSuccess({ 
                ...res.data, 
                user: userRes.data 
            });

        } catch (error) {
            toast.error("Invalid username or password.");
        }
    };

    // Google Login
    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await api.post("google-login/", { 
                token: credentialResponse.credential 
            });
            // Google login endpoint usually returns user data + tokens together
            handleLoginSuccess(res.data); 
        } catch (err) {
            toast.error("Google Login failed. Please try again.");
        }
    };

    return (
        <div className="container mt-5" style={{maxWidth: "400px"}}>
            <div className="card p-4 shadow">
                <h2 className="text-center mb-4">Login</h2>
                
                <div className="d-flex justify-content-center mb-3">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => toast.error("Google Login Failed")}
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
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="mb-3">
                        <input 
                            className="form-control" 
                            type="password" 
                            placeholder="Password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
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