// components/Layout.js
import { useRouter } from 'next/router';
import Sidebar from './Sidebar';
import InboxBell from './InboxBell';
import { useState, useEffect } from 'react';

// Pages of the supplier-to-payment flow (they live under /inventory and /folio)
const PURCHASING_PAGES = [
  '/folio/supply-management', '/inventory/requisitions', '/inventory/purchase-log', '/inventory/goods-received',
  '/inventory/sor', '/folio/supplier-payments', '/inventory/follow-up',
];

export default function Layout({ children }) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window !== 'undefined') {
      const checkIfMobile = () => {
        const mobile = window.innerWidth < 900;
        setIsMobile(mobile);
        // On mobile, start with sidebar closed by default
        if (mobile) {
          setIsSidebarOpen(false);
        }
      };
      
      // Initial check
      checkIfMobile();
      
      // Add event listener for window resize
      window.addEventListener('resize', checkIfMobile);
      
      // Cleanup
      return () => window.removeEventListener('resize', checkIfMobile);
    }
  }, []);

  // Don't render layout on login page
  // The login page and the card machine screen have no sidebar or top bar
  if (router.pathname === '/' || router.pathname === '/pos-device') {
    return <div>{children}</div>;
  }

  return (
    <div className="app-shell flex min-h-screen bg-gray-100">
      <Sidebar onToggle={setIsSidebarOpen} />
      
      {/* Main content - Adjusts based on sidebar state */}
      <div className={`
        app-content flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ease-in-out
        ${isSidebarOpen && !isMobile ? 'ml-64' : 'ml-0'}
        ${!isSidebarOpen && !isMobile ? 'ml-20' : 'ml-0'}
      `}>
        {/* Top header bar - Centers content when sidebar is closed on desktop */}
        <div className={`
          bg-white border-b border-gray-200 shadow-sm z-10 transition-all duration-300
          ${!isSidebarOpen && !isMobile ? 'ml-0' : ''}
        `}>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center justify-center lg:justify-start w-full lg:w-auto">
              <h1 className="text-xl font-normal font-raleway text-gray-800 text-center md:text-left">
                {router.pathname === '/dashboard' ? 'Dashboard' : 
                router.pathname === '/admin-dashboard' ? 'Admin Dashboard' :
                router.pathname === '/staff-dashboard' ? 'Staff Dashboard' :
                router.pathname === '/authorizeUser' ? 'User Management' :
                router.pathname === '/team' ? 'User Management' :
                PURCHASING_PAGES.includes(router.pathname) ? 'Purchasing' :
                router.pathname.startsWith('/transaction/') ? 'Sales' :
                router.pathname.startsWith('/inventory/') ? 'Inventory' :
                router.pathname === '/accounts' ? 'Accounts' :
                router.pathname === '/deletedTransactions' ? 'Sales' :
                router.pathname === '/settings' ? 'Settings' :
                router.pathname === '/inbox' ? 'Inbox' :
                router.pathname.startsWith('/folio') ? 'Folio' : ''}
              </h1>
            </div>
            <InboxBell />
          </div>
        </div>
        
        {/* Page content - Centers when sidebar is closed on desktop */}
        <main className={`
          flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 transition-all duration-300
          ${!isSidebarOpen && !isMobile ? 'max-w-6xl mx-auto w-full' : ''}
        `}>
          {children}
        </main>
      </div>
    </div>
  );
}