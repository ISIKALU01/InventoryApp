import { useState, useEffect } from "react";
import InventoryNav from "../../components/InventoryNav";
import {
  FaSearch,
  FaPlus,
  FaFileImport,
  FaSlidersH,
  FaTimes,
  FaUsers,
  FaMoneyBillWave,
  FaHandHoldingUsd,
  FaEdit,
  FaTrash,
  FaPhone,
  FaEnvelope,
} from "react-icons/fa";
import FolioNav from "../../components/FolioNav";

const API_BASE_URL = "https://pgims-production.up.railway.app/api";

// Modal Components
const ImportCSVModal = ({ isOpen, onClose, onImport }) => {
  const [csvFile, setCsvFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Importing CSV with:", { csvFile });
    onImport({ csvFile });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Import Customers from CSV</h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              CSV File *
            </label>
            <div className="p-4 text-center border-2 border-gray-300 border-dashed rounded-md">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files[0])}
                required
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="mt-2 text-xs text-gray-500">
                Upload a CSV file with customer data
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-md transition-colors hover:bg-blue-700"
            >
              Import Customers
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddCustomerModal = ({ isOpen, onClose, onAdd, isLoading }) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    customerType: "regular", // regular, debtor, creditor
    creditLimit: "0",
    currentBalance: "0",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onAdd(formData);
    onClose();
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      customerType: "regular",
      creditLimit: "0",
      currentBalance: "0",
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-opacity-50">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Add New Customer</h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
            disabled={isLoading}
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Customer Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Enter customer name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                placeholder="Email (optional)"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              disabled={isLoading}
              rows="2"
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Customer address (optional)"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Customer Type *
            </label>
            <select
              name="customerType"
              value={formData.customerType}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            >
              <option value="regular">Regular Customer</option>
              <option value="debtor">Debtor</option>
              <option value="creditor">Creditor</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Credit Limit
              </label>
              <input
                type="number"
                step="0.01"
                name="creditLimit"
                value={formData.creditLimit}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Current Balance
              </label>
              <input
                type="number"
                step="0.01"
                name="currentBalance"
                value={formData.currentBalance}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-sm text-white bg-green-600 rounded-md transition-colors hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Adding...
                </>
              ) : (
                'Add Customer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const formatCurrency = (value) => {
  if (value === null || value === undefined) return '$0.00';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
};

// API Service Functions
const customerAPI = {
  async getAllCustomers() {
    const response = await fetch(`${API_BASE_URL}/customers`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch customers: ${response.status}`);
    }
    
    return response.json();
  },

  async createCustomer(customerData) {
    const response = await fetch(`${API_BASE_URL}/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(customerData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `Failed to create customer: ${response.status}`);
    }
    
    return response.json();
  },

  async updateCustomer(id, customerData) {
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(customerData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update customer: ${response.status}`);
    }
    
    return response.json();
  },

  async deleteCustomer(id) {
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete customer: ${response.status}`);
    }
    
    return response.json();
  }
};

