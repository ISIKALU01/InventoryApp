import { useState, useEffect } from "react";
import FolioNav from "../../components/FolioNav";
import {
  FaSearch,
  FaPlus,
  FaSlidersH,
  FaBuilding,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaTimes,
} from "react-icons/fa";
import { FaEdit, FaTrash } from "react-icons/fa";

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

// Add Supplier Modal Component
const AddSupplierModal = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Filter out empty optional fields
      const supplierData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== "")
      );

      const newSupplier = await supplierAPI.createSupplier(supplierData);
      onAdd(newSupplier);
      onClose();

      // Reset form
      setFormData({
        name: "",
        contact_name: "",
        email: "",
        phone: "",
        address: "",
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
            Add Supplier
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

          {/* Supplier Name */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Supplier Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Enter supplier name"
            />
          </div>

          {/* Contact Name */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Contact Name
            </label>
            <input
              type="text"
              name="contact_name"
              value={formData.contact_name}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Enter contact name"
            />
          </div>

          {/* Email and Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                placeholder="Enter email"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={2}
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Enter supplier address"
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
              placeholder="Enter supplier description"
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
              {loading ? "Adding..." : "Add Supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Supplier Modal Component
const EditSupplierModal = ({ isOpen, onClose, onUpdate, supplier }) => {
  const [formData, setFormData] = useState({
    name: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Initialize form data when supplier changes
  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || "",
        contact_name: supplier.contact_name || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
        description: supplier.description || "",
      });
    }
  }, [supplier]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Filter out empty optional fields
      const supplierData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== "")
      );

      const updatedSupplier = await supplierAPI.updateSupplier(supplier.id, supplierData);
      onUpdate(updatedSupplier);
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

  if (!isOpen || !supplier) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-opacity-50">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            Edit Supplier
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

          {/* Supplier Name */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Supplier Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Enter supplier name"
            />
          </div>

          {/* Contact Name */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Contact Name
            </label>
            <input
              type="text"
              name="contact_name"
              value={formData.contact_name}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Enter contact name"
            />
          </div>

          {/* Email and Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                placeholder="Enter email"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={2}
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Enter supplier address"
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
              placeholder="Enter supplier description"
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
              {loading ? "Updating..." : "Update Supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
};

// Main Supplier Management Component
export default function SupplierManagement() {
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showEditSupplierModal, setShowEditSupplierModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch suppliers from API
  const fetchSuppliers = async () => {
    setLoading(true);
    setError("");
    try {
      const suppliersData = await supplierAPI.getAllSuppliers();
      setSuppliers(suppliersData);
      setFilteredSuppliers(suppliersData);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching suppliers:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit supplier
  const handleEdit = (supplier) => {
    setSelectedSupplier(supplier);
    setShowEditSupplierModal(true);
  };

  // Handle delete supplier
  const handleDelete = async (supplierId) => {
    if (!window.confirm('Are you sure you want to delete this supplier? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await supplierAPI.deleteSupplier(supplierId);
      
      // Remove the supplier from local state
      setSuppliers(prevSuppliers => prevSuppliers.filter(supplier => supplier.id !== supplierId));
      
      // Show success message
      alert('Supplier deleted successfully');
      
    } catch (err) {
      console.error('Error deleting supplier:', err);
      alert(`Error deleting supplier: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle supplier update
  const handleUpdate = (updatedSupplier) => {
    setSuppliers(prevSuppliers => 
      prevSuppliers.map(supplier => 
        supplier.id === updatedSupplier.id ? updatedSupplier : supplier
      )
    );
    setShowEditSupplierModal(false);
    setSelectedSupplier(null);
  };

  // Calculate summary metrics
  const calculateSummary = () => {
    const totalSuppliers = suppliers.length;
    const suppliersWithContact = suppliers.filter(supplier => 
      supplier.contact_name || supplier.email || supplier.phone
    ).length;

    return {
      totalSuppliers,
      suppliersWithContact,
    };
  };

  const summary = calculateSummary();

  // Detect mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Filter suppliers based on filters
  useEffect(() => {
    let filtered = suppliers;

    if (searchTerm) {
      filtered = filtered.filter(
        (supplier) =>
          supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSuppliers(filtered);
  }, [suppliers, searchTerm]);

  // Fetch suppliers on component mount
  useEffect(() => {
    fetchSuppliers();
  }, []);

  const clearFilters = () => {
    setSearchTerm("");
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleAddSupplier = (newSupplier) => {
    setSuppliers((prevSuppliers) => [...prevSuppliers, newSupplier]);
    fetchSuppliers(); // Refresh the list to ensure consistency
  };

  return (
    <div className="relative max-w-6xl mx-auto pb-16 md:pb-0">
      <h1 className="hidden mb-6 text-xl font-normal text-gray-800 md:block font-raleway">
        Supplier Management
      </h1>
      <FolioNav />

      <div className="mt-4 space-y-4 px-2 md:px-0">
        {/* Summary Cards */}
        <div className="">
          <div className="p-2 bg-white rounded shadow">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-nowrap sm:overflow-x-auto sm:justify-between sm:space-x-1 md:space-x-2">
              {/* TOTAL SUPPLIERS */}
              <div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
                <div className="flex items-center">
                  <div className="p-1 mr-1 rounded bg-blue-100 md:mr-2 md:p-1.5">
                    <FaBuilding className="text-xs text-blue-600 md:text-sm" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
                      Total Suppliers
                    </h3>
                    <p className="text-sm font-bold text-gray-800 md:text-lg">
                      {summary.totalSuppliers}
                    </p>
                  </div>
                </div>
              </div>

              {/* SUPPLIERS WITH CONTACT */}
              <div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
                <div className="flex items-center">
                  <div className="p-1 mr-1 rounded bg-green-100 md:mr-2 md:p-1.5">
                    <FaUser className="text-xs text-green-600 md:text-sm" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
                      With Contact Info
                    </h3>
                    <p className="text-sm font-bold text-gray-800 md:text-lg">
                      {summary.suppliersWithContact}
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
                      placeholder="Search suppliers..."
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
                      placeholder="Search suppliers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <FaSearch className="absolute right-2 top-1.5 text-xs text-gray-400" />
                  </div>
                </>
              )}
            </div>

            {/* Right side - Action buttons - Hidden on medium screens and below */}
            <div className="hidden md:flex justify-start w-full gap-2 md:justify-end md:w-auto">
              <button
                onClick={() => setShowAddSupplierModal(true)}
                className="flex items-center px-3 py-1.5 text-xs text-white transition-colors bg-green-600 rounded hover:bg-green-700"
              >
                <FaPlus className="mr-1 text-xs" />
                Add Supplier
              </button>
            </div>
          </div>

          {/* Filter dropdown for mobile */}
          {isMobile && showFilters && (
            <div className="grid grid-cols-1 gap-2 p-2 mt-3 bg-gray-50 rounded">
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

        {/* Suppliers Table */}
        <div className="overflow-hidden bg-white rounded shadow">
          {/* Loading State */}
          {loading && (
            <div className="py-6 text-center">
              <p className="text-xs text-black">Loading suppliers...</p>
            </div>
          )}

          {/* Desktop Table */}
          {!loading && (
            <div className="hidden overflow-x-auto text-black md:block">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                      Supplier Name
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                      Contact Name
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                      Email
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                      Address
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                      Description
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                      Last Updated
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-black">
                        {supplier.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        {supplier.contact_name || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        {supplier.email ? (
                          <a
                            href={`mailto:${supplier.email}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {supplier.email}
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        {supplier.phone ? (
                          <a
                            href={`tel:${supplier.phone}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {supplier.phone}
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        {supplier.address || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        {supplier.description || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        {formatDate(supplier.updated_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(supplier)}
                            className="p-1 text-blue-600 transition-colors hover:text-blue-800"
                            title="Edit"
                          >
                            <FaEdit className="text-sm" />
                          </button>
                          <button
                            onClick={() => handleDelete(supplier.id)}
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
              {filteredSuppliers.map((supplier) => (
                <div key={supplier.id} className="p-4 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium text-black">
                          {supplier.name}
                        </span>
                      </div>
                      
                      {/* Contact Info */}
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        {supplier.contact_name && (
                          <div className="flex items-center">
                            <FaUser className="mr-2 text-xs" />
                            {supplier.contact_name}
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center">
                            <FaEnvelope className="mr-2 text-xs" />
                            <a
                              href={`mailto:${supplier.email}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {supplier.email}
                            </a>
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center">
                            <FaPhone className="mr-2 text-xs" />
                            <a
                              href={`tel:${supplier.phone}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {supplier.phone}
                            </a>
                          </div>
                        )}
                        {supplier.address && (
                          <div className="flex items-start">
                            <FaMapMarkerAlt className="mr-2 mt-0.5 text-xs flex-shrink-0" />
                            <span>{supplier.address}</span>
                          </div>
                        )}
                      </div>

                      {supplier.description && (
                        <div className="mt-2 text-sm text-gray-600">
                          {supplier.description}
                        </div>
                      )}

                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>Updated: {formatDate(supplier.updated_at)}</span>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="px-2 py-1 text-xs text-blue-600 border border-blue-600 rounded transition-colors hover:bg-blue-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id)}
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

          {!loading && filteredSuppliers.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-xs text-black">No suppliers found</p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Action Buttons for Mobile - Placed at bottom of page */}
      {isMobile && (
        <div className="fixed bottom-4 right-4 md:hidden">
          <button
            onClick={() => setShowAddSupplierModal(true)}
            className="flex items-center justify-center w-12 h-12 text-white transition-transform bg-green-600 rounded-full shadow-lg hover:bg-green-700 hover:scale-110"
            title="Add Supplier"
          >
            <FaPlus className="text-lg" />
          </button>
        </div>
      )}

      {/* Add Supplier Modal */}
      <AddSupplierModal
        isOpen={showAddSupplierModal}
        onClose={() => setShowAddSupplierModal(false)}
        onAdd={handleAddSupplier}
      />

      {/* Edit Supplier Modal */}
      <EditSupplierModal
        isOpen={showEditSupplierModal}
        onClose={() => {
          setShowEditSupplierModal(false);
          setSelectedSupplier(null);
        }}
        onUpdate={handleUpdate}
        supplier={selectedSupplier}
      />
    </div>
  );
}