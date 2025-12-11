import axios from "axios";

const API_URL = (import.meta as any).env?.VITE_API_URL;

if (!API_URL) {
  console.warn("API base URL is not set. Set VITE_API_URL in your .env (or REACT_APP_API_URL as fallback).");
}

const axiosInstance = axios.create({
  baseURL: API_URL,
  // You can add headers or interceptors here if needed
});

export default axiosInstance;