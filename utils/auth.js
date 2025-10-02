import BASE_URL from "../config";

// Safe localStorage utilities
export const getLocalStorage = (key) => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(key);
    }
    return null;
  };
  
  export const setLocalStorage = (key, value) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, value);
      return true;
    }
    return false;
  };
  
  export const removeLocalStorage = (key) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key);
    }
  };
  
  // Session verification
  export const verifyToken = async (token) => {
    try {
      if (!token) return null;
  
      const response = await fetch(`${BASE_URL}/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
  
      if (response.ok) {
        const userData = await response.json();
        return { user: userData };
      }
      return null;
    } catch (error) {
      console.error("Token verification failed:", error);
      return null;
    }
  };
  
  // Check if user is authenticated
  export const checkAuth = async () => {
    const token = getLocalStorage("token");
    if (!token) return { isAuthenticated: false, user: null };
    
    const session = await verifyToken(token);
    return {
      isAuthenticated: !!session?.user,
      user: session?.user || null
    };
  };