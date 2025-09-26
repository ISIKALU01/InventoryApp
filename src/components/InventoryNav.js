// components/InventoryNav.js
import Link from "next/link";
import { useRouter } from "next/router";
import { FaEllipsisV } from "react-icons/fa";
import { useState, useEffect } from "react";

export default function InventoryNav() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMedium, setIsMedium] = useState(false);

  const navItems = [
    {
      name: "Product Category",
      path: "/Inventory/product-category",
    },
    {
      name: "View Adjustment",
      path: "/inventory/view-adjustment",
    },
    {
      name: "Stock Requisition",
      path: "/inventory/stock-requisition",
    },
    {
      name: "Manage product/services",
      path: "/inventory/manage-products",
    },
    {
      name: "Inventory",
      path: "/inventory/inventory",
    },
    {
      name: "Purchase Log",
      path: "/inventory/purchase-log",
    },
    {
      name: "Cost of Goods Sold",
      path: "/inventory/cost-of-goods-sold",
    },
  ];

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsMedium(width >= 768 && width < 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
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
              <a
                className={`
                flex items-center px-2 py-1 rounded-md transition-all duration-200 cursor-pointer
                ${
                  router.pathname === item.path
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }
                ${isMedium ? "text-xs" : "text-xs"}
              `}
              >
                <span className="font-medium whitespace-nowrap">
                  {item.name}
                </span>
              </a>
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-700">
            {navItems.find((item) => item.path === router.pathname)?.name ||
              "Inventory"}
          </h3>

          <div className="flex items-center gap-2">
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
                  <a
                    className={`
                    flex items-center px-3 py-2 rounded-md transition-all duration-200
                    ${
                      router.pathname === item.path
                        ? "bg-indigo-100 text-indigo-700 border-l-4 border-indigo-500"
                        : "bg-white text-gray-700 hover:bg-gray-100 border-l-4 border-transparent"
                    }
                  `}
                  >
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