import { createBrowserRouter } from "react-router";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import ForgotPassword from "./features/auth/pages/ForgotPassword";
import VendorRegister from "./features/auth/pages/VendorRegister";
import Profile from "./features/profile/pages/Profile";
import ChangePassword from "./features/profile/pages/ChangePassword";
import Home from "./features/products/pages/Home";
import AddProduct from "./features/products/pages/AddProduct";
import ProductDetail from "./features/products/pages/ProductDetail";
import Dashboard from "./features/dashboard/pages/Dashboard";
import NewOrder from "./features/dashboard/pages/NewOrder";
import Schedule from "./features/schedule/pages/Schedule";
import Assets from "./features/assets/pages/Assets";
import Invoices from "./features/invoices/pages/Invoices";
import Reports from "./features/reports/pages/Reports";
import Quotations from "./features/dashboard/pages/Quotations";
import OrderHistory from "./features/orders/pages/OrderHistory";
import { ProtectedRoute, PublicRoute, StorefrontRoute } from "./shared/components/RouteGuards";

const router = createBrowserRouter([
  {
    path: "/",
    children: [
      {
        index: true,
        element: <StorefrontRoute><Home /></StorefrontRoute>,
      },
      {
        path: "add-product",
        element: <ProtectedRoute allowedRoles="vendor"><AddProduct /></ProtectedRoute>,
      },
      {
        path: "edit-product/:p_id",
        element: <ProtectedRoute allowedRoles="vendor"><AddProduct /></ProtectedRoute>,
      },
      {
        path: "product/:p_id",
        element: <StorefrontRoute><ProductDetail /></StorefrontRoute>,
      },
    ]
  },
  {
    path: "/dashboard",
    element: <ProtectedRoute allowedRoles="vendor"><Dashboard /></ProtectedRoute>,
  },
  {
    path: "/dashboard/new-order",
    element: <ProtectedRoute allowedRoles="vendor"><NewOrder /></ProtectedRoute>,
  },
  {
    path: "/dashboard/quotation",
    element: <ProtectedRoute allowedRoles="vendor"><Quotations /></ProtectedRoute>,
  },
  {
    path: "/schedule",
    element: <ProtectedRoute allowedRoles="vendor"><Schedule /></ProtectedRoute>,
  },
  {
    path: "/assets",
    element: <ProtectedRoute allowedRoles="vendor"><Assets /></ProtectedRoute>,
  },
  {
    path: "/invoices",
    element: <ProtectedRoute allowedRoles="vendor"><Invoices /></ProtectedRoute>,
  },
  {
    path: "/reports",
    element: <ProtectedRoute allowedRoles="vendor"><Reports /></ProtectedRoute>,
  },
  {
    path: "/order-history",
    element: <ProtectedRoute allowedRoles="user"><OrderHistory /></ProtectedRoute>,
  },
  {
    path: "/login",
    element: <PublicRoute><Login /></PublicRoute>,
  },
  {
    path: "/forgot-password",
    element: <PublicRoute><ForgotPassword /></PublicRoute>,
  },
  {
    path: "/register",
    element: <PublicRoute><Register /></PublicRoute>,
  },
  {
    path: "/vendor-register",
    element: <PublicRoute><VendorRegister /></PublicRoute>,
  },
  {
    path: "/profile",
    element: <ProtectedRoute allowedRoles="user"><Profile /></ProtectedRoute>
  },
  {
    path: "/change-password",
    element: <ProtectedRoute allowedRoles="user"><ChangePassword /></ProtectedRoute>
  }
]);

export default router;
