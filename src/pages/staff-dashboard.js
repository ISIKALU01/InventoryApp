// staff-dashboard.js
import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import InventorySummary from "@/components/InventorySummary";
import SalesAnalysis from "@/components/SalesAnalysis";
import Trend from "@/components/TrendChart";
import TopCategory from "@/components/TopCatgry";
import { getLocalStorage, removeLocalStorage, verifyToken } from "../../utils/auth";

export default function StaffDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      console.log("🔐 Starting staff auth check...");

      // Check if we're in the browser environment
      if (typeof window === "undefined") {
        setLoading(false);
        return;
      }

      const token = getLocalStorage("token");
      console.log("📝 Token found:", !!token);

      if (!token) {
        console.log("❌ No token found, redirecting to login");
        router.push("/");
        return;
      }

      try {
        console.log("🔄 Verifying token with backend...");
        const session = await verifyToken(token);

        if (!session || !session.user) {
          console.log("❌ Token verification failed");
          removeLocalStorage("token");
          router.push("/");
          return;
        }

        const userData = session.user;
        console.log("✅ User verified:", userData.role);

        // Check if user has staff role
        if (userData.role !== "staff") {
          console.log("🔀 User is not staff, redirecting based on role:", userData.role);
          if (userData.role === "admin") {
            router.push("/admin-dashboard");
          } else {
            router.push("/unauthorized");
          }
          return;
        }

        console.log("🎉 Staff user authenticated successfully");
        setUser(userData);
      } catch (error) {
        console.error("❌ Staff authentication check failed:", error);
        removeLocalStorage("token");
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    console.log("🚪 Staff logging out...");
    removeLocalStorage("token");
    removeLocalStorage("user");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if no user (will redirect in useEffect)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Staff Dashboard - PGIMS</title>
      </Head>

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-raleway">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 sm:py-0 sm:h-16">
            <div className="mb-4 sm:mb-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user.name}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="text-center sm:text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-600">
                  {user.department || "Sales"} • Staff
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-green-600 text-white px-4 py-2 cursor-pointer rounded-md text-sm font-medium w-full 
                sm:w-auto hover:bg-green-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Sales Overview Cards */}
          <div className="bg-white overflow-hidden shadow mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Sales Overview
              </h2>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <div className="bg-gradient-to-r from-green-500 to-green-700 overflow-hidden shadow rounded-lg p-5 text-white">
                  <h3 className="text-sm font-medium">Today&apos Sales</h3>
                  <p className="mt-1 text-3xl font-semibold">N27,400</p>
                  <p className="text-xs opacity-90 mt-1">+12% from yesterday</p>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-blue-700 overflow-hidden shadow rounded-lg p-5 text-white">
                  <h3 className="text-sm font-medium">Orders Processed</h3>
                  <p className="mt-1 text-3xl font-semibold">42</p>
                  <p className="text-xs opacity-90 mt-1">+5 from yesterday</p>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-purple-700 overflow-hidden shadow rounded-lg p-5 text-white">
                  <h3 className="text-sm font-medium">Avg. Order Value</h3>
                  <p className="mt-1 text-3xl font-semibold">N652</p>
                  <p className="text-xs opacity-90 mt-1">+3.2% increase</p>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-orange-700 overflow-hidden shadow rounded-lg p-5 text-white">
                  <h3 className="text-sm font-medium">Inventory Alerts</h3>
                  <p className="mt-1 text-3xl font-semibold">3</p>
                  <p className="text-xs opacity-90 mt-1">Items low in stock</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 mb-8">
            <SalesAnalysis />
            <InventorySummary />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
            <Trend />
            <TopCategory />
          </div>

          {/* Quick Actions Section */}
          <div className="mt-8 bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button className="bg-green-50 hover:bg-green-100 text-green-700 px-4 py-3 rounded-md text-sm font-medium transition-colors border border-green-200">
                  New Sale
                </button>
                <button className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-md text-sm font-medium transition-colors border border-blue-200">
                  Check Inventory
                </button>
                <button className="bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-3 rounded-md text-sm font-medium transition-colors border border-purple-200">
                  Customer Lookup
                </button>
                <button className="bg-orange-50 hover:bg-orange-100 text-orange-700 px-4 py-3 rounded-md text-sm font-medium transition-colors border border-orange-200">
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}