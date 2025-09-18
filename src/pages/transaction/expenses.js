// pages/transaction/expenses.js
import { useState, useEffect } from "react";
import TransactionNav from "../../components/TransactionNav";
import {
  FaSearch,
  FaFileExport,
  FaSlidersH,
  FaPlus,
  FaBuilding,
  FaTimes,
} from "react-icons/fa";

export default function Expenses() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  // Expense form data
  const [expenseFormData, setExpenseFormData] = useState({
    description: "",
    category: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    postedBy: "Admin User",
    location: ""
  });

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
        description: "Office Supplies",
        category: "direct expenses",
        postedBy: "Admin User",
        amount: 3000,
        date: "2023-10-15",
        time: "14:30",
      },
      {
        id: 2,
        description: "Equipment Maintenance",
        category: "operational expenses",
        postedBy: "Admin User",
        amount: 3000,
        date: "2023-10-16",
        time: "10:15",
      },
      {
        id: 3,
        description: "Software License",
        category: "IT expenses",
        postedBy: "Admin User",
        amount: 3000,
        date: "2023-10-17",
        time: "16:45",
      },
    ];
    setTransactions(mockTransactions);
    setFilteredTransactions(mockTransactions);
  }, []);

  // Sample locations and users
  const locations = ["Main Store", "Branch 1", "Branch 2", "Online"];
  const users = ["Admin User", "Sales Staff 1", "Sales Staff 2", "Cashier 1"];
  const categories = ["direct expenses", "operational expenses", "IT expenses", "marketing expenses", "administrative expenses"];

  // Filter transactions based on filters
  useEffect(() => {
    let filtered = transactions;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          transaction.category
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          transaction.postedBy
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
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
      "Description",
      "Category",
      "Amount",
      "Date",
      "Time",
      "Posted By",
    ];
    const csvData = filteredTransactions.map((transaction) => [
      transaction.description,
      transaction.category,
      `N${transaction.amount.toFixed(2)}`,
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
    link.download = `expenses-report-${
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

  const handleMakeExpense = () => {
    setShowExpenseForm(true);
  };

  const handleCloseExpenseForm = () => {
    setShowExpenseForm(false);
    setExpenseFormData({
      description: "",
      category: "",
      amount: "",
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      postedBy: "Admin User",
      location: ""
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setExpenseFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitExpense = (e) => {
    e.preventDefault();
    
    const newExpense = {
      id: transactions.length + 1,
      description: expenseFormData.description,
      category: expenseFormData.category,
      postedBy: expenseFormData.postedBy,
      amount: parseFloat(expenseFormData.amount),
      date: expenseFormData.date,
      time: expenseFormData.time,
      location: expenseFormData.location
    };

    setTransactions(prev => [...prev, newExpense]);
    setFilteredTransactions(prev => [...prev, newExpense]);
    
    handleCloseExpenseForm();
  };

  return (
    <div className="max-w-6xl mx-auto pb-16 md:pb-0">
      <h1 className="text-xl font-normal font-raleway text-gray-800 mb-6 hidden md:block">
        Expenses
      </h1>
      <TransactionNav />

      <div className="mt-4 space-y-4 px-2 md:px-0">
        {/* Summary Cards */}
        <div className="">
          <div className="bg-white rounded shadow p-3">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded mr-2">
                <FaBuilding className="text-blue-600 text-sm" />
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-600">
                  Total Expenses
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
                      placeholder="Search expenses..."
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
                      placeholder="Search expenses..."
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
              <button
                onClick={handleMakeExpense}
                className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center text-xs"
              >
                <FaPlus className="mr-1 text-xs" />
                Post Expense
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

        {/* Expenses Log Table */}
        <div className="bg-white rounded shadow overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block text-black overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Date & time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Posted by
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
                      {transaction.date} {transaction.time}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      {transaction.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      {transaction.category}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      {transaction.postedBy}
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
                        N{transaction.amount.toFixed(2)}
                      </span>
                      <span className="text-xs text-black">
                        {transaction.time}
                      </span>
                    </div>
                    <div className="text-sm text-black mt-1">
                      {transaction.description}
                    </div>
                    <div className="text-sm text-black mt-1">
                      {transaction.category}
                    </div>
                    <div className="text-xs text-black mt-1">
                      {transaction.date}
                    </div>
                    <div className="text-xs text-black mt-1">
                      {transaction.postedBy}
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
          <button
            onClick={handleMakeExpense}
            className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
          >
            <FaPlus className="text-xl" />
          </button>
        </div>
      )}

      {/* Expense Form Modal */}
      {showExpenseForm && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                Post Expense
              </h2>
              <button
                onClick={handleCloseExpenseForm}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={expenseFormData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    required
                    placeholder="Enter expense description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={expenseFormData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black">
                      N
                    </span>
                    <input
                      type="number"
                      name="amount"
                      value={expenseFormData.amount}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      required
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={expenseFormData.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={expenseFormData.time}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Posted By
                  </label>
                  <select
                    name="postedBy"
                    value={expenseFormData.postedBy}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    required
                  >
                    {users.map((user) => (
                      <option key={user} value={user}>
                        {user}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <select
                    name="location"
                    value={expenseFormData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    required
                  >
                    <option value="">Select Location</option>
                    {locations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseExpenseForm}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                >
                  Post Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}