import { createBrowserRouter } from "react-router";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import VendorRegister from "./features/auth/pages/VendorRegister";
import Profile from "./features/profile/pages/Profile";
import ChangePassword from "./features/profile/pages/ChangePassword";

const router = createBrowserRouter([
  {
    path: "/",
    children: [
      {
        index: true,
        element: <Login />,
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
