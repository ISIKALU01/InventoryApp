// pages/transaction/sales-invoice.js
import TransactionNav from "../../components/TransactionNav";
import { useState, useEffect } from "react";
import { inventoryAPI } from "../../../utils/salesApi";
import BASE_URL from "../../../config";
import axios from "axios";
import { Trash2 } from "lucide-react";
import { FaTimes } from "react-icons/fa";

export default function SalesInvoice() {
	const [inventory, setInventory] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [stores, setStores] = useState([]);
	const [selectedStore, setSelectedStore] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [filteredInventory, setFilteredInventory] = useState([]);
	const [selectedItem, setSelectedItem] = useState(null);
	const [cartLoading, setCartLoading] = useState(false);
	const [cart, setCart] = useState([]);
	const [showOrderModal, setShowOrderModal] = useState(false);
	const [paymentMethod, setPaymentMethod] = useState("");
	const [selectedCustomer, setSelectedCustomer] = useState("");
	const [customers, setCustomers] = useState([]);

	const token = localStorage.getItem("token");

useEffect(() => {
	const fetchCustomers = async () => {
		try {
			const token = localStorage.getItem("token");
			let url = "";

			// Choose endpoint based on payment method
			if (paymentMethod === "customer_balance") {
				url = `${BASE_URL}/customers`;
			} else if (paymentMethod === "credit_limit") {
				url = `${BASE_URL}/reports/customer-credit`;
			} else {
				return; // no fetch needed
			}

			const response = await axios.get(url, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			setCustomers(response.data);
		} catch (error) {
			console.error("Error fetching customers:", error);
		}
	};

	fetchCustomers();
}, [paymentMethod]);


	// Fetch inventory data
	useEffect(() => {
		const fetchInventory = async () => {
			try {
				setLoading(true);
				const response = await axios.get(`${BASE_URL}/products`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
					params: {
						store: selectedStore || undefined,
						search: searchTerm || undefined,
					},
				});

				const inventoryData = response.data;
				const transformedInventory = Array.isArray(inventoryData)
					? inventoryData
					: inventoryData.data || inventoryData.products || [];

				setInventory(transformedInventory);

				const uniqueStores = [
					...new Set(
						transformedInventory
							.filter((item) => item.store)
							.map((item) => item.store)
					),
				].sort();

				setStores(uniqueStores);
				setLoading(false);
			} catch (err) {
				console.error("Failed to fetch inventory:", err);
				setError(err.message);
				setLoading(false);
			}
		};

		fetchInventory();
	}, [selectedStore, searchTerm]);

	// Filter inventory based on store and search term
	useEffect(() => {
		let filtered = inventory;

		// Filter by store
		if (selectedStore) {
			filtered = filtered.filter((item) => item.store === selectedStore);
		}

		// Filter by search term
		if (searchTerm) {
			const term = searchTerm.toLowerCase();
			filtered = filtered.filter((item) => {
				const productName = item.name || "";
				const productSku = item.sku || "";
				const storeName = item.store || "";

				return (
					productName.toLowerCase().includes(term) ||
					productSku.toLowerCase().includes(term) ||
					storeName.toLowerCase().includes(term) ||
					(item.id && item.id.toString().includes(term)) ||
					(item._id && item._id.toString().includes(term))
				);
			});
		}

		setFilteredInventory(filtered);
	}, [selectedStore, searchTerm, inventory]);

	// Handle store filter change
	const handleStoreChange = (e) => {
		setSelectedStore(e.target.value);
	};

	// Handle search input change
	const handleSearchChange = (e) => {
		setSearchTerm(e.target.value);
	};

	// Handle search form submission
	const handleSearchSubmit = (e) => {
		e.preventDefault();
	};

	// Helper function to determine stock status
	const getStockStatus = (stock) => {
		const stockNum = parseInt(stock) || 0;
		if (stockNum === 0) return "out-of-stock";
		if (stockNum <= 10) return "low-stock";
		return "in-stock";
	};

	// Get stock status badge
	const getStockBadge = (stockStatus, stock) => {
		const styles = {
			"in-stock": "bg-green-100 text-green-800",
			"low-stock": "bg-yellow-100 text-yellow-800",
			"out-of-stock": "bg-red-100 text-red-800",
		};

		const labels = {
			"in-stock": "In Stock",
			"low-stock": `Low Stock (${stock})`,
			"out-of-stock": "Out of Stock",
		};

		return (
			<span
				className={`px-2 py-1 text-xs font-medium rounded-full ${styles[stockStatus]}`}
			>
				{labels[stockStatus]}
			</span>
		);
	};

	// Fetch all cart items
	const fetchCart = async () => {
		try {
			setLoading(true);
			const response = await axios.get(`${BASE_URL}/cart`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			setCart(response.data.data || []);
		} catch (error) {
			console.error("Error fetching cart:", error);
		} finally {
			setLoading(false);
		}
	};

	//add to cart
	const handleItemClick = async (id) => {
		try {
			setCartLoading(true);
			const response = await axios.post(
				`${BASE_URL}/cart/${id}`,
				{}, // body (empty if not needed)
				{
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				}
			);
			setSelectedItem(response.data);
			console.log("Cart item details:", response.data);
			alert(`${response.data.message}`);
			// ✅ Immediately refresh cart to show update
			await fetchCart();
		} catch (error) {
			console.error("Error fetching cart item:", error);
		} finally {
			setCartLoading(false);
		}
	};

	// 🗑️ Delete cart item
	const handleDelete = async (id) => {
		try {
			const token = localStorage.getItem("token");
			await axios.delete(`${BASE_URL}/cart/${id}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			setCart((prev) => prev.filter((item) => item.id !== id));
		} catch (err) {
			console.error("Error deleting cart item:", err);
			alert("Failed to remove item from cart");
		}
	};

	// ➕ Increase quantity (with stock limit)
	const handleIncrease = (id) => {
		setCart((prev) =>
			prev.map((item) =>
				item.id === id
					? {
							...item,
							default_quantity_added:
								item.default_quantity_added < item.product_stock
									? item.default_quantity_added + 1
									: item.default_quantity_added,
					  }
					: item
			)
		);
	};

	// ➖ Decrease quantity
	const handleDecrease = (id) => {
		setCart((prev) =>
			prev.map((item) =>
				item.id === id
					? {
							...item,
							default_quantity_added:
								item.default_quantity_added > 1
									? item.default_quantity_added - 1
									: 1,
					  }
					: item
			)
		);
	};

	// Process the order
	const handleProcessOrder = async () => {
		try {
			const orderItems = cart.map((item) => ({
				product_id: item.product_id,
				quantity: item.default_quantity_added,
			}));

			const orderData = {
				customer_id: selectedCustomer || null,
				items: orderItems,
				payment_method: paymentMethod,
			};

			const response = await axios.post(`${BASE_URL}/orders`, orderData, {
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (response.data) {
				alert("Order processed successfully!");
				setCart([]);
				setShowOrderModal(false);
			}
		} catch (error) {
			console.error("Error processing order:", error);

			if (error.response && error.response.data) {
				// You can inspect what Laravel sent back
				console.log("Error details:", error.response.data);

				// Example: show a specific message from backend
				const message =
					error.response.data.message ||
					"Failed to process order. Please try again.";
				alert(message);
			} else {
				// Network or unexpected error
				alert("Something went wrong. Please try again later.");
			}
		}
	};

	// Clear all items from cart
	const handleClearOrder = async () => {
		try {
			const cartIds = cart.map((item) => item.id);
			await axios.delete(`${BASE_URL}/clear-selected-cart`, {
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				data: {
					cart_ids: cartIds,
				},
			});
			setCart([]);
		} catch (err) {
			console.error("Error clearing cart:", err);
			alert("Failed to clear cart");
		}
	};

	// 💰 Calculate totals
	const subtotal = cart.reduce(
		(sum, item) =>
			sum + item.default_quantity_added * parseFloat(item.product_price),
		0
	);
	const tax = subtotal * 0.05; // optional tax (5%)
	const discount = 0; // or calculate dynamically
	const total = subtotal + tax - discount;

	useEffect(() => {
		fetchCart();
	}, []);

	return (
		<div className="pt-0 mt-0 font-raleway">
			{/* Order Modal */}
			{showOrderModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 bg-opacity-50">
					<div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
						<div className="flex items-center justify-between border-b pb-2 mb-4">
							<h2 className="text-lg font-semibold text-gray-800">
								Process Order
							</h2>
							<button
								onClick={() => setShowOrderModal(false)}
								className="text-gray-400 transition-colors hover:text-gray-600"
							>
								<FaTimes className="text-sm" />
							</button>
						</div>

						<p className="mb-4 text-gray-400">
							Are you sure you want to process this order?
						</p>

						{/* Payment Method Section */}
						<div className="mb-6">
							<label className="block text-gray-700 font-medium mb-2">
								Select Payment Method
							</label>
							<select
								className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-600 text-black outline-none"
								value={paymentMethod}
								onChange={(e) => setPaymentMethod(e.target.value)}
							>
								<option value="">-- Select Payment Method --</option>
								<option value="cash">Cash</option>
								<option value="card">Card</option>
								<option value="bank_transfer">Bank Transfer</option>
								<option value="customer_balance">Customer Balance</option>
								<option value="credit_limit">Credit Limit</option>
								<option value="complimentary">Complimentary</option>
								<option value="loyalty">Loyalty</option>
							</select>
						</div>

						{(paymentMethod === "customer_balance" ||
							paymentMethod === "credit_limit") && (
							<div className="mb-6">
								<label
									htmlFor="customer"
									className="block text-gray-700 font-medium mb-2"
								>
									Select Customer
								</label>
								<select
									id="customer"
									className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-600 text-black outline-none"
									value={selectedCustomer}
									onChange={(e) => setSelectedCustomer(e.target.value)}
								>
									<option value="">-- Select Customer --</option>
									{customers.map((cust) => (
										<option
											key={cust.id}
											value={cust.id}
											disabled={
												paymentMethod === "credit_limit" &&
												Number(cust.credit_limit) === 0
											} // 🔒 Disable customers with no credit limit
										>
											{cust.name} —{" "}
											{paymentMethod === "customer_balance" &&
												` ₦ ${Number(cust.balance).toLocaleString()}`}{" "}
											{paymentMethod === "credit_limit" &&
												` (Credit Limit: ₦${Number(
													cust.credit_limit
												).toLocaleString()})`}
										</option>
									))}
								</select>
							</div>
						)}

						<div className="flex justify-end gap-2">
							<button
								onClick={() => setShowOrderModal(false)}
								className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
							>
								Cancel
							</button>
							<button
								onClick={handleProcessOrder}
								disabled={
									!paymentMethod ||
									(paymentMethod === "customer_balance" && !selectedCustomer)
								}
								className={`px-4 py-2 rounded text-white ${
									paymentMethod &&
									(paymentMethod !== "customer_balance" || selectedCustomer)
										? "bg-indigo-600 hover:bg-indigo-700"
										: "bg-gray-400 cursor-not-allowed"
								}`}
							>
								Confirm
							</button>
						</div>
					</div>
				</div>
			)}

			<h1 className="text-xl font-normal text-gray-800 mb-2 hidden md:block">
				Sales Point
			</h1>
			<TransactionNav />

			<div className="flex flex-col lg:flex-row gap-6 mt-6">
				{/* Products Section */}
				<div className="flex-1 bg-white rounded-lg shadow-md p-4">
					{/* Search Header */}
					<div className="mb-6">
						<h2 className="text-lg font-semibold text-gray-800 mb-4">
							Products
						</h2>

						<form
							onSubmit={handleSearchSubmit}
							className="flex flex-col sm:flex-row gap-3 mb-4 w-full"
						>
							<div className="flex-1 min-w-0">
								<select
									value={selectedStore}
									onChange={handleStoreChange}
									className="w-full px-4 py-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black outline-none"
								>
									<option value="">All Stores</option>
									{stores.map((store) => (
										<option key={store} value={store}>
											{store}
										</option>
									))}
								</select>
							</div>

							<div className="flex-1 min-w-0 flex">
								<input
									type="text"
									placeholder="Search products by name, SKU, store, or ID..."
									value={searchTerm}
									onChange={handleSearchChange}
									className="flex-1 min-w-0 px-4 py-3 border border-gray-300 rounded-l-md text-sm text-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
								/>
								<button
									type="submit"
									className="px-4 py-3 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 transition-colors outline-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
								>
									<svg
										className="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
										/>
									</svg>
								</button>
							</div>
						</form>
					</div>

					{/* Products List */}
					<div>
						<h3 className="text-sm font-semibold text-gray-700 mb-4 border-b pb-2">
							Available Products ({loading ? "..." : filteredInventory.length})
							{selectedStore && ` - Filtered by: ${selectedStore}`}
							{searchTerm && ` - Search: "${searchTerm}"`}
						</h3>

						{loading ? (
							<div className="flex items-center justify-center h-32">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
								<span className="ml-3 text-gray-600">Loading inventory...</span>
							</div>
						) : error ? (
							<div className="text-center text-red-500 py-6">
								<svg
									className="w-8 h-8 mx-auto mb-2 text-red-300"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<p className="text-sm">Error loading products</p>
								<p className="text-xs mt-1">{error}</p>
							</div>
						) : filteredInventory.length === 0 ? (
							<div className="text-center text-gray-500 py-6">
								<svg
									className="w-8 h-8 mx-auto mb-2 text-gray-300"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
									/>
								</svg>
								<p className="text-sm">No products found</p>
								<p className="text-xs mt-1">
									{selectedStore || searchTerm
										? "Try changing your filters or search term"
										: "Add products to your inventory to see them here"}
								</p>
							</div>
						) : (
							<div className="space-y-2">
								{filteredInventory.map((item) => {
									const stockStatus = getStockStatus(item.stock);

									return (
										<div
											key={item.id}
											className="flex items-center justify-between p-3 rounded-lg bg-gray-50 cursor-pointer"
											onClick={() => handleItemClick(item.id)}
										>
											<div className="flex-1 min-w-0">
												<div className="font-medium text-gray-800 truncate">
													{item.name}
												</div>
												<div className="text-xs text-gray-500 flex flex-wrap gap-2 mt-1">
													<span>ID: {item.id}</span>
													<span>SKU: {item.sku}</span>
													<span>Store: {item.store}</span>
												</div>
												<div className="flex items-center mt-1 space-x-2">
													{getStockBadge(stockStatus, item.stock)}
													<span className="text-xs text-gray-500 capitalize">
														{item.description}
													</span>
												</div>
											</div>
											<div className="text-right flex-shrink-0 ml-2">
												<div className="font-semibold text-gray-800">
													₦{parseFloat(item.price).toFixed(2)}
												</div>
												<div className="text-xs text-gray-500">
													Stock: {item.stock}
												</div>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>
				</div>

				{/* Order Preview Section */}
				<div className="lg:w-1/3 bg-white rounded-lg shadow-md p-4">
					<h2 className="text-lg font-semibold text-gray-800 mb-4">
						Order Preview
					</h2>

					{/* If empty */}
					{cart.length === 0 ? (
						<div className="bg-gray-50 rounded-lg p-4 mb-4 text-center text-gray-500 py-8">
							<svg
								className="w-12 h-12 mx-auto mb-3 text-gray-300"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
								/>
							</svg>
							<p className="text-sm">No items in order</p>
							<p className="text-xs mt-1">
								Select products to add to your order
							</p>
						</div>
					) : (
						<div className="mb-4 space-y-3">
							{cart.map((item) => (
								<div
									key={item.id}
									className="flex items-center justify-between  bg-gray-50 rounded-lg p-3"
								>
									<div className="flex-1">
										<div className="font-medium text-gray-800">
											{item.product_name}
										</div>
										<div className="text-xs text-gray-500">
											₦{parseFloat(item.product_price).toFixed(2)} ×{" "}
											{item.default_quantity_added}
										</div>
										<div className="flex items-center mt-1">
											<button
												onClick={() => handleDecrease(item.id)}
												className="w-9 h-9 flex items-center justify-center border border-blue-500 rounded-l-lg text-blue-600 font-bold text-lg transition-all duration-200 hover:bg-blue-600 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
												aria-label={`Decrease quantity for ${item.name}`}
												disabled={item.default_quantity_added <= 1} // Optional: disable at min
											>
												-
											</button>
											<span
												className="w-12 h-9 flex items-center justify-center border-t border-b border-blue-500 text-gray-800 text-base font-medium bg-white"
												aria-live="polite"
											>
												{item.default_quantity_added}
											</span>
											<button
												onClick={() => handleIncrease(item.id)}
												className="w-9 h-9 flex items-center justify-center border border-blue-500 rounded-r-lg text-blue-600 font-bold text-lg transition-all duration-200 hover:bg-blue-600 hover:text-white"
												aria-label={`Increase quantity for ${item.name}`}
											>
												+
											</button>
										</div>
									</div>

									<div className="flex items-center gap-2">
										<div className="font-semibold text-gray-800">
											₦
											{(
												parseFloat(item.product_price) *
												item.default_quantity_added
											).toFixed(2)}
										</div>
										<button
											onClick={() => handleDelete(item.id)}
											className="p-2 rounded text-red-500 hover:text-white hover:bg-red-500 transition-all duration-200 shadow-sm hover:shadow-md"
											title="Remove item"
										>
											<Trash2 size={18} strokeWidth={2} />
										</button>
									</div>
								</div>
							))}
						</div>
					)}

					{/* Totals */}
					<div className="space-y-3 border-t pt-4">
						<div className="flex justify-between text-sm">
							<span className="text-gray-600">Subtotal:</span>
							<span className="font-medium text-gray-900">
								₦{subtotal.toFixed(2)}
							</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-gray-600">Tax:</span>
							<span className="font-medium text-blue-600">
								₦{tax.toFixed(2)}
							</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-gray-600">Discount:</span>
							<span className="font-medium text-green-600">
								₦{discount.toFixed(2)}
							</span>
						</div>
						<div className="flex justify-between text-lg font-semibold border-t pt-2">
							<span className="text-gray-900">Total:</span>
							<span className="text-gray-700">₦{total.toFixed(2)}</span>
						</div>
					</div>

					{/* Buttons */}
					<div className="mt-6 space-y-3">
						<button
							disabled={cart.length === 0}
							onClick={() => setShowOrderModal(true)}
							className={`w-full py-3 px-4 rounded-md font-medium ${
								cart.length === 0
									? "bg-gray-300 text-gray-500 cursor-not-allowed"
									: "bg-indigo-600 text-white hover:bg-indigo-700"
							}`}
						>
							Process Order
						</button>
						<button
							onClick={handleClearOrder}
							disabled={cart.length === 0}
							className={`w-full py-2 px-4 rounded-md font-medium ${
								cart.length === 0
									? "bg-gray-100 text-gray-400 cursor-not-allowed"
									: "bg-red-50 text-red-500 hover:bg-red-100"
							}`}
						>
							Clear Order
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
