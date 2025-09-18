// pages/transaction/payment-analysis.js
import { useState, useEffect } from "react";
import TransactionNav from "../../components/TransactionNav";
import {
  FaSearch,
  FaFileExport,
  FaSlidersH,
  FaBalanceScale,
  FaArrowUp,
  FaMoneyBill,
  FaArrowDown,
  FaUndo,
} from "react-icons/fa";

export default function PaymentAnalysis() {
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
    // Mock transaction data matching the structure
    const mockTransactions = [
      {
        id: 1,
        paymentMethod: "Cash",
        salesPayment: 1500.00,
        paidIn: 1500.00,
        paidOut: 0.00,
        cashBack: 0.00,
        balance: 1500.00,
        date: "2023-10-15",
        time: "14:30",
        postedBy: "Cashier 1"
      },
      {
        id: 2,
        paymentMethod: "Card",
        salesPayment: 2500.00,
        paidIn: 2500.00,
        paidOut: 0.00,
        cashBack: 0.00,
        balance: 2500.00,
        date: "2023-10-15",
        time: "15:45",
        postedBy: "Sales Staff 1"
      },
      {
        id: 3,
        paymentMethod: "Transfer",
        salesPayment: 3500.00,
        paidIn: 3500.00,
        paidOut: 0.00,
        cashBack: 0.00,
        balance: 3500.00,
        date: "2023-10-16",
        time: "10:15",
        postedBy: "Admin User"
      }
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
          transaction.paymentMethod
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          transaction.postedBy
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          transaction.salesPayment?.toString().includes(searchTerm) ||
          transaction.paidIn?.toString().includes(searchTerm) ||
          transaction.paidOut?.toString().includes(searchTerm) ||
          transaction.cashBack?.toString().includes(searchTerm) ||
          transaction.balance?.toString().includes(searchTerm)
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
      "Payment Method",
      "Sales Payment",
      "Paid In",
      "Paid Out",
      "Cash Back",
      "Balance",
      "Date",
      "Time",
      "Posted By"
    ];
    const csvData = filteredTransactions.map((transaction) => [
      transaction.paymentMethod,
      `N${transaction.salesPayment.toFixed(2)}`,
      `N${transaction.paidIn.toFixed(2)}`,
      `N${transaction.paidOut.toFixed(2)}`,
      `N${transaction.cashBack.toFixed(2)}`,
      `N${transaction.balance.toFixed(2)}`,
      transaction.date,
      transaction.time,
      transaction.postedBy,
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payment-analysis-report-${
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

  // Calculate summary values
  const summary = {
    salesPayment: transactions.reduce((sum, transaction) => sum + transaction.salesPayment, 0),
    paidIn: transactions.reduce((sum, transaction) => sum + transaction.paidIn, 0),
    paidOut: transactions.reduce((sum, transaction) => sum + transaction.paidOut, 0),
    cashBack: transactions.reduce((sum, transaction) => sum + transaction.cashBack, 0),
    balance: transactions.reduce((sum, transaction) => sum + transaction.balance, 0)
  };

  return (
    <div className="max-w-6xl mx-auto pb-16 md:pb-0">
      <h1 className="text-xl font-normal font-raleway text-gray-800 mb-6 hidden md:block">
        Payment Analysis
      </h1>
      <TransactionNav />

      <div className="mt-4 space-y-4 px-2 md:px-0">
        {/* Summary Cards */}
        <div className="">
          <div className="bg-white rounded shadow p-2">
            <div className="flex flex-col sm:flex-row sm:flex-nowrap sm:overflow-x-auto gap-2 sm:justify-between sm:space-x-1 md:space-x-2">
              {/* Sales Payment Card */}
              <div className="flex-1 sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] p-2 md:p-3 rounded">
                <div className="flex items-center">
                  <div className="p-1 md:p-1.5 bg-blue-100 rounded mr-1 md:mr-2">
                    <FaMoneyBill className="text-blue-600 text-xs md:text-sm" />
                  </div>
                  <div>
                    <h3 className="text-[10px] md:text-xs font-medium text-gray-600">
                      Sales Payment
                    </h3>
                    <p className="text-sm md:text-lg font-bold text-gray-800">
                      N{summary.salesPayment.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Paid In Card */}
              <div className="flex-1 sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] p-2 md:p-3 rounded">
                <div className="flex items-center">
                  <div className="p-1 md:p-1.5 bg-green-100 rounded mr-1 md:mr-2">
                    <FaArrowDown className="text-green-600 text-xs md:text-sm" />
                  </div>
                  <div>
                    <h3 className="text-[10px] md:text-xs font-medium text-gray-600">
                      Paid In
                    </h3>
                    <p className="text-sm md:text-lg font-bold text-gray-800">
                      N{summary.paidIn.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Paid Out Card */}
              <div className="flex-1 sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] p-2 md:p-3 rounded">
                <div className="flex items-center">
                  <div className="p-1 md:p-1.5 bg-red-100 rounded mr-1 md:mr-2">
                    <FaArrowUp className="text-red-600 text-xs md:text-sm" />
                  </div>
                  <div>
                    <h3 className="text-[10px] md:text-xs font-medium text-gray-600">
                      Paid Out
                    </h3>
                    <p className="text-sm md:text-lg font-bold text-gray-800">
                      N{summary.paidOut.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cash Back Card */}
              <div className="flex-1 sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] p-2 md:p-3 rounded">
                <div className="flex items-center">
                  <div className="p-1 md:p-1.5 bg-purple-100 rounded mr-1 md:mr-2">
                    <FaUndo className="text-purple-600 text-xs md:text-sm" />
                  </div>
                  <div>
                    <h3 className="text-[10px] md:text-xs font-medium text-gray-600">
                      Cash Back
                    </h3>
                    <p className="text-sm md:text-lg font-bold text-gray-800">
                      N{summary.cashBack.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Balance Card */}
              <div className="flex-1 sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] p-2 md:p-3 rounded">
                <div className="flex items-center">
                  <div className="p-1 md:p-1.5 bg-yellow-100 rounded mr-1 md:mr-2">
                    <FaBalanceScale className="text-yellow-600 text-xs md:text-sm" />
                  </div>
                  <div>
                    <h3 className="text-[10px] md:text-xs font-medium text-gray-600">
                      Balance
                    </h3>
                    <p className="text-sm md:text-lg font-bold text-gray-800">
                      N{summary.balance.toFixed(2)}
                    </p>
                  </div>
                </div>
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
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
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
                <label className="block text-xs font-medium text-gray-700 mb-1">
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
                <label className="block text-xs font-medium text-gray-700 mb-1">
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
                <label className="block text-xs font-medium text-gray-700 mb-1">
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
                  className="flex-1 px-2 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-xs"
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

        {/* Payment Analysis Log Table */}
        <div className="bg-white rounded shadow overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block text-black overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Sales Payment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Paid In
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Paid Out
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Cash Back
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-black">
                      {transaction.paymentMethod}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      N{transaction.salesPayment.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      N{transaction.paidIn.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      N{transaction.paidOut.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      N{transaction.cashBack.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      N{transaction.balance.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden text-black">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="border-b border-gray-200 p-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-black">
                        {transaction.paymentMethod}
                      </span>
                      <span className="text-xs text-black">
                        {transaction.time}
                      </span>
                    </div>
                    <div className="text-sm text-black mt-1">
                      Sales: N{transaction.salesPayment.toFixed(2)}
                    </div>
                    <div className="text-sm text-black mt-1">
                      Paid In: N{transaction.paidIn.toFixed(2)}
                    </div>
                    <div className="text-sm text-black mt-1">
                      Paid Out: N{transaction.paidOut.toFixed(2)}
                    </div>
                    <div className="text-sm text-black mt-1">
                      Cash Back: N{transaction.cashBack.toFixed(2)}
                    </div>
                    <div className="text-sm text-black mt-1">
                      Balance: N{transaction.balance.toFixed(2)}
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
    </div>
  );
}