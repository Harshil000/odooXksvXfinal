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
  const { user, setUser, companyInfo = { cname: "Your Logo", comp_prof_image: null }, showProductFilters, setShowProductFilters } = useContext(AuthContext);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showProductsDropdown, setShowProductsDropdown] = useState(false);
  const [showDrawerProductsDropdown, setShowDrawerProductsDropdown] = useState(false);
  const profileRef = useRef(null);

  // Derive display name from user/vendor context
  const displayName = user
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Vendor"
    : "Vendor";
  const isVendor = !!(user?.role || user?.v_id || user?.c_id);

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
      {/* 3 Slash Menu Trigger */}
      <button className="menu-toggle-btn" onClick={() => setShowSidebar(true)} aria-label="Toggle Navigation Sidebar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Logo */}
      <div className="nav-logo" onClick={() => navigate("/dashboard")}>
        {companyInfo.comp_prof_image ? (
          <img src={companyInfo.comp_prof_image} alt={companyInfo.cname} style={{ width: "28px", height: "28px", borderRadius: "4px", objectFit: "cover", marginRight: "8px" }} />
        ) : (
          <div className="logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        <span>{companyInfo.cname || "Your Logo"}</span>
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
          onClick={(e) => { e.preventDefault(); navigate("/dashboard/quotation"); }}
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
        <div 
          className={`nav-link nav-link-container ${activeSection === "products" ? "active" : ""}`} 
          style={{ position: "relative", display: "inline-flex", alignItems: "center", paddingRight: "4px", cursor: "pointer" }}
          onClick={() => {
            if (isVendor) {
              navigate("/add-product");
            } else {
              navigate("/");
            }
          }}
        >
          <a 
            href="#" 
            style={{ color: "inherit", textDecoration: "none", pointerEvents: "none" }}
          >
            Products
          </a>
          <button 
            className="dropdown-arrow-btn" 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowProductsDropdown(!showProductsDropdown); }}
            style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", padding: "4px", marginLeft: "2px", display: "flex", alignItems: "center" }}
            aria-label="Toggle Products Submenu"
          >
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: showProductsDropdown ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}>
              <polyline points="1 1 5 5 9 1" />
            </svg>
          </button>
          
          {showProductsDropdown && (
            <div className="products-dropdown-menu" style={{ position: "absolute", top: "100%", left: 0, background: "#14141a", border: "1px solid #27272a", borderRadius: "6px", zIndex: 1000, minWidth: "120px", marginTop: "8px", boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)", overflow: "hidden" }}>
              <button 
                onClick={(e) => { 
                  e.stopPropagation();
                  setShowProductsDropdown(false); 
                  setShowProductFilters(!showProductFilters); 
                  navigate("/"); 
                }}
                style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", color: "#ffffff", padding: "10px 16px", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "background 0.2s" }}
                onMouseEnter={(e) => e.target.style.background = "#1a1a22"}
                onMouseLeave={(e) => e.target.style.background = "transparent"}
              >
                <span>Filters</span>
                <span style={{ fontSize: "10px", color: showProductFilters ? "#22c55e" : "#52525b" }}>●</span>
              </button>
            </div>
          )}
        </div>
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
        <a
          href="#"
          className={`nav-link ${activeSection === "reports" ? "active" : ""}`}
          onClick={(e) => { e.preventDefault(); navigate("/reports"); }}
        >
          Reports
        </a>
      </div>

      {!isVendor && user && (
        <button
          type="button"
          className={`nav-history-btn ${activeSection === "history" ? "active" : ""}`}
          onClick={() => navigate("/order-history")}
        >
          Order History
        </button>
      )}

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
            <button className="dropdown-item" onClick={() => { setShowProfileMenu(false); navigate("/profile"); }}>
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

      {/* Slide-out Sidebar Drawer */}
      {showSidebar && (
        <div className="sidebar-drawer-overlay" onClick={() => setShowSidebar(false)}>
          <div className="sidebar-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-logo">
                {companyInfo.comp_prof_image ? (
                  <img src={companyInfo.comp_prof_image} alt={companyInfo.cname} style={{ width: "24px", height: "24px", borderRadius: "4px", objectFit: "cover", marginRight: "8px" }} />
                ) : (
                  <div className="logo-icon-sm" style={{ display: "inline-flex", background: "linear-gradient(135deg, #cda4ff, #8b5cf6)", borderRadius: "4px", padding: "4px", marginRight: "8px", color: "#fff" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
                    </svg>
                  </div>
                )}
                <span>{companyInfo.cname || "Your Logo"}</span>
              </div>
              <button className="drawer-close-btn" onClick={() => setShowSidebar(false)} aria-label="Close Sidebar Menu">&times;</button>
            </div>
            <div className="drawer-nav-links">
              <a
                href="#"
                className={`drawer-nav-link ${activeSection === "orders" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); setShowSidebar(false); navigate("/dashboard"); }}
              >
                Orders
              </a>
              <a
                href="#"
                className={`drawer-nav-link ${activeSection === "quotation" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); setShowSidebar(false); navigate("/dashboard/new-order"); }}
              >
                Quotation
              </a>
              <a
                href="#"
                className={`drawer-nav-link ${activeSection === "schedule" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); setShowSidebar(false); navigate("/schedule"); }}
              >
                Schedule
              </a>
              <a
                href="#"
                className={`drawer-nav-link ${activeSection === "assets" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); setShowSidebar(false); navigate("/assets"); }}
              >
                Assets
              </a>
              <div className="drawer-products-group" style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                <div 
                  className={`drawer-nav-link ${activeSection === "products" ? "active" : ""}`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", paddingRight: "4px", cursor: "pointer" }}
                  onClick={() => { 
                    setShowSidebar(false);
                    if (isVendor) {
                      navigate("/add-product");
                    } else {
                      navigate("/");
                    }
                  }}
                >
                  <span style={{ flex: 1 }}>Products</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowDrawerProductsDropdown(!showDrawerProductsDropdown); }}
                    style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", padding: "6px", display: "flex", alignItems: "center" }}
                    aria-label="Toggle Drawer Products Submenu"
                  >
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: showDrawerProductsDropdown ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}>
                      <polyline points="1 1 5 5 9 1" />
                    </svg>
                  </button>
                </div>
                {showDrawerProductsDropdown && (
                  <div style={{ paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "4px", margin: "4px 0" }}>
                    <a
                      href="#"
                      className="drawer-nav-link"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowSidebar(false);
                        setShowProductFilters(!showProductFilters);
                        navigate("/");
                      }}
                      style={{ fontSize: "13px", color: showProductFilters ? "#fff" : "#a1a1aa", background: showProductFilters ? "rgba(163, 140, 245, 0.15)" : "transparent", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                    >
                      <span>Filters</span>
                      <span style={{ fontSize: "10px", color: showProductFilters ? "#22c55e" : "#52525b" }}>●</span>
                    </a>
                  </div>
                )}
              </div>
              {!isVendor && (
                <a
                  href="#"
                  className={`drawer-nav-link ${activeSection === "history" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); setShowSidebar(false); navigate("/order-history"); }}
                >
                  Order History
                </a>
              )}
              <a 
                href="#" 
                className={`drawer-nav-link ${activeSection === "settings" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); setShowSidebar(false); navigate("/profile"); }}
              >
                Settings
              </a>
              <a
                href="#"
                className={`drawer-nav-link ${activeSection === "invoices" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); setShowSidebar(false); navigate("/invoices"); }}
              >
                Invoices
              </a>
              <a
                href="#"
                className={`drawer-nav-link ${activeSection === "reports" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); setShowSidebar(false); navigate("/reports"); }}
              >
                Reports
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
