import { useForm } from "../hook/useForm"
import useAuth from "../hook/useAuth"
import { Link, useNavigate } from "react-router"
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'
import PasswordField from "../components/PasswordField"
import { Mail, ArrowRight } from "lucide-react"
import "../styles/login.scss"

const Register = () => {
    const navigate = useNavigate();
    const { formValues, handleChange } = useForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
    });

    const { RegisterUser } = useAuth();

    const handleSubmit = (e) => {
        e.preventDefault();
        // Assume context deals with specific fields.
        RegisterUser(formValues);
    }

    return (
        <main className="login-register-page">
            <ToastContainer position="top-right" autoClose={3000} theme="dark" />
            <div className="containerCard">
                <div className="header-content">
                    <h1>Create Account</h1>
                    <p className="subtitle">JOIN OUR PREMIUM ECOSYSTEM</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                            <div className="label-row"><label>First Name</label></div>
                            <div className="input-wrapper no-icon">
                                <input required onChange={handleChange} type="text" name="firstName" placeholder="John" />
                            </div>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <div className="label-row"><label>Last Name</label></div>
                            <div className="input-wrapper no-icon">
                                <input required onChange={handleChange} type="text" name="lastName" placeholder="Doe" />
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="label-row"><label>Email ID</label></div>
                        <div className="input-wrapper">
                            <div className="input-icon"><Mail size={16} /></div>
                            <input onChange={handleChange} required type="email" name="email" placeholder="j.doe@precision.com" />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                            <div className="label-row"><label>Password</label></div>
                            <PasswordField onChange={handleChange} />
                        </div>
                    </div>

                    <button className="submit-button" type="submit">
                        Register <ArrowRight size={18} />
                    </button>

                    <button type="button" className="secondary-button" onClick={() => navigate('/vendor-register')}>
                        BECOME A VENDOR
                    </button>
                </form>

                <div className="RedirectCard">
                    <span>Already have an account? <Link to="/login">Login here</Link></span>
                </div>
            </div>
        </main>
    )
}

export default Register
