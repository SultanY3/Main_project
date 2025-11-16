import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // 1. Get Token
            const res = await api.post("token/", { username, password });
            localStorage.setItem("access", res.data.access);
            localStorage.setItem("refresh", res.data.refresh);

            // 2. Fetch User Details to check role
            const userRes = await api.get("user/me/");
            const user = userRes.data;
            localStorage.setItem("user", JSON.stringify(user));

            // 3. Redirect based on role
            if (user.is_superuser) {
                navigate("/admin");
            } else {
                navigate("/");
            }
        } catch (error) {
            alert("Invalid credentials");
        }
    };

    return (
        <div className="container mt-5" style={{maxWidth: "400px"}}>
            <div className="card p-4 shadow">
                <h2 className="text-center">Login</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <input className="form-control" type="text" placeholder="Username" 
                               value={username} onChange={(e) => setUsername(e.target.value)} required />
                    </div>
                    <div className="mb-3">
                        <input className="form-control" type="password" placeholder="Password" 
                               value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <button className="btn btn-primary w-100" type="submit">Login</button>
                </form>
            </div>
        </div>
    );
}
export default Login;