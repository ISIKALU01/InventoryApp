import FolioNav from "../../components/FolioNav";
import {
  FaSearch,
  FaPlus,
  FaSlidersH,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaTimes,
  FaArrowLeft,
  FaBirthdayCake,
  FaDollarSign,
  FaCreditCard,
  FaHistory,
  FaCalendar,
  FaMoneyBillWave,
  FaStickyNote
} from "react-icons/fa";
import { FaEdit, FaTrash } from "react-icons/fa";
import CustomerProfile from "../customerProfile"; // Adjust the path as needed
import { useState, useEffect } from "react";


const API_BASE_URL = "https://pgimsapp-production.up.railway.app/api";

// Customer API Service
export const customerAPI = {
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

  async getAllCustomers() {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/customers`, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch customers: ${response.status}`);
    }

    return response.json();
  },

  async createCustomer(customerData) {
    const headers = await this.getAuthHeaders();
    
    const apiCustomerData = {
      name: customerData.name,
      gender: customerData.gender,
      phone: customerData.phone,
      email: customerData.email,
      address: customerData.address,
      birthday: customerData.birthday,
      balance: customerData.balance,
      credit_limit: customerData.credit_limit,
      notes: customerData.notes
    };

    const response = await fetch(`${API_BASE_URL}/customers`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(apiCustomerData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || `Failed to create customer: ${response.status}`
      );
    }

    return response.json();
  },

  async updateCustomer(id, customerData) {
    const headers = await this.getAuthHeaders();
    
    const apiCustomerData = {
      name: customerData.name,
      gender: customerData.gender,
      phone: customerData.phone,
      email: customerData.email,
      address: customerData.address,
      birthday: customerData.birthday,
      balance: customerData.balance,
      credit_limit: customerData.credit_limit,
      notes: customerData.notes
    };

    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(apiCustomerData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || `Failed to update customer: ${response.status}`
      );
    }

    return response.json();
  },

  async deleteCustomer(id) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
      method: "DELETE",
      headers: headers,
    });

    if (!response.ok) {
      let errorMessage = `Failed to delete customer: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData?.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return { success: true, message: "Customer deleted successfully" };
    }

    try {
      return await response.json();
    } catch {
      return { success: true, message: "Customer deleted successfully" };
    }
  },

  // Deposit API methods
  async addDeposit(customerId, depositData) {
    const headers = await this.getAuthHeaders();
    
    const apiDepositData = {
      amount: parseFloat(depositData.amount),
      description: depositData.description,
      customer_id: customerId
    };

    const response = await fetch(`${API_BASE_URL}/deposits`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(apiDepositData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || `Failed to add deposit: ${response.status}`
      );
    }

    return response.json();
  },

  async getCustomerDeposits(customerId) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/customers/${customerId}/deposits`, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch deposits: ${response.status}`);
    }

    return response.json();
  },

  async getCustomerById(id) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch customer: ${response.status}`);
    }

    return response.json();
  }
};


