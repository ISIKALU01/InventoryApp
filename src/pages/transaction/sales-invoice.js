// pages/transaction/sales-invoice.js
import TransactionNav from "../../components/TransactionNav";
import { useState, useEffect, useRef } from "react";
import http from "../../../services/http";
import {
	AlertTriangle,
	CheckCircle2,
	ChevronDown,
	Loader2,
	Minus,
	Package,
	Plus,
	Search,
	ShoppingCart,
	Trash2,
	X,
	XCircle,
	History,
	Info,
} from "lucide-react";

const PAYMENT_METHODS = [
	{ value: "cash", label: "Cash" },
	{ value: "card", label: "Card" },
	{ value: "bank_transfer", label: "Bank Transfer" },
	{ value: "customer_balance", label: "Customer Balance" },
	{ value: "credit_limit", label: "Credit Limit" },
	{ value: "complimentary", label: "Complimentary" },
	{ value: "loyalty", label: "Loyalty" },
];

const CUSTOMER_METHODS = ["customer_balance", "credit_limit"];

const TOAST_DURATION = { success: 3000, error: 5000 };

// Queued (parked) orders live in this browser; the nav allows up to three
const MAX_QUEUED_ORDERS = 3;
const QUEUE_STORAGE_KEY = "salesPoint.queuedOrders";

const loadQueuedOrders = () => {
	try {
		const saved = JSON.parse(localStorage.getItem(QUEUE_STORAGE_KEY));
		return Array.isArray(saved) ? saved : [];
	} catch {
		return [];
	}
};

const saveQueuedOrders = (orders) => {
	try {
		localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(orders));
	} catch {
		// Storage blocked or full: the queue still works for this session
	}
};

// What we keep of a cart to rebuild it later
const snapshotCart = (cart) => ({
	id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
	createdAt: new Date().toISOString(),
	items: cart.map((item) => ({
		product_id: item.product_id,
		product_name: item.product_name,
		product_price: item.product_price,
		quantity: Number(item.default_quantity_added) || 1,
	})),
});

const queuedTotal = (order) =>
	order.items.reduce((sum, item) => sum + item.quantity * parseFloat(item.product_price || 0), 0);

const queuedCount = (order) => order.items.reduce((sum, item) => sum + item.quantity, 0);

const formatTime = (iso) =>
	new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

// Safety stop for the paginated product fetch
const MAX_PRODUCT_PAGES = 100;

// API responses may be a bare array, { data: [...] } (Laravel paginator)
// or { [key]: [...] }
const toList = (body, key) => {
	if (Array.isArray(body)) return body;
	if (Array.isArray(body?.data)) return body.data;
	if (Array.isArray(body?.[key])) return body[key];
	return [];
};

// A product's store comes back as a name or as a { name } object
const storeNameOf = (store) =>
	(store && typeof store === "object" ? store.name : store)?.toString().trim() || "";

