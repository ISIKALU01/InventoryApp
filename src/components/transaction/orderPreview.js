// components/OrderPreview.js
import { useState } from "react";
import { orderItemAPI } from "../../pages/transaction/salesApi";

export default function OrderPreview({
  cart,
  onUpdateCart,
  onClearCart,
  onProcessOrder,
  currentOrderId,
}) {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [amountTendered, setAmountTendered] = useState("");
  const [saveToPrint, setSaveToPrint] = useState(false);
  const [updatingItem, setUpdatingItem] = useState(null);
  const [removingItem, setRemovingItem] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');


  // Calculate cart total
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  // Calculate change
  const calculateChange = () => {
    const total = calculateTotal();
    const tendered = parseFloat(amountTendered) || 0;
    return tendered - total;
  };

  // Update item quantity in cart via API
  const updateCartQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }

    const cartItem = cart.find((item) => item.id === itemId);
    if (!cartItem || !cartItem.orderItemId) return;

    if (cartItem && newQuantity > cartItem.maxQuantity) {
      alert("Cannot exceed available stock");
      return;
    }

    setUpdatingItem(itemId);

    try {
      const unitPrice = cartItem.price;
      const lineTotal = unitPrice * newQuantity;

      const orderItemData = {
        quantity: newQuantity,
        unit_price: unitPrice.toFixed(2),
        line_total: lineTotal.toFixed(2),
      };

      await orderItemAPI.updateOrderItem(cartItem.orderItemId, orderItemData);

      // Update local cart state
      onUpdateCart(
        cart.map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantity: newQuantity,
                lineTotal: lineTotal,
              }
            : item
        )
      );
    } catch (error) {
      console.error("Failed to update item quantity:", error);
      alert(`Failed to update quantity: ${error.message}`);
    } finally {
      setUpdatingItem(null);
    }
  };

  // Remove item from cart via API
  const removeFromCart = async (itemId) => {
    const cartItem = cart.find((item) => item.id === itemId);
    if (!cartItem || !cartItem.orderItemId) return;

    setRemovingItem(itemId);

    try {
      await orderItemAPI.deleteOrderItem(cartItem.orderItemId);

      // Update local cart state
      onUpdateCart(cart.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error("Failed to remove item from cart:", error);
      alert(`Failed to remove item: ${error.message}`);
    } finally {
      setRemovingItem(null);
    }
  };

  // Update the process order call:
  const handleProcessOrder = () => {
    if (cart.length === 0) return;

    const orderData = {
      cart,
      invoiceNumber,
      invoiceDate,
      amountTendered: parseFloat(amountTendered) || 0,
      total: calculateTotal(),
      change: calculateChange(),
      saveToPrint,
      orderId: currentOrderId,
      paymentMethod: paymentMethod, // Include selected payment method
    };

    onProcessOrder(orderData);
  };

  return (
    <div className="w-full lg:w-96 bg-white rounded-lg text-black shadow-md p-4">
      <div className="flex items-center mb-4">
        <svg
          className="w-4 h-4 text-indigo-600 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h2 className="text-base font-semibold text-gray-800">Order Preview</h2>
        <span className="ml-auto bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs">
          {cart.reduce((total, item) => total + item.quantity, 0)} items
        </span>
      </div>

      {/* Cart Items */}
      <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
        {cart.length === 0 ? (
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
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="text-sm">Your cart is empty</p>
            <p className="text-xs mt-1">
              Click on products to add them to cart
            </p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-800 truncate">
                  {item.name}
                  {updatingItem === item.id && (
                    <span className="ml-2 text-xs text-indigo-600">
                      Updating...
                    </span>
                  )}
                  {removingItem === item.id && (
                    <span className="ml-2 text-xs text-red-600">
                      Removing...
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  ₦{item.price.toFixed(2)} × {item.quantity}
                </div>
                <div className="text-xs text-gray-400">{item.store}</div>
                {item.lineTotal && (
                  <div className="text-xs text-green-600 font-medium">
                    Line Total: ₦{item.lineTotal.toFixed(2)}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 ml-2">
                <button
                  onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                  disabled={
                    updatingItem === item.id || removingItem === item.id
                  }
                  className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  <span className="text-xs">-</span>
                </button>
                <span className="text-sm w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                  disabled={
                    item.quantity >= item.maxQuantity ||
                    updatingItem === item.id ||
                    removingItem === item.id
                  }
                  className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
                    item.quantity >= item.maxQuantity
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 hover:bg-gray-300"
                  } disabled:opacity-50`}
                >
                  <span className="text-xs">+</span>
                </button>
                <button
                  onClick={() => removeFromCart(item.id)}
                  disabled={removingItem === item.id}
                  className="w-6 h-6 flex items-center justify-center bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors ml-1 disabled:opacity-50"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Rest of the OrderPreview component remains the same */}
      {/* ... (cart summary, payment fields, etc.) ... */}

      {/* Cart Summary */}
      <div className="border-t pt-3">
        <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg">
          <span className="font-semibold text-gray-700">Total:</span>
          <span className="text-lg font-bold text-indigo-600">
            ₦{calculateTotal().toFixed(2)}
          </span>
        </div>

        {/* Change Calculation */}
        {amountTendered && calculateChange() >= 0 && (
          <div className="flex justify-between items-center mb-3 p-2 bg-green-50 rounded-lg">
            <span className="font-medium text-green-700">Change:</span>
            <span className="text-md font-bold text-green-600">
              ₦{calculateChange().toFixed(2)}
            </span>
          </div>
        )}

        {amountTendered && calculateChange() < 0 && (
          <div className="flex justify-between items-center mb-3 p-2 bg-red-50 rounded-lg">
            <span className="font-medium text-red-700">Insufficient:</span>
            <span className="text-md font-bold text-red-600">
              ₦{Math.abs(calculateChange()).toFixed(2)}
            </span>
          </div>
        )}

        {/* Payment Fields */}
        <div className="space-y-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <input
                type="text"
                placeholder="Invoice #"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <select className="w-full px-4 py-3 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
              <option value="NGN">NGN (₦)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <select className="w-full px-4 py-3 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
                <option value="walk-in">Walk-in Customer</option>
              </select>
            </div>
            <div>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="cash">Cash</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="transfer">Transfer</option>
                <option value="pos">POS</option>
              </select>
            </div>
          </div>

          <div>
            <input
              type="number"
              placeholder="Amount Tendered"
              value={amountTendered}
              onChange={(e) => setAmountTendered(e.target.value)}
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="flex items-center p-2">
            <input
              type="checkbox"
              checked={saveToPrint}
              onChange={(e) => setSaveToPrint(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Save to print later
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleProcessOrder}
            disabled={
              cart.length === 0 || (amountTendered && calculateChange() < 0)
            }
            className={`w-full py-3 rounded font-medium text-sm transition-colors ${
              cart.length === 0 || (amountTendered && calculateChange() < 0)
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            Process Order
          </button>
          <button
            onClick={onClearCart}
            disabled={cart.length === 0}
            className={`w-full py-2.5 rounded text-sm transition-colors ${
              cart.length === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  );
}
