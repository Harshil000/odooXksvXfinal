import { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router";
import { AuthContext } from "../../auth/auth.context";
import { logout } from "../../auth/services/auth.api";
import { CartContext } from "../../cart/context/cart.context";

const Navbar = ({
  activeSection = "orders",
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search orders...",
  onCartOpen,
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

  const isVendor = !!(user?.role || user?.v_id || user?.c_id);

  // Cart item count — only for storefront (non-vendor) users
  const cartContext = useContext(CartContext);
  const cartItemCount = !isVendor && cartContext ? cartContext.cartItems.reduce((sum, item) => sum + item.quantity, 0) : 0;

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
        <span>RentAndGo</span>
      </div>

      {/* Nav Links */}
      <div className="nav-links">
        {isVendor && (
          <>
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
          </>
        )}
        <a
          href="#"
          className={`nav-link ${activeSection === "products" ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            if (isVendor) {
              navigate("/add-product");
            } else {
              navigate("/");
            }
          }}
        >
          Products
        </a>
        {isVendor && (
          <>
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
          </>
        )}
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

      {/* Cart button — only for regular (non-vendor) users */}
      {!isVendor && onCartOpen && (
        <button
          className="nav-cart-btn"
          onClick={onCartOpen}
          aria-label="Open Cart"
          id="navbar-cart-btn"
          style={{
            position: "relative",
            background: "transparent",
            border: "1px solid #3f3f46",
            borderRadius: "8px",
            padding: "6px 10px",
            cursor: "pointer",
            color: "#a1a1aa",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "border-color 0.2s, color 0.2s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#8b5cf6"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#3f3f46"; e.currentTarget.style.color = "#a1a1aa"; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          {cartItemCount > 0 && (
            <span style={{
              position: "absolute",
              top: "-6px",
              right: "-6px",
              background: "#8b5cf6",
              color: "#fff",
              borderRadius: "50%",
              width: "18px",
              height: "18px",
              fontSize: "11px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}>
              {cartItemCount > 99 ? "99+" : cartItemCount}
            </span>
          )}
        </button>
      )}

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
                <span>RentAndGo</span>
              </div>
              <button className="drawer-close-btn" onClick={() => setShowSidebar(false)} aria-label="Close Sidebar Menu">&times;</button>
            </div>
            <div className="drawer-nav-links">
              {isVendor && (
                <>
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
                </>
              )}
              <a
                href="#"
                className={`drawer-nav-link ${activeSection === "products" ? "active" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  setShowSidebar(false);
                  if (isVendor) {
                    navigate("/add-product");
                  } else {
                    navigate("/");
                  }
                }}
              >
                Products
              </a>
              {isVendor && (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
