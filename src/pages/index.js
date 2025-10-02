import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import BASE_URL from "../../config";
import {
  setLocalStorage,
  getLocalStorage,
  verifyToken,
} from "../../utils/auth";

// Session verification function (same as in AdminDashboard and StaffDashboard)

const redirectBasedOnRole = (role, router) => {
  switch (role) {
    case "admin":
      router.push("/admin-dashboard");
      break;
    case "staff":
      router.push("/staff-dashboard"); // Changed from "/sales-dashboard"
      break;
    default:
      console.error("Unknown role:", role);
      router.push("/unauthorized");
  }
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if user is already logged in on component mount
  useEffect(() => {
    if (!isClient) return;

    const checkExistingSession = async () => {
      console.log("Checking existing session...");
      const token = getLocalStorage("token");

      if (!token) {
        console.log("No token found");
        return;
      }

      const session = await verifyToken(token);
      console.log("Session check result:", session);

      if (session?.user?.role) {
        console.log(
          "User already logged in, redirecting to:",
          session.user.role
        );
        redirectBasedOnRole(session.user.role, router);
      }
    };

    checkExistingSession();
  }, [router, isClient]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid email or password");
        return;
      }

      // Save the token
      if (data.token) {
        console.log("Saving token...");
        const saveSuccess = setLocalStorage("token", data.token);
        const saveUser = setLocalStorage("user", JSON.stringify(data.user));

        if (saveSuccess && saveUser) {
          console.log("Token and User saved successfully");

          // IMPORTANT: Wait a bit and verify token was saved
          setTimeout(async () => {
            const verifyToken = getLocalStorage("token");
            if (verifyToken) {
              console.log("Token verified in storage, redirecting...");

              // Use the user data from login response directly
              if (data.user?.role) {
                redirectBasedOnRole(data.user.role, router);
              } else {
                // Fallback: fetch user data
                await fetchUserAndRedirect(data.token, router);
              }
            } else {
              setError("Token storage failed. Please try again.");
              setIsLoading(false);
            }
          }, 50);
        }
      } else {
        setError("Authentication failed. No token received.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  // Enhanced fetch user function
  const fetchUserAndRedirect = async (token, router) => {
    try {
      const response = await fetch(`${BASE_URL}/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const userData = await response.json();
        redirectBasedOnRole(userData.role, router);
      } else {
        setError("Failed to fetch user information.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Error fetching user information.");
      setIsLoading(false);
    }
  };

  // Handle Enter key press for form submission
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isLoading) {
      handleSubmit(e);
    }
  };

  // Show loading state while checking client-side
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Image & Features */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-r from-indigo-900 to-purple-800 relative">
        <Image
          src="https://images.unsplash.com/photo-1589156280159-27698a70f29e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1472&q=80"
          alt="Professional woman"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
          width={1472}
          height={980}
          priority
        />
        <div className="absolute inset-0 bg-indigo-900 opacity-80"></div>

        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 w-full">
          <h1 className="text-4xl font-bold mb-6 text-center">
            Inventory Management System
          </h1>
          <p className="text-xl text-center max-w-md">
            Efficiently manage your inventory with our powerful system
          </p>

          <div className="mt-12 space-y-4">
            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 rounded-full p-2 mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <span>Secure authentication</span>
            </div>

            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 rounded-full p-2 mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z"
                  />
                </svg>
              </div>
              <span>Advanced reporting</span>
            </div>

            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 rounded-full p-2 mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <span>User management</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="w-full md:w-1/2 flex items-center justify-center text-black p-4 md:p-8 lg:p-12">
        {/* Mobile background image */}
        <div className="md:hidden fixed inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
            alt="Professional workspace"
            className="absolute inset-0 w-full h-full object-cover filter blur-sm"
            width={1470}
            height={980}
            priority
          />
          <div className="absolute inset-0 bg-black opacity-50"></div>
        </div>

        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl z-10 md:shadow-none md:rounded-none md:bg-transparent">
          <div className="bg-white py-8 px-6 rounded-2xl shadow-lg md:shadow-xl md:px-8">
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center bg-indigo-900 text-white rounded-full w-20 h-20 shadow-lg">
                <span className="text-2xl font-bold">PGIMS</span>
              </div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
              <p className="mt-2 text-gray-600">Sign in to your account</p>
            </div>

            <form
              className="mt-4 space-y-6"
              onSubmit={handleSubmit}
              onKeyPress={handleKeyPress}
            >
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="py-3 pl-10 pr-4 block w-full border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="py-3 pl-10 pr-4 block w-full border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-900 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 ${
                    isLoading
                      ? "opacity-70 cursor-not-allowed"
                      : "transform hover:scale-105"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
