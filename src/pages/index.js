import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { FaShieldAlt, FaChartBar, FaUsers, FaBox, FaEnvelope, FaLock } from "react-icons/fa";
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
      router.push("/dashboard");
      break;
    case "staff":
      router.push("/dashboard"); // Changed from "/sales-dashboard"
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
              <div className="bg-blue bg-opacity-20 rounded-full p-2 mr-4">
                <FaShieldAlt className="h-6 w-6" />
              </div>
              <span>Secure authentication</span>
            </div>

            <div className="flex items-center">
              <div className="bg-blue bg-opacity-20 rounded-full p-2 mr-4">
                <FaChartBar className="h-6 w-6" />
              </div>
              <span>Advanced reporting</span>
            </div>

            <div className="flex items-center">
              <div className="bg-blue bg-opacity-20 rounded-full p-2 mr-4">
                <FaUsers className="h-6 w-6" />
              </div>
              <span>User management</span>
            </div>

            <div className="flex items-center">
              <div className="bg-blue bg-opacity-20 rounded-full p-2 mr-4">
                <FaBox className="h-6 w-6" />
              </div>
              <span>Inventory tracking</span>
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
              <h2 className="text-3xl font-bold text-gray-900">Welcome</h2>
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
                    <FaEnvelope className="h-5 w-5 text-gray-400" />
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
                    <FaLock className="h-5 w-5 text-gray-400" />
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