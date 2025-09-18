// pages/transaction/sales-summary.js
import { useState, useEffect } from "react";
import TransactionNav from "../../components/TransactionNav";
import {
  FaSearch,
  FaFileExport,
  FaSlidersH,
  FaPlus, FaShoppingCart, FaChartLine
} from "react-icons/fa";

export default function SalesSummary() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Sample data for demonstration
  useEffect(() => {
    // Mock transaction data with complete fields
    const mockTransactions = [
      {
        id: 1,
        product: "Product A",
        date: "2023-10-15",
        time: "14:30",
        baseQty: 125.5,
        amount: 500,
        location: "Main Store",
        postedBy: "Admin User"
      },
      {
        id: 2,
        product: "Product B",
        date: "2023-10-15",
        time: "15:45",
        baseQty: 80.2,
        amount: 320,
        location: "Branch 1",
        postedBy: "Sales Staff 1"
      },
      {
        id: 3,
        product: "Product C",
        date: "2023-10-16",
        time: "10:15",
        baseQty: 200.0,
        amount: 750,
        location: "Online",
        postedBy: "Cashier 1"
      },
    ];
    setTransactions(mockTransactions);
    setFilteredTransactions(mockTransactions);
  }, []);

  // Sample locations and users
  const locations = ["Main Store", "Branch 1", "Branch 2", "Online"];
  const users = ["Admin User", "Sales Staff 1", "Sales Staff 2", "Cashier 1"];

  // Filter transactions based on filters
  useEffect(() => {
    let filtered = transactions;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.product
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          transaction.baseQty
            ?.toString()
            .includes(searchTerm) ||
          transaction.amount?.toString().includes(searchTerm)
      );
    }

    // Apply date filter
    if (selectedDate) {
      filtered = filtered.filter(
        (transaction) => transaction.date === selectedDate
      );
    }

    // Apply location filter
    if (selectedLocation) {
      filtered = filtered.filter(
        (transaction) => transaction.location === selectedLocation
      );
    }

    // Apply user filter
    if (selectedUser) {
      filtered = filtered.filter(
        (transaction) => transaction.postedBy === selectedUser
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, selectedDate, selectedLocation, selectedUser]);

  const exportToCSV = () => {
    const headers = [
      "Product",
      "Date",
      "Time",
      "Quantity",
      "Amount",
    ];
    const csvData = filteredTransactions.map((transaction) => [
      transaction.product,
      transaction.date,
      transaction.time,
      transaction.baseQty,
      `N${transaction.amount.toFixed(2)}`,
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-summary-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDate("");
    setSelectedLocation("");
    setSelectedUser("");
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <div className="max-w-6xl mx-auto pb-16 md:pb-0">
      <h1 className="text-xl font-normal font-raleway text-gray-800 mb-6 hidden md:block">
        Sales Summary
      </h1>
      <TransactionNav />

      <div className="mt-4 space-y-4 px-2 md:px-0">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white rounded shadow p-3">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded mr-2">
                <FaShoppingCart className="text-green-600 text-sm" />
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-600">
                  Products
                </h3>
                <p className="text-lg font-bold text-gray-800">
                  N
                  {transactions
                    .reduce((sum, transaction) => sum + transaction.amount, 0)
                    .toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded mr-2">
                <FaChartLine className="text-red-600 text-sm" />
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-600">
                  Sales
                </h3>
                <p className="text-lg font-bold text-gray-800">
                  N
                  {transactions
                    .reduce((sum, transaction) => sum + transaction.amount, 0)
                    .toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Export */}
        <div className="bg-white rounded shadow p-3">
          <div className="flex flex-col md:flex-row items-stretch gap-3 w-full">
            {/* Left side - Search and filters */}
            <div className="flex flex-col md:flex-row gap-3 flex-grow">
              {/* Search bar and filter button for mobile */}
              {isMobile ? (
                <div className="flex gap-2 w-full">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-2 pr-7 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs"
                    />
                    <FaSearch className="absolute right-2 top-1.5 text-gray-400 text-xs" />
                  </div>

                  <button
                    onClick={toggleFilters}
                    className={`px-3 py-1.5 rounded transition-colors flex items-center text-xs ${
                      showFilters
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-200 text-black hover:bg-gray-300"
                    }`}
                  >
                    <FaSlidersH className="text-xs" />
                  </button>
                </div>
              ) : (
                <>
                  {/* Search bar for desktop */}
                  <div className="w-full md:w-48 relative">
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-2 pr-7 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs"
                    />
                    <FaSearch className="absolute right-2 top-1.5 text-gray-400 text-xs" />
                  </div>

                  {/* Desktop filters */}
                  <div className="flex gap-3">
                    {/* Date filter */}
                    <div className="w-auto">
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs"
                      />
                    </div>

                    {/* Location filter */}
                    <div className="w-auto">
                      <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs"
                      >
                        <option value="">All Locations</option>
                        {locations.map((location) => (
                          <option key={location} value={location}>
                            {location}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* User filter */}
                    <div className="w-auto">
                      <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs"
                      >
                        <option value="">All Users</option>
                        {users.map((user) => (
                          <option key={user} value={user}>
                            {user}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right side - Action buttons (hidden on mobile) */}
            <div className="hidden md:flex gap-2 w-full md:w-auto justify-start md:justify-end">
              <button
                onClick={exportToCSV}
                className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center text-xs"
              >
                <FaFileExport className="mr-1 text-xs" />
                Export
              </button>
            </div>
          </div>

          {/* Filter dropdown for mobile */}
          {isMobile && showFilters && (
            <div className="mt-3 grid grid-cols-1 gap-2 p-2 bg-gray-50 rounded">
              {/* Date filter */}
              <div>
                <label className="block text-xs font-medium text-black mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs"
                />
              </div>

              {/* Location filter */}
              <div>
                <label className="block text-xs font-medium text-black mb-1">
                  Location
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs"
                >
                  <option value="">All Locations</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              {/* User filter */}
              <div>
                <label className="block text-xs font-medium text-black mb-1">
                  User
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs"
                >
                  <option value="">All Users</option>
                  {users.map((user) => (
                    <option key={user} value={user}>
                      {user}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={clearFilters}
                  className="flex-1 px-2 py-1.5 bg-gray-200 text-black rounded hover:bg-gray-300 transition-colors text-xs"
                >
                  Clear Filters
                </button>
                <button
                  onClick={toggleFilters}
                  className="flex-1 px-2 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* sales summary Log Table */}
        <div className="bg-white rounded shadow text-black overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-black">
                      {transaction.product}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      {transaction.date}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      {transaction.time}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      {transaction.baseQty}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-black">
                      N{transaction.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="border-b border-gray-200 p-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-black">
                        {transaction.product}
                      </span>
                      <span className="text-xs text-black">
                        {transaction.time}
                      </span>
                    </div>
                    <div className="text-sm text-black mt-1">
                      Quantity: {transaction.baseQty}
                    </div>
                    <div className="text-sm text-black mt-1">
                      Amount: N{transaction.amount.toFixed(2)}
                    </div>
                    <div className="text-xs text-black mt-1">
                      {transaction.date}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-6">
              <p className="text-black text-xs">There is no data</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <div className="fixed bottom-6 right-6 z-10 md:hidden">
          <button className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors">
            <FaPlus className="text-xl" />
          </button>
        </div>
      )}
    </div>
  );
}