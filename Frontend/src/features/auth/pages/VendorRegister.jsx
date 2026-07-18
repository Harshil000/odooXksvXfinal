import { useForm } from "../hook/useForm"
import { Link } from "react-router"
import { ToastContainer } from 'react-toastify';
import useAuth from "../hook/useAuth"
import PasswordField from "../components/PasswordField"
import { Mail, Briefcase, Hash, Wrench, ArrowRight } from "lucide-react"
import "../styles/login.scss"

const VendorRegister = () => {
    const { formValues, handleChange } = useForm({
        firstName: "",
        lastName: "",
        companyName: "",
        productCategory: "",
        gstNo: "",
        email: "",
        password: ""
    });

    const { VendorRegisterUser } = useAuth(); // Assume it exists or will be added

    const handleSubmit = (e) => {
        e.preventDefault();
        if (VendorRegisterUser) {
            VendorRegisterUser(formValues);
        } else {
            console.log("Vendor Register:", formValues);
        }
    }

    return (
        <main className="login-register-page">
            <ToastContainer position="top-right" autoClose={3000} theme="dark" />
            <div className="containerCard" style={{ maxWidth: '600px' }}>
                <div className="header-content">
                    <h1>Vendor Sign-up</h1>
                    <p className="subtitle">PARTNER WITH PRECISION REAL ESTATE</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <div className="label-row"><label>First Name</label></div>
                            <div className="input-wrapper no-icon">
                                <input required onChange={handleChange} type="text" name="firstName" placeholder="First Name" />
                            </div>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <div className="label-row"><label>Last Name</label></div>
                            <div className="input-wrapper no-icon">
                                <input required onChange={handleChange} type="text" name="lastName" placeholder="Last Name" />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <div className="label-row"><label>Company Name</label></div>
                            <div className="input-wrapper">
                                <div className="input-icon"><Briefcase size={16} /></div>
                                <input required onChange={handleChange} type="text" name="companyName" placeholder="Company Ltd." />
                            </div>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <div className="label-row"><label>Product Category</label></div>
                            <div className="input-wrapper">
                                <div className="input-icon"><Wrench size={16} /></div>
                                <select required onChange={handleChange} name="productCategory">
                                    <option value="" disabled selected>Select Category</option>
                                    <option value="hardware">Hardware</option>
                                    <option value="software">Software</option>
                                    <option value="services">Services</option>
                                    <option value="materials">Building Materials</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="label-row"><label>GST No.</label></div>
                        <div className="input-wrapper">
                            <div className="input-icon"><Hash size={16} /></div>
                            <input required onChange={handleChange} type="text" name="gstNo" placeholder="GSTIN..." />
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="label-row"><label>Email Address</label></div>
                        <div className="input-wrapper">
                            <div className="input-icon"><Mail size={16} /></div>
                            <input required onChange={handleChange} type="email" name="email" placeholder="vendor@company.com" />
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="label-row"><label>Password</label></div>
                        <PasswordField onChange={handleChange} />
                    </div>

                    <button className="submit-button" type="submit">
                        Complete Sign-up <ArrowRight size={18} />
                    </button>
                </form>

                <div className="RedirectCard" style={{ maxWidth: '600px' }}>
                    <span>Already have an account? <Link to="/login">Sign in</Link></span>
                    <span style={{ marginLeft: '15px' }}>| Regular user? <Link to="/register">Register here</Link></span>
                </div>
            </div>
        </main>
    )
}

export default VendorRegister;
