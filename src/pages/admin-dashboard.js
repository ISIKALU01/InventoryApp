// pages/admin-dashboard.js
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Head from 'next/head';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    if (session.user.role !== 'admin') {
      router.push('/staff-dashboard');
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

  if (!session || session.user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Admin Dashboard - PGIMS</title>
      </Head>
      
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {session.user.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                <p className="text-xs text-gray-600">{session.user.department} • Admin</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium"
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Administrative Controls</h2>
              
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 overflow-hidden shadow rounded-lg p-5 text-white">
                  <h3 className="text-sm font-medium">Total Users</h3>
                  <p className="mt-1 text-3xl font-semibold">42</p>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-purple-700 overflow-hidden shadow rounded-lg p-5 text-white">
                  <h3 className="text-sm font-medium">Inventory Value</h3>
                  <p className="mt-1 text-3xl font-semibold">$24.8K</p>
                </div>
                <div className="bg-gradient-to-r from-pink-500 to-pink-700 overflow-hidden shadow rounded-lg p-5 text-white">
                  <h3 className="text-sm font-medium">Low Stock Items</h3>
                  <p className="mt-1 text-3xl font-semibold">7</p>
                </div>
                <div className="bg-gradient-to-r from-teal-500 to-teal-700 overflow-hidden shadow rounded-lg p-5 text-white">
                  <h3 className="text-sm font-medium">Pending Orders</h3>
                  <p className="mt-1 text-3xl font-semibold">13</p>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Features</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-indigo-600">User Management</h4>
                    <p className="mt-1 text-sm text-gray-500">Create, edit, and manage user accounts and permissions</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-indigo-600">System Settings</h4>
                    <p className="mt-1 text-sm text-gray-500">Configure application settings and preferences</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-indigo-600">Reports & Analytics</h4>
                    <p className="mt-1 text-sm text-gray-500">Generate detailed reports and view analytics</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-indigo-600">Database Management</h4>
                    <p className="mt-1 text-sm text-gray-500">Backup, restore, and maintain database</p>
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