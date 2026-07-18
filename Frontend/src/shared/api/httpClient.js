import axios from "axios";

const httpClient = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});

export function getErrorPayload(error, fallbackMessage = "Request failed") {
  return error.response?.data || { message: error.message || fallbackMessage };
}

export default httpClient;
