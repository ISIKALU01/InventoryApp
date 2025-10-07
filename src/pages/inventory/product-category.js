import InventoryNav from "@/components/InventoryNav";
import { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaShoppingCart,
  FaSearch,
  FaSlidersH,
  FaTimes,
} from "react-icons/fa";

import { categoryAPI } from "../../../services/api"; // Import from shared API file

// Modal Components
const AddCategoryModal = ({ isOpen, onClose, onAdd, isLoading }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.name.trim()) {
      await onAdd(formData);
      setFormData({ name: "", description: "" });
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
      <div className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            Add New Category
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
            disabled={isLoading}
          >
            <FaTimes className="text-sm" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Category Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Enter category name"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={isLoading}
              rows="3"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Enter category description"
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
                "Add Category"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditCategoryModal = ({
  isOpen,
  onClose,
  onEdit,
  category,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        description: category.description || "",
      });
    }
  }, [category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.name.trim()) {
      await onEdit(category.id, formData);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Edit Category</h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
            disabled={isLoading}
          >
            <FaTimes className="text-sm" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Category Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Enter category name"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={isLoading}
              rows="3"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Enter category description"
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
              className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-md transition-colors hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Updating...
                </>
              ) : (
                "Update Category"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Product Categories Component
export default function ProductCategories() {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    setError("");
    try {
      const categoriesData = await categoryAPI.getAllCategories();
      setCategories(categoriesData);
    } catch (err) {
      setError(err.message);
      console.error("Error loading categories:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate summary metrics
  const calculateSummary = () => {
    const totalCategories = categories.length;
    return {
      totalCategories,
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

  // Filter categories based on search
  useEffect(() => {
    let filtered = categories;

    if (searchTerm) {
      filtered = filtered.filter(
        (category) =>
          category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCategories(filtered);
  }, [categories, searchTerm]);

  const clearFilters = () => {
    setSearchTerm("");
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleAddCategory = async (categoryData) => {
    setIsLoading(true);
    setError("");
    try {
      const newCategory = await categoryAPI.createCategory(categoryData);
      setCategories((prev) => [...prev, newCategory]);
      setShowAddModal(false);
    } catch (err) {
      setError(err.message);
      console.error("Error adding category:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = async (id, categoryData) => {
    setIsLoading(true);
    setError("");
    try {
      const updatedCategory = await categoryAPI.updateCategory(
        id,
        categoryData
      );
      setCategories((prev) =>
        prev.map((category) =>
          category.id === id ? updatedCategory : category
        )
      );
      setShowEditModal(false);
      setSelectedCategory(null);
    } catch (err) {
      setError(err.message);
      console.error("Error updating category:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("Are you sure you want to delete this category?")) {
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      await categoryAPI.deleteCategory(categoryId);
      setCategories((prev) =>
        prev.filter((category) => category.id !== categoryId)
      );
    } catch (err) {
      setError(err.message);
      console.error("Error deleting category:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (category) => {
    setSelectedCategory(category);
    setShowEditModal(true);
  };

  return (
    <div className="relative max-w-6xl mx-auto pb-16 md:pb-0">
      <h1 className="hidden mb-6 text-xl font-normal text-gray-800 md:block font-raleway">
        Product Category
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
        {/* Summary Cards */}
        <div className="">
          <div className="p-2 bg-white rounded shadow">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-nowrap sm:overflow-x-auto sm:justify-between sm:space-x-1 md:space-x-2">
              {/* CATEGORIES SUMMARY CARD */}
              <div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
                <div className="flex items-center">
                  <div className="p-1 mr-1 rounded bg-blue-100 md:mr-2 md:p-1.5">
                    <FaShoppingCart className="text-xs text-blue-600 md:text-sm" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
                      All Categories
                    </h3>
                    <p className="text-sm font-bold text-gray-800 md:text-lg">
                      {summary.totalCategories}
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
                      placeholder="Search categories..."
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
                      placeholder="Search categories..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <FaSearch className="absolute right-2 top-1.5 text-xs text-gray-400" />
                  </div>
                </>
              )}
            </div>

            {/* Right side - Action buttons */}
            <div className="hidden md:flex justify-start w-full gap-2 md:justify-end md:w-auto">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center px-3 py-1.5 text-xs text-white transition-colors bg-green-600 rounded hover:bg-green-700"
                disabled={isLoading}
              >
                <FaPlus className="mr-1 text-xs" />
                Add Category
              </button>
              <button
                onClick={loadCategories}
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

        {/* Categories Table */}
        <div className="overflow-hidden bg-white rounded shadow">
          {/* Loading State */}
          {isLoading && categories.length === 0 && (
            <div className="py-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-sm text-gray-600">
                Loading categories...
              </p>
            </div>
          )}

          {/* Desktop Table */}
          <div className="hidden overflow-x-auto text-black md:block">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Product Category
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-black">
                          {category.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {category.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(category)}
                          className="flex items-center px-2 py-1 text-xs text-blue-600 transition-colors bg-blue-100 rounded hover:bg-blue-200"
                          disabled={isLoading}
                        >
                          <FaEdit className="mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
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
            {filteredCategories.map((category) => (
              <div key={category.id} className="p-4 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-black">
                        {category.name}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      {category.description}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleEditClick(category)}
                        className="flex-1 px-2 py-1 text-xs text-blue-600 transition-colors bg-blue-100 rounded hover:bg-blue-200 flex items-center justify-center"
                        disabled={isLoading}
                      >
                        <FaEdit className="mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
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

          {filteredCategories.length === 0 && !isLoading && (
            <div className="py-6 text-center">
              <p className="text-xs text-black">No categories found</p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Action Buttons for Mobile */}
      {isMobile && (
        <div className="fixed bottom-4 right-4 md:hidden">
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center w-12 h-12 text-white transition-transform bg-green-600 rounded-full shadow-lg hover:bg-green-700 hover:scale-110"
              title="Add Category"
              disabled={isLoading}
            >
              <FaPlus className="text-lg" />
            </button>
            <button
              onClick={loadCategories}
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
      <AddCategoryModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddCategory}
        isLoading={isLoading}
      />

      <EditCategoryModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCategory(null);
        }}
        onEdit={handleEditCategory}
        category={selectedCategory}
        isLoading={isLoading}
      />
    </div>
  );
}
