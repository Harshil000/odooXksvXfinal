import React, { useState } from "react";
import { Lock, Shield, Eye, EyeOff, ArrowLeft, Check, Mail } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { forgotPassword, resetPassword } from "../services/auth.api";
import { toast, ToastContainer } from "react-toastify";
import "../../profile/styles/changePassword.scss";

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    // Email request state
    const [email, setEmail] = useState("");
    const [requestLoading, setRequestLoading] = useState(false);

    // Password reset state
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);

    // Security requirements checks (same as ChangePassword.jsx)
    const reqLength = password.length >= 6 && password.length <= 12;
    const reqCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
    const reqSpecial = /[^A-Za-z0-9]/.test(password);
    const reqMatch = password === confirmPassword && password !== "";
    const allRequirementsMet = reqLength && reqCase && reqSpecial && reqMatch;

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;

        try {
            setRequestLoading(true);
            await forgotPassword({ email });
            toast.success("Password reset email sent successfully! Please check your inbox.");
            setEmail("");
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message || "Failed to send reset link");
        } finally {
            setRequestLoading(false);
        }
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        if (!allRequirementsMet || !token) return;

        try {
            setResetLoading(true);
            await resetPassword({ token, password });
            toast.success("Password updated successfully!");
            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message || "Failed to reset password");
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="change-password-container">
            <ToastContainer position="top-right" autoClose={3000} theme="dark" />
            <div className="change-password-card">
                {!token ? (
                    // 1. Request Reset Link form
                    <form onSubmit={handleRequestSubmit}>
                        <div style={{ textAlign: "center", marginBottom: "8px" }}>
                            <h2 style={{ color: "#ffffff", fontSize: "24px", fontWeight: "700", margin: "0 0 8px 0" }}>Forgot Password</h2>
                            <p style={{ color: "#a1a1aa", fontSize: "14px", margin: "0" }}>Enter your email to receive a password reset link.</p>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email ID</label>
                            <div className="input-wrapper">
                                <span className="input-icon-left">
                                    <Mail size={18} />
                                </span>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email address"
                                    required
                                    style={{ letterSpacing: "normal" }} // override placeholder spacing
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="reset-btn active"
                            disabled={requestLoading || !email}
                            style={{ background: "#8b5cf6", color: "#ffffff" }}
                        >
                            {requestLoading ? "Sending Link..." : "Send Reset Link"}
                        </button>

                        <div className="card-footer">
                            <Link to="/login" className="return-link">
                                <ArrowLeft size={16} />
                                <span>Return to Login</span>
                            </Link>
                        </div>
                    </form>
                ) : (
                    // 2. Reset Password form (with token)
                    <form onSubmit={handleResetSubmit}>
                        <div style={{ textAlign: "center", marginBottom: "8px" }}>
                            <h2 style={{ color: "#ffffff", fontSize: "24px", fontWeight: "700", margin: "0 0 8px 0" }}>Reset Password</h2>
                            <p style={{ color: "#a1a1aa", fontSize: "14px", margin: "0" }}>Enter your new password below.</p>
                        </div>

                        {/* New Password */}
                        <div className="form-group">
                            <label htmlFor="new-password">New Password</label>
                            <div className="input-wrapper">
                                <span className="input-icon-left">
                                    <Lock size={18} />
                                </span>
                                <input
                                    id="new-password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    className="input-icon-right"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="form-group">
                            <label htmlFor="confirm-password">Confirm Password</label>
                            <div className="input-wrapper">
                                <span className="input-icon-left">
                                    <Shield size={18} />
                                </span>
                                <input
                                    id="confirm-password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    className="input-icon-right"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    aria-label="Toggle confirm password visibility"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Security Requirements Card */}
                        <div className="requirements-card">
                            <h3>SECURITY REQUIREMENTS</h3>
                            <ul className="requirements-list">
                                <li className={reqLength ? "met" : ""}>
                                    <span className="requirement-check">
                                        {reqLength && <Check size={12} />}
                                    </span>
                                    <span>6-12 characters length</span>
                                </li>
                                <li className={reqCase ? "met" : ""}>
                                    <span className="requirement-check">
                                        {reqCase && <Check size={12} />}
                                    </span>
                                    <span>Uppercase & lowercase letters</span>
                                </li>
                                <li className={reqSpecial ? "met" : ""}>
                                    <span className="requirement-check">
                                        {reqSpecial && <Check size={12} />}
                                    </span>
                                    <span>At least one special character</span>
                                </li>
                                <li className={reqMatch ? "met" : ""}>
                                    <span className="requirement-check">
                                        {reqMatch && <Check size={12} />}
                                    </span>
                                    <span>Passwords must match</span>
                                </li>
                            </ul>
                        </div>

                        {/* Reset Password Button */}
                        <button
                            type="submit"
                            className={`reset-btn ${allRequirementsMet ? "active" : ""}`}
                            disabled={!allRequirementsMet || resetLoading}
                        >
                            {resetLoading ? "Resetting..." : "Reset Password"}
                        </button>

                        <div className="card-footer">
                            <Link to="/login" className="return-link">
                                <ArrowLeft size={16} />
                                <span>Return to Login</span>
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