// Modal Components (Keep your existing AddCustomerModal and EditCustomerModal)
const AddCustomerModal = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: "",
    gender: "female",
    phone: "",
    email: "",
    address: "",
    birthday: "",
    balance: "0.00",
    credit_limit: "0.00",
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const newCustomer = await customerAPI.createCustomer(formData);
      onAdd(newCustomer);
      onClose();

      setFormData({
        name: "",
        gender: "female",
        phone: "",
        email: "",
        address: "",
        birthday: "",
        balance: "0.00",
        credit_limit: "0.00",
        notes: ""
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            Add Customer
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
            disabled={loading}
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && (
            <div className="p-2 text-sm text-red-600 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Full name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Gender *
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Phone *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                placeholder="Phone number"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Birthday
            </label>
            <input
              type="date"
              name="birthday"
              value={formData.birthday}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Balance
              </label>
              <input
                type="number"
                step="0.01"
                name="balance"
                value={formData.balance}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Credit Limit
              </label>
              <input
                type="number"
                step="0.01"
                name="credit_limit"
                value={formData.credit_limit}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Street address"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              disabled={loading}
              rows={3}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Additional notes"
            />
          </div>

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
              {loading ? "Adding..." : "Add Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditCustomerModal = ({ isOpen, onClose, onUpdate, customer }) => {
  const [formData, setFormData] = useState({
    name: "",
    gender: "female",
    phone: "",
    email: "",
    address: "",
    birthday: "",
    balance: "0.00",
    credit_limit: "0.00",
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        gender: customer.gender || "female",
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
        birthday: customer.birthday || "",
        balance: customer.balance || "0.00",
        credit_limit: customer.credit_limit || "0.00",
        notes: customer.notes || ""
      });
    }
  }, [customer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const updatedCustomer = await customerAPI.updateCustomer(customer.id, formData);
      onUpdate(updatedCustomer);
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

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            Edit Customer
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
            disabled={loading}
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && (
            <div className="p-2 text-sm text-red-600 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Full name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Gender *
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Phone *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                placeholder="Phone number"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Birthday
            </label>
            <input
              type="date"
              name="birthday"
              value={formData.birthday}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Balance
              </label>
              <input
                type="number"
                step="0.01"
                name="balance"
                value={formData.balance}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Credit Limit
              </label>
              <input
                type="number"
                step="0.01"
                name="credit_limit"
                value={formData.credit_limit}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Street address"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              disabled={loading}
              rows={3}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Additional notes"
            />
          </div>

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
              {loading ? "Updating..." : "Update Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper function to get gender badge color
const getGenderBadge = (gender) => {
  switch (gender) {
    case "male":
      return "bg-blue-100 text-blue-800";
    case "female":
      return "bg-pink-100 text-pink-800";
    case "other":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Helper function to format currency in Naira
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(amount || 0);
};

// Helper function to format Naira without currency symbol
const formatNaira = (amount) => {
  return new Intl.NumberFormat('en-NG').format(amount || 0);
};

// Main Customer Management Component
export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Customer Profile State
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [showCustomerProfile, setShowCustomerProfile] = useState(false);

  // Fetch customers from API
  const fetchCustomers = async () => {
    setLoading(true);
    setError("");
    try {
      const customersData = await customerAPI.getAllCustomers();
      setCustomers(customersData);
      setFilteredCustomers(customersData);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching customers:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle customer row click
  const handleCustomerClick = (customer) => {
    setSelectedCustomerId(customer.id);
    setShowCustomerProfile(true);
  };

  // Handle back from profile
  const handleBackFromProfile = () => {
    setShowCustomerProfile(false);
    setSelectedCustomerId(null);
    fetchCustomers(); // Refresh the customer list to get updated balances
  };

  // Handle edit customer
  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setShowEditCustomerModal(true);
  };

  // Handle delete customer
  const handleDelete = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await customerAPI.deleteCustomer(customerId);
      
      setCustomers(prevCustomers => prevCustomers.filter(customer => customer.id !== customerId));
      
      alert('Customer deleted successfully');
      
    } catch (err) {
      console.error('Error deleting customer:', err);
      alert(`Error deleting customer: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle customer update
  const handleUpdate = (updatedCustomer) => {
    setCustomers(prevCustomers => 
      prevCustomers.map(customer => 
        customer.id === updatedCustomer.id ? updatedCustomer : customer
      )
    );
    setShowEditCustomerModal(false);
    setSelectedCustomer(null);
  };

  // Calculate summary metrics for total customers, debtors, and creditors
  const calculateSummary = () => {
    const totalCustomers = customers.length;
    
    // Debtors: customers with negative balance (owe money)
    const debtors = customers.filter(customer => parseFloat(customer.balance || 0) < 0);
    const totalDebtors = debtors.length;
    const totalDebtAmount = debtors.reduce((sum, customer) => sum + Math.abs(parseFloat(customer.balance || 0)), 0);
    
    // Creditors: customers with positive balance (are owed money)
    const creditors = customers.filter(customer => parseFloat(customer.balance || 0) > 0);
    const totalCreditors = creditors.length;
    const totalCreditAmount = creditors.reduce((sum, customer) => sum + parseFloat(customer.balance || 0), 0);

    return {
      totalCustomers,
      totalDebtors,
      totalDebtAmount,
      totalCreditors,
      totalCreditAmount,
    };
  };

  const summary = calculateSummary();

  // Customer genders for filters
  const customerGenders = [...new Set(customers.map((customer) => customer.gender))];

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
          customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedGender) {
      filtered = filtered.filter((customer) => customer.gender === selectedGender);
    }

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, selectedGender]);

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedGender("");
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleAddCustomer = (newCustomer) => {
    setCustomers((prevCustomers) => [...prevCustomers, newCustomer]);
    fetchCustomers();
  };

  // If showing customer profile, render the profile component
  if (showCustomerProfile && selectedCustomerId) {
    return (
      <CustomerProfile 
        customerId={selectedCustomerId} 
        onBack={handleBackFromProfile}
      />
    );
  }

  return (
    <div className="relative max-w-6xl mx-auto pb-16 md:pb-0">
      <h1 className="hidden mb-6 text-xl font-normal text-gray-800 md:block font-raleway">
        Customer Management
      </h1>
      <FolioNav />

      <div className="mt-4 space-y-4 px-2 md:px-0">
        {/* Summary Cards */}
        <div className="">
          <div className="p-2 bg-white rounded shadow">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-nowrap sm:overflow-x-auto sm:justify-between sm:space-x-1 md:space-x-2">
              {/* TOTAL CUSTOMERS */}
              <div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
                <div className="flex items-center">
                  <div className="p-1 mr-1 rounded bg-blue-100 md:mr-2 md:p-1.5">
                    <FaUser className="text-xs text-blue-600 md:text-sm" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
                      Total Customers
                    </h3>
                    <p className="text-sm font-bold text-gray-800 md:text-lg">
                      {summary.totalCustomers}
                    </p>
                  </div>
                </div>
              </div>

              {/* DEBTORS */}
              <div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
                <div className="flex items-center">
                  <div className="p-1 mr-1 rounded bg-red-100 md:mr-2 md:p-1.5">
                    <FaUser className="text-xs text-red-600 md:text-sm" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
                      Debtors
                    </h3>
                    <p className="text-sm font-bold text-gray-800 md:text-lg">
                      {summary.totalDebtors}
                    </p>
                    <p className="text-xs font-medium text-red-600">
                      ₦{formatNaira(summary.totalDebtAmount)}
                    </p>
                  </div>
                </div>
              </div>

              {/* CREDITORS */}
              <div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
                <div className="flex items-center">
                  <div className="p-1 mr-1 rounded bg-green-100 md:mr-2 md:p-1.5">
                    <FaUser className="text-xs text-green-600 md:text-sm" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
                      Creditors
                    </h3>
                    <p className="text-sm font-bold text-gray-800 md:text-lg">
                      {summary.totalCreditors}
                    </p>
                    <p className="text-xs font-medium text-green-600">
                      ₦{formatNaira(summary.totalCreditAmount)}
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
                    {/* Gender filter */}
                    <div className="w-auto">
                      <select
                        value={selectedGender}
                        onChange={(e) => setSelectedGender(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">All Genders</option>
                        {customerGenders.map((gender) => (
                          <option key={gender} value={gender}>
                            {gender.charAt(0).toUpperCase() + gender.slice(1)}
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
                onClick={() => setShowAddCustomerModal(true)}
                className="flex items-center px-3 py-1.5 text-xs text-white transition-colors bg-green-600 rounded hover:bg-green-700"
              >
                <FaPlus className="mr-1 text-xs" />
                Add Customer
              </button>
            </div>
          </div>

          {/* Filter dropdown for mobile */}
          {isMobile && showFilters && (
            <div className="grid grid-cols-1 gap-2 p-2 mt-3 bg-gray-50 rounded">
              {/* Gender filter */}
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-700">
                  Gender
                </label>
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Genders</option>
                  {customerGenders.map((gender) => (
                    <option key={gender} value={gender}>
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
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

        {/* Customers Table */}
        <div className="overflow-hidden bg-white rounded shadow">
          {/* Loading State */}
          {loading && (
            <div className="py-6 text-center">
              <p className="text-xs text-black">Loading customers...</p>
            </div>
          )}

          {/* Desktop Table */}
          {!loading && (
            <div className="hidden overflow-x-auto text-black md:block">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                      Name
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                      Gender
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                      Balance
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                      Birthday
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr 
                      key={customer.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleCustomerClick(customer)}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-black">
                        <div>
                          {customer.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {customer.id}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        <div className="flex items-center gap-1">
                          <FaEnvelope className="text-xs text-gray-400" />
                          <span>{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <FaPhone className="text-xs text-gray-400" />
                          <span>{customer.phone}</span>
                        </div>
                        {customer.address && (
                          <div className="flex items-center gap-1 mt-1">
                            <FaMapMarkerAlt className="text-xs text-gray-400" />
                            <span className="text-xs text-gray-600">{customer.address}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getGenderBadge(customer.gender)}`}>
                          {customer.gender?.charAt(0).toUpperCase() + customer.gender?.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        <span className={`font-medium ${parseFloat(customer.balance || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ₦{formatNaira(Math.abs(parseFloat(customer.balance || 0)))}
                        </span>
                      </td>
                  
                      <td className="px-4 py-3 text-sm text-black">
                        {customer.birthday ? new Date(customer.birthday).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(customer);
                            }}
                            className="p-1 text-blue-600 transition-colors hover:text-blue-800"
                            title="Edit"
                          >
                            <FaEdit className="text-sm" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(customer.id);
                            }}
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
              {filteredCustomers.map((customer) => (
                <div 
                  key={customer.id} 
                  className="p-4 border-b border-gray-200 cursor-pointer"
                  onClick={() => handleCustomerClick(customer)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium text-black">
                          {customer.name}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getGenderBadge(customer.gender)}`}>
                          {customer.gender?.charAt(0).toUpperCase() + customer.gender?.slice(1)}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <FaEnvelope className="text-xs" />
                          {customer.email}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <FaPhone className="text-xs" />
                          {customer.phone}
                        </div>
                        {customer.address && (
                          <div className="flex items-center gap-1 mt-1">
                            <FaMapMarkerAlt className="text-xs" />
                            {customer.address}
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <span className="text-xs text-gray-500">Balance:</span>
                            <div className={`text-sm font-medium ${parseFloat(customer.balance || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                              ₦{formatNaira(Math.abs(parseFloat(customer.balance || 0)))}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Birthday:</span>
                            <div className="text-sm font-medium">
                              {customer.birthday ? new Date(customer.birthday).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(customer);
                          }}
                          className="px-2 py-1 text-xs text-blue-600 border border-blue-600 rounded transition-colors hover:bg-blue-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(customer.id);
                          }}
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

          {!loading && filteredCustomers.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-xs text-black">No customers found</p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Action Buttons for Mobile - Placed at bottom of page */}
      {isMobile && (
        <div className="fixed bottom-4 right-4 md:hidden">
          <button
            onClick={() => setShowAddCustomerModal(true)}
            className="flex items-center justify-center w-12 h-12 text-white transition-transform bg-green-600 rounded-full shadow-lg hover:bg-green-700 hover:scale-110"
            title="Add Customer"
          >
            <FaPlus className="text-lg" />
          </button>
        </div>
      )}

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        onAdd={handleAddCustomer}
      />

      {/* Edit Customer Modal */}
      <EditCustomerModal
        isOpen={showEditCustomerModal}
        onClose={() => {
          setShowEditCustomerModal(false);
          setSelectedCustomer(null);
        }}
        onUpdate={handleUpdate}
        customer={selectedCustomer}
      />
    </div>
  );
}