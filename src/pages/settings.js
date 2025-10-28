import { useState, useEffect } from "react";
import { 
  FaStore, 
  FaCog, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSave, 
  FaTimes,
  FaBuilding,
  FaMapMarkerAlt,
  FaPhone,
  FaGlobe,
  FaUserCog,
  FaBell,
  FaShieldAlt,
  FaPalette,
  FaDatabase
} from "react-icons/fa";

const API_BASE_URL = "https://pgimsapp-production.up.railway.app/api";

// API Service for Stores
const storeAPI = {
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

  async createStore(storeData) {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/stores`, {
        method: "POST",
        headers,
        body: JSON.stringify(storeData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Failed to create store: ${response.status}`
        );
      }

      return response.json();
    } catch (error) {
      if (
        error.message.includes("No authentication token") ||
        error.message.includes("Authentication failed")
      ) {
        window.location.href = "/";
      }
      throw error;
    }
  },

  async getStores() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/stores`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        throw new Error(`Failed to fetch stores: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error.message.includes("No authentication token")) {
        window.location.href = "/";
      }
      throw error;
    }
  },

  async updateStore(id, storeData) {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/stores/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(storeData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Failed to update store: ${response.status}`
        );
      }

      return response.json();
    } catch (error) {
      if (
        error.message.includes("No authentication token") ||
        error.message.includes("Authentication failed")
      ) {
        window.location.href = "/";
      }
      throw error;
    }
  },

  async deleteStore(id) {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/stores/${id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Failed to delete store: ${response.status}`
        );
      }

      if (response.status === 204) {
        return { success: true };
      }

      return response.json();
    } catch (error) {
      if (
        error.message.includes("No authentication token") ||
        error.message.includes("Authentication failed")
      ) {
        window.location.href = "/";
      }
      throw error;
    }
  },
};

