// components/Sidebar.js
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  FaChartPie, 
  FaMoneyBill, 
  FaBoxes, 
  FaUsers, 
  FaTrash, 
  FaCog, 
  FaFolder,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaBars,
  FaList,
  FaChartBar,
  FaCreditCard,
  FaTag,
  FaSlidersH,
  FaTruck,
  FaCube,
  FaShoppingCart,
  FaCalculator,
  FaMoneyCheck,
  FaUniversity,
  FaWallet,
  FaLock,
  FaSignOutAlt,
  FaCalendarTimes,
  FaPrint
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { canAccessPath } from '../../utils/permissions';

export default function Sidebar({ onToggle }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const { user, logout } = useAuth();

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
      
      // Initial checks
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

  const toggleDropdown = (name) => {
    if (openDropdown === name) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(name);
    }
  };

  // Each item needs a permission (see utils/permissions.js). Items the user
  // can't use are hidden; a group shows only when one of its items is visible.
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <FaChartPie className="w-5 h-5" /> },
    { name: 'Authorize users', path: '/authorizeUser', icon: <FaUsers className="w-5 h-5" /> },
    {
      name: 'Transaction',
      icon: <FaMoneyBill className="w-5 h-5" />,
      submenu: [
        { name: 'Sales point', path: '/transaction/sales-invoice', icon: <FaShoppingCart className="w-4 h-4" /> },
        { name: 'Expenses', path: '/transaction/expenses', icon: <FaMoneyBill className="w-4 h-4" /> },
        { name: 'Sales list', path: '/transaction/sales-list', icon: <FaList className="w-4 h-4" /> },
        // Still showing sample data: hidden until connected to the backend
        { name: 'Sales summary', path: '/transaction/sales-summary', icon: <FaChartBar className="w-4 h-4" />, hidden: true },
        { name: 'Payment analysis', path: '/transaction/payment-analysis', icon: <FaCalculator className="w-4 h-4" />, hidden: true },
      ]
    },
    {
      name: 'Inventory',
      icon: <FaBoxes className="w-5 h-5" />,
      submenu: [
        { name: 'Product Category', path: '/inventory/product-category', icon: <FaTag className="w-4 h-4" /> },
        { name: 'Stock Transfers', path: '/inventory/stock-transfers', icon: <FaTruck className="w-4 h-4" /> },
        { name: 'Expiry', path: '/inventory/expiry', icon: <FaCalendarTimes className="w-4 h-4" /> },
        { name: 'Print Labels', path: '/inventory/labels', icon: <FaPrint className="w-4 h-4" /> },
        // Page not built yet
        { name: 'View Adjustment', path: '/inventory/view-adjustment', icon: <FaSlidersH className="w-4 h-4" />, hidden: true },
        { name: 'Manage Product/Service', path: '/inventory/manage-products', icon: <FaCube className="w-4 h-4" /> },
        { name: 'Inventory', path: '/inventory/inventory', icon: <FaBoxes className="w-4 h-4" /> },
        { name: 'Purchase Log', path: '/inventory/purchase-log', icon: <FaShoppingCart className="w-4 h-4" /> },
      ]
    },
    { name: 'Deleted Transactions', path: '/deletedTransactions', icon: <FaTrash className="w-5 h-5" /> },
    { name: 'Settings', path: '/settings', icon: <FaCog className="w-5 h-5" /> },
    {
      name: 'Folio',
      icon: <FaFolder className="w-5 h-5" />,
      submenu: [
        { name: 'Bank Management', path: '/folio/bank-management', icon: <FaUniversity className="w-4 h-4" /> },
        { name: 'Manage Customer', path: '/folio/customer-management', icon: <FaUsers className="w-4 h-4" /> },
        { name: 'Manage Supplier', path: '/folio/supply-management', icon: <FaUsers className="w-4 h-4" /> },
      ]
    },
  ];

  const visibleMenu = menuItems
    .map((item) => item.submenu
      ? { ...item, submenu: item.submenu.filter((sub) => !sub.hidden && canAccessPath(user, sub.path)) }
      : item)
    .filter((item) => item.submenu ? item.submenu.length > 0 : canAccessPath(user, item.path));

  const initials = (user?.name || 'U')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Close sidebar when a menu item is clicked on mobile
  const handleMenuItemClick = () => {
    if (isMobile) {
      setIsOpen(false);
      setOpenDropdown(null);
    }
  };

  // Check if a menu item or any of its submenu items is active
  const isMenuItemActive = (item) => {
    if (item.path) {
      return router.pathname === item.path;
    }
    if (item.submenu) {
      return item.submenu.some(subItem => router.pathname === subItem.path);
    }
    return false;
  };

  return (
    <>
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-indigo-800 text-white z-30
        transition-all duration-300 ease-in-out
        ${isOpen ? 'w-64' : (isMobile ? '-translate-x-full' : 'w-20')}
        ${isMobile ? 'shadow-2xl' : 'shadow-xl'}
        flex flex-col
        scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-indigo-800 scrollbar-thumb-rounded-full
      `}>
        {/* Logo and toggle button */}
        <div className="flex items-center justify-between p-4 border-b border-indigo-700 flex-shrink-0">
          {isOpen && <h1 className="text-xl font-bold">SellaPad</h1>}
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-lg bg-indigo-900 hover:bg-indigo-700 transition-colors duration-200"
            aria-label="Toggle sidebar"
          >
            {isOpen ? (
              <FaChevronLeft className="w-5 h-5" />
            ) : (
              <FaChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation items - Scrollable area */}
        <nav className="mt-6 flex-1 overflow-y-auto">
          <ul className="space-y-2 px-2">
            {visibleMenu.map((item) => {
              const isActive = isMenuItemActive(item);

              return (
                <li key={item.name}>
                  {item.submenu ? (
                    /* Dropdown menu item */
                    <div>
                      <div
                        className={`
                          flex items-center justify-between p-3 rounded-lg transition-all duration-200 ease-in-out cursor-pointer
                          ${isActive
                            ? 'bg-indigo-900 text-white shadow-lg'
                            : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                          }
                        `}
                        onClick={() => toggleDropdown(item.name)}
                      >
                        <div className="flex items-center">
                          <span className="flex-shrink-0">
                            {item.icon}
                          </span>
                          {isOpen && (
                            <span className="ml-3 font-medium overflow-hidden whitespace-nowrap">
                              {item.name}
                            </span>
                          )}
                        </div>
                        {isOpen && (
                          <FaChevronDown
                            className={`w-4 h-4 transition-transform duration-300 ${openDropdown === item.name ? 'rotate-180' : ''}`}
                          />
                        )}
                      </div>

                      {/* Submenu items with smooth transition */}
                      {isOpen && (
                        <div className={`
                          overflow-hidden transition-all duration-500 ease-in-out
                          ${openDropdown === item.name ? 'max-h-96' : 'max-h-0'}
                        `}>
                          <ul className="ml-8 mt-1 space-y-1">
                            {item.submenu.map((subItem) => (
                              <li key={subItem.name}>
                                <Link href={subItem.path}>
                                  <div
                                    className={`
                                      flex items-center p-2 rounded-lg transition-all duration-200 ease-in-out
                                      transform origin-left
                                      ${router.pathname === subItem.path
                                        ? 'bg-indigo-900 text-white shadow-lg scale-105'
                                        : 'text-indigo-100 hover:bg-indigo-700 hover:text-white hover:scale-105'
                                      }
                                    `}
                                    onClick={handleMenuItemClick}
                                  >
                                    <span className="flex-shrink-0">{subItem.icon}</span>
                                    <span className="ml-3 text-sm font-medium overflow-hidden whitespace-nowrap">
                                      {subItem.name}
                                    </span>
                                  </div>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Regular menu item */
                    <Link href={item.path}>
                      <div
                        className={`
                          flex items-center p-3 rounded-lg transition-all duration-200 ease-in-out
                          transform
                          ${isActive
                            ? 'bg-indigo-900 text-white shadow-lg scale-105'
                            : 'text-indigo-100 hover:bg-indigo-700 hover:text-white hover:scale-105'
                          }
                          group
                        `}
                        onClick={handleMenuItemClick}
                      >
                        <span className="flex-shrink-0">{item.icon}</span>
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
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logged-in user and logout */}
        <div className="p-4 border-t border-indigo-700 bg-indigo-800 flex-shrink-0">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0" title={user?.name}>
              <span className="font-bold">{initials}</span>
            </div>
            {isOpen && (
              <div className="ml-3 overflow-hidden flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-indigo-300 truncate">{user?.role_label || user?.role || ''}</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={logout}
            className={`mt-3 w-full flex items-center ${isOpen ? 'justify-start px-3' : 'justify-center'} py-2 rounded-lg text-indigo-100 hover:bg-indigo-700 hover:text-white transition-colors duration-200`}
            aria-label="Log out"
            title="Log out"
          >
            <FaSignOutAlt className="w-4 h-4 flex-shrink-0" />
            {isOpen && <span className="ml-3 text-sm font-medium">Log out</span>}
          </button>
        </div>
      </div>

      {/* Small toggle button for mobile when sidebar is hidden */}
      {isMobile && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-40 p-1.5 rounded-md text-blue-900 shadow-lg transition-colors"
          aria-label="Open menu"
          style={{ 
            width: '32px', 
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FaBars className="w-4 h-4" />
        </button>
      )}

      {/* Add custom scrollbar styles */}
      <style jsx global>{`
        /* Webkit browsers (Chrome, Safari) */
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #3730a3; /* indigo-800 */
          border-radius: 0;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #4f46e5; /* indigo-600 */
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #6366f1; /* indigo-500 */
        }
        
        /* Firefox */
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: #4f46e5 #3730a3; /* thumb and track color */
        }
      `}</style>
    </>
  );
}