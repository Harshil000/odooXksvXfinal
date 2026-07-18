import { useForm } from "../hook/useForm"
import { Link } from "react-router"
import { ToastContainer } from 'react-toastify';
import useAuth from "../hook/useAuth"
import PasswordField from "../components/PasswordField"
import { Mail, ArrowRight } from "lucide-react"
import "../styles/login.scss"

const Login = () => {
    const { formValues, handleChange } = useForm({
        email: "",
        password: ""
    });

    const { LoginUser } = useAuth();

    const handleSubmit = (e) => {
        e.preventDefault();
        LoginUser(formValues);
    }

    return (
        <main className="login-register-page">
            <ToastContainer position="top-right" autoClose={3000} theme="dark" />
            <div className="containerCard">
                <div className="header-content">
                    <h1>Login</h1>
                    <p className="subtitle">ACCESS YOUR ACCOUNT</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <div className="label-row"><label>Email ID</label></div>
                        <div className="input-wrapper">
                            <div className="input-icon"><Mail size={16} /></div>
                            <input required onChange={handleChange} type="email" name="email" placeholder="admin@precision.com" />
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="label-row">
                            <label>Password</label>
                            <Link to="/forgot-password" className="forgot-password">Forgot Password?</Link>
                        </div>
                        <PasswordField onChange={handleChange} />
                    </div>

                    <button className="submit-button" type="submit">
                        Sign in <ArrowRight size={18} />
                    </button>
                </form>

                <div className="RedirectCard">
                    <span>Don't have an account? <Link to="/register">Register here</Link></span>
                </div>
            </div>
        </main>
    )
}

export default Login