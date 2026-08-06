import axios from "axios";

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

export function getErrorPayload(error, fallbackMessage = "Request failed") {
  return error.response?.data || { message: error.message || fallbackMessage };
}

export default httpClient;
