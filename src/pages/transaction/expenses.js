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
  FaEdit,
  FaTrash,
  FaEye,
  FaUser,
} from "react-icons/fa";

const API_BASE_URL = "https://pgimsapp-production.up.railway.app/api";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Expense form data
  const [expenseFormData, setExpenseFormData] = useState({
    description: "",
    category: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    posted_by: "",
    location: ""
  });

  // Calculate total expenses
  const totalExpenses = transactions.reduce((sum, transaction) => {
    return sum + (parseFloat(transaction.amount) || 0);
  }, 0);

  // Get auth headers
  const getAuthHeaders = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found. Please log in again.");
    }
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // Extract username from email (everything before @)
  const extractUsernameFromEmail = (email) => {
    if (!email) return '';
    return email.split('@')[0];
  };

  // Format username to be more readable (capitalize first letter)
  const formatUsername = (username) => {
    if (!username) return '';
    return username.charAt(0).toUpperCase() + username.slice(1);
  };

  // Fetch current user data
  const fetchCurrentUser = async () => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/user`, {
        method: "GET",
        headers,
      });

      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
        
        // Auto-fill the posted_by field with formatted username
        const username = extractUsernameFromEmail(userData.email);
        const formattedUsername = formatUsername(username);
        setExpenseFormData(prev => ({
          ...prev,
          posted_by: formattedUsername
        }));
      }
    } catch (err) {
      console.error("Error fetching current user:", err);
      // If we can't get current user, try to get from users list
      fetchUsers();
    }
  };

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: "GET",
        headers,
      });

      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData);
        
        // If we don't have current user yet, try to find it from the users list
        if (!currentUser) {
          const token = localStorage.getItem("token");
          // You might need to decode the token to get user email, or use the first user as fallback
          if (usersData.length > 0) {
            const firstUser = usersData[0];
            const username = extractUsernameFromEmail(firstUser.email);
            const formattedUsername = formatUsername(username);
            setExpenseFormData(prev => ({
              ...prev,
              posted_by: formattedUsername
            }));
          }
        }
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  // Detect mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Fetch expenses from API
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError("");
      
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/expenses`, {
        method: "GET",
        headers,
      });

      if (response.status === 401) {
        throw new Error("Authentication required. Please log in.");
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch expenses: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle both array and object responses
      if (Array.isArray(data)) {
        setTransactions(data);
        setFilteredTransactions(data);
      } else if (data.data && Array.isArray(data.data)) {
        // Handle Laravel paginated response
        setTransactions(data.data);
        setFilteredTransactions(data.data);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load expenses and user data on component mount
  useEffect(() => {
    fetchExpenses();
    fetchCurrentUser();
  }, []);

  // Extract unique locations and posted_by users from transactions
  const locations = [...new Set(transactions.map(t => t.location).filter(Boolean))];
  const postedByUsers = [...new Set(transactions.map(t => t.posted_by).filter(Boolean))];
  const categories = [...new Set(transactions.map(t => t.category).filter(Boolean))];

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
          transaction.posted_by
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
        (transaction) => transaction.posted_by === selectedUser
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
      "Location"
    ];
    const csvData = filteredTransactions.map((transaction) => [
      transaction.description,
      transaction.category,
      `N${(parseFloat(transaction.amount) || 0).toFixed(2)}`,
      transaction.date,
      transaction.time,
      transaction.posted_by,
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
    setSelectedExpense(null);
    setExpenseFormData({
      description: "",
      category: "",
      amount: "",
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      posted_by: currentUser ? formatUsername(extractUsernameFromEmail(currentUser.email)) : "",
      location: ""
    });
    setShowExpenseForm(true);
  };

  const handleEditExpense = (expense) => {
    setSelectedExpense(expense);
    setExpenseFormData({
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      time: expense.time,
      posted_by: expense.posted_by,
      location: expense.location
    });
    setShowExpenseForm(true);
  };

  const handleViewExpense = (expense) => {
    setSelectedExpense(expense);
    setExpenseFormData({
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      time: expense.time,
      posted_by: expense.posted_by,
      location: expense.location
    });
    setShowExpenseForm(true);
  };

  const handleDeleteExpense = (expense) => {
    setExpenseToDelete(expense);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      setError("");
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/expenses/${expenseToDelete.id}`, {
        method: "DELETE",
        headers,
      });

      if (response.status === 401) {
        throw new Error("Authentication required. Please log in.");
      }

      if (!response.ok) {
        throw new Error(`Failed to delete expense: ${response.status}`);
      }

      // Refresh the expenses list
      await fetchExpenses();
      setShowDeleteConfirm(false);
      setExpenseToDelete(null);
    } catch (err) {
      setError(err.message);
      console.error("Error deleting expense:", err);
    }
  };

  const handleCloseExpenseForm = () => {
    setShowExpenseForm(false);
    setSelectedExpense(null);
    setExpenseFormData({
      description: "",
      category: "",
      amount: "",
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      posted_by: currentUser ? formatUsername(extractUsernameFromEmail(currentUser.email)) : "",
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

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    
    try {
      setError("");
      const headers = await getAuthHeaders();
      
      const url = selectedExpense 
        ? `${API_BASE_URL}/expenses/${selectedExpense.id}`
        : `${API_BASE_URL}/expenses`;
      
      const method = selectedExpense ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          ...expenseFormData,
          amount: parseFloat(expenseFormData.amount)
        }),
      });

      if (response.status === 401) {
        throw new Error("Authentication required. Please log in.");
      }

      if (!response.ok) {
        throw new Error(`Failed to ${selectedExpense ? 'update' : 'create'} expense: ${response.status}`);
      }

      // Refresh the expenses list
      await fetchExpenses();
      
      handleCloseExpenseForm();
    } catch (err) {
      setError(err.message);
      console.error(`Error ${selectedExpense ? 'updating' : 'creating'} expense:`, err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-16 md:pb-0">
      <h1 className="text-xl font-normal font-raleway text-gray-800 mb-6 hidden md:block">
        Expenses
      </h1>
      <TransactionNav />

      <div className="mt-4 space-y-4 px-2 md:px-0">
        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="text-sm">{error}</p>
            {error.includes("authentication") && (
              <button
                onClick={() => window.location.href = '/login'}
                className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
              >
                Go to Login
              </button>
            )}
          </div>
        )}

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
                  N{totalExpenses.toFixed(2)}
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
                        {postedByUsers.map((user) => (
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
                  {postedByUsers.map((user) => (
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
          {/* Loading State */}
          {loading && (
            <div className="text-center py-6">
              <p className="text-black text-xs">Loading expenses...</p>
            </div>
          )}

          {/* Desktop Table */}
          {!loading && (
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
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Actions
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
                        {transaction.posted_by}
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        {transaction.location}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-black">
                        N{(parseFloat(transaction.amount) || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewExpense(transaction)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="View"
                          >
                            <FaEye className="text-sm" />
                          </button>
                          <button
                            onClick={() => handleEditExpense(transaction)}
                            className="text-green-600 hover:text-green-800 transition-colors"
                            title="Edit"
                          >
                            <FaEdit className="text-sm" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(transaction)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Delete"
                          >
                            <FaTrash className="text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Mobile Cards */}
          {!loading && (
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
                          N{(parseFloat(transaction.amount) || 0).toFixed(2)}
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
                        {transaction.posted_by}
                      </div>
                      <div className="text-xs text-black mt-1">
                        {transaction.location}
                      </div>
                      <div className="flex space-x-3 mt-2">
                        <button
                          onClick={() => handleViewExpense(transaction)}
                          className="text-blue-600 hover:text-blue-800 transition-colors text-xs flex items-center"
                        >
                          <FaEye className="mr-1" />
                          View
                        </button>
                        <button
                          onClick={() => handleEditExpense(transaction)}
                          className="text-green-600 hover:text-green-800 transition-colors text-xs flex items-center"
                        >
                          <FaEdit className="mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(transaction)}
                          className="text-red-600 hover:text-red-800 transition-colors text-xs flex items-center"
                        >
                          <FaTrash className="mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredTransactions.length === 0 && (
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedExpense ? (selectedExpense.id ? 'Edit Expense' : 'View Expense') : 'Add New Expense'}
              </h2>
              <button
                onClick={handleCloseExpenseForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitExpense} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={expenseFormData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    required
                    placeholder="Enter expense description"
                    readOnly={selectedExpense && !selectedExpense.id}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={expenseFormData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      required
                      placeholder="Category"
                      readOnly={selectedExpense && !selectedExpense.id}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        N
                      </span>
                      <input
                        type="number"
                        name="amount"
                        value={expenseFormData.amount}
                        onChange={handleInputChange}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                        required
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        readOnly={selectedExpense && !selectedExpense.id}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={expenseFormData.date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      required
                      readOnly={selectedExpense && !selectedExpense.id}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time *
                    </label>
                    <input
                      type="time"
                      name="time"
                      value={expenseFormData.time}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      required
                      readOnly={selectedExpense && !selectedExpense.id}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Posted By *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="posted_by"
                      value={expenseFormData.posted_by}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      required
                      readOnly
                      placeholder="Auto-filled from your account"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    This field is automatically filled with your username and cannot be changed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={expenseFormData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    required
                    placeholder="Enter expense location"
                    readOnly={selectedExpense && !selectedExpense.id}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseExpenseForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                {(!selectedExpense || selectedExpense.id) && (
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {selectedExpense ? 'Update Expense' : 'Add Expense'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-sm mx-auto">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <FaTrash className="w-6 h-6 text-red-600" />
              </div>
              <div className="mt-3 text-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Delete Expense
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Are you sure you want to delete this expense? This action cannot be undone.
                </p>
              </div>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}