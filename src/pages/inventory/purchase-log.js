// pages/transaction/purchases.js
import { useState, useEffect } from "react";
import InventoryNav from "../../components/InventoryNav";
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
  FaTruck,
  FaBox,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
} from "react-icons/fa";

const API_BASE_URL = "https://testing.osharaofficial.com/api";

// Supplier API Service
export const supplierAPI = {
  async getAuthHeaders() {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found. Please log in again.");
    }

    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
  },

  async getAllSuppliers() {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/suppliers`, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch suppliers: ${response.status}`);
    }

    return response.json();
  },

  async createSupplier(supplierData) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/suppliers`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(supplierData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || `Failed to create supplier: ${response.status}`
      );
    }

    return response.json();
  },

  async updateSupplier(id, supplierData) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(supplierData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || `Failed to update supplier: ${response.status}`
      );
    }

    return response.json();
  },

  async deleteSupplier(id) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
      method: "DELETE",
      headers: headers,
    });

    if (!response.ok) {
      let errorMessage = `Failed to delete supplier: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData?.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return { success: true, message: "Supplier deleted successfully" };
    }

    try {
      return await response.json();
    } catch {
      return { success: true, message: "Supplier deleted successfully" };
    }
  },
};

export default function Purchases() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [showSupplierDetails, setShowSupplierDetails] = useState(false);
  const [selectedSupplierDetails, setSelectedSupplierDetails] = useState(null);

  // Purchase order form data
  const [orderFormData, setOrderFormData] = useState({
    supplier_id: "",
    order_number: "",
    status: "pending",
    payment_method: "",
    total_amount: "",
    order_date: new Date().toISOString().split('T')[0],
    expected_date: "",
    notes: ""
  });

  // Status options
  const statusOptions = [
    { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
    { value: "approved", label: "Approved", color: "bg-blue-100 text-blue-800" },
    { value: "received", label: "Received", color: "bg-green-100 text-green-800" },
    { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" }
  ];

  // Payment method options
  const paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "credit_card", label: "Credit Card" },
    { value: "debit_card", label: "Debit Card" },
    { value: "online", label: "Online Payment" }
  ];

  // Calculate total amount
  const totalAmount = purchaseOrders.reduce((sum, order) => {
    return sum + (parseFloat(order.total_amount) || 0);
  }, 0);

  // Get auth headers for purchase orders
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

  // Generate order number
  const generateOrderNumber = () => {
    const timestamp = new Date().getTime();
    return `PO-${timestamp}`;
  };

  // Fetch suppliers using the supplier API
  const fetchSuppliers = async () => {
    try {
      setSuppliersLoading(true);
      const suppliersData = await supplierAPI.getAllSuppliers();
      setSuppliers(suppliersData);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      setError(`Failed to load suppliers: ${err.message}`);
    } finally {
      setSuppliersLoading(false);
    }
  };

  // View supplier details
  const handleViewSupplierDetails = (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier) {
      setSelectedSupplierDetails(supplier);
      setShowSupplierDetails(true);
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

  // Fetch purchase orders from API
  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError("");
      
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/purchase-orders`, {
        method: "GET",
        headers,
      });

      if (response.status === 401) {
        throw new Error("Authentication required. Please log in.");
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch purchase orders: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle both array and object responses
      if (Array.isArray(data)) {
        setPurchaseOrders(data);
        setFilteredOrders(data);
      } else if (data.data && Array.isArray(data.data)) {
        // Handle Laravel paginated response
        setPurchaseOrders(data.data);
        setFilteredOrders(data.data);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching purchase orders:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load purchase orders and suppliers on component mount
  useEffect(() => {
    fetchPurchaseOrders();
    fetchSuppliers();
  }, []);

  // Extract unique suppliers and statuses from orders
  const uniqueSuppliers = [...new Set(purchaseOrders
    .map(order => order.supplier?.name)
    .filter(Boolean)
    .sort())];

  const uniqueStatuses = [...new Set(purchaseOrders.map(order => order.status).filter(Boolean))];

  // Filter orders based on filters
  useEffect(() => {
    let filtered = purchaseOrders;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.total_amount?.toString().includes(searchTerm)
      );
    }

    // Apply status filter
    if (selectedStatus) {
      filtered = filtered.filter(
        (order) => order.status === selectedStatus
      );
    }

    // Apply date filter
    if (selectedDate) {
      filtered = filtered.filter(
        (order) => order.order_date === selectedDate
      );
    }

    // Apply supplier filter
    if (selectedSupplier) {
      filtered = filtered.filter(
        (order) => order.supplier?.name === selectedSupplier
      );
    }

    setFilteredOrders(filtered);
  }, [purchaseOrders, searchTerm, selectedStatus, selectedDate, selectedSupplier]);

  const exportToCSV = () => {
    const headers = [
      "Order Number",
      "Supplier",
      "Supplier Contact",
      "Supplier Email",
      "Status",
      "Total Amount",
      "Order Date",
      "Expected Date",
      "Payment Method",
      "Notes"
    ];
    const csvData = filteredOrders.map((order) => [
      order.order_number,
      order.supplier?.name || 'N/A',
      order.supplier?.contact_person || 'N/A',
      order.supplier?.email || 'N/A',
      order.status,
      `N${(parseFloat(order.total_amount) || 0).toFixed(2)}`,
      order.order_date,
      order.expected_date,
      order.payment_method,
      order.notes
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `purchase-orders-report-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("");
    setSelectedDate("");
    setSelectedSupplier("");
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleCreateOrder = () => {
    setSelectedOrder(null);
    setOrderFormData({
      supplier_id: "",
      order_number: generateOrderNumber(),
      status: "pending",
      payment_method: "",
      total_amount: "",
      order_date: new Date().toISOString().split('T')[0],
      expected_date: "",
      notes: ""
    });
    setShowOrderForm(true);
  };

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setOrderFormData({
      supplier_id: order.supplier_id,
      order_number: order.order_number,
      status: order.status,
      payment_method: order.payment_method,
      total_amount: order.total_amount,
      order_date: order.order_date,
      expected_date: order.expected_date,
      notes: order.notes
    });
    setShowOrderForm(true);
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setOrderFormData({
      supplier_id: order.supplier_id,
      order_number: order.order_number,
      status: order.status,
      payment_method: order.payment_method,
      total_amount: order.total_amount,
      order_date: order.order_date,
      expected_date: order.expected_date,
      notes: order.notes
    });
    setShowOrderForm(true);
  };

  const handleDeleteOrder = (order) => {
    setOrderToDelete(order);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      setError("");
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/purchase-orders/${orderToDelete.id}`, {
        method: "DELETE",
        headers,
      });

      if (response.status === 401) {
        throw new Error("Authentication required. Please log in.");
      }

      if (!response.ok) {
        throw new Error(`Failed to delete purchase order: ${response.status}`);
      }

      // Refresh the orders list
      await fetchPurchaseOrders();
      setShowDeleteConfirm(false);
      setOrderToDelete(null);
    } catch (err) {
      setError(err.message);
      console.error("Error deleting purchase order:", err);
    }
  };

  const handleCloseOrderForm = () => {
    setShowOrderForm(false);
    setSelectedOrder(null);
    setOrderFormData({
      supplier_id: "",
      order_number: generateOrderNumber(),
      status: "pending",
      payment_method: "",
      total_amount: "",
      order_date: new Date().toISOString().split('T')[0],
      expected_date: "",
      notes: ""
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrderFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    
    try {
      setError("");
      const headers = await getAuthHeaders();
      
      const url = selectedOrder 
        ? `${API_BASE_URL}/purchase-orders/${selectedOrder.id}`
        : `${API_BASE_URL}/purchase-orders`;
      
      const method = selectedOrder ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          ...orderFormData,
          total_amount: orderFormData.total_amount ? parseFloat(orderFormData.total_amount) : null,
          supplier_id: parseInt(orderFormData.supplier_id)
        }),
      });

      if (response.status === 401) {
        throw new Error("Authentication required. Please log in.");
      }

      if (!response.ok) {
        throw new Error(`Failed to ${selectedOrder ? 'update' : 'create'} purchase order: ${response.status}`);
      }

      // Refresh the orders list
      await fetchPurchaseOrders();
      
      handleCloseOrderForm();
    } catch (err) {
      setError(err.message);
      console.error(`Error ${selectedOrder ? 'updating' : 'creating'} purchase order:`, err);
    }
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption ? statusOption.color : "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption ? statusOption.label : status;
  };

  // Get supplier details for display
  const getSelectedSupplier = () => {
    return suppliers.find(s => s.id === parseInt(orderFormData.supplier_id));
  };

  const selectedSupplierData = getSelectedSupplier();

  return (
    <div className="max-w-6xl mx-auto pb-16 md:pb-0">
      <h1 className="text-xl font-normal font-raleway text-gray-800 mb-6 hidden md:block">
        Purchase Orders
      </h1>
      <InventoryNav />

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded shadow p-3">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded mr-2">
                <FaBox className="text-blue-600 text-sm" />
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-600">
                  Total Orders
                </h3>
                <p className="text-lg font-bold text-gray-800">
                  {purchaseOrders.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded mr-2">
                <FaBuilding className="text-green-600 text-sm" />
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-600">
                  Total Amount
                </h3>
                <p className="text-lg font-bold text-gray-800">
                  N{totalAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded mr-2">
                <FaTruck className="text-purple-600 text-sm" />
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-600">
                  Pending Orders
                </h3>
                <p className="text-lg font-bold text-gray-800">
                  {purchaseOrders.filter(order => order.status === 'pending').length}
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
                      placeholder="Search purchase orders..."
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
                      placeholder="Search purchase orders..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-2 pr-7 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs"
                    />
                    <FaSearch className="absolute right-2 top-1.5 text-gray-400 text-xs" />
                  </div>

                  {/* Desktop filters */}
                  <div className="flex gap-3">
                    {/* Status filter */}
                    <div className="w-auto">
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs"
                      >
                        <option value="">All Status</option>
                        {statusOptions.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date filter */}
                    <div className="w-auto">
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs"
                      />
                    </div>

                    {/* Supplier filter */}
                    <div className="w-auto">
                      <select
                        value={selectedSupplier}
                        onChange={(e) => setSelectedSupplier(e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs"
                      >
                        <option value="">All Suppliers</option>
                        {uniqueSuppliers.map((supplier) => (
                          <option key={supplier} value={supplier}>
                            {supplier}
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
                onClick={handleCreateOrder}
                className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center text-xs"
              >
                <FaPlus className="mr-1 text-xs" />
                New Order
              </button>
            </div>
          </div>

          {/* Filter dropdown for mobile */}
          {isMobile && showFilters && (
            <div className="mt-3 grid grid-cols-1 gap-2 p-2 bg-gray-50 rounded">
              {/* Status filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs"
                >
                  <option value="">All Status</option>
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Order Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs"
                />
              </div>

              {/* Supplier filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Supplier
                </label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs"
                >
                  <option value="">All Suppliers</option>
                  {uniqueSuppliers.map((supplier) => (
                    <option key={supplier} value={supplier}>
                      {supplier}
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

        {/* Purchase Orders Table */}
        <div className="bg-white rounded shadow overflow-hidden">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-6">
              <p className="text-black text-xs">Loading purchase orders...</p>
            </div>
          )}

          {/* Desktop Table */}
          {!loading && (
            <div className="hidden md:block text-black overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Order Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Supplier Details
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Order Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Expected Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-black">
                        {order.order_number}
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        <div>
                          <div className="font-medium">{order.supplier?.name || 'N/A'}</div>
                          {order.supplier?.contact_person && (
                            <div className="text-xs text-gray-600">
                              Contact: {order.supplier.contact_person}
                            </div>
                          )}
                          {order.supplier?.email && (
                            <div className="text-xs text-gray-600">
                              Email: {order.supplier.email}
                            </div>
                          )}
                          <button
                            onClick={() => handleViewSupplierDetails(order.supplier_id)}
                            className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                          >
                            View Supplier Details
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-black">
                        N{(parseFloat(order.total_amount) || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        {order.order_date}
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        {order.expected_date || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="View"
                          >
                            <FaEye className="text-sm" />
                          </button>
                          <button
                            onClick={() => handleEditOrder(order)}
                            className="text-green-600 hover:text-green-800 transition-colors"
                            title="Edit"
                          >
                            <FaEdit className="text-sm" />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order)}
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
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="border-b border-gray-200 p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium text-black">
                            {order.order_number}
                          </span>
                          <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-black">
                          N{(parseFloat(order.total_amount) || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-sm text-black mt-1">
                        <strong>Supplier:</strong> {order.supplier?.name || 'N/A'}
                      </div>
                      {order.supplier?.contact_person && (
                        <div className="text-sm text-black mt-1">
                          <strong>Contact:</strong> {order.supplier.contact_person}
                        </div>
                      )}
                      {order.supplier?.email && (
                        <div className="text-sm text-black mt-1">
                          <strong>Email:</strong> {order.supplier.email}
                        </div>
                      )}
                      <div className="text-sm text-black mt-1">
                        <strong>Order Date:</strong> {order.order_date}
                      </div>
                      <div className="text-sm text-black mt-1">
                        <strong>Expected Date:</strong> {order.expected_date || 'N/A'}
                      </div>
                      {order.notes && (
                        <div className="text-sm text-gray-600 mt-1">
                          <strong>Notes:</strong> {order.notes}
                        </div>
                      )}
                      <div className="flex space-x-3 mt-2">
                        <button
                          onClick={() => handleViewSupplierDetails(order.supplier_id)}
                          className="text-blue-600 hover:text-blue-800 transition-colors text-xs flex items-center"
                        >
                          <FaEye className="mr-1" />
                          Supplier
                        </button>
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="text-blue-600 hover:text-blue-800 transition-colors text-xs flex items-center"
                        >
                          <FaEye className="mr-1" />
                          View
                        </button>
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="text-green-600 hover:text-green-800 transition-colors text-xs flex items-center"
                        >
                          <FaEdit className="mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order)}
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

          {!loading && filteredOrders.length === 0 && (
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
            onClick={handleCreateOrder}
            className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
          >
            <FaPlus className="text-xl" />
          </button>
        </div>
      )}

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedOrder ? (selectedOrder.id ? 'Edit Purchase Order' : 'View Purchase Order') : 'Create Purchase Order'}
              </h2>
              <button
                onClick={handleCloseOrderForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitOrder} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Number *
                  </label>
                  <input
                    type="text"
                    name="order_number"
                    value={orderFormData.order_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    required
                    placeholder="PO-12345"
                    readOnly={selectedOrder && !selectedOrder.id}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier *
                  </label>
                  <select
                    name="supplier_id"
                    value={orderFormData.supplier_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    required
                    disabled={selectedOrder && !selectedOrder.id}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                  
                  {/* Supplier Details Preview */}
                  {selectedSupplierData && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-md border">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Supplier Details:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {selectedSupplierData.contact_person && (
                          <div className="flex items-center">
                            <FaUser className="w-3 h-3 text-gray-400 mr-2" />
                            <span>{selectedSupplierData.contact_person}</span>
                          </div>
                        )}
                        {selectedSupplierData.email && (
                          <div className="flex items-center">
                            <FaEnvelope className="w-3 h-3 text-gray-400 mr-2" />
                            <span>{selectedSupplierData.email}</span>
                          </div>
                        )}
                        {selectedSupplierData.phone && (
                          <div className="flex items-center">
                            <FaPhone className="w-3 h-3 text-gray-400 mr-2" />
                            <span>{selectedSupplierData.phone}</span>
                          </div>
                        )}
                        {selectedSupplierData.address && (
                          <div className="flex items-center md:col-span-2">
                            <FaMapMarkerAlt className="w-3 h-3 text-gray-400 mr-2" />
                            <span className="flex-1">{selectedSupplierData.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={orderFormData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    disabled={selectedOrder && !selectedOrder.id}
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    name="payment_method"
                    value={orderFormData.payment_method}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    required
                    disabled={selectedOrder && !selectedOrder.id}
                  >
                    <option value="">Select Payment Method</option>
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      N
                    </span>
                    <input
                      type="number"
                      name="total_amount"
                      value={orderFormData.total_amount}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      readOnly={selectedOrder && !selectedOrder.id}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Date *
                  </label>
                  <input
                    type="date"
                    name="order_date"
                    value={orderFormData.order_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    required
                    readOnly={selectedOrder && !selectedOrder.id}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    name="expected_date"
                    value={orderFormData.expected_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    readOnly={selectedOrder && !selectedOrder.id}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={orderFormData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Additional notes..."
                    readOnly={selectedOrder && !selectedOrder.id}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseOrderForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                {(!selectedOrder || selectedOrder.id) && (
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {selectedOrder ? 'Update Order' : 'Create Order'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Details Modal */}
      {showSupplierDetails && selectedSupplierDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Supplier Details
              </h2>
              <button
                onClick={() => setShowSupplierDetails(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedSupplierDetails.name}
                  </h3>
                </div>
                
                {selectedSupplierDetails.contact_person && (
                  <div className="flex items-center">
                    <FaUser className="w-4 h-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Contact Person</p>
                      <p className="text-sm text-gray-600">{selectedSupplierDetails.contact_person}</p>
                    </div>
                  </div>
                )}

                {selectedSupplierDetails.email && (
                  <div className="flex items-center">
                    <FaEnvelope className="w-4 h-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-600">{selectedSupplierDetails.email}</p>
                    </div>
                  </div>
                )}

                {selectedSupplierDetails.phone && (
                  <div className="flex items-center">
                    <FaPhone className="w-4 h-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Phone</p>
                      <p className="text-sm text-gray-600">{selectedSupplierDetails.phone}</p>
                    </div>
                  </div>
                )}

                {selectedSupplierDetails.address && (
                  <div className="flex items-start">
                    <FaMapMarkerAlt className="w-4 h-4 text-gray-400 mr-3 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Address</p>
                      <p className="text-sm text-gray-600">{selectedSupplierDetails.address}</p>
                    </div>
                  </div>
                )}

                {selectedSupplierDetails.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Notes</p>
                    <p className="text-sm text-gray-600">{selectedSupplierDetails.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowSupplierDetails(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
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
                  Delete Purchase Order
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Are you sure you want to delete this purchase order? This action cannot be undone.
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