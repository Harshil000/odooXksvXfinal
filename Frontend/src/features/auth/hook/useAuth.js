import { useContext } from "react";
import { AuthContext } from "../auth.context";
import { register, login, logout, adminRegister, staffRegister } from "../services/auth.api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import { decodeToken } from "../utils/token.util";

function useAuth() {
  const context = useContext(AuthContext);
  const { setUser, setLoading, user } = context;
  const navigate = useNavigate();

  const getTokenFromCookie = () => {
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "accessToken") {
        return decodeURIComponent(value);
      }
    }
    return null;
  };

  async function RegisterUser(formValues) {
    try {
      setLoading(true);

      const payload = {
        first_name: formValues.firstName,
        last_name: formValues.lastName,
        email: formValues.email.toLowerCase(),
        password: formValues.password,
      };

      const response = await register(payload);
      console.log("✅ Registration Response:", response);
      setUser(response.user);

      // Token is automatically managed by cookies


      navigate("/");
    } catch (error) {
      if (Array.isArray(error?.errors)) {
        error.errors.forEach((item) => {
          if (item?.msg) {
            toast.error(item.msg);
          }
        });
      } else {
        toast.error(error?.message || "Registration failed");
      }
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }

  async function LoginUser(formValues) {
    try {
      setLoading(true);
      const response = await login({
        email: formValues.email.toLowerCase(),
        password: formValues.password,
      });
      setUser(response.user);

      // Token is automatically managed by cookies


      navigate("/");
    } catch (error) {
      if (Array.isArray(error?.errors)) {
        error.errors.forEach((item) => {
          if (item?.msg) {
            toast.error(item.msg);
          }
        });
      } else {
        toast.error(error?.message || "Login failed");
      }
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }

  async function LogoutUser() {
    try {
      await logout();
      setUser(null);
      navigate("/login");
    } catch (error) {
      toast.error(error?.message || "Logout failed");
    }
  }

  async function VendorRegisterUser(payload) {
    try {
      setLoading(true);
      
      let response;
      if (payload.role === 'ADMIN') {
          response = await adminRegister(payload);
      } else {
          response = await staffRegister(payload);
      }
      console.log("✅ Vendor Registration Response:", response);
      setUser(response.user);

      // Decode token 
      const token = getTokenFromCookie();
      if (token) {
        const decoded = decodeToken(token);
        if (decoded?.c_id) {
          console.log("✅ Registered - Company ID:", decoded.c_id);
        }
      }

      navigate("/");
    } catch (error) {
      if (Array.isArray(error?.errors)) {
        error.errors.forEach((item) => {
          if (item?.msg) {
            toast.error(item.msg);
          }
        });
      } else {
        toast.error(error?.message || "Vendor Registration failed");
      }
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }

  return { RegisterUser, VendorRegisterUser, LoginUser, LogoutUser, user };
}

export default useAuth;
