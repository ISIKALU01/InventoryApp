// components/Sidebar.js
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Sidebar({ onToggle }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window !== 'undefined') {
      const checkIfMobile = () => {
        const mobile = window.innerWidth < 900;
        setIsMobile(mobile);
        // On mobile, start with sidebar closed by default
        if (mobile) {
          setIsOpen(false);
        } else {
          setIsOpen(true);
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

  // Notify parent component about sidebar state changes
  useEffect(() => {
    if (onToggle) {
      onToggle(isOpen);
    }
  }, [isOpen, onToggle]);

  // Don't render sidebar on login page
  if (router.pathname === '/') {
    return null;
  }

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Transaction', path: '/transaction', icon: '💸' },
    { name: 'Inventory', path: '/inventory', icon: '📦' },
    { name: 'Accounts', path: '/accounts', icon: '👥' },
    { name: 'Deleted Transactions', path: '/deleted-transactions', icon: '🗑️' },
    { name: 'Settings', path: '/settings', icon: '⚙️' },
    { name: 'Folio', path: '/folio', icon: '📁' },
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Close sidebar when a menu item is clicked on mobile
  const handleMenuItemClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-indigo-800 text-white z-30
        transition-all duration-300 ease-in-out
        ${isOpen ? 'w-64' : (isMobile ? '-translate-x-full' : 'w-20')}
        ${isMobile ? 'shadow-2xl' : 'shadow-xl'}
      `}>
        {/* Logo and toggle button */}
        <div className="flex items-center justify-between p-4 border-b border-indigo-700">
          {isOpen && <h1 className="text-xl font-bold">PGIMS</h1>}
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-lg bg-indigo-900 hover:bg-indigo-700 transition-colors duration-200"
            aria-label="Toggle sidebar"
          >
            {isOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>

        {/* Navigation items */}
        <nav className="mt-6">
          <ul className="space-y-2 px-2">
            {menuItems.map((item) => (
              <li key={item.name}>
                <Link href={item.path}>
                  <div 
                    className={`
                      flex items-center p-3 rounded-lg transition-all duration-200 ease-in-out
                      ${router.pathname === item.path 
                        ? 'bg-indigo-900 text-white shadow-lg' 
                        : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                      }
                      group
                    `}
                    onClick={handleMenuItemClick}
                  >
                    <span className="text-xl flex-shrink-0">{item.icon}</span>
                    {isOpen && (
                      <span className="ml-3 font-medium overflow-hidden whitespace-nowrap">
                        {item.name}
                      </span>
                    )}
                    {/* Tooltip for collapsed state */}
                    {!isOpen && !isMobile && (
                      <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg z-40">
                        {item.name}
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User info at bottom */}
        <div className="absolute bottom-0 w-full p-4 border-t border-indigo-700">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="font-bold">U</span>
            </div>
            {isOpen && (
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium truncate">User Name</p>
                <p className="text-xs text-indigo-300 truncate">Admin</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hamburger menu for mobile */}
      {isMobile && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-20 p-2 rounded-md bg-indigo-800 text-white shadow-lg"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
    </>
  );
}