import { useState, useEffect } from "react"
import { useForm } from "../hook/useForm"
import { Link } from "react-router"
import { ToastContainer } from 'react-toastify';
import useAuth from "../hook/useAuth"
import { searchCompanies } from "../services/auth.api"
import PasswordField from "../components/PasswordField"
import { Mail, Briefcase, Hash, Wrench, ArrowRight, UserCog } from "lucide-react"
import "../styles/login.scss"

const VendorRegister = () => {
    const { formValues, handleChange, setFormValues } = useForm({
        firstName: "",
        lastName: "",
        role: "ADMIN",
        companyName: "",
        productCategory: "",
        gstNo: "",
        pincode: "",
        city: "",
        state: "",
        addressLine1: "",
        addressLine2: "",
        companyUuid: "",
        email: "",
        password: ""
    });

    const { VendorRegisterUser } = useAuth();

    const [searchTerm, setSearchTerm] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (formValues.role !== "STAFF") {
            setSuggestions([]);
            setShowDropdown(false);
            return;
        }

        if (!searchTerm.trim()) {
            setSuggestions([]);
            setShowDropdown(false);
            return;
        }

        setIsSearching(true);
        const delayDebounce = setTimeout(async () => {
            try {
                const response = await searchCompanies(searchTerm);
                setSuggestions(response.companies || []);
                setShowDropdown(true);
            } catch (err) {
                console.warn("Failed to fetch companies:", err);
            } finally {
                setIsSearching(false);
            }
        }, 400);

        return () => clearTimeout(delayDebounce);
    }, [searchTerm, formValues.role]);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Filter payload based on role
        const payload = {
            firstName: formValues.firstName,
            lastName: formValues.lastName,
            email: formValues.email,
            password: formValues.password,
            role: formValues.role,
        };

        if (formValues.role === "ADMIN") {
            payload.companyName = formValues.companyName;
            payload.productCategory = formValues.productCategory;
            payload.gstNo = formValues.gstNo;
            payload.pincode = formValues.pincode;
            payload.city = formValues.city;
            payload.state = formValues.state;
            payload.addressLine1 = formValues.addressLine1;
            payload.addressLine2 = formValues.addressLine2;
        } else if (formValues.role === "STAFF") {
            if (!formValues.companyUuid) {
                alert("Please search and select a matching company from the dropdown suggestions.");
                return;
            }
            payload.companyUuid = formValues.companyUuid;
        }

        if (VendorRegisterUser) {
            VendorRegisterUser(payload);
        } else {
            console.log("Vendor Register:", payload);
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
                    <div className="form-row">
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

                    <div className="form-group">
                        <div className="label-row"><label>Registration Role</label></div>
                        <div className="input-wrapper">
                            <div className="input-icon"><UserCog size={16} /></div>
                            <select required onChange={handleChange} name="role" value={formValues.role}>
                                <option value="ADMIN">Company Admin</option>
                                <option value="STAFF">Company Staff</option>
                            </select>
                        </div>
                    </div>

                    {formValues.role === "ADMIN" && (
                        <>
                            <div className="form-row">
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

                            <div className="form-row">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <div className="label-row"><label>Pincode</label></div>
                                    <div className="input-wrapper no-icon">
                                        <input required onChange={handleChange} type="text" name="pincode" placeholder="Pincode" />
                                    </div>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <div className="label-row"><label>City</label></div>
                                    <div className="input-wrapper no-icon">
                                        <input required onChange={handleChange} type="text" name="city" placeholder="City" />
                                    </div>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <div className="label-row"><label>State</label></div>
                                    <div className="input-wrapper no-icon">
                                        <input required onChange={handleChange} type="text" name="state" placeholder="State" />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <div className="label-row"><label>Address Line 1</label></div>
                                <div className="input-wrapper no-icon">
                                    <input required onChange={handleChange} type="text" name="addressLine1" placeholder="Address Line 1" />
                                </div>
                            </div>

                            <div className="form-group">
                                <div className="label-row"><label>Address Line 2 (Optional)</label></div>
                                <div className="input-wrapper no-icon">
                                    <input onChange={handleChange} type="text" name="addressLine2" placeholder="Address Line 2" />
                                </div>
                            </div>
                        </>
                    )}

                    {formValues.role === "STAFF" && (
                        <div className="form-group" style={{ position: 'relative' }}>
                            <div className="label-row"><label>Search Company Name</label></div>
                            <div className="input-wrapper">
                                <div className="input-icon"><Briefcase size={16} /></div>
                                <input 
                                    required 
                                    type="text" 
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setFormValues(prev => ({ ...prev, companyUuid: "" }));
                                    }} 
                                    placeholder="Start typing company name..." 
                                />
                                
                                {showDropdown && suggestions.length > 0 && (
                                    <ul className="company-suggestions-dropdown">
                                        {suggestions.map((company) => (
                                            <li 
                                                key={company.c_id}
                                                onClick={() => {
                                                    setSearchTerm(company.cname);
                                                    setFormValues(prev => ({ ...prev, companyUuid: company.c_id }));
                                                    setShowDropdown(false);
                                                }}
                                            >
                                                <span className="comp-name">{company.cname}</span>
                                                <span className="comp-gst">GST: {company.gst_no || "N/A"}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {showDropdown && searchTerm.trim() && suggestions.length === 0 && !isSearching && (
                                    <div className="company-suggestions-empty">
                                        No matching companies found
                                    </div>
                                )}
                            </div>
                            {formValues.companyUuid && (
                                <div className="selected-company-indicator">
                                    Selected Company ID: <code>{formValues.companyUuid}</code>
                                </div>
                            )}
                        </div>
                    )}

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
