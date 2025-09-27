import { useState, useEffect } from "react";
import InventoryNav from "../../components/InventoryNav";
import {
  FaSearch,
  FaPlus,
  FaFileImport,
  FaSlidersH,
  FaTimes,
  FaStore,
  FaCogs,
  FaChartBar,
  FaEdit,
  FaTrash,
} from "react-icons/fa";

const API_BASE_URL = "https://pgims-production.up.railway.app/api";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-opacity-50">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Import Products from CSV</h2>
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
              Product Date *
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
              Import Products
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddProductModal = ({ isOpen, onClose, onAdd, isLoading }) => {
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    price: "",
    measurement: "unit",
    sold: "0",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onAdd(formData);
    onClose();
    setFormData({
      name: "",
      sku: "",
      category: "",
      price: "",
      measurement: "unit",
      sold: "0",
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
          <h2 className="text-lg font-semibold text-gray-800">Add New Product</h2>
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
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              SKU *
            </label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            >
              <option value="">Select Category</option>
              <option value="Food">Food</option>
              <option value="Alcohol">Alcohol</option>
              <option value="Energy Drinks">Energy Drinks</option>
              <option value="Soft Drinks">Soft Drinks</option>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Services">Services</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Price *
              </label>
              <input
                type="number"
                step="0.01"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Measurement *
              </label>
              <select
                name="measurement"
                value={formData.measurement}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              >
                <option value="unit">Unit</option>
                <option value="kilograms">Kilograms</option>
                <option value="liters">Liters</option>
                <option value="meters">Meters</option>
                <option value="packs">Packs</option>
                <option value="boxes">Boxes</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Initial Sold Quantity
            </label>
            <input
              type="number"
              name="sold"
              value={formData.sold}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            />
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
                'Add Product'
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
const productAPI = {
  async getAllProducts() {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }
    
    return response.json();
  },

  async createProduct(productData) {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(productData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `Failed to create product: ${response.status}`);
    }
    
    return response.json();
  },

  async updateProduct(id, productData) {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(productData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update product: ${response.status}`);
    }
    
    return response.json();
  },

  async deleteProduct(id) {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete product: ${response.status}`);
    }
    
    return response.json();
  }
};

