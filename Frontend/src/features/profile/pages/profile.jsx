import React, { useState, useEffect, useRef } from "react";
import { Edit2, Trash2, Shield, Lock, MapPin, Plus, Check, ShoppingCart, User as UserIcon } from "lucide-react";
import { useProfile } from "../hooks/useProfile";
import { ToastContainer } from "react-toastify";
import "../styles/profile.scss";

const Profile = () => {
    const { 
        profileData, 
        loading, 
        isSaving, 
        saveAll, 
        handleUserImageDelete, 
        handleCompanyImageDelete,
        handleAddAddress,
        handleDeleteAddress 
    } = useProfile();

    const fileInputRef = useRef(null);
    const companyLogoInputRef = useRef(null);

    // Edit states
    const [isEditingUser, setIsEditingUser] = useState(false);
    const [isEditingCompany, setIsEditingCompany] = useState(false);
    const [showAddAddress, setShowAddAddress] = useState(false);

    // Form inputs
    const [userForm, setUserForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
    });

    const [companyForm, setCompanyForm] = useState({
        companyName: "",
        gstNo: "",
        productCategory: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: ""
    });

    const [addressForm, setAddressForm] = useState({
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: ""
    });

    // Temp image preview/files
    const [userImagePreview, setUserImagePreview] = useState(null);
    const [companyImagePreview, setCompanyImagePreview] = useState(null);

    useEffect(() => {
        if (profileData) {
            const { user, company } = profileData;
            setUserForm({
                firstName: user?.first_name || "",
                lastName: user?.last_name || "",
                email: user?.email || "",
                phone: "+1 (555) 012-3456"
            });
            setUserImagePreview(user?.profile_image || null);

            if (company) {
                setCompanyForm({
                    companyName: company.cname || "",
                    gstNo: company.gst_no || "",
                    productCategory: company.product_category || "",
                    addressLine1: company.address_line1 || "",
                    addressLine2: company.address_line2 || "",
                    city: company.city || "",
                    state: company.state || "",
                    pincode: company.pincode || ""
                });
                setCompanyImagePreview(company.comp_prof_image || null);
            }
        }
    }, [profileData]);

    if (loading) {
        return (
            <div className="profile-container loading-state">
                <div className="spinner"></div>
                <p>Loading account profile...</p>
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className="profile-container error-state">
                <p>Failed to load profile. Please sign in again.</p>
            </div>
        );
    }

    const { user, userType, company, addresses } = profileData;
    const isVendor = userType === "vendor";
    const isAdmin = isVendor && user.role === "admin";

    // Handle User Info Save
    const handleUserSave = async () => {
        const formData = new FormData();
        formData.append("firstName", userForm.firstName);
        formData.append("lastName", userForm.lastName);
        await saveAll(formData, null, isVendor, false);
        setIsEditingUser(false);
    };

    // Handle Company Info Save
    const handleCompanySave = async () => {
        const formData = new FormData();
        formData.append("companyName", companyForm.companyName);
        formData.append("productCategory", companyForm.productCategory);
        formData.append("gstNo", companyForm.gstNo);
        formData.append("addressLine1", companyForm.addressLine1);
        formData.append("addressLine2", companyForm.addressLine2 || "");
        formData.append("city", companyForm.city);
        formData.append("state", companyForm.state);
        formData.append("pincode", companyForm.pincode);

        await saveAll(null, formData, isVendor, true);
        setIsEditingCompany(false);
    };

    // Handle User Avatar Upload
    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append("firstName", userForm.firstName);
            formData.append("lastName", userForm.lastName);
            formData.append("profileImage", file);
            await saveAll(formData, null, isVendor, false);
        }
    };

    // Handle Company Logo Upload
    const handleCompanyLogoChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append("companyName", companyForm.companyName);
            formData.append("productCategory", companyForm.productCategory);
            formData.append("gstNo", companyForm.gstNo);
            formData.append("addressLine1", companyForm.addressLine1);
            formData.append("addressLine2", companyForm.addressLine2 || "");
            formData.append("city", companyForm.city);
            formData.append("state", companyForm.state);
            formData.append("pincode", companyForm.pincode);
            formData.append("companyProfileImage", file);
            await saveAll(null, formData, isVendor, true);
        }
    };

    // Handle User Image Instant Delete
    const handleAvatarDeleteClick = () => {
        handleUserImageDelete(userForm.firstName, userForm.lastName);
    };

    // Handle Company Logo Instant Delete
    const handleCompanyLogoDeleteClick = () => {
        handleCompanyImageDelete(companyForm);
    };

    // Handle Add Address Submit
    const handleAddressSubmit = async (e) => {
        e.preventDefault();
        await handleAddAddress(addressForm);
        setAddressForm({
            addressLine1: "",
            addressLine2: "",
            city: "",
            state: "",
            pincode: ""
        });
        setShowAddAddress(false);
    };

    return (
        <div className="profile-wrapper">
            <ToastContainer position="top-right" autoClose={3000} theme="dark" />

            {/* Main Content Body */}
            <div className="profile-grid">
                
                {/* Left Column: Sidebar details */}
                <div className="profile-sidebar">
                    <div className="sidebar-card user-main-card">
                        <div className="avatar-wrapper">
                            <div className="avatar-circle">
                                {userImagePreview ? (
                                    <img src={userImagePreview} alt="User profile" />
                                ) : (
                                    <span className="avatar-initials">
                                        {userForm.firstName ? userForm.firstName.charAt(0) : "U"}
                                    </span>
                                )}
                            </div>
                            
                            {/* Round overlay buttons */}
                            <label className="avatar-btn edit-badge" title="Upload Photo">
                                <Edit2 size={14} />
                                <input type="file" onChange={handleAvatarChange} accept="image/*" style={{ display: "none" }} />
                            </label>
                            
                            {userImagePreview && (
                                <button className="avatar-btn delete-badge" onClick={handleAvatarDeleteClick} title="Remove Photo">
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>

                        <h2>{userForm.firstName} {userForm.lastName}</h2>
                        
                        <span className="role-badge">
                            {isVendor ? (isAdmin ? "Company Admin" : "Company Staff") : "You"}
                        </span>
                    </div>

                    {/* Security Card */}
                    <div className="sidebar-card security-card">
                        <h3>Security Overview</h3>
                        <div className="security-detail">
                            <div className="check-icon-circle">
                                <Check size={14} />
                            </div>
                            <div className="security-text">
                                <span className="sec-title">Two-Factor Auth</span>
                                <span className="sec-desc">Enabled via SMS</span>
                            </div>
                        </div>
                        <button className="change-password-btn">
                            <Lock size={14} />
                            Change Password
                        </button>
                    </div>
                </div>

                {/* Right Column: Main Form Forms */}
                <div className="profile-main-panel">
                    
                    {/* Card 1: Personal Info */}
                    <div className="main-card">
                        <div className="card-header">
                            <h2>Personal Information</h2>
                            {!isEditingUser ? (
                                <button className="edit-action-btn" onClick={() => setIsEditingUser(true)}>
                                    <Edit2 size={14} />
                                    Edit Profile
                                </button>
                            ) : (
                                <div className="action-group">
                                    <button className="save-action-btn" onClick={handleUserSave} disabled={isSaving}>
                                        {isSaving ? "Saving..." : "Save"}
                                    </button>
                                    <button className="cancel-action-btn" onClick={() => setIsEditingUser(false)}>
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>First Name</label>
                                <input 
                                    type="text" 
                                    value={userForm.firstName} 
                                    onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                                    disabled={!isEditingUser}
                                    placeholder="First Name"
                                />
                            </div>

                            <div className="form-group">
                                <label>Last Name</label>
                                <input 
                                    type="text" 
                                    value={userForm.lastName} 
                                    onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                                    disabled={!isEditingUser}
                                    placeholder="Last Name"
                                />
                            </div>

                            <div className="form-group full-width">
                                <label>Email Address</label>
                                <input 
                                    type="email" 
                                    value={userForm.email} 
                                    disabled
                                    placeholder="Email Address"
                                />
                                <span className="field-hint">Email cannot be changed manually. Contact support for updates.</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Saved Addresses (If Customer / Users) */}
                    {!isVendor && (
                        <div className="main-card address-card-container">
                            <div className="card-header">
                                <h2>Saved Addresses</h2>
                                {!showAddAddress && (
                                    <button className="add-address-btn" onClick={() => setShowAddAddress(true)}>
                                        <Plus size={14} />
                                        Add New Address
                                    </button>
                                )}
                            </div>

                            {/* Add Address Form Block */}
                            {showAddAddress && (
                                <form onSubmit={handleAddressSubmit} className="add-address-form">
                                    <h3>Add New Address</h3>
                                    <div className="form-grid">
                                        <div className="form-group full-width">
                                            <label>Address Line 1</label>
                                            <input 
                                                type="text" 
                                                required
                                                value={addressForm.addressLine1}
                                                onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                                                placeholder="123 Main Street"
                                            />
                                        </div>

                                        <div className="form-group full-width">
                                            <label>Address Line 2 (Optional)</label>
                                            <input 
                                                type="text" 
                                                value={addressForm.addressLine2}
                                                onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                                                placeholder="Apartment, Suite, Unit, etc."
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>City</label>
                                            <input 
                                                type="text" 
                                                required
                                                value={addressForm.city}
                                                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                                                placeholder="City"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>State</label>
                                            <input 
                                                type="text" 
                                                required
                                                value={addressForm.state}
                                                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                                                placeholder="State"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Pincode</label>
                                            <input 
                                                type="text" 
                                                required
                                                value={addressForm.pincode}
                                                onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                                                placeholder="Pincode"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-actions">
                                        <button type="submit" className="save-action-btn">Save Address</button>
                                        <button type="button" className="cancel-action-btn" onClick={() => setShowAddAddress(false)}>Cancel</button>
                                    </div>
                                </form>
                            )}

                            {/* List of Saved Addresses */}
                            <div className="address-blocks-grid">
                                {addresses && addresses.length > 0 ? (
                                    addresses.map((addr) => (
                                        <div key={addr.address_id} className="address-block">
                                            <div className="address-block-icon">
                                                <MapPin size={18} />
                                            </div>
                                            <div className="address-block-info">
                                                <p className="line-1">{addr.address_line1}</p>
                                                {addr.address_line2 && <p className="line-2">{addr.address_line2}</p>}
                                                <p className="city-state">{addr.city}, {addr.state} - {addr.pincode}</p>
                                            </div>
                                            <button 
                                                className="address-delete-btn" 
                                                onClick={() => handleDeleteAddress(addr.address_id)}
                                                title="Delete Address"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-address-text">No saved addresses found. Add one above!</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Card 2: Company Information (If Vendor) */}
                    {isVendor && (
                        <div className="main-card company-card-container">
                            <div className="card-header">
                                <h2>Company Information</h2>
                                {isAdmin && (
                                    !isEditingCompany ? (
                                        <button className="edit-action-btn" onClick={() => setIsEditingCompany(true)}>
                                            <Edit2 size={14} />
                                            Edit Company
                                        </button>
                                    ) : (
                                        <div className="action-group">
                                            <button className="save-action-btn" onClick={handleCompanySave} disabled={isSaving}>
                                                {isSaving ? "Saving..." : "Save"}
                                            </button>
                                            <button className="cancel-action-btn" onClick={() => setIsEditingCompany(false)}>
                                                Cancel
                                            </button>
                                        </div>
                                    )
                                )}
                            </div>

                            <div className="company-logo-section">
                                <div className="logo-preview-wrapper">
                                    <div className="logo-preview-box">
                                        {companyImagePreview ? (
                                            <img src={companyImagePreview} alt="Company Logo" />
                                        ) : (
                                            <span className="logo-initial">
                                                {companyForm.companyName ? companyForm.companyName.charAt(0) : "C"}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {isAdmin && (
                                        <div className="logo-action-buttons">
                                            <label className="logo-action-btn" title="Upload Company Logo">
                                                <Edit2 size={14} /> Upload
                                                <input type="file" onChange={handleCompanyLogoChange} accept="image/*" style={{ display: "none" }} />
                                            </label>
                                            {companyImagePreview && (
                                                <button className="logo-action-btn delete-action" onClick={handleCompanyLogoDeleteClick} title="Remove Logo">
                                                    <Trash2 size={14} /> Remove
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Company Name</label>
                                    <input 
                                        type="text" 
                                        value={companyForm.companyName} 
                                        onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                                        disabled={!isEditingCompany}
                                        placeholder="Company Name"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>GST Number</label>
                                    <input 
                                        type="text" 
                                        value={companyForm.gstNo} 
                                        onChange={(e) => setCompanyForm({ ...companyForm, gstNo: e.target.value })}
                                        disabled={!isEditingCompany}
                                        placeholder="GST Number"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>Product Category</label>
                                    <input 
                                        type="text" 
                                        value={companyForm.productCategory} 
                                        onChange={(e) => setCompanyForm({ ...companyForm, productCategory: e.target.value })}
                                        disabled={!isEditingCompany}
                                        placeholder="e.g. Electronics, Cars, Tools"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>Address Line 1</label>
                                    <input 
                                        type="text" 
                                        value={companyForm.addressLine1} 
                                        onChange={(e) => setCompanyForm({ ...companyForm, addressLine1: e.target.value })}
                                        disabled={!isEditingCompany}
                                        placeholder="Address Line 1"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>Address Line 2 (Optional)</label>
                                    <input 
                                        type="text" 
                                        value={companyForm.addressLine2} 
                                        onChange={(e) => setCompanyForm({ ...companyForm, addressLine2: e.target.value })}
                                        disabled={!isEditingCompany}
                                        placeholder="Address Line 2"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>City</label>
                                    <input 
                                        type="text" 
                                        value={companyForm.city} 
                                        onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                                        disabled={!isEditingCompany}
                                        placeholder="City"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>State</label>
                                    <input 
                                        type="text" 
                                        value={companyForm.state} 
                                        onChange={(e) => setCompanyForm({ ...companyForm, state: e.target.value })}
                                        disabled={!isEditingCompany}
                                        placeholder="State"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Pincode</label>
                                    <input 
                                        type="text" 
                                        value={companyForm.pincode} 
                                        onChange={(e) => setCompanyForm({ ...companyForm, pincode: e.target.value })}
                                        disabled={!isEditingCompany}
                                        placeholder="Pincode"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;