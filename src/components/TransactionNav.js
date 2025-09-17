// components/TransactionNav.js
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  FaEllipsisV
} from 'react-icons/fa';
import { useState, useEffect } from 'react';

export default function TransactionNav({ onQueueOrder, onRecallOrder, queuedOrdersCount }) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMedium, setIsMedium] = useState(false);
  
  const navItems = [
    { 
      name: 'Sales Point', 
      path: '/transaction/sales-invoice'
    },
    { 
      name: 'Expenses', 
      path: '/transaction/expenses'
    },
    { 
      name: 'Payment', 
      path: '/transaction/payments'
    },
    { 
      name: 'Sales List', 
      path: '/transaction/sales-list'
    },
    { 
      name: 'Sales Summary', 
      path: '/transaction/sales-summary'
    },
    { 
      name: 'Payment Analysis', 
      path: '/transaction/payment-analysis'
    },
  ];

  // Check if current page is Sales Point
  const isSalesPoint = router.pathname === '/transaction/sales-invoice';

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsMedium(width >= 768 && width < 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [router.pathname]);

  return (
    <div className="bg-white p-2 rounded-lg shadow-md">
      {/* Desktop Layout */}
      <div className="hidden md:flex flex-wrap items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {navItems.map((item) => (
            <Link key={item.name} href={item.path} legacyBehavior>
              <a className={`
                flex items-center px-2 py-1 rounded-md transition-all duration-200 cursor-pointer
                ${router.pathname === item.path 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
                ${isMedium ? 'text-xs' : 'text-xs'}
              `}>
                <span className="font-medium whitespace-nowrap">{item.name}</span>
              </a>
            </Link>
          ))}
        </div>
        
        {/* Only show Queue/Recall buttons on Sales Point page */}
        {isSalesPoint && (
          <div className="flex gap-0 font-raleway">
            <button 
              onClick={onQueueOrder}
              disabled={queuedOrdersCount >= 3}
              className={`
                flex items-center px-2 py-1 text-xs font-medium
                border border-gray-300 rounded-l-md transition-all duration-200
                ${queuedOrdersCount >= 3 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-800'
                }
              `}
            >
              Queue Order {queuedOrdersCount > 0 && `(${queuedOrdersCount}/3)`}
            </button>
            <button 
              onClick={onRecallOrder}
              disabled={queuedOrdersCount === 0}
              className={`
                flex items-center px-2 py-1 text-xs font-medium
                border border-gray-300 border-l-0 rounded-r-md transition-all duration-200
                ${queuedOrdersCount === 0 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-800'
                }
              `}
            >
              Recall Order
            </button>
          </div>
        )}
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-700">
            {navItems.find(item => item.path === router.pathname)?.name || 'Transaction'}
          </h3>
          
          <div className="flex items-center gap-2">
            {/* Only show Queue/Recall buttons on Sales Point page */}
            {isSalesPoint && (
              <>
                <button 
                  onClick={onQueueOrder}
                  disabled={queuedOrdersCount >= 3}
                  className={`
                    flex items-center px-2 py-1 text-xs font-medium
                    border border-gray-300 rounded-md transition-all duration-200
                    ${queuedOrdersCount >= 3 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-800'
                    }
                  `}
                >
                  Queue {queuedOrdersCount > 0 && `(${queuedOrdersCount})`}
                </button>
                <button 
                  onClick={onRecallOrder}
                  disabled={queuedOrdersCount === 0}
                  className={`
                    flex items-center px-2 py-1 text-xs font-medium
                    border border-gray-300 rounded-md transition-all duration-200
                    ${queuedOrdersCount === 0 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-800'
                    }
                  `}
                >
                  Recall
                </button>
              </>
            )}
            
            {/* Three-dotted menu button on the right */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              <FaEllipsisV className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="mt-3 bg-gray-50 rounded-lg shadow-inner p-2">
            <div className="grid grid-cols-1 gap-1">
              {navItems.map((item) => (
                <Link key={item.name} href={item.path} legacyBehavior>
                  <a className={`
                    flex items-center px-3 py-2 rounded-md transition-all duration-200
                    ${router.pathname === item.path 
                      ? 'bg-indigo-100 text-indigo-700 border-l-4 border-indigo-500' 
                      : 'bg-white text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
                    }
                  `}>
                    <span className="text-xs font-medium">{item.name}</span>
                  </a>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}