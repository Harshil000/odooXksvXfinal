import React, { useContext } from "react";
import { Navigate } from "react-router";
import { AuthContext } from "../../features/auth/auth.context";

/**
 * Route guard wrapper to protect user/vendor private pages.
 * - AllowedRoles = 'vendor': ONLY vendors (admin/staff/vendor) can access. If regular user, redirects to '/'.
 * - AllowedRoles = 'user': ONLY logged-in regular customers can access. If vendor, redirects to '/dashboard'.
 */
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, checkingAuth } = useContext(AuthContext);

  if (checkingAuth) {
    return (
      <div className="guard-loading-container">
        <div className="guard-spinner"></div>
        <p className="guard-loading-text">Verifying session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if vendor (has role or v_id or c_id properties)
  const isVendor = !!(user.role || user.v_id || user.c_id);

  if (allowedRoles === "vendor" && !isVendor) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles === "user" && isVendor) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

/**
 * Route guard wrapper to protect guest-only pages (e.g. Login, Sign-up, Forgot-Password).
 * - Redirects logged-in vendors to '/dashboard'.
 * - Redirects logged-in regular customers to '/'.
 */
export const PublicRoute = ({ children }) => {
  const { user, checkingAuth } = useContext(AuthContext);

  if (checkingAuth) {
    return (
      <div className="guard-loading-container">
        <div className="guard-spinner"></div>
        <p className="guard-loading-text">Verifying session...</p>
      </div>
    );
  }

  if (user) {
    const isVendor = !!(user.role || user.v_id || user.c_id);
    return <Navigate to={isVendor ? "/dashboard" : "/"} replace />;
  }

  return children;
};

/**
 * Route guard wrapper to protect public storefront pages (Home, ProductDetail).
 * - Allows guest users to browse freely.
 * - Redirects logged-in vendors (admin/staff) to '/dashboard'.
 */
export const StorefrontRoute = ({ children }) => {
  const { checkingAuth } = useContext(AuthContext);

  if (checkingAuth) {
    return (
      <div className="guard-loading-container">
        <div className="guard-spinner"></div>
        <p className="guard-loading-text">Verifying session...</p>
      </div>
    );
  }

  return children;
};
