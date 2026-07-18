import { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router";
import { AuthContext } from "../../auth/auth.context";
import { logout } from "../../auth/services/auth.api";

const Navbar = ({
  activeSection = "orders",
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search orders...",
}) => {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);

  // Derive display name from user/vendor context
  const displayName = user
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Vendor"
    : "Vendor";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <nav className="dashboard-nav" id="dashboard-navbar">
      {/* Logo */}
      <div className="nav-logo" onClick={() => navigate("/dashboard")}>
        <div className="logo-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span>Your Logo</span>
      </div>

      {/* Nav Links */}
      <div className="nav-links">
        <a
          href="#"
          className={`nav-link ${activeSection === "orders" ? "active" : ""}`}
          onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }}
        >
          Orders
        </a>
        <a
          href="#"
          className={`nav-link ${activeSection === "quotation" ? "active" : ""}`}
          onClick={(e) => { e.preventDefault(); navigate("/dashboard/new-order"); }}
        >
          Quotation
        </a>
        <a
          href="#"
          className={`nav-link ${activeSection === "schedule" ? "active" : ""}`}
          onClick={(e) => { e.preventDefault(); navigate("/schedule"); }}
        >
          Schedule
        </a>
        <a
          href="#"
          className={`nav-link ${activeSection === "assets" ? "active" : ""}`}
          onClick={(e) => { e.preventDefault(); navigate("/assets"); }}
        >
          Assets
        </a>
        <a 
          href="#" 
          className={`nav-link ${activeSection === "products" ? "active" : ""}`}
          onClick={(e) => { e.preventDefault(); navigate("/"); }}
        >
          Products
        </a>
        
        <a 
          href="#" 
          className={`nav-link ${activeSection === "settings" ? "active" : ""}`}
          onClick={(e) => { e.preventDefault(); navigate("/profile"); }}
        >
          Settings
        </a>
        <a
          href="#"
          className={`nav-link ${activeSection === "invoices" ? "active" : ""}`}
          onClick={(e) => { e.preventDefault(); navigate("/invoices"); }}
        >
          Invoices
        </a>
        <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); navigate("/"); }}>Products</a>
        <a
          href="#"
          className={`nav-link ${activeSection === "reports" ? "active" : ""}`}
          onClick={(e) => { e.preventDefault(); navigate("/reports"); }}
        >
          Reports
        </a>
        <a href="#" className="nav-link">Settings</a>
      </div>

      {/* Search */}
      <div className="nav-search">
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          id="dashboard-search-input"
        />
        <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      {/* Profile */}
      <div className="nav-profile" ref={profileRef}>
        <button
          className="profile-trigger"
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          id="profile-menu-toggle"
        >
          <span className="profile-name">{displayName}</span>
          <div className="profile-avatar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <svg className="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {showProfileMenu && (
          <div className="profile-dropdown" id="profile-dropdown">
            <button className="dropdown-item" onClick={() => setShowProfileMenu(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Profile
            </button>
            <button className="dropdown-item dropdown-item--danger" onClick={handleLogout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
