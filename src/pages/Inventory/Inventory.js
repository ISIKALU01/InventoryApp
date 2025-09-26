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
} from "react-icons/fa";

// Modal Components
const ImportCSVModal = ({ isOpen, onClose, onImport }) => {
  const [measurementUnit, setMeasurementUnit] = useState("");
  const [stockDate, setStockDate] = useState("");
  const [csvFile, setCsvFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle CSV import logic here
    console.log("Importing CSV with:", { measurementUnit, stockDate, csvFile });
    onImport({ measurementUnit, stockDate, csvFile });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-opacity-50">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Import Stock from CSV</h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Measurement Unit */}
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

          {/* Stock Date */}
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

          {/* CSV File Upload */}
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

          {/* Buttons */}
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

const AddStockModal = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    cost: "",
    price: "",
    quantity: "",
    measurementUnit: "",
    stockDate: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle add stock logic here
    console.log("Adding stock:", formData);
    
    // Convert string values to numbers before passing to onAdd
    const processedData = {
      ...formData,
      cost: parseFloat(formData.cost) || 0,
      price: parseFloat(formData.price) || 0,
      quantity: parseInt(formData.quantity) || 0,
    };
    
    onAdd(processedData);
    onClose();
    // Reset form
    setFormData({
      name: "",
      sku: "",
      category: "",
      cost: "",
      price: "",
      quantity: "",
      measurementUnit: "",
      stockDate: "",
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
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Add New Stock</h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Product Name */}
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
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* SKU */}
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
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Category</option>
              <option value="Electronics">Food</option>
              <option value="Furniture">Alchohol</option>
              <option value="Stationery">Energy Drinks</option>
              <option value="Clothing">Soft Drinks</option>
            </select>
          </div>

          {/* Cost and Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Cost *
              </label>
              <input
                type="number"
                step="0.01"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
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
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Quantity and Measurement Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Quantity *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Unit *
              </label>
              <select
                name="measurementUnit"
                value={formData.measurementUnit}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Unit</option>
                <option value="pieces">Unit</option>
                <option value="kilograms">Kilograms</option>
                <option value="liters">Liters</option>
                <option value="meters">Meters</option>
                <option value="packs">Packs</option>
                <option value="boxes">Boxes</option>
              </select>
            </div>
          </div>

          {/* Stock Date */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Stock Date *
            </label>
            <input
              type="date"
              name="stockDate"
              value={formData.stockDate}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Buttons */}
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
              className="flex-1 px-4 py-2 text-sm text-white bg-green-600 rounded-md transition-colors hover:bg-green-700"
            >
              Add Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper function to safely format numbers
const formatCurrency = (value) => {
  if (value === null || value === undefined) return '$0.00';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
};

// Helper function to safely calculate numeric values
const safeCalculate = (items, property) => {
  return items.reduce((sum, item) => {
    const value = item[property];
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return sum + (isNaN(num) ? 0 : num);
  }, 0);
};

// Main Inventory Component
export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);

  // Calculate summary metrics with safe number handling
  const calculateSummary = () => {
    const totalItems = inventory.length;
    
    // Safely calculate totals with number conversion
    const totalStockBalance = inventory.reduce((sum, item) => {
      const cost = typeof item.cost === 'string' ? parseFloat(item.cost) : item.cost;
      const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity;
      const costValue = isNaN(cost) ? 0 : cost;
      const quantityValue = isNaN(quantity) ? 0 : quantity;
      return sum + (costValue * quantityValue);
    }, 0);
    
    const totalRetailValue = inventory.reduce((sum, item) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
      const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity;
      const priceValue = isNaN(price) ? 0 : price;
      const quantityValue = isNaN(quantity) ? 0 : quantity;
      return sum + (priceValue * quantityValue);
    }, 0);
    
    // Calculate average markup and profit margin safely
    let averageMarkup = 0;
    let averageProfitMargin = 0;
    
    if (inventory.length > 0) {
      const validItems = inventory.filter(item => {
        const cost = typeof item.cost === 'string' ? parseFloat(item.cost) : item.cost;
        const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
        return !isNaN(cost) && !isNaN(price) && cost > 0;
      });
      
      if (validItems.length > 0) {
        averageMarkup = validItems.reduce((sum, item) => {
          const cost = typeof item.cost === 'string' ? parseFloat(item.cost) : item.cost;
          const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
          return sum + ((price - cost) / cost * 100);
        }, 0) / validItems.length;
        
        averageProfitMargin = validItems.reduce((sum, item) => {
          const cost = typeof item.cost === 'string' ? parseFloat(item.cost) : item.cost;
          const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
          return sum + ((price - cost) / price * 100);
        }, 0) / validItems.length;
      }
    }

    return {
      totalItems,
      totalStockBalance,
      totalRetailValue,
      averageMarkup,
      averageProfitMargin,
    };
  };

  const summary = calculateSummary();

  // Categories and statuses for filters
  const categories = [...new Set(inventory.map(item => item.category))];
  const stores = [...new Set(inventory.map(item => item.store))];

  // Detect mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Filter inventory based on filters
  useEffect(() => {
    let filtered = inventory;

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        (item) => item.category === selectedCategory
      );
    }

    if (selectedStore) {
      filtered = filtered.filter(
        (item) => item.store === selectedStore
      );
    }

    setFilteredInventory(filtered);
  }, [inventory, searchTerm, selectedCategory, selectedStore]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedStore("");
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleImportCSV = (importData) => {
    // Handle CSV import logic here
    console.log("Importing CSV data:", importData);
    // Add your CSV processing logic
  };

  const handleAddStock = (stockData) => {
    // Handle add stock logic here
    console.log("Adding new stock:", stockData);
    // Add your stock creation logic
    const newItem = {
      id: inventory.length + 1,
      ...stockData,
      status: stockData.quantity > 10 ? "In Stock" : stockData.quantity > 0 ? "Low Stock" : "Out of Stock",
      dispensed: 0, // Default value for dispensed
      closingStock: stockData.quantity // Initially closing stock equals available stock
    };
    setInventory([...inventory, newItem]);
  };

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
                      Items
                    </h3>
                    <p className="text-sm font-bold text-gray-800 md:text-lg">
                      {summary.totalItems}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stock Balance card */}
              <div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
                <div className="flex items-center">
                  <div className="p-1 mr-1 rounded bg-green-100 md:mr-2 md:p-1.5">
                    <FaUniversity className="text-xs text-green-600 md:text-sm" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
                      Stock Balance
                    </h3>
                    <p className="text-sm font-bold text-gray-800 md:text-lg">
                      ${summary.totalStockBalance.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Potential retail value */}
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
                      ${summary.totalRetailValue.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mark up card */}
              <div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
                <div className="flex items-center">
                  <div className="p-1 mr-1 rounded bg-purple-100 md:mr-2 md:p-1.5">
                    <FaPercentage className="text-xs text-purple-600 md:text-sm" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
                      Avg Markup
                    </h3>
                    <p className="text-sm font-bold text-gray-800 md:text-lg">
                      {summary.averageMarkup.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Profit Card */}
              <div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
                <div className="flex items-center">
                  <div className="p-1 mr-1 rounded bg-yellow-100 md:mr-2 md:p-1.5">
                    <FaMoneyBillWave className="text-xs text-yellow-600 md:text-sm" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
                      Profit Margin
                    </h3>
                    <p className="text-sm font-bold text-gray-800 md:text-lg">
                      {summary.averageProfitMargin.toFixed(1)}%
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
                      placeholder="Search inventory..."
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
                      placeholder="Search inventory..."
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

                    {/* Store filter */}
                    <div className="w-auto">
                      <select
                        value={selectedStore}
                        onChange={(e) => setSelectedStore(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">All Stores</option>
                        {stores.map((store) => (
                          <option key={store} value={store}>
                            {store}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right side - Action buttons */}
            <div className="flex justify-start w-full gap-2 md:justify-end md:w-auto">
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
                Add Stock
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
                    <option key={store} value={store}>
                      {store}
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
                    Product
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Measurement
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Available Stock
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Dispensed
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Closing Stock
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Price
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-black">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">{item.measurementUnit}</td>
                    <td className="px-4 py-3 text-sm text-black">
                      {item.quantity || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      {item.dispensed || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      {item.closingStock || (item.quantity || 0) - (item.dispensed || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      {formatCurrency((item.price || 0) * (item.quantity || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="text-black md:hidden">
            {filteredInventory.map((item) => (
              <div key={item.id} className="p-4 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-black">{item.name}</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">Measurement: {item.measurementUnit}</div>
                    <div className="mt-1 text-sm text-gray-600">Available: {item.quantity || 0}</div>
                    <div className="flex justify-between mt-2">
                      <div className="text-sm">
                        <div>Dispensed: {item.dispensed || 0}</div>
                        <div>Closing: {item.closingStock || (item.quantity || 0) - (item.dispensed || 0)}</div>
                      </div>
                      <div className="text-sm">
                        <div>Price: {formatCurrency(item.price)}</div>
                        <div>Amount: {formatCurrency((item.price || 0) * (item.quantity || 0))}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredInventory.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-xs text-black">No inventory items found</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals - These will now properly overlay the content */}
      <ImportCSVModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportCSV}
      />
      
      <AddStockModal
        isOpen={showAddStockModal}
        onClose={() => setShowAddStockModal(false)}
        onAdd={handleAddStock}
      />
    </div>
  );
}