import { useState, useEffect } from "react";
import InventoryNav from "../../components/InventoryNav";
import {
  FaSearch,
  FaPlus,
  FaFileImport,
  FaSlidersH,
  FaShoppingCart,
  FaUniversity,
  FaTag,
  FaPercentage,
  FaMoneyBillWave,
  FaTimes,
  FaEdit,
  FaTrash,
  FaStore,
  FaBox,
  FaExclamationTriangle,
} from "react-icons/fa";

const API_BASE_URL = "https://testing.osharaofficial.com/api";

// API Service functions with authentication
const inventoryAPI = {
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

  async getAllInventory() {
    try {
      const headers = await this.getAuthHeaders();
      console.log("Fetching inventory from:", `${API_BASE_URL}/inventory`);

      const response = await fetch(`${API_BASE_URL}/inventory`, {
        method: "GET",
        headers,
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }

        let errorMessage = `Failed to fetch inventory: ${response.status}`;
        try {
          const errorData = await response.json();
          console.log("Error response data:", errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.log("Could not parse error response as JSON");
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Inventory data received:", data);
      return data;
    } catch (error) {
      console.error("Error in getAllInventory:", error);
      if (
        error.message.includes("No authentication token") ||
        error.message.includes("Authentication failed")
      ) {
        window.location.href = "/";
      }
      throw error;
    }
  },

  async createInventory(inventoryData) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/inventory`, {
        method: "POST",
        headers,
        body: JSON.stringify(inventoryData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to create inventory: ${response.status}`
        );
      }

      const data = await response.json();
      return data;
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

  async updateInventory(id, inventoryData) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(inventoryData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to update inventory: ${response.status}`
        );
      }

      const data = await response.json();
      return data;
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

  async deleteInventory(id) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        throw new Error(`Failed to delete inventory: ${response.status}`);
      }

      return true;
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

  async getAllStores() {
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

      const data = await response.json();
      return data;
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

const productAPI = {
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

  async getAllProducts() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const data = await response.json();
      return data;
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

// Modal Components
const ImportCSVModal = ({ isOpen, onClose, onImport }) => {
  const [measurementUnit, setMeasurementUnit] = useState("");
  const [stockDate, setStockDate] = useState("");
  const [csvFile, setCsvFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Importing CSV with:", { measurementUnit, stockDate, csvFile });
    onImport({ measurementUnit, stockDate, csvFile });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            Import Stock from CSV
          </h2>
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
              Measurement Unit *
            </label>
            <select
              value={measurementUnit}
              onChange={(e) => setMeasurementUnit(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Unit</option>
              <option value="unit">Unit</option>
              <option value="kilograms">Kilograms</option>
              <option value="liters">Liters</option>
              <option value="meters">Meters</option>
              <option value="packs">Packs</option>
              <option value="carton">Carton</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Stock Date *
            </label>
            <input
              type="date"
              value={stockDate}
              onChange={(e) => setStockDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

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
                Upload a CSV file with product data
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
              Import Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddStockModal = ({ isOpen, onClose, onAdd, stores, products }) => {
  const [formData, setFormData] = useState({
    store_id: "",
    product_id: "",
    quantity: "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.store_id || !formData.product_id || !formData.quantity) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const processedData = {
        store_id: parseInt(formData.store_id),
        product_id: parseInt(formData.product_id),
        quantity: parseInt(formData.quantity) || 0,
      };

      await onAdd(processedData);
      onClose();
      setFormData({
        store_id: "",
        product_id: "",
        quantity: "",
      });
    } catch (error) {
      console.error("Error adding inventory:", error);
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
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Add Inventory</h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
            disabled={loading}
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              <FaStore className="inline mr-1 text-gray-500" />
              Store *
            </label>
            <select
              name="store_id"
              value={formData.store_id}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select a Store</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name} {store.address ? `- ${store.address}` : ""}
                </option>
              ))}
            </select>
            {stores.length === 0 && (
              <p className="mt-1 text-xs text-red-600">
                No stores available. Please create a store first.
              </p>
            )}
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              <FaBox className="inline mr-1 text-gray-500" />
              Product *
            </label>
            <select
              name="product_id"
              value={formData.product_id}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select a Product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - {product.sku || "No SKU"} (₦{product.price})
                </option>
              ))}
            </select>
            {products.length === 0 && (
              <p className="mt-1 text-xs text-red-600">
                No products available. Please create a product first.
              </p>
            )}
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Quantity *
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
              min="1"
              disabled={loading}
              placeholder="Enter quantity"
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {formData.product_id && (
            <div className="p-3 bg-blue-50 rounded-md">
              <h4 className="text-sm font-medium text-blue-800">
                Selected Product Info:
              </h4>
              {(() => {
                const selectedProduct = products.find(
                  (p) => p.id === parseInt(formData.product_id)
                );
                return selectedProduct ? (
                  <div className="mt-1 text-xs text-blue-700">
                    <p>
                      <strong>Name:</strong> {selectedProduct.name}
                    </p>
                    <p>
                      <strong>SKU:</strong> {selectedProduct.sku || "N/A"}
                    </p>
                    <p>
                      <strong>Price:</strong> ₦{selectedProduct.price}
                    </p>
                    <p>
                      <strong>Cost Price:</strong> ₦
                      {selectedProduct.cost_price || "N/A"}
                    </p>
                    <p>
                      <strong>Current Stock:</strong>{" "}
                      {selectedProduct.stock || 0}
                    </p>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md transition-colors hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                !formData.store_id ||
                !formData.product_id ||
                !formData.quantity
              }
              className="flex-1 px-4 py-2 text-sm text-white bg-green-600 rounded-md transition-colors hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Adding..." : "Add Inventory"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditStockModal = ({
  isOpen,
  onClose,
  onUpdate,
  inventoryItem,
  stores,
  products,
}) => {
  const [formData, setFormData] = useState({
    store_id: "",
    product_id: "",
    quantity: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (inventoryItem) {
      setFormData({
        store_id: inventoryItem.store_id?.toString() || "",
        product_id: inventoryItem.product_id?.toString() || "",
        quantity: inventoryItem.quantity?.toString() || "",
      });
    }
  }, [inventoryItem]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.store_id || !formData.product_id || !formData.quantity) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const processedData = {
        store_id: parseInt(formData.store_id),
        product_id: parseInt(formData.product_id),
        quantity: parseInt(formData.quantity) || 0,
      };

      await onUpdate(inventoryItem.id, processedData);
      onClose();
    } catch (error) {
      console.error("Error updating inventory:", error);
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

  if (!isOpen || !inventoryItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            Edit Inventory
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
            disabled={loading}
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              <FaStore className="inline mr-1 text-gray-500" />
              Store *
            </label>
            <select
              name="store_id"
              value={formData.store_id}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select a Store</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name} {store.address ? `- ${store.address}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              <FaBox className="inline mr-1 text-gray-500" />
              Product *
            </label>
            <select
              name="product_id"
              value={formData.product_id}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select a Product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - {product.sku || "No SKU"} (₦{product.price})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Quantity *
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
              min="0"
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md transition-colors hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-md transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Inventory"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper function to safely format numbers in Naira
const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "₦0.00";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num)
    ? "₦0.00"
    : `₦${num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
};

// Main Inventory Component
export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showEditStockModal, setShowEditStockModal] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from API
  const fetchInventory = async () => {
    try {
      setError(null);
      const data = await inventoryAPI.getAllInventory();
      setInventory(data);
      setFilteredInventory(data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const data = await storeAPI.getAllStores();
      setStores(data);
    } catch (error) {
      console.error("Error fetching stores:", error);
      setError((prev) => prev || `Stores: ${error.message}`);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await productAPI.getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError((prev) => prev || `Products: ${error.message}`);
    }
  };

  // Add new inventory
  const handleAddInventory = async (inventoryData) => {
    try {
      const newInventory = await inventoryAPI.createInventory(inventoryData);
      setInventory((prev) => [...prev, newInventory]);
      setShowAddStockModal(false);
      alert("Inventory added successfully!");
    } catch (error) {
      console.error("Error adding inventory:", error);
      alert(error.message || "Failed to add inventory");
      throw error;
    }
  };

  // Update inventory
  const handleUpdateInventory = async (id, inventoryData) => {
    try {
      const updatedInventory = await inventoryAPI.updateInventory(
        id,
        inventoryData
      );
      setInventory((prev) =>
        prev.map((item) => (item.id === id ? updatedInventory : item))
      );
      setShowEditStockModal(false);
      setSelectedInventoryItem(null);
      alert("Inventory updated successfully!");
    } catch (error) {
      console.error("Error updating inventory:", error);
      alert(error.message || "Failed to update inventory");
      throw error;
    }
  };

  // Delete inventory
  const handleDeleteInventory = async (id) => {
    if (!confirm("Are you sure you want to delete this inventory item?")) {
      return;
    }

    try {
      await inventoryAPI.deleteInventory(id);
      setInventory((prev) => prev.filter((item) => item.id !== id));
      alert("Inventory deleted successfully!");
    } catch (error) {
      console.error("Error deleting inventory:", error);
      alert(error.message || "Failed to delete inventory item.");
    }
  };

  // Calculate summary metrics - FIXED: Use cost price for stock value and unit price for retail value
  // Calculate summary metrics - FIXED: Handle data structure properly
  const calculateSummary = () => {
    const totalItems = inventory.length;

    // Debug: Check what data we actually have
    console.log("Inventory items:", inventory);
    console.log("Products:", products);
    console.log("First inventory item:", inventory[0]);
    console.log("First product:", products[0]);

    // Stock Value: Sum of (cost_price * quantity) for all inventory items
    const totalStockValue = inventory.reduce((sum, item) => {
      // Try multiple ways to find the product data
      let product;

      // Check if product data is nested in the item
      if (item.product) {
        product = item.product;
      }
      // Check if we have product_id and can find it in products array
      else if (item.product_id && products.length > 0) {
        product = products.find((p) => p.id === item.product_id);
      }

      const costPrice = product?.cost_price || 0;
      const quantity = item.quantity || 0;
      const itemValue = costPrice * quantity;

      console.log(`Item ${item.id}:`, {
        costPrice,
        quantity,
        itemValue,
        product,
      });

      return sum + itemValue;
    }, 0);

    // Retail Value: Sum of (price * quantity) for all inventory items
    const totalRetailValue = inventory.reduce((sum, item) => {
      // Try multiple ways to find the product data
      let product;

      if (item.product) {
        product = item.product;
      } else if (item.product_id && products.length > 0) {
        product = products.find((p) => p.id === item.product_id);
      }

      const price = product?.price || 0;
      const quantity = item.quantity || 0;
      const itemValue = price * quantity;

      return sum + itemValue;
    }, 0);

    const lowStockItems = inventory.filter((item) => {
      // Try multiple ways to find the product data
      let product;

      if (item.product) {
        product = item.product;
      } else if (item.product_id && products.length > 0) {
        product = products.find((p) => p.id === item.product_id);
      }

      const currentQuantity = item.quantity || 0;
      const threshold = product?.low_stock_threshold || 10;
      const isLowStock = currentQuantity <= threshold;

      console.log(`Low stock check - Item ${item.id}:`, {
        quantity: currentQuantity,
        threshold,
        isLowStock,
      });

      return isLowStock;
    }).length;

    const summary = {
      totalItems,
      totalStockValue,
      totalRetailValue,
      lowStockItems,
    };

    console.log("Final Summary:", summary);

    return summary;
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

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchInventory(), fetchStores(), fetchProducts()]);
      } catch (error) {
        console.error("Error loading data:", error);
        setError("Failed to load data. Please try again.");
      }
    };
    loadData();
  }, []);

  // Filter inventory based on filters
  useEffect(() => {
    let filtered = inventory;

    if (searchTerm) {
      filtered = filtered.filter((item) => {
        const product = products.find((p) => p.id === item.product_id);
        const store = stores.find((s) => s.id === item.store_id);

        return (
          product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product?.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          store?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (selectedStore) {
      filtered = filtered.filter(
        (item) => item.store_id.toString() === selectedStore
      );
    }

    setFilteredInventory(filtered);
  }, [inventory, searchTerm, selectedStore, products, stores]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStore("");
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleEditClick = (item) => {
    setSelectedInventoryItem(item);
    setShowEditStockModal(true);
  };

  const handleImportCSV = (importData) => {
    console.log("Importing CSV data:", importData);
  };

  // Helper function to get product details
  const getProductDetails = (productId) => {
    return products.find((p) => p.id === productId) || {};
  };

  // Helper function to get store details
  const getStoreDetails = (storeId) => {
    return stores.find((s) => s.id === storeId) || {};
  };

  // Add a retry function
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    fetchInventory();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading inventory...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative max-w-6xl mx-auto pb-16 md:pb-0">
        <h1 className="hidden mb-6 text-xl font-normal text-gray-800 md:block font-raleway">
          Inventory
        </h1>
        <InventoryNav />

        <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-lg text-center">
          <FaExclamationTriangle className="mx-auto text-red-500 text-3xl mb-4" />
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Unable to Load Inventory
          </h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
            <div className="text-sm text-red-500">
              <p>If this problem persists, please check:</p>
              <ul className="list-disc list-inside mt-2 text-left max-w-md mx-auto">
                <li>Your internet connection</li>
                <li>Server status</li>
                <li>Authentication token validity</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-6xl mx-auto pb-16 md:pb-0">
      <h1 className="hidden mb-6 text-xl font-normal text-gray-800 md:block font-raleway">
        Inventory
      </h1>
      <InventoryNav />

      <div className="mt-4 space-y-4 px-2 md:px-0">
        {/* Summary Cards */}
        <div className="">
          <div className="p-2 bg-white rounded shadow">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-nowrap sm:overflow-x-auto sm:justify-between sm:space-x-1 md:space-x-2">
              {/* ITEMS */}
              <div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
                <div className="flex items-center">
                  <div className="p-1 mr-1 rounded bg-blue-100 md:mr-2 md:p-1.5">
                    <FaShoppingCart className="text-xs text-blue-600 md:text-sm" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
                      Total Items
                    </h3>
                    <p className="text-sm font-bold text-gray-800 md:text-lg">
                      {summary.totalItems}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stock Value card - Now using cost price */}
              <div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
                <div className="flex items-center">
                  <div className="p-1 mr-1 rounded bg-green-100 md:mr-2 md:p-1.5">
                    <FaUniversity className="text-xs text-green-600 md:text-sm" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
                      Stock Value
                    </h3>
                    <p className="text-sm font-bold text-gray-800 md:text-lg">
                      {formatCurrency(summary.totalStockValue)}
                    </p>
                    <p className="text-[8px] text-gray-500 md:text-xs">
                      Based on cost price
                    </p>
                  </div>
                </div>
              </div>

              {/* Retail value - Now using unit price */}
              <div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
                <div className="flex items-center">
                  <div className="p-1 mr-1 rounded bg-red-100 md:mr-2 md:p-1.5">
                    <FaTag className="text-xs text-red-600 md:text-sm" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
                      Retail Value
                    </h3>
                    <p className="text-sm font-bold text-gray-800 md:text-lg">
                      {formatCurrency(summary.totalRetailValue)}
                    </p>
                    <p className="text-[8px] text-gray-500 md:text-xs">
                      Based on unit price
                    </p>
                  </div>
                </div>
              </div>

              {/* Low Stock Items */}
              <div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
                <div className="flex items-center">
                  <div className="p-1 mr-1 rounded bg-yellow-100 md:mr-2 md:p-1.5">
                    <FaMoneyBillWave className="text-xs text-yellow-600 md:text-sm" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
                      Low Stock
                    </h3>
                    <p className="text-sm font-bold text-gray-800 md:text-lg">
                      {summary.lowStockItems}
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
                      placeholder="Search products, SKU, stores..."
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
                  <div className="relative w-full md:w-64">
                    <input
                      type="text"
                      placeholder="Search products, SKU, stores..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <FaSearch className="absolute right-2 top-1.5 text-xs text-gray-400" />
                  </div>

                  {/* Desktop filters */}
                  <div className="flex gap-3">
                    {/* Store filter */}
                    <div className="w-48">
                      <select
                        value={selectedStore}
                        onChange={(e) => setSelectedStore(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">All Stores</option>
                        {stores.map((store) => (
                          <option key={store.id} value={store.id}>
                            {store.name}
                          </option>
                        ))}
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
              >
                <FaFileImport className="mr-1 text-xs" />
                Import CSV
              </button>
              <button
                onClick={() => setShowAddStockModal(true)}
                className="flex items-center px-3 py-1.5 text-xs text-white transition-colors bg-green-600 rounded hover:bg-green-700"
              >
                <FaPlus className="mr-1 text-xs" />
                Add Inventory
              </button>
            </div>
          </div>

          {/* Filter dropdown for mobile */}
          {isMobile && showFilters && (
            <div className="grid grid-cols-1 gap-2 p-2 mt-3 bg-gray-50 rounded">
              {/* Store filter */}
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-700">
                  Store
                </label>
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Stores</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
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

        {/* Inventory Table */}
        <div className="overflow-hidden bg-white rounded shadow">
          {/* Desktop Table */}
          <div className="hidden overflow-x-auto text-black md:block">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Product Details
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Store
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Cost Price
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Stock Value
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item) => {
                  const product = item.product;
                  console.log(product);
                  const store = item.store;
                  // Stock Value: cost_price * quantity
                  console.log(item);
                  const stockValue =
                    (product.cost_price || 0) * (item.quantity || 0);
                  const isLowStock =
                    (item.quantity || 0) <=
                    (product?.low_stock_threshold || 10);
                  const isOutOfStock = (item.quantity || 0) === 0;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <div className="font-medium text-black">
                            {product.name || "N/A"}
                          </div>
                          <div className="text-xs text-gray-500">
                            SKU: {product.sku || "No SKU"}
                            {product.description && ` • ${product.description}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        <div className="font-medium">{store.name || "N/A"}</div>
                        {store.address && (
                          <div className="text-xs text-gray-500">
                            {store.address}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        <span
                          className={`font-medium ${
                            isOutOfStock
                              ? "text-red-600"
                              : isLowStock
                              ? "text-yellow-600"
                              : "text-green-600"
                          }`}
                        >
                          {item.quantity || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        {product.cost_price
                          ? formatCurrency(product.cost_price)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-black">
                        {formatCurrency(stockValue)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isOutOfStock
                              ? "bg-red-100 text-red-800"
                              : isLowStock
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {isOutOfStock
                            ? "Out of Stock"
                            : isLowStock
                            ? "Low Stock"
                            : "In Stock"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="p-1 text-blue-600 transition-colors hover:text-blue-800 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <FaEdit className="text-sm" />
                          </button>
                          <button
                            onClick={() => handleDeleteInventory(item.id)}
                            className="p-1 text-red-600 transition-colors hover:text-red-800 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <FaTrash className="text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="text-black md:hidden">
            {filteredInventory.map((item) => {
              const product = item.product;
              console.log(product);
              const store = item.store;
              // Stock Value: cost_price * quantity
              console.log(item);
              const stockValue =
                (product.cost_price || 0) * (item.quantity || 0);
              const isLowStock =
                (item.quantity || 0) <= (product?.low_stock_threshold || 10);
              const isOutOfStock = (item.quantity || 0) === 0;

              return (
                <div key={item.id} className="p-4 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      {/* FIXED: Use product.name instead of item.name */}
                      <div className="font-medium text-black">
                        {product.name || "N/A"}
                      </div>
                      {/* FIXED: Use product.sku instead of item.sku */}
                      <div className="text-xs text-gray-500">
                        SKU: {product.sku || "No SKU"}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        isOutOfStock
                          ? "bg-red-100 text-red-800"
                          : isLowStock
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {isOutOfStock
                        ? "Out of Stock"
                        : isLowStock
                        ? "Low Stock"
                        : "In Stock"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Store</div>
                      <div className="font-medium">{store.name || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Quantity</div>
                      <div
                        className={`font-medium ${
                          isOutOfStock
                            ? "text-red-600"
                            : isLowStock
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {item.quantity || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Unit Price</div>
                      {/* FIXED: Use product.price instead of item.price */}
                      <div className="font-medium">
                        {formatCurrency(product.price)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Cost Price</div>
                      {/* FIXED: Use product.cost_price instead of item.cost_price */}
                      <div className="font-medium">
                        {product.cost_price
                          ? formatCurrency(product.cost_price)
                          : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Stock Value</div>
                      <div className="font-medium">
                        {formatCurrency(stockValue)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleEditClick(item)}
                      className="flex-1 px-3 py-1.5 text-xs text-blue-600 border border-blue-600 rounded transition-colors hover:bg-blue-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteInventory(item.id)}
                      className="flex-1 px-3 py-1.5 text-xs text-red-600 border border-red-600 rounded transition-colors hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredInventory.length === 0 && (
            <div className="py-12 text-center">
              <div className="text-gray-400 mb-2">
                <FaBox className="inline text-3xl" />
              </div>
              <p className="text-sm text-gray-500">No inventory items found</p>
              {inventory.length === 0 && (
                <button
                  onClick={() => setShowAddStockModal(true)}
                  className="mt-2 px-4 py-2 text-xs text-white bg-green-600 rounded hover:bg-green-700"
                >
                  Add Your First Inventory Item
                </button>
              )}
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
            >
              <FaFileImport className="text-lg" />
            </button>
            <button
              onClick={() => setShowAddStockModal(true)}
              className="flex items-center justify-center w-12 h-12 text-white transition-transform bg-green-600 rounded-full shadow-lg hover:bg-green-700 hover:scale-110"
              title="Add Inventory"
            >
              <FaPlus className="text-lg" />
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

      <AddStockModal
        isOpen={showAddStockModal}
        onClose={() => setShowAddStockModal(false)}
        onAdd={handleAddInventory}
        stores={stores}
        products={products}
      />

      <EditStockModal
        isOpen={showEditStockModal}
        onClose={() => {
          setShowEditStockModal(false);
          setSelectedInventoryItem(null);
        }}
        onUpdate={handleUpdateInventory}
        inventoryItem={selectedInventoryItem}
        stores={stores}
        products={products}
      />
    </div>
  );
}
