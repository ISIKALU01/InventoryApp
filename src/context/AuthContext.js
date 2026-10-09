// Logged-in user and their permissions, shared by every page.
//
// On load it asks the backend for the current user (GET /user), so a role
// an admin changed shows up on the next page load, not the next login.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import http from "../../services/http";
import { getLocalStorage, removeLocalStorage, setLocalStorage } from "../../utils/auth";
import { hasPermission } from "../../utils/permissions";

const AuthContext = createContext(null);

const readCachedUser = () => {
  try {
    const cached = getLocalStorage("user");
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

const clearSession = () => {
  removeLocalStorage("token");
  removeLocalStorage("user");
};

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  // "loading" until we know who is logged in, then "ready" or "guest"
  const [status, setStatus] = useState("loading");

  const refresh = useCallback(async () => {
    if (!getLocalStorage("token")) {
      setUser(null);
      setStatus("guest");
      return null;
    }

    try {
      const { data } = await http.get("/user");
      setLocalStorage("user", JSON.stringify(data));
      setUser(data);
      setStatus("ready");
      return data;
    } catch (error) {
      if (error.response?.status === 401) {
        clearSession();
        setUser(null);
        setStatus("guest");
        return null;
      }
      // Backend unreachable: carry on with the last known user. The backend
      // still checks every request once it is back.
      const cached = readCachedUser();
      setUser(cached);
      setStatus(cached ? "ready" : "guest");
      return cached;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // An admin may change a role's permissions while this tab is open: check
  // again when the user comes back to the tab, at most once a minute
  useEffect(() => {
    let lastCheck = Date.now();
    const onFocus = () => {
      if (Date.now() - lastCheck < 60_000 || !getLocalStorage("token")) return;
      lastCheck = Date.now();
      refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  // Called by the login page once the backend accepts the password
  const startSession = useCallback((token, sessionUser) => {
    setLocalStorage("token", token);
    setLocalStorage("user", JSON.stringify(sessionUser));
    setUser(sessionUser);
    setStatus("ready");
  }, []);

  const logout = useCallback(async () => {
    try {
      // Revoke the token on the server, not just in this browser
      await http.post("/logout");
    } catch {
      // Already expired or offline: clearing it locally is still right
    }
    clearSession();
    setUser(null);
    setStatus("guest");
    if (typeof window !== "undefined") {
      sessionStorage.setItem("isLogout", "true");
    }
    router.replace("/");
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      status,
      can: (permission) => hasPermission(user, permission),
      refresh,
      startSession,
      logout,
    }),
    [user, status, refresh, startSession, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
