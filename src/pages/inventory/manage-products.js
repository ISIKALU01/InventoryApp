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
	FaMoneyBillWave,
	FaTags,
} from "react-icons/fa";
import { useRouter } from "next/router";

const API_BASE_URL = "https://testing.osharaofficial.com/api";

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
						Import Products from CSV
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
		description: "",
		price: "", // Selling price
		cost_price: "", // cost_price quantity
	});

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Convert numeric fields to proper types for API
		const processedData = {
			...formData,
			price: parseFloat(formData.price) || 0,
			cost_price: parseInt(formData.cost_price) || 0,
		};

		console.log("Data being sent:", processedData);
		await onAdd(processedData);
	};

const handleChange = (e) => {
	const { name, value } = e.target;

	setFormData((prev) => ({
		...prev,
		[name]: value === "" ? "" : value,
	}));
};


	useEffect(() => {
		if (!isOpen) {
			setFormData({
				name: "",
				sku: "",
				description: "",
				price: "",
				cost_price: "",
			});
		}
	}, [isOpen]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-opacity-50">
			<div className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
				<div className="flex items-center justify-between p-4 border-b">
					<h2 className="text-lg font-semibold text-gray-800">
						Add New Product
					</h2>
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
							placeholder="Enter product name"
						/>
					</div>

					<div>
						<label className="block mb-1 text-sm font-medium text-gray-700">
							SKU (Stock Keeping Unit)
						</label>
						<input
							type="text"
							name="sku"
							value={formData.sku}
							onChange={handleChange}
							disabled={isLoading}
							className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
							placeholder="e.g., SKU001 (optional)"
						/>
					</div>

					<div>
						<label className="block mb-1 text-sm font-medium text-gray-700">
							Description / Category *
						</label>
						<textarea
							name="description"
							value={formData.description}
							onChange={handleChange}
							required
							disabled={isLoading}
							rows="3"
							className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
							placeholder="Enter product description or category"
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="block mb-1 text-sm font-medium text-gray-700">
								Price *
							</label>
							<input
								type="number"
								step="0.01"
								min="0"
								name="price"
								value={formData.price}
								onChange={handleChange}
								required
								disabled={isLoading}
								className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
								placeholder="0.00"
							/>
						</div>
						<div>
							<label className="block mb-1 text-sm font-medium text-gray-700">
								Cost price *
							</label>
							<input
								type="number"
								min="0"
								step="1"
								name="cost_price"
								value={formData.cost_price}
								onChange={handleChange}
								required
								disabled={isLoading}
								className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
								placeholder="0"
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
								"Add Product"
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

// Edit Product Modal Component
const EditProductModal = ({ isOpen, onClose, onEdit, isLoading, product }) => {
	const [formData, setFormData] = useState({
		name: "",
		sku: "",
		description: "",
		price: "",
		stock: "",
	});

	// Initialize form data when product changes or modal opens
	useEffect(() => {
		if (product && isOpen) {
			setFormData({
				name: product.name || "",
				sku: product.sku || "",
				description: product.description || "",
				price: product.price?.toString() || "",
				stock: product.stock?.toString() || "",
			});
		}
	}, [product, isOpen]);

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Convert numeric fields to proper types for API
		const processedData = {
			...formData,
			price: parseFloat(formData.price) || 0,
			stock: parseInt(formData.stock) || 0,
		};

		await onEdit(product.id, processedData);
	};

	const handleChange = (e) => {
		const { name, value } = e.target;

		if (name === "price") {
			setFormData({
				...formData,
				[name]: value === "" ? "" : value,
			});
		} else if (name === "stock") {
			setFormData({
				...formData,
				[name]: value === "" ? "" : value,
			});
		} else {
			setFormData({
				...formData,
				[name]: value,
			});
		}
	};

	if (!isOpen || !product) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-opacity-50">
			<div className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
				<div className="flex items-center justify-between p-4 border-b">
					<h2 className="text-lg font-semibold text-gray-800">Edit Product</h2>
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
							placeholder="Enter product name"
						/>
					</div>

					<div>
						<label className="block mb-1 text-sm font-medium text-gray-700">
							SKU (Stock Keeping Unit)
						</label>
						<input
							type="text"
							name="sku"
							value={formData.sku}
							onChange={handleChange}
							disabled={isLoading}
							className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
							placeholder="e.g., SKU001 (optional)"
						/>
					</div>

					<div>
						<label className="block mb-1 text-sm font-medium text-gray-700">
							Description / Category *
						</label>
						<textarea
							name="description"
							value={formData.description}
							onChange={handleChange}
							required
							disabled={isLoading}
							rows="3"
							className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
							placeholder="Enter product description or category"
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="block mb-1 text-sm font-medium text-gray-700">
								Price *
							</label>
							<input
								type="number"
								step="0.01"
								min="0"
								name="price"
								value={formData.price}
								onChange={handleChange}
								required
								disabled={isLoading}
								className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
								placeholder="0.00"
							/>
						</div>
						<div>
							<label className="block mb-1 text-sm font-medium text-gray-700">
								Stock Quantity *
							</label>
							<input
								type="number"
								min="0"
								step="1"
								name="stock"
								value={formData.stock}
								onChange={handleChange}
								required
								disabled={isLoading}
								className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
								placeholder="0"
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
							className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-md transition-colors hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
						>
							{isLoading ? (
								<>
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
									Updating...
								</>
							) : (
								"Update Product"
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

const formatCurrency = (value) => {
	if (value === null || value === undefined) return "₦0.00";
	const num = typeof value === "string" ? parseFloat(value) : value;
	return isNaN(num) ? "₦0.00" : `₦${num.toFixed(2)}`;
};

const formatNumber = (value) => {
	if (value === null || value === undefined) return "0";
	const num = typeof value === "string" ? parseInt(value) : value;
	return isNaN(num) ? "0" : num.toLocaleString();
};

// API Service Functions
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
			if (error.message.includes("No authentication token")) {
				window.location.href = "/";
			}
			throw error;
		}
	},

	async createProduct(productData) {
		try {
			const headers = await this.getAuthHeaders();

			const apiProductData = {
				sku: productData.sku || "",
				name: productData.name,
				description: productData.description || "",
				price: productData.price,
				cost_price: productData.cost_price,
			};

			console.log("Sending product data to API:", apiProductData);

			const response = await fetch(`${API_BASE_URL}/products`, {
				method: "POST",
				headers,
				body: JSON.stringify(apiProductData),
			});

			if (!response.ok) {
				if (response.status === 401) {
					throw new Error("Authentication failed. Please log in again.");
				}
				const errorData = await response.json().catch(() => null);
				throw new Error(
					errorData?.message || `Failed to create product: ${response.status}`
				);
			}

			const newProduct = await response.json();
			console.log("Product created successfully:", newProduct);
			return newProduct;
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

	async updateProduct(id, productData) {
		try {
			const headers = await this.getAuthHeaders();

			const apiProductData = {
				sku: productData.sku || "",
				name: productData.name,
				description: productData.description || "",
				price: productData.price,
				stock: productData.stock,
			};

			const response = await fetch(`${API_BASE_URL}/products/${id}`, {
				method: "PUT",
				headers,
				body: JSON.stringify(apiProductData),
			});

			if (!response.ok) {
				if (response.status === 401) {
					throw new Error("Authentication failed. Please log in again.");
				}
				const errorData = await response.json().catch(() => null);
				throw new Error(
					errorData?.message || `Failed to update product: ${response.status}`
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

	async deleteProduct(id) {
		try {
			const headers = await this.getAuthHeaders();

			const response = await fetch(`${API_BASE_URL}/products/${id}`, {
				method: "DELETE",
				headers,
			});

			if (!response.ok) {
				if (response.status === 401) {
					throw new Error("Authentication failed. Please log in again.");
				}
				const errorData = await response.json().catch(() => null);
				throw new Error(
					errorData?.message || `Failed to delete product: ${response.status}`
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

// Main Products Component
export default function Products() {
	const [products, setProducts] = useState([]);
	const [filteredProducts, setFilteredProducts] = useState([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedDescription, setSelectedDescription] = useState("");
	const [showFilters, setShowFilters] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const [showImportModal, setShowImportModal] = useState(false);
	const [showAddProductModal, setShowAddProductModal] = useState(false);
	const [showEditProductModal, setShowEditProductModal] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isAddingProduct, setIsAddingProduct] = useState(false);
	const [isEditingProduct, setIsEditingProduct] = useState(false);
	const [error, setError] = useState("");
	const router = useRouter();

	// Extract unique descriptions for filtering
	const descriptions = [
		...new Set(
			products
				.map((product) => product.description)
				.filter((desc) => desc && desc.trim() !== "")
		),
	].sort();

	useEffect(() => {
		const checkAuth = () => {
			const token = localStorage.getItem("token");
			if (!token) {
				router.push("/");
				return;
			}
		};

		checkAuth();
	}, [router]);

	useEffect(() => {
		loadProducts();
	}, []);

	const loadProducts = async () => {
		setIsLoading(true);
		setError("");
		try {
			const productsData = await productAPI.getAllProducts();

			// Ensure products is an array and has the expected structure
			if (Array.isArray(productsData)) {
				setProducts(productsData);
			} else if (productsData && Array.isArray(productsData.data)) {
				setProducts(productsData.data);
			} else if (productsData && productsData.products) {
				setProducts(productsData.products);
			} else {
				console.warn("Unexpected API response structure:", productsData);
				setProducts([]);
			}
		} catch (err) {
			setError(err.message);
			console.error("Error loading products:", err);
		} finally {
			setIsLoading(false);
		}
	};

	// Calculate summary metrics - UPDATED without stock data
	const calculateSummary = () => {
		const totalProducts = products.length;

		// Count unique descriptions/categories
		const uniqueDescriptions = new Set(
			products
				.map((product) => product.description)
				.filter((desc) => desc && desc.trim() !== "")
		).size;

		// Calculate average price
		const totalPrice = products.reduce((sum, product) => {
			const price = parseFloat(product.price) || 0;
			return sum + price;
		}, 0);
		const averagePrice = totalProducts > 0 ? totalPrice / totalProducts : 0;

		// Find highest priced product
		const highestPricedProduct = products.reduce(
			(highest, product) => {
				const price = parseFloat(product.price) || 0;
				return price > (parseFloat(highest.price) || 0) ? product : highest;
			},
			{ price: 0 }
		);

		// Count products with SKU
		const productsWithSKU = products.filter(
			(product) => product.sku && product.sku.trim() !== ""
		).length;

		return {
			totalProducts,
			uniqueDescriptions,
			averagePrice,
			highestPrice: parseFloat(highestPricedProduct.price) || 0,
			productsWithSKU,
			skuPercentage:
				totalProducts > 0 ? (productsWithSKU / totalProducts) * 100 : 0,
		};
	};

	const summary = calculateSummary();

	useEffect(() => {
		const checkIsMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkIsMobile();
		window.addEventListener("resize", checkIsMobile);
		return () => window.removeEventListener("resize", checkIsMobile);
	}, []);

	useEffect(() => {
		let filtered = products;

		if (searchTerm) {
			filtered = filtered.filter(
				(product) =>
					product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					product.description?.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		if (selectedDescription) {
			filtered = filtered.filter(
				(product) => product.description === selectedDescription
			);
		}

		setFilteredProducts(filtered);
	}, [products, searchTerm, selectedDescription]);

	const clearFilters = () => {
		setSearchTerm("");
		setSelectedDescription("");
	};

	const toggleFilters = () => {
		setShowFilters(!showFilters);
	};

	const handleImportCSV = (importData) => {
		console.log("Importing CSV data:", importData);
	};

	const handleAddProduct = async (productData) => {
		setIsAddingProduct(true);
		setError("");
		try {
			console.log("Adding product:", productData);
			const newProduct = await productAPI.createProduct(productData);
			console.log("Product added successfully:", newProduct);

			// Refresh the products list to get the updated data from the server
			await loadProducts();
			setShowAddProductModal(false);
		} catch (err) {
			setError(err.message);
			console.error("Error adding product:", err);
		} finally {
			setIsAddingProduct(false);
		}
	};

	const handleEditClick = (product) => {
		setSelectedProduct(product);
		setShowEditProductModal(true);
	};

	const handleEditProduct = async (id, productData) => {
		setIsEditingProduct(true);
		setError("");
		try {
			const updatedProduct = await productAPI.updateProduct(id, productData);
			setProducts((prev) =>
				prev.map((product) => (product.id === id ? updatedProduct : product))
			);
			setShowEditProductModal(false);
			setSelectedProduct(null);
		} catch (err) {
			setError(err.message);
			console.error("Error updating product:", err);
		} finally {
			setIsEditingProduct(false);
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
			setProducts((prev) => prev.filter((product) => product.id !== id));
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
				{/* Summary Cards - UPDATED */}
				<div className="">
					<div className="p-2 bg-white rounded shadow">
						<div className="flex flex-col gap-2 sm:flex-row sm:flex-nowrap sm:overflow-x-auto sm:justify-between sm:space-x-1 md:space-x-2">
							<div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
								<div className="flex items-center">
									<div className="p-1 mr-1 rounded bg-blue-100 md:mr-2 md:p-1.5">
										<FaStore className="text-xs text-blue-600 md:text-sm" />
									</div>
									<div>
										<h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
											Total Products
										</h3>
										<p className="text-sm font-bold text-gray-800 md:text-lg">
											{summary.totalProducts}
										</p>
									</div>
								</div>
							</div>

							<div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
								<div className="flex items-center">
									<div className="p-1 mr-1 rounded bg-green-100 md:mr-2 md:p-1.5">
										<FaTags className="text-xs text-green-600 md:text-sm" />
									</div>
									<div>
										<h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
											Categories
										</h3>
										<p className="text-sm font-bold text-gray-800 md:text-lg">
											{summary.uniqueDescriptions}
										</p>
									</div>
								</div>
							</div>

							<div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
								<div className="flex items-center">
									<div className="p-1 mr-1 rounded bg-purple-100 md:mr-2 md:p-1.5">
										<FaChartBar className="text-xs text-purple-600 md:text-sm" />
									</div>
									<div>
										<h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
											Avg Price
										</h3>
										<p className="text-sm font-bold text-gray-800 md:text-lg">
											{formatCurrency(summary.averagePrice)}
										</p>
									</div>
								</div>
							</div>

							<div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
								<div className="flex items-center">
									<div className="p-1 mr-1 rounded bg-orange-100 md:mr-2 md:p-1.5">
										<FaMoneyBillWave className="text-xs text-orange-600 md:text-sm" />
									</div>
									<div>
										<h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
											Highest Price
										</h3>
										<p className="text-sm font-bold text-gray-800 md:text-lg">
											{formatCurrency(summary.highestPrice)}
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Search and Actions Section */}
				<div className="p-3 bg-white rounded shadow">
					<div className="flex flex-col w-full gap-3 md:flex-row items-stretch">
						<div className="flex flex-col flex-grow gap-3 md:flex-row">
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

									<div className="w-full md:w-48">
										<select
											value={selectedDescription}
											onChange={(e) => setSelectedDescription(e.target.value)}
											className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
										>
											<option value="">All Categories</option>
											{descriptions.map((description) => (
												<option key={description} value={description}>
													{description}
												</option>
											))}
										</select>
									</div>
								</>
							)}
						</div>

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

					{isMobile && showFilters && descriptions.length > 0 && (
						<div className="grid grid-cols-1 gap-2 p-2 mt-3 bg-gray-50 rounded">
							<div>
								<label className="block mb-1 text-xs font-medium text-gray-700">
									Description
								</label>
								<select
									value={selectedDescription}
									onChange={(e) => setSelectedDescription(e.target.value)}
									className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
								>
									<option value="">All Categories</option>
									{descriptions.map((description) => (
										<option key={description} value={description}>
											{description}
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
					{isLoading && products.length === 0 && (
						<div className="py-12 text-center">
							<div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
							<p className="mt-2 text-sm text-gray-600">Loading products...</p>
						</div>
					)}

					<div className="hidden overflow-x-auto text-black md:block">
						<table className="w-full">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
										Name
									</th>
									<th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
										SKU
									</th>
									<th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
										Category
									</th>
									<th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
										Price
									</th>
									<th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{filteredProducts.map((product) => (
									<tr key={product.id} className="hover:bg-gray-50">
										<td className="px-4 py-3 text-sm text-black">
											{product.name || "N/A"}
										</td>
										<td className="px-4 py-3 text-sm font-medium text-black">
											{product.sku || "N/A"}
										</td>
										<td className="px-4 py-3 text-sm text-black">
											{product.description || "N/A"}
										</td>
										<td className="px-4 py-3 text-sm text-black">
											{formatCurrency(product.price)}
										</td>
										<td className="px-4 py-3 text-sm text-black">
											<div className="flex gap-2">
												<button
													onClick={() => handleEditClick(product)}
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

					<div className="text-black md:hidden">
						{filteredProducts.map((product) => (
							<div key={product.id} className="p-4 border-b border-gray-200">
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<div className="flex justify-between">
											<span className="font-medium text-black">
												{product.name || "N/A"}
											</span>
										</div>
										<div className="mt-1 text-sm text-gray-600">
											SKU: {product.sku || "N/A"}
										</div>
										<div className="mt-1 text-sm text-gray-600">
											Category: {product.description || "N/A"}
										</div>
										<div className="mt-2">
											<div className="text-sm">
												Price: {formatCurrency(product.price)}
											</div>
										</div>
										<div className="flex gap-2 mt-3">
											<button
												onClick={() => handleEditClick(product)}
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

			<ImportCSVModal
				isOpen={showImportModal}
				onClose={() => setShowImportModal(false)}
				onImport={handleImportCSV}
			/>

			<AddProductModal
				isOpen={showAddProductModal}
				onClose={() => setShowAddProductModal(false)}
				onAdd={handleAddProduct}
				isLoading={isAddingProduct}
			/>

			<EditProductModal
				isOpen={showEditProductModal}
				onClose={() => {
					setShowEditProductModal(false);
					setSelectedProduct(null);
				}}
				onEdit={handleEditProduct}
				isLoading={isEditingProduct}
				product={selectedProduct}
			/>
		</div>
	);
}
