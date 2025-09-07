// components/Sidebar.js
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
  FaReceipt,
  FaList,
  FaClipboardCheck,
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
  FaLock
} from 'react-icons/fa';

export default function Sidebar({ onToggle }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

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

  const toggleDropdown = (name) => {
    if (openDropdown === name) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(name);
    }
  };

  // Determine the correct dashboard path based on user role
  const getDashboardPath = () => {
    if (!session || !session.user) return '/dashboard';
    return session.user.role === 'admin' ? '/admin-dashboard' : '/staff-dashboard';
  };

  // Check if current path is a dashboard path
  const isDashboardActive = () => {
    return router.pathname === '/admin-dashboard' || router.pathname === '/staff-dashboard' || router.pathname === '/dashboard';
  };

  const menuItems = [
    { 
      name: 'Dashboard', 
      path: getDashboardPath(), // Dynamic path based on role
      icon: <FaChartPie className="w-5 h-5" />, 
      roles: ['admin', 'staff'] 
    },
    { 
      name: 'Transaction', 
      icon: <FaMoneyBill className="w-5 h-5" />,
      roles: ['admin', 'staff'],
      submenu: [
          { name: 'sales point', path: '/transaction/sales-invoice', icon: <FaShoppingCart className="w-4 h-4" />, roles: ['admin', 'staff'] },
          { name: 'expenses', path: '/transaction/expenses', icon: <FaMoneyBill className="w-4 h-4" />, roles: ['admin', 'staff'] },
          { name: 'payment', path: '/transaction/payment', icon: <FaCreditCard className="w-4 h-4" />, roles: ['admin', 'staff'] },
          { name: 'sales list', path: '/transaction/sales-list', icon: <FaList className="w-4 h-4" />, roles: ['admin', 'staff'] },
          { name: 'sales summary', path: '/transaction/sales-summary', icon: <FaChartBar className="w-4 h-4" />, roles: ['admin', 'staff'] },
          { name: 'payment analysis', path: '/transaction/payment-analysis', icon: <FaCalculator className="w-4 h-4" />, roles: ['admin', 'staff'] }
      ]
    },
    { 
      name: 'Inventory', 
      icon: <FaBoxes className="w-5 h-5" />,
      roles: ['admin'], // Only admin has full access
      submenu: [
        { name: 'Product Category', path: '/inventory/product-category', icon: <FaTag className="w-4 h-4" />, roles: ['admin'] },
        { name: 'View Adjustment', path: '/inventory/view-adjustment', icon: <FaSlidersH className="w-4 h-4" />, roles: ['admin'] },
        { name: 'Stock Requisition', path: '/inventory/stock-requisition', icon: <FaTruck className="w-4 h-4" />, roles: ['admin'] },
        { name: 'Manage Product/Service', path: '/inventory/manage-product', icon: <FaCube className="w-4 h-4" />, roles: ['admin'] },
        { name: 'Inventory', path: '/inventory', icon: <FaBoxes className="w-4 h-4" />, roles: ['admin'] },
        { name: 'Purchase Log', path: '/inventory/purchase-log', icon: <FaShoppingCart className="w-4 h-4" />, roles: ['admin'] },
        { name: 'Cost of Goods Sold', path: '/inventory/cost-of-goods', icon: <FaCalculator className="w-4 h-4" />, roles: ['admin'] },
      ]
    },
    { 
      name: 'Accounts', 
      icon: <FaUsers className="w-5 h-5" />,
      roles: ['admin'], // Only admin has full access
      submenu: [
        { name: 'Cash', path: '/accounts/cash', icon: <FaWallet className="w-4 h-4" />, roles: ['admin'] },
        { name: 'Float Disbursement', path: '/accounts/float-disbursement', icon: <FaCreditCard className="w-4 h-4" />, roles: ['admin'] },
        { name: 'Float', path: '/accounts/float', icon: <FaMoneyCheck className="w-4 h-4" />, roles: ['admin'] },
      ]
    },
    { name: 'Deleted Transactions', path: '/deleted-transactions', icon: <FaTrash className="w-5 h-5" />, roles: ['admin'] }, // Only admin
    { name: 'Settings', path: '/settings', icon: <FaCog className="w-5 h-5" />, roles: ['admin', 'staff'] },
    { 
      name: 'Folio', 
      icon: <FaFolder className="w-5 h-5" />,
      roles: ['admin', 'staff'],
      submenu: [
        { name: 'Bank Management', path: '/folio/bank-management', icon: <FaUniversity className="w-4 h-4" />, roles: ['admin'] },
        { name: 'Manage Customer', path: '/folio/manage-customer', icon: <FaUsers className="w-4 h-4" />, roles: ['admin', 'staff'] },
      ]
    },
  ];

  // Check if user has access to a menu item
  const hasAccess = (item) => {
    if (!session || !session.user) return false;
    return item.roles.includes(session.user.role);
  };

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
      return router.pathname === item.path || (item.name === 'Dashboard' && isDashboardActive());
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
          {isOpen && <h1 className="text-xl font-bold">PGIMS</h1>}
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
            {menuItems.map((item) => {
              const userHasAccess = hasAccess(item);
              const isActive = isMenuItemActive(item);
              const dashboardPath = getDashboardPath();
              
              return (
                <li key={item.name}>
                  {item.submenu ? (
                    /* Dropdown menu item */
                    <div>
                      <div 
                        className={`
                          flex items-center justify-between p-3 rounded-lg transition-all duration-200 ease-in-out
                          ${isActive 
                            ? 'bg-indigo-900 text-white shadow-lg' 
                            : userHasAccess 
                              ? 'text-indigo-100 hover:bg-indigo-700 hover:text-white' 
                              : 'text-indigo-400 cursor-not-allowed'
                          }
                          ${userHasAccess ? 'cursor-pointer' : 'cursor-not-allowed'}
                        `}
                        onClick={() => userHasAccess && toggleDropdown(item.name)}
                      >
                        <div className="flex items-center">
                          <span className="flex-shrink-0">
                            {item.icon}
                            {!userHasAccess && isOpen && (
                              <FaLock className="absolute -top-1 -right-1 w-3 h-3 text-indigo-300" />
                            )}
                          </span>
                          {isOpen && (
                            <span className="ml-3 font-medium overflow-hidden whitespace-nowrap">
                              {item.name}
                              {!userHasAccess && (
                                <span className="ml-2 text-xs text-indigo-300">(Restricted)</span>
                              )}
                            </span>
                          )}
                        </div>
                        {isOpen && userHasAccess && (
                          <FaChevronDown 
                            className={`w-4 h-4 transition-transform duration-300 ${openDropdown === item.name ? 'rotate-180' : ''}`} 
                          />
                        )}
                        {isOpen && !userHasAccess && (
                          <FaLock className="w-3 h-3 text-indigo-300" />
                        )}
                      </div>
                      
                      {/* Submenu items with smooth transition */}
                      {isOpen && userHasAccess && (
                        <div className={`
                          overflow-hidden transition-all duration-500 ease-in-out
                          ${openDropdown === item.name ? 'max-h-96' : 'max-h-0'}
                        `}>
                          <ul className="ml-8 mt-1 space-y-1">
                            {item.submenu.map((subItem) => {
                              const subUserHasAccess = hasAccess(subItem);
                              
                              return (
                                <li key={subItem.name}>
                                  {subUserHasAccess ? (
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
                                  ) : (
                                    <div 
                                      className={`
                                        flex items-center p-2 rounded-lg transition-all duration-200
                                        text-indigo-400 cursor-not-allowed
                                      `}
                                    >
                                      <span className="flex-shrink-0">{subItem.icon}</span>
                                      <span className="ml-3 text-sm font-medium overflow-hidden whitespace-nowrap">
                                        {subItem.name}
                                        <FaLock className="ml-2 inline w-3 h-3" />
                                      </span>
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Regular menu item - Special handling for Dashboard */
                    userHasAccess ? (
                      <Link href={item.name === 'Dashboard' ? dashboardPath : item.path}>
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
                    ) : (
                      <div 
                        className={`
                          flex items-center p-3 rounded-lg transition-all duration-200
                          text-indigo-400 cursor-not-allowed
                          group
                        `}
                      >
                        <span className="flex-shrink-0">
                          {item.icon}
                          {isOpen && (
                            <FaLock className="absolute -top-1 -right-1 w-3 h-3 text-indigo-300" />
                          )}
                        </span>
                        {isOpen && (
                          <span className="ml-3 font-medium overflow-hidden whitespace-nowrap">
                            {item.name}
                            <span className="ml-2 text-xs text-indigo-300">(Restricted)</span>
                          </span>
                        )}
                        {/* Tooltip for collapsed state */}
                        {!isOpen && !isMobile && (
                          <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg z-40">
                            {item.name} (Restricted)
                          </div>
                        )}
                      </div>
                    )
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User info at bottom */}
        <div className="p-4 border-t border-indigo-700 bg-indigo-800 flex-shrink-0">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="font-bold">U</span>
            </div>
            {isOpen && (
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium truncate">{session?.user?.name || 'User Name'}</p>
                <p className="text-xs text-indigo-300 truncate capitalize">{session?.user?.role || 'User'}</p>
              </div>
            )}
          </div>
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