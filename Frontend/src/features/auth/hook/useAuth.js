import { useContext } from "react";
import { AuthContext } from "../auth.context";
import { register, login, logout } from "../services/auth.api";
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
        name: formValues.name,
        email: formValues.email.toLowerCase(),
        password: formValues.password,
        role: formValues.role,
        ...(formValues.role === "owner"
          ? { restaurant_name: formValues.restaurant_name }
          : {}),
        ...(formValues.role === "staff"
          ? { restaurant_id: formValues.restaurant_id }
          : {}),
      };

      const response = await register(payload);
      console.log("✅ Registration Response:", response);
      setUser(response.user);

      // Decode token and log restaurant_id
      const token = getTokenFromCookie();
      if (token) {
        const decoded = decodeToken(token);
        if (decoded?.restaurant_id) {
          console.log("✅ Registered - Restaurant ID:", decoded.restaurant_id);
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

      // Decode token and log restaurant_id
      const token = getTokenFromCookie();
      if (token) {
        const decoded = decodeToken(token);
        if (decoded?.restaurant_id) {
          console.log("✅ Logged In - Restaurant ID:", decoded.restaurant_id);
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

  return { RegisterUser, LoginUser, LogoutUser, user };
}

export default useAuth;
