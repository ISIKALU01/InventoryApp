import { useState, useEffect } from "react";
import FolioNav from "../../components/FolioNav";
import {
  FaSearch,
  FaPlus,
  FaSlidersH,
  FaUniversity,
  FaMoneyBillWave,
  FaTimes,
} from "react-icons/fa";
import { FaEdit, FaTrash } from "react-icons/fa";

import API_BASE_URL from "../../../config";

// Bank API Service
export const bankAPI = {
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

  async getAllBanks() {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/bank-accounts`, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch banks: ${response.status}`);
    }

    return response.json();
  },

  async createBank(bankData) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/bank-accounts`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(bankData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || `Failed to create bank: ${response.status}`
      );
    }

    return response.json();
  },

  async updateBank(id, bankData) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/bank-accounts/${id}`, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(bankData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || `Failed to update bank: ${response.status}`
      );
    }

    return response.json();
  },

  async deleteBank(id) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/bank-accounts/${id}`, {
      method: "DELETE",
      headers: headers,
    });

    if (!response.ok) {
      let errorMessage = `Failed to delete bank: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData?.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return { success: true, message: "Bank deleted successfully" };
    }

    try {
      return await response.json();
    } catch {
      return { success: true, message: "Bank deleted successfully" };
    }
  },
};

