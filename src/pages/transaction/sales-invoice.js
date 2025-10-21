// pages/transaction/sales-invoice.js
import TransactionNav from "../../components/TransactionNav";
import ProductList from "../../components/transaction/productList";
import OrderPreview from "../../components/transaction/orderPreview";
import { useState, useEffect } from "react";
import { inventoryAPI, orderItemAPI, orderAPI } from "../../../utils/salesApi";

export default function SalesInvoice() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stores, setStores] = useState([]);
  const [cart, setCart] = useState([]);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [creatingOrder, setCreatingOrder] = useState(false);


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

  // Create a new order when component mounts
  useEffect(() => {
    createNewOrder();
  }, []);

  // Create new order function
  const createNewOrder = async () => {
    try {
      setCreatingOrder(true);
      const response = await orderAPI.createOrder();

      if (response && response.data) {
        const orderId = response.data.id || response.data._id;
        setCurrentOrderId(orderId);
        console.log("New order created with ID:", orderId);
      } else {
        throw new Error("Invalid response from order creation");
      }
    } catch (error) {
      console.error("Failed to create order:", error);
      alert("Failed to create new order. Please refresh the page.");
    } finally {
      setCreatingOrder(false);
    }
  };

  // Add item to cart
  const addToCart = (cartItem) => {
    const existingItem = cart.find(
      (item) => item.productId === cartItem.productId
    );

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.productId === cartItem.productId
            ? { ...cartItem, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, cartItem]);
    }
  };

  // Update cart
  const updateCart = (updatedCart) => {
    setCart(updatedCart);
  };

  // Clear cart and create new order
  const clearCart = async () => {
    if (cart.length === 0) {
      await createNewOrder();
      return;
    }

    try {
      const deletePromises = cart.map((item) =>
        item.orderItemId
          ? orderItemAPI.deleteOrderItem(item.orderItemId)
          : Promise.resolve()
      );

      await Promise.all(deletePromises);
      setCart([]);
      await createNewOrder();
      console.log("Cart cleared and new order created");
    } catch (error) {
      console.error("Failed to clear cart:", error);
      alert("Failed to clear cart");
    }
  };

  // In SalesInvoice component - update the processOrder function
  const processOrder = async (orderData) => {
    console.log("Processing order:", orderData);

    try {
      // Update order with final details
      await orderAPI.updateOrder(currentOrderId, {
        status: "completed",
        total_amount: orderData.total.toFixed(2),
        payment_method: orderData.paymentMethod || "cash",
        payment_status: "paid",
      });

      alert(
        `Order #${currentOrderId} processed successfully! Total: ₦${orderData.total.toFixed(
          2
        )}`
      );

      // Clear cart and create new order
      setCart([]);
      await createNewOrder();
    } catch (error) {
      console.error("Failed to process order:", error);
      alert(`Failed to process order: ${error.message}`);
    }
  };
  return (
    <div className="pt-0 mt-0 font-raleway">
      <h1 className="text-xl font-normal text-gray-800 mb-2 hidden md:block">
        Sales Point
      </h1>
      <TransactionNav />

      {/* Order Info Banner */}
      <div
        className={`rounded-md p-3 mb-4 ${
          currentOrderId
            ? "bg-blue-50 border border-blue-200"
            : "bg-yellow-50 border border-yellow-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {creatingOrder ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-blue-700 text-sm">
                  Creating new order...
                </span>
              </>
            ) : currentOrderId ? (
              <>
                <svg
                  className="w-5 h-5 text-blue-400 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-blue-700 text-sm">
                  Current Order: <strong>#{currentOrderId}</strong>
                </span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 text-yellow-400 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <span className="text-yellow-700 text-sm">No active order</span>
              </>
            )}
          </div>
          <button
            onClick={clearCart}
            disabled={creatingOrder}
            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            {cart.length > 0 ? "New Order" : "Refresh Order"}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mt-6">
        <ProductList
          inventory={inventory}
          loading={loading}
          error={error}
          onAddToCart={addToCart}
          stores={stores}
          currentOrderId={currentOrderId}
        />

        <OrderPreview
          cart={cart}
          onUpdateCart={updateCart}
          onClearCart={clearCart}
          onProcessOrder={processOrder}
          currentOrderId={currentOrderId}
        />
      </div>
    </div>
  );
}
