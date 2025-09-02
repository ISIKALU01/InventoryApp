// components/Layout.js
import { useRouter } from 'next/router';
import Sidebar from './Sidebar';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';

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
  if (router.pathname === '/') {
    return <div>{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar onToggle={setIsSidebarOpen} />
      
      {/* Main content - Adjusts based on sidebar state */}
      <div className={`
        flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out
        ${isSidebarOpen && !isMobile ? 'ml-64' : 'ml-0'}
        ${!isSidebarOpen && !isMobile ? 'ml-20' : 'ml-0'}
      `}>
        {/* Top header bar - Centers content when sidebar is closed on desktop */}
        <div className={`
          bg-white border-b border-gray-200 shadow-sm z-10 transition-all duration-300
          ${!isSidebarOpen && !isMobile ? 'ml-0' : ''}
        `}>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-800">
                {router.pathname === '/dashboard' ? 'Dashboard' : 
                 router.pathname === '/transaction' ? 'Transactions' :
                 router.pathname === '/inventory' ? 'Inventory' :
                 router.pathname === '/accounts' ? 'Accounts' :
                 router.pathname === '/deleted-transactions' ? 'Deleted Transactions' :
                 router.pathname === '/settings' ? 'Settings' :
                 router.pathname === '/folio' ? 'Folio' : 'Page'}
              </h1>
            </div>
            
            {/* Add any header buttons or user info here */}
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