const formatNaira = (value) =>
	`₦${Number(value || 0).toLocaleString("en-NG", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

const fieldClass =
	"block w-full px-3 py-2.5 text-sm text-gray-800 bg-gray-100 border-0 rounded-none outline-none transition-colors placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-600";

const labelClass =
	"block mb-1.5 text-xs font-semibold tracking-wide text-gray-600 uppercase";

const primaryButtonClass =
	"flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-none transition-colors hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed";

const secondaryButtonClass =
	"flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-none transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed";

// Borderless dropdown with its own chevron in place of the browser arrow
const Select = ({ className = "", children, ...props }) => (
	<div className={`relative ${className}`}>
		<select {...props} className={`${fieldClass} pr-9 appearance-none cursor-pointer`}>
			{children}
		</select>
		<ChevronDown
			size={16}
			className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2"
		/>
	</div>
);

const PanelHeader = ({ title, meta, action }) => (
	<div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-200">
		<div className="flex items-baseline min-w-0 gap-2">
			<h2 className="text-base font-semibold text-gray-900">{title}</h2>
			{meta && <span className="text-xs text-gray-500 truncate">{meta}</span>}
		</div>
		{action}
	</div>
);

const EmptyState = ({ icon: Icon, title, hint, tone = "gray" }) => (
	<div className="flex flex-col items-center justify-center px-5 py-12 text-center">
		<div
			className={`flex items-center justify-center w-12 h-12 mb-3 ${
				tone === "red" ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-400"
			}`}
		>
			<Icon size={22} />
		</div>
		<p className="text-sm font-medium text-gray-700">{title}</p>
		{hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
	</div>
);

const STOCK_BADGE = {
	"in-stock": "bg-green-50 text-green-700",
	"low-stock": "bg-amber-50 text-amber-700",
	"out-of-stock": "bg-red-50 text-red-700",
};

// Toast for quick confirmations and failures; the bar shows time left
const Toast = ({ toast, onClose }) => {
	const isError = toast.type === "error";
	const Icon = isError ? XCircle : CheckCircle2;

	return (
		<div
			role={isError ? "alert" : "status"}
			className="fixed z-[60] top-4 right-4 left-4 sm:left-auto sm:w-96 toast-in"
		>
			<div
				className={`relative overflow-hidden bg-white border border-gray-200 border-l-4 shadow-xl ${
					isError ? "border-l-red-600" : "border-l-green-600"
				}`}
			>
				<div className="flex items-start gap-3 px-4 py-3.5">
					<Icon
						size={20}
						className={`mt-0.5 shrink-0 ${isError ? "text-red-600" : "text-green-600"}`}
					/>
					<div className="flex-1 min-w-0">
						<p className="text-sm font-semibold text-gray-900">
							{toast.title || (isError ? "Something went wrong" : "Done")}
						</p>
						<p className="mt-0.5 text-sm text-gray-600 break-words">{toast.message}</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Dismiss"
						className="flex items-center justify-center w-7 h-7 -mr-1 text-gray-400 transition-colors shrink-0 hover:bg-gray-100 hover:text-gray-700"
					>
						<X size={16} />
					</button>
				</div>
				<div
					className={`h-1 toast-progress ${isError ? "bg-red-600/30" : "bg-green-600/30"}`}
					style={{ animationDuration: `${TOAST_DURATION[toast.type]}ms` }}
				/>
			</div>
		</div>
	);
};

// Floating panel over a lightly blurred page, matching the inventory modals
const ModalShell = ({ title, subtitle, icon: Icon, iconClass, onClose, busy = false, children }) => (
	<div
		className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 overflow-y-auto bg-gray-900/20 backdrop-blur-[2px]"
		onClick={(e) => {
			if (e.target === e.currentTarget && !busy) onClose();
		}}
	>
		<div
			role="dialog"
			aria-modal="true"
			className="relative w-full max-w-md bg-white border border-gray-300 rounded-none shadow-2xl modal-in"
		>
			<div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-200">
				<div className="flex items-center gap-3">
					<div className={`flex items-center justify-center w-10 h-10 text-white ${iconClass}`}>
						<Icon size={20} />
					</div>
					<div>
						<h2 className="text-lg font-semibold leading-tight text-gray-900">{title}</h2>
						{subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
					</div>
				</div>
				<button
					type="button"
					onClick={onClose}
					disabled={busy}
					aria-label="Close"
					className="flex items-center justify-center w-8 h-8 text-gray-400 transition-colors border border-transparent hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50"
				>
					<X size={16} />
				</button>
			</div>
			{children}
		</div>
	</div>
);

const ModalFooter = ({ children }) => (
	<div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
		{children}
	</div>
);

const SummaryRow = ({ label, value, strong = false, valueClass = "" }) => (
	<div className="flex items-center justify-between px-4 py-2.5 bg-white">
		<span className={strong ? "text-sm font-semibold text-gray-900" : "text-sm text-gray-600"}>
			{label}
		</span>
		<span
			className={`${
				strong ? "text-base font-bold text-gray-900" : "text-sm font-medium text-gray-900"
			} ${valueClass}`}
		>
			{value}
		</span>
	</div>
);

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SalesInvoice() {
	const [inventory, setInventory] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [stores, setStores] = useState([]);
	const [selectedStore, setSelectedStore] = useState(""); // store id, "" = all stores
	const [orderStore, setOrderStore] = useState(""); // store the order is sold from
	const [searchTerm, setSearchTerm] = useState("");
	const [filteredInventory, setFilteredInventory] = useState([]);
	const [addingId, setAddingId] = useState(null);
	const [cart, setCart] = useState([]);
	const [showOrderModal, setShowOrderModal] = useState(false);
	const [paymentMethod, setPaymentMethod] = useState("");
	const [selectedCustomer, setSelectedCustomer] = useState("");
	const [customers, setCustomers] = useState([]);
	const [processing, setProcessing] = useState(false);
	const [orderError, setOrderError] = useState("");
	const [completedOrder, setCompletedOrder] = useState(null);
	const [queuedOrders, setQueuedOrders] = useState([]);
	const [queueLoaded, setQueueLoaded] = useState(false);
	const [queueBusy, setQueueBusy] = useState(false);
	const [showRecallModal, setShowRecallModal] = useState(false);

	const [toast, setToast] = useState(null);
	const toastTimer = useRef(null);

	const notify = (type, message, title) => {
		clearTimeout(toastTimer.current);
		setToast({ id: Date.now(), type, message, title });
		toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION[type]);
	};

	const closeToast = () => {
		clearTimeout(toastTimer.current);
		setToast(null);
	};

	useEffect(() => () => clearTimeout(toastTimer.current), []);

	const needsCustomer = CUSTOMER_METHODS.includes(paymentMethod);

	useEffect(() => {
		// A customer picked for one method may not qualify for another
		setSelectedCustomer("");
		setCustomers([]);

		const fetchCustomers = async () => {
			try {
				let url = "";

				// Choose endpoint based on payment method
				if (paymentMethod === "customer_balance") {
					url = "/customers";
				} else if (paymentMethod === "credit_limit") {
					url = "/reports/customer-credit";
				} else {
					return; // no fetch needed
				}

				const response = await http.get(url);

				setCustomers(response.data);
			} catch (error) {
				console.error("Error fetching customers:", error);
				setOrderError("Could not load customers. Please try again.");
			}
		};

		fetchCustomers();
	}, [paymentMethod]);

	// Fetch every product once and filter on the client. /products can be
	// paginated, so follow last_page; reading only page one hid whole stores
	// whose products sat on later pages.
	useEffect(() => {
		let cancelled = false;

		const fetchInventory = async () => {
			try {
				setLoading(true);
				const allProducts = [];
				let page = 1;
				let lastPage = 1;

				do {
					const response = await http.get("/products", { params: { page } });
					const body = response.data;
					allProducts.push(...toList(body, "products"));
					lastPage = Number(body?.last_page ?? body?.meta?.last_page ?? 1);
					page += 1;
				} while (page <= lastPage && page <= MAX_PRODUCT_PAGES);

				if (cancelled) return;
				setInventory(allProducts);
				setError(null);
			} catch (err) {
				console.error("Failed to fetch inventory:", err);
				if (!cancelled) setError(err.message);
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		fetchInventory();
		return () => {
			cancelled = true;
		};
	}, []);

	// The filter lists every store from /stores. A product stocked in several
	// stores is listed under each of them.
	useEffect(() => {
		const fetchStores = async () => {
			try {
				const response = await http.get("/stores");
				setStores(
					toList(response.data, "stores")
						.filter((store) => store?.id !== undefined && storeNameOf(store))
						.sort((a, b) => storeNameOf(a).localeCompare(storeNameOf(b)))
				);
			} catch (err) {
				console.error("Failed to fetch stores:", err);
			}
		};

		fetchStores();
	}, []);

	const storeName = (id) =>
		storeNameOf(stores.find((store) => String(store.id) === String(id)));

	// Filter inventory based on store and search term
	useEffect(() => {
		let filtered = inventory;

		// Filter by store: keep products stocked there and show that store's stock
		if (selectedStore) {
			filtered = filtered.flatMap((item) => {
				const entry = (item.stores || []).find(
					(s) => String(s.store_id) === String(selectedStore)
				);
				return entry ? [{ ...item, stock: entry.stock, store: entry.store }] : [];
			});
		}

		// Filter by search term
		if (searchTerm) {
			const term = searchTerm.toLowerCase();
			filtered = filtered.filter((item) => {
				const productName = item.name || "";
				const productSku = item.sku || "";
				const storeName = storeNameOf(item.store) || "";

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

	// Handle store filter change; the order is sold from the filtered store by default
	const handleStoreChange = (e) => {
		setSelectedStore(e.target.value);
		setOrderStore(e.target.value);
	};

	// Stock a cart item can sell: the order store's stock, or the total if no store is chosen
	const availableStock = (item) => {
		if (orderStore && Array.isArray(item.product_stores)) {
			const entry = item.product_stores.find(
				(s) => String(s.store_id) === String(orderStore)
			);
			return entry ? Number(entry.stock) : 0;
		}
		return Number(item.product_stock);
	};

	// Products stocked in more than one store need a store to sell from
	const needsOrderStore =
		!orderStore && cart.some((item) => (item.product_stores || []).length > 1);

	// Helper function to determine stock status
	const getStockStatus = (stock) => {
		const stockNum = parseInt(stock) || 0;
		if (stockNum === 0) return "out-of-stock";
		if (stockNum <= 10) return "low-stock";
		return "in-stock";
	};

	const stockLabel = (stockStatus, stock) =>
		({
			"in-stock": "In Stock",
			"low-stock": `Low Stock (${stock})`,
			"out-of-stock": "Out of Stock",
		}[stockStatus]);

	// Fetch all cart items (kept off the product list's loading flag so the
	// list doesn't flash a spinner every time an item is added)
	const fetchCart = async () => {
		try {
			const response = await http.get("/cart");
			setCart(response.data.data || []);
		} catch (error) {
			console.error("Error fetching cart:", error);
			notify("error", "Could not load the current order.");
		}
	};

	//add to cart
	const handleItemClick = async (item) => {
		if (addingId) return;
		try {
			setAddingId(item.id);
			await http.post(`/cart/${item.id}`, {});
			notify("success", `${item.name} added to the order.`, "Item added");
			await fetchCart();
		} catch (error) {
			console.error("Error adding cart item:", error);
			notify(
				"error",
				error.response?.data?.message || `Could not add ${item.name} to the order.`,
				"Item not added"
			);
		} finally {
			setAddingId(null);
		}
	};

	// 🗑️ Delete cart item
	const handleDelete = async (item) => {
		try {
			await http.delete(`/cart/${item.id}`);
			setCart((prev) => prev.filter((cartItem) => cartItem.id !== item.id));
			notify("success", `${item.product_name} removed from the order.`, "Item removed");
		} catch (err) {
			console.error("Error deleting cart item:", err);
			notify("error", `Could not remove ${item.product_name}.`, "Item not removed");
		}
	};

	const handleIncrease = (id) => {
		setCart((prev) =>
			prev.map((item) => {
				if (item.id === id) {
					const currentQty = Number(item.default_quantity_added);
					const maxStock = availableStock(item);
					return {
						...item,
						default_quantity_added: currentQty < maxStock ? currentQty + 1 : currentQty,
					};
				}
				return item;
			})
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

	const openOrderModal = () => {
		setOrderError("");
		setShowOrderModal(true);
	};

	const closeOrderModal = () => {
		if (processing) return;
		setShowOrderModal(false);
	};

	// Process the order
	const handleProcessOrder = async () => {
		try {
			setProcessing(true);
			setOrderError("");

			const orderItems = cart.map((item) => ({
				product_id: item.product_id,
				quantity: item.default_quantity_added,
			}));

			const orderData = {
				customer_id: selectedCustomer || null,
				store_id: orderStore || undefined,
				items: orderItems,
				payment_method: paymentMethod,
			};

			const response = await http.post("/orders", orderData);

			if (response.data) {
				setCompletedOrder({
					total,
					itemCount,
					method:
						PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label || paymentMethod,
					customer: customers.find((c) => String(c.id) === String(selectedCustomer))?.name,
				});
				setCart([]);
				setShowOrderModal(false);
				setPaymentMethod("");
			}
		} catch (error) {
			console.error("Error processing order:", error);

			if (error.response && error.response.data) {
				console.log("Error details:", error.response.data);
				setOrderError(
					error.response.data.message || "Failed to process order. Please try again."
				);
			} else {
				setOrderError("Could not reach the server. Check your connection and try again.");
			}
		} finally {
			setProcessing(false);
		}
	};

	const clearServerCart = (items) =>
		http.delete("/clear-selected-cart", {
			data: {
				cart_ids: items.map((item) => item.id),
			},
		});

	// Clear all items from cart
	const handleClearOrder = async () => {
		try {
			await clearServerCart(cart);
			setCart([]);
			notify("success", "All items were removed from the order.", "Order cleared");
		} catch (err) {
			console.error("Error clearing cart:", err);
			notify("error", "Could not clear the order.", "Order not cleared");
		}
	};

	// Restore the queue after mount (localStorage isn't available during SSR)
	useEffect(() => {
		setQueuedOrders(loadQueuedOrders());
		setQueueLoaded(true);
	}, []);

	useEffect(() => {
		if (queueLoaded) saveQueuedOrders(queuedOrders);
	}, [queuedOrders, queueLoaded]);

	// Park the current cart so another customer can be served
	const handleQueueOrder = async () => {
		if (queueBusy) return;
		if (cart.length === 0) {
			notify("error", "Add items to the order before queuing it.", "Nothing to queue");
			return;
		}
		if (queuedOrders.length >= MAX_QUEUED_ORDERS) {
			notify(
				"error",
				`Up to ${MAX_QUEUED_ORDERS} orders can be queued. Recall or discard one first.`,
				"Queue is full"
			);
			return;
		}

		try {
			setQueueBusy(true);
			const snapshot = snapshotCart(cart);
			await clearServerCart(cart);
			setQueuedOrders((prev) => [...prev, snapshot]);
			setCart([]);
			notify(
				"success",
				`${queuedCount(snapshot)} item${queuedCount(snapshot) === 1 ? "" : "s"} · ${formatNaira(
					queuedTotal(snapshot)
				)} saved. Recall it from the nav when ready.`,
				"Order queued"
			);
		} catch (err) {
			console.error("Error queuing order:", err);
			notify("error", "Could not queue the order. Please try again.", "Order not queued");
		} finally {
			setQueueBusy(false);
		}
	};

	// Rebuild a queued order in the cart. If the cart already has items they
	// take the recalled order's place in the queue, so nothing is lost.
	const handleRecallOrder = async (order) => {
		if (queueBusy) return;

		try {
			setQueueBusy(true);

			const parked = cart.length > 0 ? snapshotCart(cart) : null;
			if (parked) await clearServerCart(cart);

			const failed = [];
			for (const item of order.items) {
				try {
					await http.post(`/cart/${item.product_id}`, {});
				} catch (err) {
					console.error(`Error re-adding ${item.product_name}:`, err);
					failed.push(item.product_name);
				}
			}

			// Quantities are kept on the client, so put them back on the fresh rows
			const response = await http.get("/cart");
			const wanted = new Map(order.items.map((item) => [String(item.product_id), item.quantity]));
			setCart(
				(response.data.data || []).map((row) => {
					const qty = wanted.get(String(row.product_id));
					if (!qty) return row;
					const stock = availableStock(row);
					return {
						...row,
						default_quantity_added: stock > 0 ? Math.min(qty, stock) : qty,
					};
				})
			);

			setQueuedOrders((prev) => [
				...prev.filter((queued) => queued.id !== order.id),
				...(parked ? [parked] : []),
			]);
			setShowRecallModal(false);

			if (failed.length > 0) {
				notify(
					"error",
					`Recalled, but ${failed.join(", ")} could not be added back. ${
						failed.length === 1 ? "It may" : "They may"
					} be out of stock.`,
					"Order partly recalled"
				);
			} else {
				notify(
					"success",
					parked
						? "Your previous order was queued in its place."
						: `${queuedCount(order)} item${queuedCount(order) === 1 ? "" : "s"} back in the order.`,
					"Order recalled"
				);
			}
		} catch (err) {
			console.error("Error recalling order:", err);
			notify("error", "Could not recall the order. Please try again.", "Order not recalled");
			fetchCart();
		} finally {
			setQueueBusy(false);
		}
	};

	const handleDiscardQueued = (order) => {
		setQueuedOrders((prev) => prev.filter((queued) => queued.id !== order.id));
		notify("success", "The queued order was discarded.", "Order discarded");
	};

	// 💰 Calculate totals
	const subtotal = cart.reduce(
		(sum, item) =>
			sum + item.default_quantity_added * parseFloat(item.product_price),
		0
	);
	const discount = 0; // or calculate dynamically
	const total = subtotal - discount;
	const itemCount = cart.reduce((sum, item) => sum + Number(item.default_quantity_added), 0);

	const canConfirm =
		Boolean(paymentMethod) &&
		(!needsCustomer || selectedCustomer) &&
		!needsOrderStore &&
		!processing;

	useEffect(() => {
		fetchCart();
	}, []);

	// Escape closes whichever dialog is open
	useEffect(() => {
		if (!showOrderModal && !completedOrder && !showRecallModal) return;
		const onKey = (e) => {
			if (e.key !== "Escape") return;
			if (completedOrder) setCompletedOrder(null);
			else if (showRecallModal) {
				if (!queueBusy) setShowRecallModal(false);
			} else closeOrderModal();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	});

	const listMeta = [
		loading ? "Loading…" : `${filteredInventory.length} available`,
		selectedStore && storeName(selectedStore),
		searchTerm && `“${searchTerm}”`,
	]
		.filter(Boolean)
		.join(" · ");

	return (
		<div className="pt-0 mt-0 font-raleway">
			{toast && <Toast key={toast.id} toast={toast} onClose={closeToast} />}

			{/* Order Modal */}
			{showOrderModal && (
				<ModalShell
					title="Process Order"
					subtitle={`${itemCount} item${itemCount === 1 ? "" : "s"} · ${formatNaira(total)}`}
					icon={ShoppingCart}
					iconClass="bg-blue-600"
					onClose={closeOrderModal}
					busy={processing}
				>
					<div className="px-6 py-5 space-y-5">
						{orderError && (
							<div
								role="alert"
								className="flex items-start gap-3 px-4 py-3 text-sm text-red-800 border border-red-200 bg-red-50"
							>
								<AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" />
								<div>
									<p className="font-semibold">Order not processed</p>
									<p className="mt-0.5 text-red-700">{orderError}</p>
								</div>
							</div>
						)}

						<div>
							<label htmlFor="order-store" className={labelClass}>
								Sell From Store
							</label>
							<Select
								id="order-store"
								value={orderStore}
								onChange={(e) => {
									setOrderError("");
									setOrderStore(e.target.value);
								}}
								disabled={processing}
							>
								<option value="">Select store</option>
								{stores.map((store) => (
									<option key={store.id} value={store.id}>
										{storeNameOf(store)}
									</option>
								))}
							</Select>
							{needsOrderStore && (
								<p className="mt-1.5 text-xs text-red-600">
									Some items are stocked in more than one store. Choose the store you are
									selling from.
								</p>
							)}
						</div>

						<div>
							<label htmlFor="payment-method" className={labelClass}>
								Payment Method
							</label>
							<Select
								id="payment-method"
								value={paymentMethod}
								onChange={(e) => {
									setOrderError("");
									setPaymentMethod(e.target.value);
								}}
								disabled={processing}
							>
								<option value="">Select payment method</option>
								{PAYMENT_METHODS.map((method) => (
									<option key={method.value} value={method.value}>
										{method.label}
									</option>
								))}
							</Select>
						</div>

						{needsCustomer && (
							<div>
								<label htmlFor="customer" className={labelClass}>
									Customer
								</label>
								<Select
									id="customer"
									value={selectedCustomer}
									onChange={(e) => setSelectedCustomer(e.target.value)}
									disabled={processing}
								>
									<option value="">Select customer</option>
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
											{paymentMethod === "customer_balance"
												? `Balance ${formatNaira(cust.balance)}`
												: `Credit limit ${formatNaira(cust.credit_limit)}`}
										</option>
									))}
								</Select>
								{paymentMethod === "credit_limit" && (
									<p className="mt-1.5 text-xs text-gray-500">
										Customers without a credit limit can&apos;t be selected.
									</p>
								)}
							</div>
						)}

						<div className="grid gap-px bg-gray-200 border border-gray-200">
							<SummaryRow label="Subtotal" value={formatNaira(subtotal)} />
							<SummaryRow
								label="Discount"
								value={formatNaira(discount)}
								valueClass="text-green-700"
							/>
							<SummaryRow label="Total" value={formatNaira(total)} strong />
						</div>
					</div>

					<ModalFooter>
						<button
							type="button"
							onClick={closeOrderModal}
							disabled={processing}
							className={secondaryButtonClass}
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleProcessOrder}
							disabled={!canConfirm}
							className={primaryButtonClass}
						>
							{processing && <Loader2 size={16} className="animate-spin" />}
							{processing ? "Processing…" : "Confirm Order"}
						</button>
					</ModalFooter>
				</ModalShell>
			)}

			{/* Recall Order Modal */}
			{showRecallModal && (
				<ModalShell
					title="Recall Order"
					subtitle={`${queuedOrders.length} of ${MAX_QUEUED_ORDERS} queued`}
					icon={History}
					iconClass="bg-blue-600"
					onClose={() => setShowRecallModal(false)}
					busy={queueBusy}
				>
					<div className="px-6 py-5 space-y-4">
						{cart.length > 0 && queuedOrders.length > 0 && (
							<div className="flex items-start gap-3 px-4 py-3 text-sm text-blue-800 border border-blue-200 bg-blue-50">
								<Info size={18} className="mt-0.5 shrink-0 text-blue-600" />
								<p>
									Your current order ({itemCount} item{itemCount === 1 ? "" : "s"}) will be
									queued in place of the one you recall.
								</p>
							</div>
						)}

						{queuedOrders.length === 0 ? (
							<EmptyState icon={History} title="No queued orders" hint="Queue an order to see it here" />
						) : (
							<ul className="border border-gray-200 divide-y divide-gray-200">
								{queuedOrders.map((order, index) => (
									<li key={order.id} className="px-4 py-3.5">
										<div className="flex items-start justify-between gap-3">
											<div className="min-w-0">
												<p className="text-sm font-semibold text-gray-900">
													Order {index + 1}
													<span className="ml-2 text-xs font-normal text-gray-500">
														Queued {formatTime(order.createdAt)}
													</span>
												</p>
												<p className="mt-0.5 text-xs text-gray-500 truncate">
													{order.items
														.map((item) => `${item.quantity}× ${item.product_name}`)
														.join(", ")}
												</p>
											</div>
											<p className="text-sm font-semibold text-gray-900 shrink-0">
												{formatNaira(queuedTotal(order))}
											</p>
										</div>
										<div className="flex items-center justify-between mt-3">
											<span className="text-xs text-gray-500">
												{queuedCount(order)} item{queuedCount(order) === 1 ? "" : "s"}
											</span>
											<div className="flex gap-2">
												<button
													type="button"
													onClick={() => handleDiscardQueued(order)}
													disabled={queueBusy}
													className="flex items-center justify-center px-3 py-1.5 text-xs font-medium text-red-600 transition-colors border border-gray-300 hover:bg-red-50 hover:border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
												>
													Discard
												</button>
												<button
													type="button"
													onClick={() => handleRecallOrder(order)}
													disabled={queueBusy}
													className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white transition-colors bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
												>
													{queueBusy && <Loader2 size={12} className="animate-spin" />}
													Recall
												</button>
											</div>
										</div>
									</li>
								))}
							</ul>
						)}
					</div>
					<ModalFooter>
						<button
							type="button"
							onClick={() => setShowRecallModal(false)}
							disabled={queueBusy}
							className={secondaryButtonClass}
						>
							Close
						</button>
					</ModalFooter>
				</ModalShell>
			)}

			{/* Order Success Modal */}
			{completedOrder && (
				<ModalShell
					title="Order Processed"
					subtitle="The sale has been recorded"
					icon={CheckCircle2}
					iconClass="bg-green-600"
					onClose={() => setCompletedOrder(null)}
				>
					<div className="px-6 py-5">
						<div className="px-4 py-5 mb-4 text-center border border-green-200 bg-green-50">
							<p className="text-xs font-semibold tracking-wide text-green-700 uppercase">
								Amount
							</p>
							<p className="mt-1 text-3xl font-bold text-gray-900">
								{formatNaira(completedOrder.total)}
							</p>
						</div>
						<div className="grid gap-px bg-gray-200 border border-gray-200">
							<SummaryRow label="Items" value={completedOrder.itemCount} />
							<SummaryRow label="Payment" value={completedOrder.method} />
							{completedOrder.customer && (
								<SummaryRow label="Customer" value={completedOrder.customer} />
							)}
						</div>
					</div>
					<ModalFooter>
						<button
							type="button"
							autoFocus
							onClick={() => setCompletedOrder(null)}
							className={primaryButtonClass}
						>
							Start New Sale
						</button>
					</ModalFooter>
				</ModalShell>
			)}

			<h1 className="hidden mb-2 text-xl font-normal text-gray-800 md:block">
				Sales Point
			</h1>
			<TransactionNav
				onQueueOrder={handleQueueOrder}
				onRecallOrder={() => setShowRecallModal(true)}
				queuedOrdersCount={queuedOrders.length}
				queueDisabled={cart.length === 0 || queueBusy}
			/>

			<div className="flex flex-col gap-5 mt-5 lg:flex-row lg:items-start">
				{/* Products Section */}
				<section className="flex-1 min-w-0 bg-white border border-gray-200">
					<PanelHeader title="Products" meta={listMeta} />

					<div className="grid gap-3 px-5 py-4 border-b border-gray-200 sm:grid-cols-[minmax(0,14rem)_1fr]">
						<Select
							value={selectedStore}
							onChange={handleStoreChange}
							aria-label="Filter by store"
						>
							<option value="">All Stores</option>
							{stores.map((store) => (
								<option key={store.id} value={store.id}>
									{storeNameOf(store)}
								</option>
							))}
						</Select>

						<div className="relative">
							<Search
								size={16}
								className="absolute text-gray-400 -translate-y-1/2 pointer-events-none left-3 top-1/2"
							/>
							<input
								type="search"
								placeholder="Search by name, SKU, store or ID"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className={`${fieldClass} pl-9`}
							/>
						</div>
					</div>

					{loading ? (
						<div className="flex items-center justify-center gap-3 py-12 text-sm text-gray-500">
							<Loader2 size={20} className="text-blue-600 animate-spin" />
							Loading products…
						</div>
					) : error ? (
						<EmptyState
							icon={AlertTriangle}
							tone="red"
							title="Couldn't load products"
							hint={error}
						/>
					) : filteredInventory.length === 0 ? (
						<EmptyState
							icon={Package}
							title="No products found"
							hint={
								selectedStore || searchTerm
									? "Try a different store or search term"
									: "Add products to your inventory to see them here"
							}
						/>
					) : (
						<ul className="divide-y divide-gray-100">
							{filteredInventory.map((item) => {
								const stockStatus = getStockStatus(item.stock);
								const outOfStock = stockStatus === "out-of-stock";
								const isAdding = addingId === item.id;

								return (
									<li key={item.id}>
										<button
											type="button"
											onClick={() => handleItemClick(item)}
											disabled={outOfStock || Boolean(addingId)}
											className="flex items-center w-full gap-4 px-5 py-3.5 text-left transition-colors hover:bg-blue-50/60 focus:outline-none focus-visible:bg-blue-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
										>
											<div className={`flex-1 min-w-0 ${outOfStock ? "opacity-50" : ""}`}>
												<div className="flex items-center gap-2">
													<span className="text-sm font-medium text-gray-900 truncate">
														{item.name}
													</span>
													<span
														className={`shrink-0 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STOCK_BADGE[stockStatus]}`}
													>
														{stockLabel(stockStatus, item.stock)}
													</span>
												</div>
												<div className="flex flex-wrap mt-1 text-xs text-gray-500 gap-x-3 gap-y-0.5">
													<span>SKU {item.sku || "—"}</span>
													<span>{storeNameOf(item.store)}</span>
													<span>ID {item.id}</span>
													{item.description && (
														<span className="capitalize truncate">{item.description}</span>
													)}
												</div>
											</div>

											<div className={`text-right shrink-0 ${outOfStock ? "opacity-50" : ""}`}>
												<div className="text-sm font-semibold text-gray-900">
													{formatNaira(item.price)}
												</div>
												<div className="mt-0.5 text-xs text-gray-500">{item.stock} in stock</div>
											</div>

											<span
												className={`flex items-center justify-center w-8 h-8 shrink-0 ${
													outOfStock ? "bg-gray-100 text-gray-300" : "bg-blue-600 text-white"
												}`}
												aria-hidden="true"
											>
												{isAdding ? (
													<Loader2 size={16} className="animate-spin" />
												) : (
													<Plus size={16} />
												)}
											</span>
										</button>
									</li>
								);
							})}
						</ul>
					)}
				</section>

				{/* Order Preview Section */}
				<aside className="bg-white border border-gray-200 lg:w-96 lg:shrink-0 lg:sticky lg:top-4">
					<PanelHeader
						title="Order Preview"
						meta={cart.length > 0 ? `${itemCount} item${itemCount === 1 ? "" : "s"}` : null}
						action={
							cart.length > 0 && (
								<button
									type="button"
									onClick={handleClearOrder}
									className="text-xs font-medium text-red-600 transition-colors hover:text-red-700"
								>
									Clear all
								</button>
							)
						}
					/>

					{cart.length === 0 ? (
						<EmptyState
							icon={ShoppingCart}
							title="No items in order"
							hint="Select products on the left to add them"
						/>
					) : (
						<ul className="divide-y divide-gray-100">
							{cart.map((item) => {
								const qty = Number(item.default_quantity_added);
								const atMax = qty >= availableStock(item);

								return (
									<li key={item.id} className="px-5 py-3.5">
										<div className="flex items-start justify-between gap-3">
											<div className="min-w-0">
												<p className="text-sm font-medium text-gray-900 truncate">
													{item.product_name}
												</p>
												<p className="mt-0.5 text-xs text-gray-500">
													{formatNaira(item.product_price)} each
												</p>
											</div>
											<p className="text-sm font-semibold text-gray-900 shrink-0">
												{formatNaira(parseFloat(item.product_price) * qty)}
											</p>
										</div>

										<div className="flex items-center justify-between mt-2.5">
											<div className="flex items-stretch border border-gray-300">
												<button
													type="button"
													onClick={() => handleDecrease(item.id)}
													disabled={qty <= 1}
													aria-label={`Decrease quantity for ${item.product_name}`}
													className="flex items-center justify-center w-8 h-8 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
												>
													<Minus size={14} />
												</button>
												<span
													className="flex items-center justify-center w-10 h-8 text-sm font-semibold text-gray-900 border-gray-300 border-x"
													aria-live="polite"
												>
													{qty}
												</span>
												<button
													type="button"
													onClick={() => handleIncrease(item.id)}
													disabled={atMax}
													aria-label={`Increase quantity for ${item.product_name}`}
													title={atMax ? "No more stock available" : undefined}
													className="flex items-center justify-center w-8 h-8 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
												>
													<Plus size={14} />
												</button>
											</div>

											<button
												type="button"
												onClick={() => handleDelete(item)}
												title="Remove item"
												aria-label={`Remove ${item.product_name}`}
												className="flex items-center justify-center w-8 h-8 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
											>
												<Trash2 size={16} />
											</button>
										</div>
									</li>
								);
							})}
						</ul>
					)}

					{/* Totals */}
					<div className="grid gap-px bg-gray-200 border-t border-gray-200">
						<SummaryRow label="Subtotal" value={formatNaira(subtotal)} />
						<SummaryRow
							label="Discount"
							value={formatNaira(discount)}
							valueClass="text-green-700"
						/>
						<SummaryRow label="Total" value={formatNaira(total)} strong />
					</div>

					<div className="px-5 py-4 border-t border-gray-200 bg-gray-50">
						<button
							type="button"
							disabled={cart.length === 0}
							onClick={openOrderModal}
							className={`${primaryButtonClass} w-full py-3`}
						>
							<ShoppingCart size={16} />
							Process Order
						</button>
					</div>
				</aside>
			</div>

			<style jsx global>{`
				@keyframes toast-in {
					from {
						opacity: 0;
						transform: translateY(-8px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}
				@keyframes toast-progress {
					from {
						width: 100%;
					}
					to {
						width: 0%;
					}
				}
				@keyframes modal-in {
					from {
						opacity: 0;
						transform: translateY(8px) scale(0.98);
					}
					to {
						opacity: 1;
						transform: translateY(0) scale(1);
					}
				}
				.toast-in {
					animation: toast-in 0.2s ease-out;
				}
				.toast-progress {
					animation-name: toast-progress;
					animation-timing-function: linear;
					animation-fill-mode: forwards;
				}
				.modal-in {
					animation: modal-in 0.18s ease-out;
				}
			`}</style>
		</div>
	);
}
