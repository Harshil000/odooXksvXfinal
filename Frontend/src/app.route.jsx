import { createBrowserRouter } from "react-router";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import VendorRegister from "./features/auth/pages/VendorRegister";
import Home from "./features/products/pages/Home";
import AddProduct from "./features/products/pages/AddProduct";
import ProductDetail from "./features/products/pages/ProductDetail";
import Dashboard from "./features/dashboard/pages/Dashboard";
import NewOrder from "./features/dashboard/pages/NewOrder";
import Schedule from "./features/schedule/pages/Schedule";
import Assets from "./features/assets/pages/Assets";

const router = createBrowserRouter([
  {
    path: "/",
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "add-product",
        element: <AddProduct />,
      },
      {
        path: "product/:p_id",
        element: <ProductDetail />,
      },
    ]
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/dashboard/new-order",
    element: <NewOrder />,
  },
  {
    path: "/schedule",
    element: <Schedule />,
  },
  {
    path: "/assets",
    element: <Assets />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/vendor-register",
    element: <VendorRegister />,
  },
]);

export default router;
