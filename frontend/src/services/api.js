import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:5001/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("rebuild_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getErrorMessage(err) {
  return err.response?.data?.message || err.message || "Something went wrong.";
}

export function homePath(role) {
  if (role === "admin") return "/admin";
  if (role === "volunteer") return "/volunteer";
  return "/family";
}

export default api;