// Store Form Modal Component
const StoreFormModal = ({ isOpen, onClose, onSave, isLoading, store = null }) => {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    website: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (store && isOpen) {
      setFormData({
        name: store.name || "",
        address: store.address || "",
        phone: store.phone || "",
        website: store.website || "",
      });
    } else if (!store && isOpen) {
      setFormData({
        name: "",
        address: "",
        phone: "",
        website: "",
      });
    }
    setErrors({});
  }, [store, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Store name is required";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    await onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <div className="p-2 mr-3 rounded-lg bg-blue-100">
              <FaStore className="text-lg text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {store ? "Edit Store" : "Create New Store"}
              </h2>
              <p className="text-sm text-gray-600">
                {store ? "Update store information" : "Add a new store to your account"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-600"
            disabled={isLoading}
          >
            <FaTimes className="text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="flex items-center mb-2 text-sm font-medium text-gray-700">
              <FaBuilding className="mr-2 text-gray-400" />
              Store Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isLoading}
              className={`w-full px-4 py-3 text-sm border rounded-lg outline-none transition-colors ${
                errors.name 
                  ? "border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500" 
                  : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              } disabled:opacity-50`}
              placeholder="Enter store name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="flex items-center mb-2 text-sm font-medium text-gray-700">
              <FaMapMarkerAlt className="mr-2 text-gray-400" />
              Address *
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              disabled={isLoading}
              rows="3"
              className={`w-full px-4 py-3 text-sm border rounded-lg outline-none transition-colors ${
                errors.address 
                  ? "border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500" 
                  : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              } disabled:opacity-50`}
              placeholder="Enter store address"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address}</p>
            )}
          </div>

          <div>
            <label className="flex items-center mb-2 text-sm font-medium text-gray-700">
              <FaPhone className="mr-2 text-gray-400" />
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              disabled={isLoading}
              className={`w-full px-4 py-3 text-sm border rounded-lg outline-none transition-colors ${
                errors.phone 
                  ? "border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500" 
                  : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              } disabled:opacity-50`}
              placeholder="Enter phone number"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="flex items-center mb-2 text-sm font-medium text-gray-700">
              <FaGlobe className="mr-2 text-gray-400" />
              Website (Optional)
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="https://example.com"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center flex-1 px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {store ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  {store ? "Update Store" : "Create Store"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Store Card Component
const StoreCard = ({ store, onEdit, onDelete, isLoading }) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div 
      className="relative p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="p-3 rounded-lg bg-blue-50">
            <FaStore className="text-xl text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {store.name}
            </h3>
            <div className="mt-2 space-y-2 text-sm text-gray-600">
              <div className="flex items-start">
                <FaMapMarkerAlt className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                <span className="break-words">{store.address}</span>
              </div>
              <div className="flex items-center">
                <FaPhone className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                <span>{store.phone}</span>
              </div>
              {store.website && (
                <div className="flex items-center">
                  <FaGlobe className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                  <a 
                    href={store.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate"
                  >
                    {store.website}
                  </a>
                </div>
              )}
            </div>
            <div className="mt-3 text-xs text-gray-500">
              Created: {new Date(store.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        {showActions && (
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(store)}
              disabled={isLoading}
              className="p-2 text-blue-600 transition-colors bg-blue-100 rounded-lg hover:bg-blue-200 disabled:opacity-50"
              title="Edit Store"
            >
              <FaEdit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(store.id)}
              disabled={isLoading}
              className="p-2 text-red-600 transition-colors bg-red-100 rounded-lg hover:bg-red-200 disabled:opacity-50"
              title="Delete Store"
            >
              <FaTrash className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Settings Sections
const SettingsSection = ({ title, description, icon: Icon, children }) => (
  <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
    <div className="flex items-start mb-6">
      <div className="p-2 mr-4 rounded-lg bg-gray-100">
        <Icon className="text-xl text-gray-600" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
    {children}
  </div>
);

// Main Settings Component
export default function Settings() {
  const [activeSection, setActiveSection] = useState("stores");
  const [stores, setStores] = useState([]);
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Settings sections
  const settingsSections = [
    { id: "stores", name: "Stores", icon: FaStore, description: "Manage your store locations" },
    { id: "general", name: "General", icon: FaCog, description: "Basic application settings" },
    { id: "appearance", name: "Appearance", icon: FaPalette, description: "Customize the look and feel" },
    { id: "notifications", name: "Notifications", icon: FaBell, description: "Manage your notification preferences" },
    { id: "security", name: "Security", icon: FaShieldAlt, description: "Security and privacy settings" },
    { id: "users", name: "Users", icon: FaUserCog, description: "Manage user accounts and permissions" },
    { id: "data", name: "Data Management", icon: FaDatabase, description: "Backup and data handling" },
  ];

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    setIsLoading(true);
    setError("");
    try {
      const storesData = await storeAPI.getStores();
      setStores(Array.isArray(storesData) ? storesData : []);
    } catch (err) {
      setError(err.message);
      console.error("Error loading stores:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStore = async (storeData) => {
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    
    try {
      const newStore = await storeAPI.createStore(storeData);
      setStores(prev => [...prev, newStore]);
      setShowStoreForm(false);
      setSuccess("Store created successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
      console.error("Error creating store:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStore = async (storeData) => {
    if (!editingStore) return;

    setIsSubmitting(true);
    setError("");
    setSuccess("");
    
    try {
      const updatedStore = await storeAPI.updateStore(editingStore.id, storeData);
      setStores(prev => prev.map(store => 
        store.id === editingStore.id ? updatedStore : store
      ));
      setShowStoreForm(false);
      setEditingStore(null);
      setSuccess("Store updated successfully!");
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
      console.error("Error updating store:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStore = async (storeId) => {
    if (!window.confirm("Are you sure you want to delete this store? This action cannot be undone.")) {
      return;
    }

    setIsLoading(true);
    setError("");
    
    try {
      await storeAPI.deleteStore(storeId);
      setStores(prev => prev.filter(store => store.id !== storeId));
      setSuccess("Store deleted successfully!");
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
      console.error("Error deleting store:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const openStoreForm = (store = null) => {
    setEditingStore(store);
    setShowStoreForm(true);
  };

  const closeStoreForm = () => {
    setShowStoreForm(false);
    setEditingStore(null);
  };

  const renderStoresSection = () => (
    <SettingsSection
      title="Store Management"
      description="Create and manage your store locations"
      icon={FaStore}
    >
      {error && (
        <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg">
          <strong>Error:</strong> {error}
          <button
            onClick={() => setError("")}
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 mb-6 text-sm text-green-700 bg-green-100 border border-green-300 rounded-lg">
          <strong>Success:</strong> {success}
          <button
            onClick={() => setSuccess("")}
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-lg font-medium text-gray-900">Your Stores</h4>
          <p className="text-sm text-gray-600">
            {stores.length} store{stores.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <button
          onClick={() => openStoreForm()}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
        >
          <FaPlus className="mr-2" />
          Add Store
        </button>
      </div>

      {isLoading && stores.length === 0 ? (
        <div className="py-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-sm text-gray-600">Loading stores...</p>
        </div>
      ) : stores.length === 0 ? (
        <div className="py-12 text-center">
          <FaStore className="mx-auto text-4xl text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No stores yet</h3>
          <p className="mt-2 text-sm text-gray-600">
            Get started by creating your first store location.
          </p>
          <button
            onClick={() => openStoreForm()}
            className="mt-4 flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700 mx-auto"
          >
            <FaPlus className="mr-2" />
            Create Your First Store
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {stores.map(store => (
            <StoreCard
              key={store.id}
              store={store}
              onEdit={openStoreForm}
              onDelete={handleDeleteStore}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}
    </SettingsSection>
  );

  const renderGeneralSection = () => (
    <SettingsSection
      title="General Settings"
      description="Basic application preferences and configuration"
      icon={FaCog}
    >
      <div className="space-y-6">
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Application Preferences</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-900">Language</label>
                <p className="text-sm text-gray-600">Select your preferred language</p>
              </div>
              <select className="px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-900">Timezone</label>
                <p className="text-sm text-gray-600">Set your local timezone</p>
              </div>
              <select className="px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>UTC</option>
                <option>EST</option>
                <option>PST</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-900">Currency</label>
                <p className="text-sm text-gray-600">Default currency for transactions</p>
              </div>
              <select className="px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>USD ($)</option>
                <option>EUR (€)</option>
                <option>GBP (£)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </SettingsSection>
  );

  const renderAppearanceSection = () => (
    <SettingsSection
      title="Appearance"
      description="Customize the look and feel of your application"
      icon={FaPalette}
    >
      <div className="space-y-6">
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Theme</h4>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {['Light', 'Dark', 'Auto'].map(theme => (
              <button
                key={theme}
                className="p-4 border-2 border-gray-200 rounded-lg text-center hover:border-blue-500 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900">{theme}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </SettingsSection>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case "stores":
        return renderStoresSection();
      case "general":
        return renderGeneralSection();
      case "appearance":
        return renderAppearanceSection();
      default:
        return (
          <SettingsSection
            title={settingsSections.find(s => s.id === activeSection)?.name || "Settings"}
            description="Configuration options"
            icon={FaCog}
          >
            <div className="py-12 text-center">
              <FaCog className="mx-auto text-4xl text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Coming Soon</h3>
              <p className="mt-2 text-sm text-gray-600">
                This section is under development and will be available soon.
              </p>
            </div>
          </SettingsSection>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your application settings and preferences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="space-y-2">
              {settingsSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === section.id
                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                      : "text-gray-700 hover:bg-gray-100 border border-transparent"
                  }`}
                >
                  <section.icon className={`mr-3 ${
                    activeSection === section.id ? "text-blue-600" : "text-gray-400"
                  }`} />
                  {section.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderSectionContent()}
          </div>
        </div>
      </div>

      {/* Store Form Modal */}
      <StoreFormModal
        isOpen={showStoreForm}
        onClose={closeStoreForm}
        onSave={editingStore ? handleEditStore : handleCreateStore}
        isLoading={isSubmitting}
        store={editingStore}
      />
    </div>
  );
}