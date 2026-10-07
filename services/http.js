import axios from "axios";
import BASE_URL from "../config";

// Shared axios instance: prefixes BASE_URL, attaches the bearer token,
// and sends the user back to login when the session is rejected.
const http = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

http.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default http;
