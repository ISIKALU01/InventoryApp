// pages/staff-dashboard.js
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Head from 'next/head';

export default function StaffDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    if (session.user.role === 'admin') {
      router.push('/admin-dashboard');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session || session.user.role === 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Staff Dashboard - PGIMS</title>
      </Head>
      
      <header className="bg-green-600 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-white">Staff Dashboard</h1>
              <p className="text-sm text-green-100">Welcome back, {session.user.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right text-white">
                <p className="text-sm font-medium">{session.user.name}</p>
                <p className="text-xs">{session.user.department}</p>
              </div>
              <button onClick={() => signOut({ callbackUrl: `${window.location.origin}/` })}               
               className="bg-white text-green-700 px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Inventory Overview</h2>
              
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <div className="bg-gradient-to-r from-green-500 to-green-600 overflow-hidden shadow rounded-lg p-5 text-white">
                  <h3 className="text-sm font-medium">Total Items</h3>
                  <p className="mt-1 text-3xl font-semibold">1,248</p>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 overflow-hidden shadow rounded-lg p-5 text-white">
                  <h3 className="text-sm font-medium">Categories</h3>
                  <p className="mt-1 text-3xl font-semibold">24</p>
                </div>
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 overflow-hidden shadow rounded-lg p-5 text-white">
                  <h3 className="text-sm font-medium">Low Stock</h3>
                  <p className="mt-1 text-3xl font-semibold">17</p>
                </div>
                <div className="bg-gradient-to-r from-red-500 to-red-600 overflow-hidden shadow rounded-lg p-5 text-white">
                  <h3 className="text-sm font-medium">Out of Stock</h3>
                  <p className="mt-1 text-3xl font-semibold">5</p>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Staff Actions</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-green-600">Manage Inventory</h4>
                    <p className="mt-1 text-sm text-gray-500">View, add, and update inventory items</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-green-600">Process Orders</h4>
                    <p className="mt-1 text-sm text-gray-500">Manage customer orders and fulfillment</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-green-600">View Reports</h4>
                    <p className="mt-1 text-sm text-gray-500">Access sales and inventory reports</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-green-600">Supplier Management</h4>
                    <p className="mt-1 text-sm text-gray-500">Manage supplier information and orders</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}