// Add Bank Modal Component
const AddBankModal = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    bank_name: "",
    account_number: "",
    account_name: "",
    branch: "",
    account_type: "",
    balance: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const bankData = {
        ...formData,
        balance: parseFloat(formData.balance) || 0,
      };

      const newBank = await bankAPI.createBank(bankData);
      onAdd(newBank);
      onClose();

      // Reset form
      setFormData({
        bank_name: "",
        account_number: "",
        account_name: "",
        branch: "",
        account_type: "",
        balance: "",
        description: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            Add Bank Account
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
            disabled={loading}
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && (
            <div className="p-2 text-sm text-red-600 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          {/* Bank Name */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Bank Name *
            </label>
            <input
              type="text"
              name="bank_name"
              value={formData.bank_name}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Enter bank name"
            />
          </div>

          {/* Account Number */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Account Number *
            </label>
            <input
              type="text"
              name="account_number"
              value={formData.account_number}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Enter account number"
            />
          </div>

          {/* Account Name */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Account Name *
            </label>
            <input
              type="text"
              name="account_name"
              value={formData.account_name}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Enter account name"
            />
          </div>

          {/* Account Type and Branch */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Account Type *
              </label>
              <select
                name="account_type"
                value={formData.account_type}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              >
                <option value="">Select Type</option>
                <option value="Checking">Checking</option>
                <option value="Savings">Savings</option>
                <option value="Business">Business</option>
                <option value="Investment">Investment</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Branch
              </label>
              <input
                type="text"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                placeholder="Enter branch"
              />
            </div>
          </div>

          {/* Balance */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Initial Balance *
            </label>
            <input
              type="number"
              step="0.01"
              name="balance"
              value={formData.balance}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="0.00"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Enter account description"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm text-white bg-green-600 rounded-md transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Bank Modal Component
const EditBankModal = ({ isOpen, onClose, onUpdate, bank }) => {
  const [formData, setFormData] = useState({
    bank_name: "",
    account_number: "",
    account_name: "",
    branch: "",
    account_type: "",
    balance: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Initialize form data when bank changes
  useEffect(() => {
    if (bank) {
      setFormData({
        bank_name: bank.bank_name || "",
        account_number: bank.account_number || "",
        account_name: bank.account_name || "",
        branch: bank.branch || "",
        account_type: bank.account_type || "",
        balance: bank.balance || "",
        description: bank.description || "",
      });
    }
  }, [bank]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const bankData = {
        ...formData,
        balance: parseFloat(formData.balance) || 0,
      };

      const updatedBank = await bankAPI.updateBank(bank.id, bankData);
      onUpdate(updatedBank);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!isOpen || !bank) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-opacity-50">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            Edit Bank Account
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
            disabled={loading}
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && (
            <div className="p-2 text-sm text-red-600 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          {/* Bank Name */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Bank Name *
            </label>
            <input
              type="text"
              name="bank_name"
              value={formData.bank_name}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Enter bank name"
            />
          </div>

          {/* Account Number */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Account Number *
            </label>
            <input
              type="text"
              name="account_number"
              value={formData.account_number}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Enter account number"
            />
          </div>

          {/* Account Name */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Account Name *
            </label>
            <input
              type="text"
              name="account_name"
              value={formData.account_name}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Enter account name"
            />
          </div>

          {/* Account Type and Branch */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Account Type *
              </label>
              <select
                name="account_type"
                value={formData.account_type}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              >
                <option value="">Select Type</option>
                <option value="Checking">Checking</option>
                <option value="Savings">Savings</option>
                <option value="Business">Business</option>
                <option value="Investment">Investment</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Branch
              </label>
              <input
                type="text"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                placeholder="Enter branch"
              />
            </div>
          </div>

          {/* Balance */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Balance *
            </label>
            <input
              type="number"
              step="0.01"
              name="balance"
              value={formData.balance}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="0.00"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Enter account description"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-md transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper function to safely format numbers
const formatCurrency = (value) => {
  if (value === null || value === undefined) return `N0.00`;
  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) return `N0.00`;

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
  }).format(num);
};

// Main Bank Management Component
export default function BankManagement() {
  const [banks, setBanks] = useState([]);
  const [filteredBanks, setFilteredBanks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [showEditBankModal, setShowEditBankModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch banks from API
  const fetchBanks = async () => {
    setLoading(true);
    setError("");
    try {
      const banksData = await bankAPI.getAllBanks();
      setBanks(banksData);
      setFilteredBanks(banksData);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching banks:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit bank
  const handleEdit = (bank) => {
    setSelectedBank(bank);
    setShowEditBankModal(true);
  };

  // Handle delete bank
  const handleDelete = async (bankId) => {
    if (!window.confirm('Are you sure you want to delete this bank account? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await bankAPI.deleteBank(bankId);
      
      // Remove the bank from local state
      setBanks(prevBanks => prevBanks.filter(bank => bank.id !== bankId));
      
      // Show success message
      alert('Bank account deleted successfully');
      
    } catch (err) {
      console.error('Error deleting bank:', err);
      alert(`Error deleting bank: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle bank update
  const handleUpdate = (updatedBank) => {
    setBanks(prevBanks => 
      prevBanks.map(bank => 
        bank.id === updatedBank.id ? updatedBank : bank
      )
    );
    setShowEditBankModal(false);
    setSelectedBank(null);
  };

  // Calculate summary metrics
  const calculateSummary = () => {
    const bankAccounts = banks.length;
    const totalBalance = banks.reduce((sum, bank) => {
      const balance =
        typeof bank.balance === "string"
          ? parseFloat(bank.balance)
          : bank.balance;
      return sum + (isNaN(balance) ? 0 : balance);
    }, 0);

    return {
      bankAccounts,
      totalBalance,
    };
  };

  const summary = calculateSummary();

  // Account types for filters
  const accountTypes = [...new Set(banks.map((bank) => bank.account_type))];

  // Detect mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Filter banks based on filters
  useEffect(() => {
    let filtered = banks;

    if (searchTerm) {
      filtered = filtered.filter(
        (bank) =>
          bank.bank_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bank.account_number
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          bank.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bank.branch?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType) {
      filtered = filtered.filter((bank) => bank.account_type === selectedType);
    }

    setFilteredBanks(filtered);
  }, [banks, searchTerm, selectedType]);

  // Fetch banks on component mount
  useEffect(() => {
    fetchBanks();
  }, []);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedType("");
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleAddBank = (newBank) => {
    setBanks((prevBanks) => [...prevBanks, newBank]);
    fetchBanks(); // Refresh the list to ensure consistency
  };

  return (
    <div className="relative max-w-6xl mx-auto pb-16 md:pb-0">
      <h1 className="hidden mb-6 text-xl font-normal text-gray-800 md:block font-raleway">
        Bank Management
      </h1>
      <FolioNav />

      <div className="mt-4 space-y-4 px-2 md:px-0">
        {/* Summary Cards */}
        <div className="">
          <div className="p-2 bg-white rounded shadow">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-nowrap sm:overflow-x-auto sm:justify-between sm:space-x-1 md:space-x-2">
              {/* BANK ACCOUNTS */}
              <div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
                <div className="flex items-center">
                  <div className="p-1 mr-1 rounded bg-blue-100 md:mr-2 md:p-1.5">
                    <FaUniversity className="text-xs text-blue-600 md:text-sm" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
                      Bank Accounts
                    </h3>
                    <p className="text-sm font-bold text-gray-800 md:text-lg">
                      {summary.bankAccounts}
                    </p>
                  </div>
                </div>
              </div>

              {/* TOTAL BALANCE */}
              <div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
                <div className="flex items-center">
                  <div className="p-1 mr-1 rounded bg-green-100 md:mr-2 md:p-1.5">
                    <FaMoneyBillWave className="text-xs text-green-600 md:text-sm" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
                      Total Balance
                    </h3>
                    <p className="text-sm font-bold text-gray-800 md:text-lg">
                      {formatCurrency(summary.totalBalance)}
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
                      placeholder="Search banks..."
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
                      placeholder="Search banks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <FaSearch className="absolute right-2 top-1.5 text-xs text-gray-400" />
                  </div>

                  {/* Desktop filters */}
                  <div className="flex gap-3">
                    {/* Account Type filter */}
                    <div className="w-auto">
                      <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">All Account Types</option>
                        {accountTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right side - Action buttons - Hidden on medium screens and below */}
            <div className="hidden md:flex justify-start w-full gap-2 md:justify-end md:w-auto">
              <button
                onClick={() => setShowAddBankModal(true)}
                className="flex items-center px-3 py-1.5 text-xs text-white transition-colors bg-green-600 rounded hover:bg-green-700"
              >
                <FaPlus className="mr-1 text-xs" />
                Add Bank Account
              </button>
            </div>
          </div>

          {/* Filter dropdown for mobile */}
          {isMobile && showFilters && (
            <div className="grid grid-cols-1 gap-2 p-2 mt-3 bg-gray-50 rounded">
              {/* Account Type filter */}
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-700">
                  Account Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Account Types</option>
                  {accountTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
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

        {/* Error Message */}
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-100 rounded-md">
            Error: {error}
          </div>
        )}

        {/* Banks Table */}
        <div className="overflow-hidden bg-white rounded shadow">
          {/* Loading State */}
          {loading && (
            <div className="py-6 text-center">
              <p className="text-xs text-black">Loading banks...</p>
            </div>
          )}

          {/* Desktop Table */}
          {!loading && (
            <div className="hidden overflow-x-auto text-black md:block">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                      Bank Name
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                      Account Number
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                      Account Name
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                      Branch
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                      Account Type
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                      Balance
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                      Description
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBanks.map((bank) => (
                    <tr key={bank.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-black">
                        {bank.bank_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        {bank.account_number}
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        {bank.account_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        {bank.branch || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        {bank.account_type}
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        {formatCurrency(bank.balance)}
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        {bank.description || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(bank)}
                            className="p-1 text-blue-600 transition-colors hover:text-blue-800"
                            title="Edit"
                          >
                            <FaEdit className="text-sm" />
                          </button>
                          <button
                            onClick={() => handleDelete(bank.id)}
                            className="p-1 text-red-600 transition-colors hover:text-red-800"
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
            <div className="text-black md:hidden">
              {filteredBanks.map((bank) => (
                <div key={bank.id} className="p-4 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium text-black">
                          {bank.bank_name}
                        </span>
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(bank.balance)}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        {bank.account_number} • {bank.account_name}
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        {bank.branch || "No branch"} • {bank.account_type}
                      </div>
                      {bank.description && (
                        <div className="mt-1 text-sm text-gray-600">
                          {bank.description}
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleEdit(bank)}
                          className="px-2 py-1 text-xs text-blue-600 border border-blue-600 rounded transition-colors hover:bg-blue-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(bank.id)}
                          className="px-2 py-1 text-xs text-red-600 border border-red-600 rounded transition-colors hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredBanks.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-xs text-black">No bank accounts found</p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Action Buttons for Mobile - Placed at bottom of page */}
      {isMobile && (
        <div className="fixed bottom-4 right-4 md:hidden">
          <button
            onClick={() => setShowAddBankModal(true)}
            className="flex items-center justify-center w-12 h-12 text-white transition-transform bg-green-600 rounded-full shadow-lg hover:bg-green-700 hover:scale-110"
            title="Add Bank Account"
          >
            <FaPlus className="text-lg" />
          </button>
        </div>
      )}

      {/* Add Bank Modal */}
      <AddBankModal
        isOpen={showAddBankModal}
        onClose={() => setShowAddBankModal(false)}
        onAdd={handleAddBank}
      />

      {/* Edit Bank Modal */}
      <EditBankModal
        isOpen={showEditBankModal}
        onClose={() => {
          setShowEditBankModal(false);
          setSelectedBank(null);
        }}
        onUpdate={handleUpdate}
        bank={selectedBank}
      />
    </div>
  );
}