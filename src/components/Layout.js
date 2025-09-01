// components/Layout.js
import { useRouter } from 'next/router';
import Sidebar from './Sidebar';
import { useSession, signOut } from 'next-auth/react';

export default function Layout({ children }) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top header bar */}
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-800">
                {router.pathname === '/dashboard' ? 'Dashboard' : 
                 router.pathname === '/transaction' ? 'Transactions' :
                 router.pathname === '/inventory' ? 'Inventory' :
                 router.pathname === '/accounts' ? 'Accounts' :
                 router.pathname === '/deleted-transactions' ? 'Deleted Transactions' :
                 router.pathname === '/settings' ? 'Settings' :
                 router.pathname === '/folio' ? 'Folio' : ''}
              </h1>
            </div>
            
          </div>
        
        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}