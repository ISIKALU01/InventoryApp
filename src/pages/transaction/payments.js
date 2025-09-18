// pages/transaction/payment.js
import { useState, useEffect } from "react";
import TransactionNav from "../../components/TransactionNav";
import {
  FaSearch,
  FaFileExport,
  FaPlusCircle,
  FaMinusCircle,
  FaMoneyBill,
  FaTrash,
  FaEye,
  FaSlidersH,
  FaPlus,
  FaTimes,
} from "react-icons/fa";

export default function Payments() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [expandedTransaction, setExpandedTransaction] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    amount: "",
    date: new Date().toISOString().split('T')[0],
    purpose: "",
    persons: "",
    location: "",
    notes: ""
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
    // Mock transaction data
    const mockTransactions = [
      {
        id: 1,
        amount: 125.5,
        date: "2023-10-15",
        time: "10:30 AM",
        purpose: "Product Sale",
        persons: "John Doe",
        postedBy: "Admin User",
        location: "Main Store",
      },
      {
        id: 2,
        amount: 542.75,
        date: "2023-10-15",
        time: "02:45 PM",
        purpose: "Bulk Order",
        persons: "Jane Smith",
        postedBy: "Sales Staff 1",
        location: "Branch 1",
      },
      {
        id: 3,
        amount: 89.99,
        date: "2023-10-16",
        time: "09:15 AM",
        purpose: "Retail Sale",
        persons: "Robert Johnson",
        postedBy: "Cashier 1",
        location: "Main Store",
      },
      {
        id: 4,
        amount: 234.0,
        date: "2023-10-16",
        time: "11:20 AM",
        purpose: "Service Payment",
        persons: "Sarah Wilson",
        postedBy: "Sales Staff 2",
        location: "Online",
      },
      {
        id: 5,
        amount: 67.5,
        date: "2023-10-17",
        time: "03:40 PM",
        purpose: "Product Sale",
        persons: "Michael Brown",
        postedBy: "Cashier 1",
        location: "Branch 2",
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
          transaction.purpose
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          transaction.persons
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
      "No.",
      "Amount",
      "Date",
      "Time",
      "Purpose",
      "Persons",
      "Posted By",
      "Location"
    ];
    const csvData = filteredTransactions.map((transaction, index) => [
      index + 1,
      `$${transaction.amount.toFixed(2)}`,
      transaction.date,
      transaction.time,
      transaction.purpose,
      transaction.persons,
      transaction.postedBy,
      transaction.location
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payments-report-${
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

  const toggleTransactionDetails = (id) => {
    if (expandedTransaction === id) {
      setExpandedTransaction(null);
    } else {
      setExpandedTransaction(id);
    }
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleMakePayment = () => {
    setShowPaymentForm(true);
  };

  const handleClosePaymentForm = () => {
    setShowPaymentForm(false);
    setPaymentFormData({
      amount: "",
      date: new Date().toISOString().split('T')[0],
      purpose: "",
      persons: "",
      location: "",
      notes: ""
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentFormData({
      ...paymentFormData,
      [name]: value
    });
  };

  const handleSubmitPayment = (e) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    console.log("Payment data:", paymentFormData);
    
    // For demo purposes, add to transactions
    const newTransaction = {
      id: transactions.length + 1,
      amount: parseFloat(paymentFormData.amount),
      date: paymentFormData.date,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      purpose: paymentFormData.purpose,
      persons: paymentFormData.persons,
      postedBy: "Current User", // This would come from auth context
      location: paymentFormData.location
    };
    
    setTransactions([...transactions, newTransaction]);
    handleClosePaymentForm();
  };

  return (
    <div className="max-w-6xl mx-auto pb-16 md:pb-0">
      <h1 className="text-xl font-normal font-raleway text-gray-800 mb-6 hidden md:block">
        Payment
      </h1>
      <TransactionNav />

      <div className="mt-4 space-y-4 px-2 md:px-0">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-full mr-3">
                <FaPlusCircle className="text-green-600 text-sm" />
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-600">
                  Total Paid In
                </h3>
                <p className="text-lg font-bold text-gray-800">
                  $
                  {transactions
                    .reduce((sum, transaction) => sum + transaction.amount, 0)
                    .toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-full mr-3">
                <FaMinusCircle className="text-red-600 text-sm" />
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-600">
                  Total Paid Out
                </h3>
                <p className="text-lg font-bold text-gray-800">$0.00</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Export */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
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
                      className="w-full pl-2 pr-7 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    />
                    <FaSearch className="absolute right-2 top-2.5 text-gray-400 text-sm" />
                  </div>

                  <button
                    onClick={toggleFilters}
                    className={`px-3 py-2 rounded-lg transition-colors flex items-center text-sm ${
                      showFilters
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <FaSlidersH className="text-sm" />
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
                      className="w-full pl-2 pr-7 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    />
                    <FaSearch className="absolute right-2 top-2.5 text-gray-400 text-sm" />
                  </div>

                  {/* Desktop filters */}
                  <div className="flex gap-3">
                    {/* Date filter */}
                    <div className="w-auto">
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-2 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      />
                    </div>

                    {/* Location filter */}
                    <div className="w-auto">
                      <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="w-full px-2 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
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
                        className="w-full px-2 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
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
              {/* Make Payment button */}
              <button 
                onClick={handleMakePayment}
                className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center text-xs shadow-sm"
              >
                <FaMoneyBill className="mr-1 text-xs" />
                Make Payment
              </button>

              <button
                onClick={exportToCSV}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center text-xs shadow-sm"
              >
                <FaFileExport className="mr-1 text-xs" />
                Export
              </button>
            </div>
          </div>

          {/* Filter dropdown for mobile */}
          {isMobile && showFilters && (
            <div className="mt-3 grid grid-cols-1 gap-3 p-3 bg-gray-50 rounded-lg">
              {/* Date filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-2 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                />
              </div>

              {/* Location filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-2 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-2 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
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
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Clear Filters
                </button>
                <button
                  onClick={toggleFilters}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Payment Log Table */}
        <div className="bg-white rounded-lg shadow-sm border text-black border-gray-100 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Persons
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Posted By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction, index) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                      ${transaction.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      <div>{transaction.date}</div>
                      <div className="text-xs text-black">
                        {transaction.time}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      {transaction.purpose}
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      {transaction.persons}
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      {transaction.postedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors">
                        <FaEye />
                      </button>
                      <button className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors ml-2">
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden">
            {filteredTransactions.map((transaction, index) => (
              <div
                key={transaction.id}
                className="border-b border-gray-200 p-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-black">
                        #{index + 1} - ${transaction.amount.toFixed(2)}
                      </span>
                      <span className="text-xs text-black">
                        {transaction.time}
                      </span>
                    </div>
                    <div className="text-sm text-black mt-1">
                      {transaction.purpose}
                    </div>
                    <div className="text-sm text-black mt-1">
                      {transaction.persons}
                    </div>
                    <div className="text-xs text-black mt-1">
                      By: {transaction.postedBy}
                    </div>
                    <div className="text-xs text-black mt-1">
                      {transaction.date}
                    </div>
                  </div>
                  <div className="ml-2 flex space-x-2">
                    <button className="text-blue-600 p-1 rounded hover:bg-blue-50">
                      <FaEye />
                    </button>
                    <button className="text-red-600 p-1 rounded hover:bg-red-50">
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-black text-sm">No transactions found</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <div className="fixed bottom-6 right-6 z-10 md:hidden">
          <button 
            onClick={handleMakePayment}
            className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
          >
            <FaPlus className="text-xl" />
          </button>
        </div>
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Make Payment</h2>
              <button 
                onClick={handleClosePaymentForm}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitPayment} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black">$</span>
                    <input
                      type="number"
                      name="amount"
                      value={paymentFormData.amount}
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
                    value={paymentFormData.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purpose
                  </label>
                  <input
                    type="text"
                    name="purpose"
                    value={paymentFormData.purpose}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    required
                    placeholder="Enter payment purpose"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Persons
                  </label>
                  <input
                    type="text"
                    name="persons"
                    value={paymentFormData.persons}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    required
                    placeholder="Enter person or company name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <select
                    name="location"
                    value={paymentFormData.location}
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={paymentFormData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Add any additional notes here..."
                  />
                </div>
              </div>
              
              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleClosePaymentForm}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                >
                  Submit Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}