// Main Customers Component
export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setIsLoading(true);
    setError("");
    try {
      const customersData = await customerAPI.getAllCustomers();
      setCustomers(customersData);
    } catch (err) {
      setError(err.message);
      console.error("Error loading customers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate summary metrics
  const calculateSummary = () => {
    const totalCustomers = customers.length;
    const debtors = customers.filter(customer => 
      customer.customerType === 'debtor' || customer.currentBalance < 0
    );
    const creditors = customers.filter(customer => 
      customer.customerType === 'creditor' || customer.currentBalance > 0
    );

    const totalDebts = debtors.reduce((sum, customer) => {
      const balance = Math.abs(typeof customer.currentBalance === 'string' ? 
        parseFloat(customer.currentBalance) : customer.currentBalance || 0);
      return sum + (isNaN(balance) ? 0 : balance);
    }, 0);

    const totalCredits = creditors.reduce((sum, customer) => {
      const balance = Math.abs(typeof customer.currentBalance === 'string' ? 
        parseFloat(customer.currentBalance) : customer.currentBalance || 0);
      return sum + (isNaN(balance) ? 0 : balance);
    }, 0);

    return {
      total: totalCustomers,
      debtors: debtors.length,
      creditors: creditors.length,
      totalDebts,
      totalCredits,
    };
  };

  const summary = calculateSummary();

  // Customer types for filters
  const customerTypes = [...new Set(customers.map(customer => customer.customerType))];

  // Detect mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Filter customers based on filters
  useEffect(() => {
    let filtered = customers;

    if (searchTerm) {
      filtered = filtered.filter(
        (customer) =>
          customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType) {
      filtered = filtered.filter(
        (customer) => customer.customerType === selectedType
      );
    }

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, selectedType]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedType("");
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleImportCSV = (importData) => {
    console.log("Importing CSV data:", importData);
  };

  const handleAddCustomer = async (customerData) => {
    setIsLoading(true);
    setError("");
    try {
      const newCustomer = await customerAPI.createCustomer(customerData);
      setCustomers(prev => [...prev, newCustomer]);
      setShowAddCustomerModal(false);
    } catch (err) {
      setError(err.message);
      console.error("Error adding customer:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCustomer = async (id, customerData) => {
    setIsLoading(true);
    setError("");
    try {
      const updatedCustomer = await customerAPI.updateCustomer(id, customerData);
      setCustomers(prev => prev.map(customer => 
        customer.id === id ? updatedCustomer : customer
      ));
    } catch (err) {
      setError(err.message);
      console.error("Error updating customer:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) {
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      await customerAPI.deleteCustomer(id);
      setCustomers(prev => prev.filter(customer => customer.id !== id));
    } catch (err) {
      setError(err.message);
      console.error("Error deleting customer:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative max-w-6xl mx-auto pb-16 md:pb-0">
      <h1 className="hidden mb-6 text-xl font-normal text-gray-800 md:block font-raleway">
        Customers
      </h1>
      <FolioNav />

      {/* Error Display */}
      {error && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded">
          <strong>Error:</strong> {error}
          <button 
            onClick={() => setError("")}
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      <div className="mt-4 space-y-4 px-2 md:px-0">
        {/* Summary Cards - Total Customers, Debtors, Creditors */}
        <div className="">
          <div className="p-2 bg-white rounded shadow">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-nowrap sm:overflow-x-auto sm:justify-between sm:space-x-1 md:space-x-2">
              {/* TOTAL CUSTOMERS */}
              <div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
                <div className="flex items-center">
                  <div className="p-1 mr-1 rounded bg-blue-100 md:mr-2 md:p-1.5">
                    <FaUsers className="text-xs text-blue-600 md:text-sm" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
                      Total Customers
                    </h3>
                    <p className="text-sm font-bold text-gray-800 md:text-lg">
                      {summary.total}
                    </p>
                  </div>
                </div>
              </div>

              {/* DEBTORS */}
              <div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
                <div className="flex items-center">
                  <div className="p-1 mr-1 rounded bg-red-100 md:mr-2 md:p-1.5">
                    <FaMoneyBillWave className="text-xs text-red-600 md:text-sm" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
                      Debtors
                    </h3>
                    <p className="text-sm font-bold text-gray-800 md:text-lg">
                      {summary.debtors}
                    </p>
                    <p className="text-[10px] text-red-600 font-medium">
                      {formatCurrency(summary.totalDebts)}
                    </p>
                  </div>
                </div>
              </div>

              {/* CREDITORS */}
              <div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
                <div className="flex items-center">
                  <div className="p-1 mr-1 rounded bg-green-100 md:mr-2 md:p-1.5">
                    <FaHandHoldingUsd className="text-xs text-green-600 md:text-sm" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
                      Creditors
                    </h3>
                    <p className="text-sm font-bold text-gray-800 md:text-lg">
                      {summary.creditors}
                    </p>
                    <p className="text-[10px] text-green-600 font-medium">
                      {formatCurrency(summary.totalCredits)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="p-3 bg-white rounded shadow">
          <div className="flex flex-col w-full gap-3 md:flex-row items-stretch">
            {/* Left side - Search and filters */}
            <div className="flex flex-col flex-grow gap-3 md:flex-row">
              {/* Search bar and filter button for mobile */}
              {isMobile ? (
                <div className="flex w-full gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <FaSearch className="absolute right-2 top-1.5 text-xs text-gray-400" />
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
                  <div className="relative w-full md:w-48">
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <FaSearch className="absolute right-2 top-1.5 text-xs text-gray-400" />
                  </div>

                  {/* Desktop filters */}
                  <div className="flex gap-3">
                    {/* Customer Type filter */}
                    <div className="w-auto">
                      <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">All Types</option>
                        <option value="regular">Regular</option>
                        <option value="debtor">Debtor</option>
                        <option value="creditor">Creditor</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right side - Action buttons */}
            <div className="hidden md:flex justify-start w-full gap-2 md:justify-end md:w-auto">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center px-3 py-1.5 text-xs text-white transition-colors bg-blue-600 rounded hover:bg-blue-700"
                disabled={isLoading}
              >
                <FaFileImport className="mr-1 text-xs" />
                Import CSV
              </button>
              <button
                onClick={() => setShowAddCustomerModal(true)}
                className="flex items-center px-3 py-1.5 text-xs text-white transition-colors bg-green-600 rounded hover:bg-green-700"
                disabled={isLoading}
              >
                <FaPlus className="mr-1 text-xs" />
                Add Customer
              </button>
              <button
                onClick={loadCustomers}
                className="flex items-center px-3 py-1.5 text-xs text-white transition-colors bg-gray-600 rounded hover:bg-gray-700"
                disabled={isLoading}
              >
                {isLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          {/* Filter dropdown for mobile */}
          {isMobile && showFilters && (
            <div className="grid grid-cols-1 gap-2 p-2 mt-3 bg-gray-50 rounded">
              {/* Customer Type filter */}
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-700">
                  Customer Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Types</option>
                  <option value="regular">Regular</option>
                  <option value="debtor">Debtor</option>
                  <option value="creditor">Creditor</option>
                </select>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={clearFilters}
                  className="flex-1 px-2 py-1.5 text-xs text-gray-700 transition-colors bg-gray-200 rounded hover:bg-gray-300"
                >
                  Clear Filters
                </button>
                <button
                  onClick={toggleFilters}
                  className="flex-1 px-2 py-1.5 text-xs text-white transition-colors bg-blue-600 rounded hover:bg-blue-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Customers Table */}
        <div className="overflow-hidden bg-white rounded shadow">
          {/* Loading State */}
          {isLoading && customers.length === 0 && (
            <div className="py-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-sm text-gray-600">Loading customers...</p>
            </div>
          )}

          {/* Desktop Table */}
          <div className="hidden overflow-x-auto text-black md:block">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Phone Number
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Email
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Balance
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-black">
                      {customer.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      <div className="flex items-center">
                        <FaPhone className="mr-2 text-xs text-gray-400" />
                        {customer.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      {customer.email ? (
                        <div className="flex items-center">
                          <FaEnvelope className="mr-2 text-xs text-gray-400" />
                          {customer.email}
                        </div>
                      ) : (
                        <span className="text-gray-400">No email</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        customer.customerType === 'debtor' 
                          ? 'bg-red-100 text-red-800'
                          : customer.customerType === 'creditor'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {customer.customerType || 'regular'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-black">
                      <span className={
                        (customer.currentBalance || 0) < 0 
                          ? 'text-red-600' 
                          : (customer.currentBalance || 0) > 0 
                          ? 'text-green-600' 
                          : 'text-gray-600'
                      }>
                        {formatCurrency(customer.currentBalance || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEditCustomer(customer.id, customer)}
                          className="flex items-center px-2 py-1 text-xs text-blue-600 transition-colors bg-blue-100 rounded hover:bg-blue-200"
                          disabled={isLoading}
                        >
                          <FaEdit className="mr-1" />
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="flex items-center px-2 py-1 text-xs text-red-600 transition-colors bg-red-100 rounded hover:bg-red-200"
                          disabled={isLoading}
                        >
                          <FaTrash className="mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="text-black md:hidden">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="p-4 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-black">{customer.name}</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        customer.customerType === 'debtor' 
                          ? 'bg-red-100 text-red-800'
                          : customer.customerType === 'creditor'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {customer.customerType || 'regular'}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <FaPhone className="mr-2 text-xs" />
                        {customer.phone}
                      </div>
                      {customer.email && (
                        <div className="flex items-center">
                          <FaEnvelope className="mr-2 text-xs" />
                          {customer.email}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between mt-3">
                      <div className="text-sm font-medium">
                        Balance: 
                        <span className={
                          (customer.currentBalance || 0) < 0 
                            ? 'text-red-600 ml-1' 
                            : (customer.currentBalance || 0) > 0 
                            ? 'text-green-600 ml-1' 
                            : 'text-gray-600 ml-1'
                        }>
                          {formatCurrency(customer.currentBalance || 0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button 
                        onClick={() => handleEditCustomer(customer.id, customer)}
                        className="flex-1 px-2 py-1 text-xs text-blue-600 transition-colors bg-blue-100 rounded hover:bg-blue-200 flex items-center justify-center"
                        disabled={isLoading}
                      >
                        <FaEdit className="mr-1" />
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="flex-1 px-2 py-1 text-xs text-red-600 transition-colors bg-red-100 rounded hover:bg-red-200 flex items-center justify-center"
                        disabled={isLoading}
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

          {filteredCustomers.length === 0 && !isLoading && (
            <div className="py-6 text-center">
              <p className="text-xs text-black">No customers found</p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Action Buttons for Mobile */}
      {isMobile && (
        <div className="fixed bottom-4 right-4 md:hidden">
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center justify-center w-12 h-12 text-white transition-transform bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 hover:scale-110"
              title="Import CSV"
              disabled={isLoading}
            >
              <FaFileImport className="text-lg" />
            </button>
            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="flex items-center justify-center w-12 h-12 text-white transition-transform bg-green-600 rounded-full shadow-lg hover:bg-green-700 hover:scale-110"
              title="Add Customer"
              disabled={isLoading}
            >
              <FaPlus className="text-lg" />
            </button>
            <button
              onClick={loadCustomers}
              className="flex items-center justify-center w-12 h-12 text-white transition-transform bg-gray-600 rounded-full shadow-lg hover:bg-gray-700 hover:scale-110"
              title="Refresh"
              disabled={isLoading}
            >
              ↻
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ImportCSVModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportCSV}
      />
      
      <AddCustomerModal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        onAdd={handleAddCustomer}
        isLoading={isLoading}
      />
    </div>
  );
}