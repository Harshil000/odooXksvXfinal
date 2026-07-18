import React, { useState } from "react";
import { Lock, Shield, Eye, EyeOff, ArrowLeft, Check } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { changePassword } from "../services/profile.api";
import { toast, ToastContainer } from "react-toastify";
import useAuth from "../../auth/hook/useAuth";
import "../styles/changePassword.scss";

const ChangePassword = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Security requirements checks
    const reqLength = password.length >= 6 && password.length <= 12;
    const reqCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
    const reqSpecial = /[^A-Za-z0-9]/.test(password);
    const reqMatch = password === confirmPassword && password !== "";

    const allRequirementsMet = reqLength && reqCase && reqSpecial && reqMatch;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!allRequirementsMet) return;

        try {
            setLoading(true);
            await changePassword({ password, confirmPassword });
            toast.success("Password changed successfully!");
            setTimeout(() => {
                navigate(user ? "/profile" : "/login");
            }, 1500);
        } catch (error) {
            if (Array.isArray(error?.response?.data?.errors)) {
                error.response.data.errors.forEach((err) => {
                    toast.error(err.msg);
                });
            } else {
                toast.error(error?.response?.data?.message || error?.message || "Failed to change password");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="change-password-container">
            <ToastContainer position="top-right" autoClose={3000} theme="dark" />
            <div className="change-password-card">
                <form onSubmit={handleSubmit}>
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
                        disabled={!allRequirementsMet || loading}
                    >
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>

                    <div className="card-footer">
                        <Link to={user ? "/profile" : "/login"} className="return-link">
                            <ArrowLeft size={16} />
                            <span>Return to {user ? "Profile" : "Login"}</span>
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;
