import { createBrowserRouter } from "react-router";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import VendorRegister from "./features/auth/pages/VendorRegister";
import Profile from "./features/profile/pages/Profile";
import ChangePassword from "./features/profile/pages/ChangePassword";
import Home from "./pages/Home";
import AddProduct from "./pages/AddProduct";
import ProductDetail from "./pages/ProductDetail";

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
  {
    path: "/profile",
    element: <Profile/>
  },
  {
    path: "/change-password",
    element: <ChangePassword />
  }
]);

export default router;
