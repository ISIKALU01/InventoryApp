// pages/deleted-transactions.js
import { useState, useEffect } from "react";
import axios from "axios";
import BASE_URL from "../../config";
import { 
  Search, 
  Filter, 
  Trash2, 
  RefreshCw, 
  Calendar,
  User,
  FileText,
  Clock,
  Eye,
  ChevronDown,
  ChevronUp,
  Download,
  Archive,
  MoreVertical
} from "lucide-react";

export default function DeletedTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("deleted_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const token = localStorage.getItem("token");

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // Fetch deleted transactions
  const fetchDeletedTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${BASE_URL}/view-deleted-transaction`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Deleted Transactions Response:", response.data);
      
      // Handle different response formats
      const transactionsData = Array.isArray(response.data) 
        ? response.data 
        : response.data?.data || [];
        
      setTransactions(transactionsData);
    } catch (err) {
      console.error("Failed to fetch deleted transactions:", err);
      setError(err.response?.data?.message || "Failed to load deleted transactions");
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = async () => {
    try {
      setExportLoading(true);
      const filtered = filteredTransactions;
      const headers = ["ID", "Amount", "Status", "Payment Method", "Processed By", "Customer ID", "Deleted At", "Created At"];
      const csvContent = [
        headers.join(","),
        ...filtered.map(transaction => [
          transaction.id || "",
          transaction.total_amount || "",
          transaction.status || "",
          transaction.payment_method || "",
          `"${(transaction.processed_by || "").replace(/"/g, '""')}"`,
          transaction.customer_id || "",
          transaction.deleted_at || "",
          transaction.created_at || ""
        ].join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `deleted-transactions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export transactions");
    } finally {
      setExportLoading(false);
    }
  };

  // Filter transactions based on actual API data structure
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = 
      transaction.id?.toString().includes(searchTerm.toLowerCase()) ||
      transaction.total_amount?.toString().includes(searchTerm) ||
      transaction.processed_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.customer_id?.toString().includes(searchTerm) ||
      transaction.payment_method?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === "all" || 
      transaction.status?.toLowerCase() === statusFilter.toLowerCase();

    const matchesPaymentMethod = 
      paymentMethodFilter === "all" || 
      transaction.payment_method?.toLowerCase() === paymentMethodFilter.toLowerCase();

    const matchesDate = dateFilter === "all" || applyDateFilter(transaction.deleted_at, dateFilter);

    return matchesSearch && matchesStatus && matchesPaymentMethod && matchesDate;
  });

  // Apply date filtering
  const applyDateFilter = (dateString, filter) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    switch (filter) {
      case "today":
        return date >= today;
      case "yesterday":
        return date >= yesterday && date < today;
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date >= weekAgo;
      case "month":
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return date >= monthAgo;
      default:
        return true;
    }
  };

  // Sort transactions based on actual API fields
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case "total_amount":
        aValue = parseFloat(a.total_amount) || 0;
        bValue = parseFloat(b.total_amount) || 0;
        break;
      case "deleted_at":
        aValue = new Date(a.deleted_at || 0);
        bValue = new Date(b.deleted_at || 0);
        break;
      case "created_at":
        aValue = new Date(a.created_at || 0);
        bValue = new Date(b.created_at || 0);
        break;
      case "customer_id":
        aValue = a.customer_id || "";
        bValue = b.customer_id || "";
        break;
      default:
        aValue = a[sortBy] || "";
        bValue = b[sortBy] || "";
    }

    if (sortOrder === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Handle sort
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  // View transaction details
  const viewTransactionDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount || 0);
  };

  // Format date for mobile
  const formatDate = (dateString, mobile = false) => {
    if (!dateString) return "N/A";
    
    if (mobile) {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusColors = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${statusColors[status] || "bg-gray-100 text-gray-800"}`}>
        {status || "unknown"}
      </span>
    );
  };

  // Get payment method badge
  const getPaymentMethodBadge = (method) => {
    const methodColors = {
      cash: "bg-green-100 text-green-800",
      card: "bg-blue-100 text-blue-800",
      transfer: "bg-purple-100 text-purple-800",
      digital: "bg-orange-100 text-orange-800",
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${methodColors[method] || "bg-gray-100 text-gray-800"}`}>
        {method || "unknown"}
      </span>
    );
  };

  // Get unique values for filters based on actual data
  const uniqueStatuses = [...new Set(transactions.map(t => t.status).filter(Boolean))];
  const uniquePaymentMethods = [...new Set(transactions.map(t => t.payment_method).filter(Boolean))];

  // Mobile transaction card component
  const MobileTransactionCard = ({ transaction }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-3 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-900">#{transaction.id}</span>
            {getStatusBadge(transaction.status)}
          </div>
          <div className="text-lg font-bold text-gray-900">
            {formatCurrency(transaction.total_amount)}
          </div>
        </div>
        <button
          onClick={() => viewTransactionDetails(transaction)}
          className="text-indigo-600 hover:text-indigo-900 p-1"
        >
          <Eye size={16} />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-500 text-xs">Payment Method</span>
          <div className="mt-1">{getPaymentMethodBadge(transaction.payment_method)}</div>
        </div>
        <div>
          <span className="text-gray-500 text-xs">Customer ID</span>
          <p className="mt-1 font-medium">{transaction.customer_id || "N/A"}</p>
        </div>
        <div>
          <span className="text-gray-500 text-xs">Processed By</span>
          <p className="mt-1 font-medium truncate">{transaction.processed_by || "System"}</p>
        </div>
        <div>
          <span className="text-gray-500 text-xs">Deleted</span>
          <div className="mt-1 flex items-center gap-1 text-gray-700">
            <Clock size={12} />
            <span className="text-xs">{formatDate(transaction.deleted_at, true)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    fetchDeletedTransactions();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-3 sm:px-4 lg:px-6 font-raleway">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 mb-6">
          

          {/* Stats Cards */}
          {!loading && transactions.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
              <div className="bg-white rounded-lg shadow-xs border p-3 sm:p-4">
                <div className="flex items-center">
                  <div className="p-1 sm:p-2 bg-red-100 rounded-lg">
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                  </div>
                  <div className="ml-2 sm:ml-3">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Total Deleted</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">{transactions.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-xs border p-3 sm:p-4">
                <div className="flex items-center">
                  <div className="p-1 sm:p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div className="ml-2 sm:ml-3">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Total Amount</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
                      {formatCurrency(transactions.reduce((sum, t) => sum + (parseFloat(t.total_amount) || 0), 0))}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-xs border p-3 sm:p-4">
                <div className="flex items-center">
                  <div className="p-1 sm:p-2 bg-green-100 rounded-lg">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <div className="ml-2 sm:ml-3">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Showing</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">{filteredTransactions.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-xs border p-3 sm:p-4">
                <div className="flex items-center">
                  <div className="p-1 sm:p-2 bg-purple-100 rounded-lg">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  </div>
                  <div className="ml-2 sm:ml-3">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Unique Processors</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
                      {new Set(transactions.map(t => t.processed_by).filter(Boolean)).size}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by ID, amount, processed by, customer ID, or payment method..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black outline-none"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-9 sm:pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black outline-none appearance-none"
                >
                  <option value="all">All Status</option>
                  {uniqueStatuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                </div>
                <select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  className="pl-9 sm:pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black outline-none appearance-none"
                >
                  <option value="all">All Payment Methods</option>
                  {uniquePaymentMethods.map(method => (
                    <option key={method} value={method}>
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative xs:col-span-2 lg:col-span-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                </div>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-9 sm:pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black outline-none appearance-none"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table/Cards */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2 sm:ml-3 text-gray-600 text-sm sm:text-base">Loading deleted transactions...</span>
            </div>
          ) : error ? (
            <div className="text-center py-6 sm:py-8">
              <div className="text-red-500 mb-4">
                <Trash2 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-red-300" />
                <p className="text-sm font-medium">Error loading transactions</p>
                <p className="text-xs mt-1 text-gray-600 px-4">{error}</p>
              </div>
              <button
                onClick={fetchDeletedTransactions}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
              >
                Try Again
              </button>
            </div>
          ) : sortedTransactions.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="text-gray-400 mb-4">
                <Archive className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3" />
                <p className="text-base sm:text-lg font-medium text-gray-600">No deleted transactions found</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 px-4">
                  {transactions.length === 0 
                    ? "No transactions have been deleted yet"
                    : "Try adjusting your search or filters"
                  }
                </p>
              </div>
            </div>
          ) : isMobile ? (
            // Mobile Cards View
            <div className="p-3 sm:p-4">
              {sortedTransactions.map((transaction) => (
                <MobileTransactionCard 
                  key={transaction.id} 
                  transaction={transaction} 
                />
              ))}
            </div>
          ) : (
            // Desktop Table View
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th 
                      className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("id")}
                    >
                      <div className="flex items-center gap-1">
                        ID
                        {sortBy === "id" && (
                          sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("total_amount")}
                    >
                      <div className="flex items-center gap-1">
                        Amount
                        {sortBy === "total_amount" && (
                          sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                        )}
                      </div>
                    </th>
                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th 
                      className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("customer_id")}
                    >
                      <div className="flex items-center gap-1">
                        Customer ID
                        {sortBy === "customer_id" && (
                          sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("processed_by")}
                    >
                      <div className="flex items-center gap-1">
                        Processed By
                        {sortBy === "processed_by" && (
                          sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("deleted_at")}
                    >
                      <div className="flex items-center gap-1">
                        Deleted At
                        {sortBy === "deleted_at" && (
                          sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                        )}
                      </div>
                    </th>
                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-3 sm:px-4 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{transaction.id}
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(transaction.total_amount)}
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4 whitespace-nowrap">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4 whitespace-nowrap">
                        {getPaymentMethodBadge(transaction.payment_method)}
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.customer_id || "N/A"}
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.processed_by || "System"}
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatDate(transaction.deleted_at)}
                        </div>
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => viewTransactionDetails(transaction)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                        >
                          <Eye size={14} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  Transaction Details
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <span className="sr-only">Close</span>
                  <span className="text-xl sm:text-2xl">×</span>
                </button>
              </div>
            </div>
            <div className="px-4 py-3 sm:px-6 sm:py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2 sm:mb-3">Basic Information</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-xs text-gray-500">Transaction ID</dt>
                      <dd className="text-sm font-medium">#{selectedTransaction.id}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Amount</dt>
                      <dd className="text-base sm:text-lg font-semibold">{formatCurrency(selectedTransaction.total_amount)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Status</dt>
                      <dd>{getStatusBadge(selectedTransaction.status)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Payment Method</dt>
                      <dd>{getPaymentMethodBadge(selectedTransaction.payment_method)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Customer ID</dt>
                      <dd className="text-sm">{selectedTransaction.customer_id || "N/A"}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2 sm:mb-3">Timeline</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-xs text-gray-500">Created At</dt>
                      <dd className="text-sm">{formatDate(selectedTransaction.created_at)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Deleted At</dt>
                      <dd className="text-sm">{formatDate(selectedTransaction.deleted_at)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Processed By</dt>
                      <dd className="text-sm font-medium">{selectedTransaction.processed_by || "System"}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              {/* Items Section */}
              {selectedTransaction.items && selectedTransaction.items.length > 0 && (
                <div className="mt-4 sm:mt-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2 sm:mb-3">Items</h4>
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <div className="space-y-2 sm:space-y-3">
                      {selectedTransaction.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center border-b pb-2 last:border-b-0">
                          <div>
                            <p className="text-sm font-medium">{item.name || `Item ${index + 1}`}</p>
                            {item.description && (
                              <p className="text-xs text-gray-500">{item.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatCurrency(item.price)}</p>
                            {item.quantity && (
                              <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedTransaction.notes && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Notes</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedTransaction.notes}
                  </p>
                </div>
              )}
            </div>
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}