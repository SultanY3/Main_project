import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function ForgotPassword() {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(""); // ✅ State for errors
    const navigate = useNavigate();

    // Helper to reset error when user types
    const clearError = () => setError("");

    // Step 1: Send OTP
    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await api.post("forgot-password/", { email });
            setStep(2); // ✅ Move to next step silently
        } catch (err) {
            setError("Could not send OTP. Please check the email.");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await api.post("verify-otp/", { email, otp });
            setStep(3); // ✅ Move to next step silently
        } catch (err) {
            setError("Invalid or expired OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await api.post("reset-password/", { email, otp, new_password: newPassword });
            navigate("/login"); // ✅ Redirect silently
        } catch (err) {
            setError("Failed to reset password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5" style={{maxWidth: "450px"}}>
            <div className="card p-4 shadow">
                <h3 className="text-center mb-4">
                    {step === 1 && "Forgot Password"}
                    {step === 2 && "Enter OTP"}
                    {step === 3 && "Reset Password"}
                </h3>

                {/* ✅ Inline Error Message */}
                {error && <div className="alert alert-danger py-2">{error}</div>}

                {/* --- STEP 1: EMAIL FORM --- */}
                {step === 1 && (
                    <form onSubmit={handleRequestOTP}>
                        <div className="mb-3">
                            <label className="form-label">Enter your email address</label>
                            <input 
                                type="email" 
                                className="form-control" 
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); clearError(); }}
                                required 
                                placeholder="e.g. john@example.com"
                            />
                        </div>
                        <button className="btn btn-primary w-100" disabled={loading}>
                            {loading ? "Sending..." : "Send OTP"}
                        </button>
                    </form>
                )}

                {/* --- STEP 2: OTP FORM --- */}
                {step === 2 && (
                    <form onSubmit={handleVerifyOTP}>
                        <div className="mb-3">
                            <label className="form-label">Enter the 6-digit code sent to {email}</label>
                            <input 
                                type="text" 
                                className="form-control text-center" 
                                value={otp}
                                onChange={(e) => { setOtp(e.target.value); clearError(); }}
                                required 
                                placeholder="123456"
                                maxLength="6"
                                style={{ letterSpacing: "5px", fontSize: "1.2rem" }}
                            />
                        </div>
                        <button className="btn btn-primary w-100" disabled={loading}>
                            {loading ? "Verifying..." : "Verify OTP"}
                        </button>
                        <div className="text-center mt-3">
                            <button type="button" className="btn btn-link btn-sm" onClick={() => {setStep(1); setError("");}}>
                                Wrong email?
                            </button>
                        </div>
                    </form>
                )}

                {/* --- STEP 3: NEW PASSWORD FORM --- */}
                {step === 3 && (
                    <form onSubmit={handleResetPassword}>
                        <div className="mb-3">
                            <label className="form-label">Enter New Password</label>
                            <input 
                                type="password" 
                                className="form-control" 
                                value={newPassword}
                                onChange={(e) => { setNewPassword(e.target.value); clearError(); }}
                                required 
                                placeholder="Minimum 6 characters"
                                minLength="6"
                            />
                        </div>
                        <button className="btn btn-success w-100" disabled={loading}>
                            {loading ? "Resetting..." : "Reset Password"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default ForgotPassword;