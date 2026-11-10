import axios from "axios";
import BASE_URL from "../config";
import { reportOffline, reportOnline } from "../src/offline/connection";

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

// Saved answers from the offline service worker carry this header
const isSavedCopy = (response) => Boolean(response?.headers?.["x-sellapad-offline"]);

export const OFFLINE_SAVE_MESSAGE = "You're offline, so this can't be saved yet. Try again when the internet is back.";

http.interceptors.response.use(
  (response) => {
    if (isSavedCopy(response)) reportOffline();
    else reportOnline();
    return response;
  },
  (error) => {
    // No answer at all, or the offline worker had nothing saved for it
    if (!error.response || isSavedCopy(error.response)) {
      reportOffline();
      if ((error.config?.method || "get").toLowerCase() !== "get") {
        error.message = OFFLINE_SAVE_MESSAGE;
        // Screens show errors.* or message from the response body
        error.response = error.response || { status: 0, data: { message: OFFLINE_SAVE_MESSAGE } };
      }
      return Promise.reject(error);
    }
    reportOnline();
    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default http;