// Main Products Component
export default function Products() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    setError("");
    try {
      const productsData = await productAPI.getAllProducts();
      setProducts(productsData);
    } catch (err) {
      setError(err.message);
      console.error("Error loading products:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate summary metrics for retail, services, and total
  const calculateSummary = () => {
    const retailProducts = products.filter(product => 
      product.category && !product.category.toLowerCase().includes('service')
    );
    
    const serviceProducts = products.filter(product => 
      product.category && product.category.toLowerCase().includes('service')
    );

    const totalRetailSales = retailProducts.reduce((sum, product) => {
      const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
      const sold = typeof product.sold === 'string' ? parseInt(product.sold) : product.sold || 0;
      const priceValue = isNaN(price) ? 0 : price;
      const soldValue = isNaN(sold) ? 0 : sold;
      return sum + (priceValue * soldValue);
    }, 0);

    const totalServiceSales = serviceProducts.reduce((sum, product) => {
      const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
      const sold = typeof product.sold === 'string' ? parseInt(product.sold) : product.sold || 0;
      const priceValue = isNaN(price) ? 0 : price;
      const soldValue = isNaN(sold) ? 0 : sold;
      return sum + (priceValue * soldValue);
    }, 0);

    return {
      retail: totalRetailSales,
      services: totalServiceSales,
      total: totalRetailSales + totalServiceSales,
    };
  };

  const summary = calculateSummary();

  // Categories and users for filters
  const categories = [...new Set(products.map(product => product.category))];
  const users = [...new Set(products.map(product => product.user))];

  // Detect mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Filter products based on filters
  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    if (selectedUser) {
      filtered = filtered.filter(
        (product) => product.user === selectedUser
      );
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory, selectedUser]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedUser("");
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleImportCSV = (importData) => {
    console.log("Importing CSV data:", importData);
  };

  const handleAddProduct = async (productData) => {
    setIsLoading(true);
    setError("");
    try {
      const newProduct = await productAPI.createProduct(productData);
      setProducts(prev => [...prev, newProduct]);
      setShowAddProductModal(false);
    } catch (err) {
      setError(err.message);
      console.error("Error adding product:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProduct = async (id, productData) => {
    setIsLoading(true);
    setError("");
    try {
      const updatedProduct = await productAPI.updateProduct(id, productData);
      setProducts(prev => prev.map(product => 
        product.id === id ? updatedProduct : product
      ));
    } catch (err) {
      setError(err.message);
      console.error("Error updating product:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      await productAPI.deleteProduct(id);
      setProducts(prev => prev.filter(product => product.id !== id));
    } catch (err) {
      setError(err.message);
      console.error("Error deleting product:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative max-w-6xl mx-auto pb-16 md:pb-0">
      <h1 className="hidden mb-6 text-xl font-normal text-gray-800 md:block font-raleway">
        Products
      </h1>
      <InventoryNav />

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
        {/* Summary Cards - Retail, Services, Total */}
        <div className="">
          <div className="p-2 bg-white rounded shadow">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-nowrap sm:overflow-x-auto sm:justify-between sm:space-x-1 md:space-x-2">
              {/* RETAIL */}
              <div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
                <div className="flex items-center">
                  <div className="p-1 mr-1 rounded bg-blue-100 md:mr-2 md:p-1.5">
                    <FaStore className="text-xs text-blue-600 md:text-sm" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
                      Retail
                    </h3>
                    <p className="text-sm font-bold text-gray-800 md:text-lg">
                      {formatCurrency(summary.retail)}
                    </p>
                  </div>
                </div>
              </div>

              {/* SERVICES */}
              <div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
                <div className="flex items-center">
                  <div className="p-1 mr-1 rounded bg-green-100 md:mr-2 md:p-1.5">
                    <FaCogs className="text-xs text-green-600 md:text-sm" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
                      Services
                    </h3>
                    <p className="text-sm font-bold text-gray-800 md:text-lg">
                      {formatCurrency(summary.services)}
                    </p>
                  </div>
                </div>
              </div>

              {/* TOTAL */}
              <div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
                <div className="flex items-center">
                  <div className="p-1 mr-1 rounded bg-purple-100 md:mr-2 md:p-1.5">
                    <FaChartBar className="text-xs text-purple-600 md:text-sm" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
                      Total
                    </h3>
                    <p className="text-sm font-bold text-gray-800 md:text-lg">
                      {formatCurrency(summary.total)}
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
                      placeholder="Search products..."
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
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <FaSearch className="absolute right-2 top-1.5 text-xs text-gray-400" />
                  </div>

                  {/* Desktop filters */}
                  <div className="flex gap-3">
                    {/* Category filter */}
                    <div className="w-auto">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">All Categories</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* User filter */}
                    <div className="w-auto">
                      <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
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
                onClick={() => setShowAddProductModal(true)}
                className="flex items-center px-3 py-1.5 text-xs text-white transition-colors bg-green-600 rounded hover:bg-green-700"
                disabled={isLoading}
              >
                <FaPlus className="mr-1 text-xs" />
                Add Product
              </button>
              <button
                onClick={loadProducts}
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
              {/* Category filter */}
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-700">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* User filter */}
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-700">
                  User
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
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

        {/* Products Table */}
        <div className="overflow-hidden bg-white rounded shadow">
          {/* Loading State */}
          {isLoading && products.length === 0 && (
            <div className="py-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-sm text-gray-600">Loading products...</p>
            </div>
          )}

          {/* Desktop Table */}
          <div className="hidden overflow-x-auto text-black md:block">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Product
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Measurement
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Sold
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Sales Amount
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-black">
                      {product.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">{product.sku}</td>
                    <td className="px-4 py-3 text-sm text-black">{product.measurement || product.measuremnt}</td>
                    <td className="px-4 py-3 text-sm text-black">
                      {product.sold || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      {formatCurrency((product.price || 0) * (product.sold || 0))}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEditProduct(product.id, product)}
                          className="flex items-center px-2 py-1 text-xs text-blue-600 transition-colors bg-blue-100 rounded hover:bg-blue-200"
                          disabled={isLoading}
                        >
                          <FaEdit className="mr-1" />
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
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
            {filteredProducts.map((product) => (
              <div key={product.id} className="p-4 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-black">{product.name}</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">SKU: {product.sku}</div>
                    <div className="mt-1 text-sm text-gray-600">Measurement: {product.measurement || product.measuremnt}</div>
                    <div className="flex justify-between mt-2">
                      <div className="text-sm">
                        <div>Sold: {product.sold || 0}</div>
                      </div>
                      <div className="text-sm">
                        <div>Sales: {formatCurrency((product.price || 0) * (product.sold || 0))}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button 
                        onClick={() => handleEditProduct(product.id, product)}
                        className="flex-1 px-2 py-1 text-xs text-blue-600 transition-colors bg-blue-100 rounded hover:bg-blue-200 flex items-center justify-center"
                        disabled={isLoading}
                      >
                        <FaEdit className="mr-1" />
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
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

          {filteredProducts.length === 0 && !isLoading && (
            <div className="py-6 text-center">
              <p className="text-xs text-black">No products found</p>
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
              onClick={() => setShowAddProductModal(true)}
              className="flex items-center justify-center w-12 h-12 text-white transition-transform bg-green-600 rounded-full shadow-lg hover:bg-green-700 hover:scale-110"
              title="Add Product"
              disabled={isLoading}
            >
              <FaPlus className="text-lg" />
            </button>
            <button
              onClick={loadProducts}
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
      
      <AddProductModal
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        onAdd={handleAddProduct}
        isLoading={isLoading}
      />
    </div>
  );
}