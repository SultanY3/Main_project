import { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";

function Register() {
    const [formData, setFormData] = useState({
        username: "", email: "", password: "", first_name: "", last_name: ""
    });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post("register/", formData); // Uses the view we made earlier
            navigate("/login");
        } catch (err) {
            alert("Registration failed. Username might be taken.");
        }
    };

    return (
        <div className="container mt-5" style={{maxWidth: "500px"}}>
            <div className="card p-4">
                <h2 className="text-center">Register</h2>
                <form onSubmit={handleSubmit}>
                    <div className="row mb-3">
                        <div className="col"><input className="form-control" placeholder="First Name" onChange={e => setFormData({...formData, first_name: e.target.value})} /></div>
                        <div className="col"><input className="form-control" placeholder="Last Name" onChange={e => setFormData({...formData, last_name: e.target.value})} /></div>
                    </div>
                    <input className="form-control mb-3" placeholder="Username" onChange={e => setFormData({...formData, username: e.target.value})} required />
                    <input className="form-control mb-3" type="email" placeholder="Email" onChange={e => setFormData({...formData, email: e.target.value})} required />
                    <input className="form-control mb-3" type="password" placeholder="Password" onChange={e => setFormData({...formData, password: e.target.value})} required />
                    <button className="btn btn-success w-100">Create Account</button>
                </form>
                <p className="mt-3 text-center">Already have an account? <Link to="/login">Login</Link></p>
            </div>
        </div>
    );
}
export default Register;