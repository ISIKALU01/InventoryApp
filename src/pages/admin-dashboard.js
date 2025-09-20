// pages/admin-dashboard.js
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Head from "next/head";
import InventorySummary from "@/components/InventorySummary";
import SalesAnalysis from "@/components/SalesAnalysis";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    if (session.user.role !== "admin") {
      router.push("/staff-dashboard");
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session || session.user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Admin Dashboard - PGIMS</title>
      </Head>

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-raleway">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 sm:py-0 sm:h-16">
            <div className="mb-4 sm:mb-0 text-center sm:text-left">
              <p className="text-xl text-gray-600">
                Welcome back, {session.user.name}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="text-center sm:text-right">
                <p className="text-sm font-medium text-gray-900">
                  {session.user.name}
                </p>
                <p className="text-xs text-gray-600">
                  {session.user.department} • Admin
                </p>
              </div>
              <button
                onClick={() =>
                  signOut({ callbackUrl: `${window.location.origin}/` })
                }
                className="bg-indigo-600 text-white px-4 py-2 cursor-pointer rounded-md text-sm font-medium w-full 
                sm:w-auto"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Administrative Controls
              </h2>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 overflow-hidden shadow rounded-lg p-5 text-white">
                  <h3 className="text-sm font-medium">Sales for today</h3>
                  <p className="mt-1 text-3xl font-semibold">N27,400</p>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-purple-700 overflow-hidden shadow rounded-lg p-5 text-white">
                  <h3 className="text-sm font-medium">Cost of goods sold</h3>
                  <p className="mt-1 text-3xl font-semibold">N24,400</p>
                </div>
                <div className="bg-gradient-to-r from-pink-500 to-pink-700 overflow-hidden shadow rounded-lg p-5 text-white">
                  <h3 className="text-sm font-medium">Expenses for today</h3>
                  <p className="mt-1 text-3xl font-semibold">N7,000</p>
                </div>
                <div className="bg-gradient-to-r from-teal-500 to-teal-700 overflow-hidden shadow rounded-lg p-5 text-white">
                  <h3 className="text-sm font-medium">Profit for today</h3>
                  <p className="mt-1 text-3xl font-semibold">N13,000</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <SalesAnalysis />
            <InventorySummary />
          </div>
        </div>
      </main>
    </div>
  );
}
