// pages/transaction/sales-invoice.js
import TransactionNav from "../../components/TransactionNav";
import { useState, useEffect } from "react";
import { inventoryAPI } from "../../../utils/salesApi";
import { orderItemAPI, orderAPI, customerAPI } from "../../../utils/salesApi";

export default function SalesInvoice() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [currentOrderId, setCurrentOrderId] = useState(null);

  // Cart and Order State
  const [cart, setCart] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orderForm, setOrderForm] = useState({
    customer_id: "",
    payment_method: "cash",
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch inventory data
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const inventoryData = await inventoryAPI.getAllInventory();

        const transformedInventory = Array.isArray(inventoryData)
          ? inventoryData
          : inventoryData.data || inventoryData.inventory || [];

        setInventory(transformedInventory);

        const uniqueStores = [
          ...new Set(
            transformedInventory
              .filter((item) => item.store && item.store.name)
              .map((item) => item.store.name)
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
  }, []);

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const customersData = await customerAPI.getAllCustomers();
        setCustomers(
          Array.isArray(customersData)
            ? customersData
            : customersData.data || []
        );
      } catch (err) {
        console.error("Failed to fetch customers:", err);
      }
    };

    fetchCustomers();
  }, []);

  // Add this useEffect to auto-select first customer
  useEffect(() => {
    if (customers.length > 0 && !orderForm.customer_id) {
      setOrderForm((prev) => ({
        ...prev,
        customer_id: customers[0].id || customers[0]._id,
      }));
    }
  }, [customers]);

  // Filter inventory based on store and search term
  useEffect(() => {
    let filtered = inventory;

    // Filter by store
    if (selectedStore) {
      filtered = filtered.filter(
        (item) => item.store && item.store.name === selectedStore
      );
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) => {
        const productName =
          item.name || (item.product && item.product.name) || "";
        const productSku = (item.product && item.product.sku) || "";
        const storeName = (item.store && item.store.name) || "";

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

  // Handle Order Form Changes
  const handleOrderFormChange = (e) => {
    setOrderForm({
      ...orderForm,
      [e.target.name]: e.target.value,
    });
  };

  // Fixed addToCart function - Always provide customer_id
  const addToCart = async (item) => {
    try {
      const stockQuantity = item.quantity || item.stockQuantity || 0;
      console.log("Adding to cart:", stockQuantity);

      if (stockQuantity <= 0) {
        alert("This product is out of stock");
        return;
      }

      // Check if customer is selected
      if (!orderForm.customer_id) {
        alert("Please select a customer first before adding items to cart");
        return;
      }

      const unitPrice = parseFloat(item.product?.price) || 0;
      const productId = parseInt(item.id || item._id);

      // If no order exists, create one with the first item
      if (cart.length === 0) {
        const newOrder = await orderAPI.create({
          customer_id: parseInt(orderForm.customer_id), // REQUIRED - cannot be null
          payment_method: orderForm.payment_method || "cash",
          items: [
            {
              product_id: productId,
              quantity: 1,
            },
          ],
        });

        // Store the order ID for future updates
        setCurrentOrderId(newOrder.id);

        // Add the item to cart
        const newCartItem = {
          product_id: productId,
          product_name:
            item.name ||
            (item.product && item.product.name) ||
            "Unknown Product",
          quantity: 1,
          unit_price: unitPrice,
          line_total: unitPrice.toFixed(2),
          inventory_item: item,
        };

        setCart([newCartItem]);
        return;
      }

      // If order already exists, check if item exists in cart
      const existingItemIndex = cart.findIndex(
        (cartItem) => cartItem.product_id === productId
      );

      if (existingItemIndex > -1) {
        // Update quantity if item exists
        const updatedCart = [...cart];
        const currentQuantity = updatedCart[existingItemIndex].quantity;

        if (currentQuantity + 1 > stockQuantity) {
          alert(`Only ${stockQuantity} items available in stock`);
          return;
        }

        updatedCart[existingItemIndex].quantity += 1;
        updatedCart[existingItemIndex].line_total = (
          updatedCart[existingItemIndex].quantity *
          updatedCart[existingItemIndex].unit_price
        ).toFixed(2);

        setCart(updatedCart);

        // Update the order with new items array
        await updateOrderItems();
      } else {
        // Add new item to cart
        const newItem = {
          product_id: productId,
          product_name:
            item.name ||
            (item.product && item.product.name) ||
            "Unknown Product",
          quantity: 1,
          unit_price: unitPrice,
          line_total: unitPrice.toFixed(2),
          inventory_item: item,
        };

        setCart([...cart, newItem]);

        // Update the order with new items array
        await updateOrderItems();
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add item to cart");
    }
  };

  // Update order items in the main order
  const updateOrderItems = async () => {
    if (!currentOrderId) return;

    try {
      const items = cart.map((item) => ({
        product_id: parseInt(item.product_id),
        quantity: parseInt(item.quantity),
      }));

      await orderAPI.update(currentOrderId, {
        items: items,
        total_amount: parseFloat(calculateTotals().total),
      });
    } catch (error) {
      console.error("Error updating order items:", error);
    }
  };

  // Process Order - Create order items with full details
  const processOrder = async () => {
    if (cart.length === 0) {
      alert("Please add items to cart before processing order");
      return;
    }

    if (!orderForm.customer_id) {
      alert("Please select a customer");
      return;
    }

    if (!currentOrderId) {
      alert("No order found. Please add items to cart first.");
      return;
    }

    try {
      setIsProcessing(true);

      // Create order items with full details for each cart item
      for (const cartItem of cart) {
        const orderItemData = {
          order_id: parseInt(currentOrderId),
          product_id: parseInt(cartItem.product_id),
          quantity: parseInt(cartItem.quantity),
          unit_price: parseFloat(cartItem.unit_price).toFixed(2),
          line_total: parseFloat(cartItem.line_total).toFixed(2),
        };

        await orderItemAPI.create(orderItemData);
      }

      // Update order with final details
      await orderAPI.update(currentOrderId, {
        customer_id: parseInt(orderForm.customer_id),
        payment_method: orderForm.payment_method,
        total_amount: parseFloat(calculateTotals().total),
        status: "completed",
      });

      alert(`Order #${currentOrderId} processed successfully!`);
      clearCart();
    } catch (error) {
      console.error("Error processing order:", error);
      alert(`Failed to process order: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Update Cart Item Quantity
  const updateCartItemQuantity = async (index, newQuantity) => {
    if (newQuantity < 1) return;

    const updatedCart = [...cart];
    const stockQuantity =
      updatedCart[index].inventory_item.quantity ||
      updatedCart[index].inventory_item.stockQuantity ||
      0;

    if (newQuantity > stockQuantity) {
      alert(`Only ${stockQuantity} items available in stock`);
      return;
    }

    updatedCart[index].quantity = newQuantity;
    updatedCart[index].line_total = (
      newQuantity * updatedCart[index].unit_price
    ).toFixed(2);
    setCart(updatedCart);

    // Update order items
    await updateOrderItems();
  };

  // Remove from Cart
  const removeFromCart = async (index) => {
    const updatedCart = cart.filter((_, i) => i !== index);
    setCart(updatedCart);

    if (updatedCart.length > 0) {
      // Update order items
      await updateOrderItems();
    } else {
      // If cart is empty, delete the order
      if (currentOrderId) {
        try {
          await orderAPI.delete(currentOrderId);
          setCurrentOrderId(null);
        } catch (error) {
          console.error("Error deleting empty order:", error);
        }
      }
    }
  };

  // Clear Cart
  const clearCart = async () => {
    if (currentOrderId) {
      try {
        await orderAPI.delete(currentOrderId);
      } catch (error) {
        console.error("Error deleting order:", error);
      }
    }

    setCart([]);
    setCurrentOrderId(null);
    setOrderForm({
      customer_id: "",
      payment_method: "cash",
    });
  };

  // Calculate Totals
  const calculateTotals = () => {
    const subtotal = cart.reduce(
      (sum, item) => sum + parseFloat(item.line_total),
      0
    );
    const tax = subtotal * 0.1;
    const discount = 0;
    const total = subtotal + tax - discount;

    return {
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      discount: discount.toFixed(2),
      total: total.toFixed(2),
    };
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

  const totals = calculateTotals();

  return (
    <div className="pt-0 mt-0 font-raleway">
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
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-col sm:flex-row gap-3 mb-4 w-full"
            >
              <div className="flex-1 min-w-0">
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 min-w-0 px-4 py-3 border border-gray-300 rounded-l-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                <button
                  type="button"
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
                  const stockStatus = getStockStatus(
                    item.quantity || item.stockQuantity
                  );

                  return (
                    <div
                      key={item.id || item._id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => addToCart(item)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 truncate">
                          {item.name ||
                            (item.product && item.product.name) ||
                            "Unknown Product"}
                        </div>
                        <div className="text-xs text-gray-500 flex flex-wrap gap-2 mt-1">
                          <span>ID: {item.id || item._id}</span>
                          {item.product?.sku && (
                            <span>SKU: {item.product.sku}</span>
                          )}
                          {item.store?.name && (
                            <span>Store: {item.store.name}</span>
                          )}
                        </div>
                        <div className="flex items-center mt-1 space-x-2">
                          {getStockBadge(
                            stockStatus,
                            item.quantity || item.stockQuantity
                          )}
                          {item.category && (
                            <span className="text-xs text-gray-500 capitalize">
                              {item.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="font-semibold text-gray-800">
                          ₦{(parseFloat(item.product?.price) || 0).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Stock: {item.quantity || item.stockQuantity || 0}
                        </div>
                        <button
                          type="button"
                          className="mt-1 px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(item);
                          }}
                        >
                          Add to Cart
                        </button>
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

          {/* Cart Items */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
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
              <div className="space-y-3">
                {cart.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white rounded border"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-800">
                        {item.product_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        ₦{item.unit_price.toFixed(2)} × {item.quantity}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="font-semibold text-gray-800">
                        ₦{item.line_total}
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() =>
                            updateCartItemQuantity(index, item.quantity - 1)
                          }
                          className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded text-gray-600 hover:bg-gray-300"
                        >
                          -
                        </button>
                        <span className="text-sm w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateCartItemQuantity(index, item.quantity + 1)
                          }
                          className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded text-gray-600 hover:bg-gray-300"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(index)}
                          className="w-6 h-6 flex items-center justify-center bg-red-100 text-red-600 rounded hover:bg-red-200 ml-2"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Form */}
          {cart.length > 0 && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-md font-semibold text-gray-800 mb-3">
                Order Details
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer
                  </label>
                  <select
                    name="customer_id"
                    value={orderForm.customer_id}
                    onChange={handleOrderFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    required
                  >
                    <option value="">Select a customer</option>
                    {customers.map((customer) => (
                      <option
                        key={customer.id || customer._id}
                        value={customer.id || customer._id}
                      >
                        {customer.name ||
                          customer.email ||
                          `Customer ${customer.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    name="payment_method"
                    value={orderForm.payment_method}
                    onChange={handleOrderFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="transfer">Transfer</option>
                    <option value="digital_wallet">Digital Wallet</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">₦{totals.subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax:</span>
              <span className="font-medium">₦{totals.tax}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Discount:</span>
              <span className="font-medium">₦{totals.discount}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t pt-2">
              <span>Total:</span>
              <span>₦{totals.total}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            <button
              onClick={processOrder}
              disabled={
                cart.length === 0 || isProcessing || !orderForm.customer_id
              }
              className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                cart.length === 0 || isProcessing || !orderForm.customer_id
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {isProcessing ? "Processing..." : "Process Order"}
            </button>
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                cart.length === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
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
