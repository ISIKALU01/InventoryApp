// pages/transaction/sales-invoice.js
import { useRouter } from 'next/router';
import TransactionNav from '../../components/TransactionNav';
import { useState, useEffect } from 'react';
import { FaSearch, FaShoppingCart, FaPlus, FaMinus, FaTrash, FaCheck, FaCheckCircle, FaPrint, FaExclamationTriangle } from 'react-icons/fa';
import { useSession } from 'next-auth/react';

export default function SalesInvoice() {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [customerType, setCustomerType] = useState('walk-in');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [saveForLater, setSaveForLater] = useState(false);
  
  // Queue state management
  const [queuedOrders, setQueuedOrders] = useState([]);
  const [currentOrderId, setCurrentOrderId] = useState(1);

  // Success popup state
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedOrder, setProcessedOrder] = useState(null);

  // Error message state
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);

  // Sample categories
  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'electronics', name: 'Electronics' },
    { id: 'clothing', name: 'Clothing' },
    { id: 'books', name: 'Books' },
    { id: 'food', name: 'Food & Beverages' },
    { id: 'sports', name: 'Sports Equipment' }
  ];

  // Currencies
  const currencies = [
    { id: 'USD', name: 'USD ($)' },
    { id: 'EUR', name: 'EUR (€)' },
    { id: 'GBP', name: 'GBP (£)' },
    { id: 'NGN', name: 'NGN (₦)' },
    { id: 'GHS', name: 'GHS (₵)' },
    { id: 'KES', name: 'KES (KSh)' }
  ];

  // Customer types
  const customerTypes = [
    { id: 'walk-in', name: 'Walk-in Customer' },
    { id: 'regular', name: 'Regular Customer' },
    { id: 'wholesale', name: 'Wholesale Customer' },
    { id: 'VIP', name: 'VIP Customer' }
  ];

  // Payment methods
  const paymentMethods = [
    { id: 'cash', name: 'Cash' },
    { id: 'card', name: 'Credit/Debit Card' },
    { id: 'transfer', name: 'Bank Transfer' },
    { id: 'balance', name: 'Customer Balance' },
    { id: 'complimentary', name: 'Complimentary' }
  ];

  // Bank accounts
  const bankAccounts = [
    { id: 'account-1', name: 'Main Account (***4567)' },
    { id: 'account-2', name: 'Savings Account (***8910)' },
    { id: 'account-3', name: 'Business Account (***1234)' }
  ];

  // Sample products with stock status and proper IDs
  const products = [
    { 
      id: 'WH001', 
      name: 'Wireless Headphones', 
      price: 79.99, 
      category: 'electronics', 
      sold: 142,
      stock: 25,
      stockStatus: 'in-stock'
    },
    { 
      id: 'CT002', 
      name: 'Cotton T-Shirt', 
      price: 19.99, 
      category: 'clothing', 
      sold: 89,
      stock: 5,
      stockStatus: 'low-stock'
    },
    { 
      id: 'PB003', 
      name: 'Programming Book', 
      price: 34.99, 
      category: 'books', 
      sold: 56,
      stock: 0,
      stockStatus: 'out-of-stock'
    },
    { 
      id: 'ED004', 
      name: 'Energy Drink', 
      price: 2.99, 
      category: 'food', 
      sold: 231,
      stock: 45,
      stockStatus: 'in-stock'
    },
    { 
      id: 'BB005', 
      name: 'Basketball', 
      price: 24.99, 
      category: 'sports', 
      sold: 34,
      stock: 12,
      stockStatus: 'in-stock'
    }
  ];

  // Show error message for 3 seconds
  const showErrorMsg = (message) => {
    setErrorMessage(message);
    setShowError(true);
    setTimeout(() => {
      setShowError(false);
      setErrorMessage('');
    }, 3000);
  };

  // Get stock status badge
  const getStockBadge = (stockStatus, stock) => {
    const styles = {
      'in-stock': 'bg-green-100 text-green-800',
      'low-stock': 'bg-yellow-100 text-yellow-800',
      'out-of-stock': 'bg-red-100 text-red-800'
    };
    
    const labels = {
      'in-stock': 'In Stock',
      'low-stock': `Low Stock (${stock})`,
      'out-of-stock': 'Out of Stock'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[stockStatus]}`}>
        {labels[stockStatus]}
      </span>
    );
  };

  // Queue Order Function
  const handleQueueOrder = () => {
    if (queuedOrders.length >= 3) return;
    
    const newOrder = {
      id: currentOrderId,
      cartItems: [...cartItems],
      invoiceNumber,
      selectedDate,
      selectedCurrency,
      customerType,
      paymentMethod,
      amountTendered,
      bankAccount,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setQueuedOrders([...queuedOrders, newOrder]);
    setCurrentOrderId(currentOrderId + 1);
    
    // Clear current cart for new order
    setCartItems([]);
    setInvoiceNumber('');
    setAmountTendered('');
    setBankAccount('');
  };

  // Recall Order Function
  const handleRecallOrder = () => {
    if (queuedOrders.length === 0) return;
    
    // Get the most recent order
    const orderToRecall = queuedOrders[queuedOrders.length - 1];
    
    // Restore order data
    setCartItems(orderToRecall.cartItems);
    setInvoiceNumber(orderToRecall.invoiceNumber);
    setSelectedDate(orderToRecall.selectedDate);
    setSelectedCurrency(orderToRecall.selectedCurrency);
    setCustomerType(orderToRecall.customerType);
    setPaymentMethod(orderToRecall.paymentMethod);
    setAmountTendered(orderToRecall.amountTendered);
    setBankAccount(orderToRecall.bankAccount);
    
    // Remove from queue
    setQueuedOrders(queuedOrders.slice(0, -1));
  };

  // Process Payment Function with loading effect
  const handleProcessPayment = async () => {
    // Validate amount tendered for cash payments
    if (paymentMethod === 'cash') {
      const tendered = parseFloat(amountTendered) || 0;
      const total = getCartTotal();
      
      if (tendered < total) {
        showErrorMsg(`Insufficient amount. Total is $${total.toFixed(2)}`);
        return;
      }
    }
    
    // Validate amount for other payment methods that require amount
    if (requiresAmountTendered() && paymentMethod !== 'cash') {
      const tendered = parseFloat(amountTendered) || 0;
      const total = getCartTotal();
      
      if (tendered !== total) {
        showErrorMsg(`Amount must equal total of $${total.toFixed(2)}`);
        return;
      }
    }
    
    // Validate bank account for methods that require it
    if (requiresBankAccount() && !bankAccount) {
      showErrorMsg('Please select a bank account');
      return;
    }
    
    // Show loading state
    setIsProcessing(true);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Process the current order
    const orderData = {
      cartItems: [...cartItems],
      invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
      selectedDate: selectedDate || new Date().toISOString().split('T')[0],
      selectedCurrency,
      customerType,
      paymentMethod,
      amountTendered,
      bankAccount,
      total: getCartTotal(),
      timestamp: new Date().toISOString(),
      transactionId: `TXN-${Date.now()}`,
      // Add user information to the order
      processedBy: session?.user?.name || 'Unknown User',
      userId: session?.user?.id || 'unknown'
    };
    
    // Save to localStorage for the sales list page
    const existingTransactions = JSON.parse(localStorage.getItem('salesTransactions') || '[]');
    localStorage.setItem('salesTransactions', JSON.stringify([...existingTransactions, orderData]));
    
    // Set the processed order for receipt
    setProcessedOrder(orderData);
    
    // Hide loading and show success popup
    setIsProcessing(false);
    setShowSuccessPopup(true);
    
    // Clear the current order
    setCartItems([]);
    setInvoiceNumber('');
    setAmountTendered('');
    setBankAccount('');
  };

  // Print receipt function
  const printReceipt = () => {
    const receiptElement = document.getElementById('receipt');
    if (receiptElement) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Receipt</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 0;
                padding: 10px;
                color: #000;
                font-size: 12px;
              }
              .receipt-container {
                width: 100%;
                max-width: 280px;
                margin: 0 auto;
              }
              .receipt-header {
                text-align: center;
                margin-bottom: 10px;
                border-bottom: 1px dashed #ddd;
                padding-bottom: 8px;
              }
              .receipt-header h2 {
                margin: 0;
                font-size: 14px;
                font-weight: bold;
              }
              .receipt-header p {
                margin: 3px 0;
                font-size: 10px;
              }
              .receipt-info {
                display: flex;
                justify-between;
                margin-bottom: 8px;
                font-size: 10px;
              }
              .receipt-items {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 10px;
                font-size: 10px;
              }
              .receipt-items th {
                text-align: left;
                border-bottom: 1px solid #ddd;
                padding: 3px 0;
                font-weight: bold;
              }
              .receipt-items td {
                padding: 2px 0;
              }
              .receipt-totals {
                border-top: 1px dashed #ddd;
                padding-top: 8px;
                margin-top: 8px;
                font-size: 11px;
              }
              .receipt-totals .total-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 3px;
              }
              .receipt-totals .grand-total {
                font-weight: bold;
                border-top: 1px solid #ddd;
                padding-top: 5px;
                margin-top: 5px;
              }
              .receipt-footer {
                text-align: center;
                margin-top: 10px;
                border-top: 1px dashed #ddd;
                padding-top: 8px;
                font-size: 9px;
              }
              @media print {
                body { 
                  margin: 0; 
                  padding: 10px;
                }
              }
              @media (max-width: 480px) {
                body {
                  font-size: 11px;
                }
              }
            </style>
          </head>
          <body>
            <div class="receipt-container">
              ${receiptElement.innerHTML}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      
      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  // Filter products based on category and search
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         product.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort by most sold
  const mostSoldProducts = [...filteredProducts].sort((a, b) => b.sold - a.sold).slice(0, 5);

  // Check if product is in cart
  const isInCart = (productId) => {
    return cartItems.some(item => item.id === productId);
  };

  // Toggle product in cart
  const toggleProductInCart = (product) => {
    if (product.stockStatus === 'out-of-stock') return;
    
    if (isInCart(product.id)) {
      // Remove from cart if already added
      setCartItems(cartItems.filter(item => item.id !== product.id));
    } else {
      // Add to cart with quantity 1
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, change) => {
    setCartItems(cartItems.map(item =>
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + change) } : item
    ));
  };

  const removeFromCart = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Calculate change
  const getChangeAmount = () => {
    const tendered = parseFloat(amountTendered) || 0;
    const total = getCartTotal();
    return tendered - total;
  };

  // Check if payment method requires bank account
  const requiresBankAccount = () => {
    return ['card', 'transfer', 'balance', 'complimentary'].includes(paymentMethod);
  };

  // Check if payment method requires amount tendered
  const requiresAmountTendered = () => {
    return ['cash', 'card', 'transfer', 'balance', 'complimentary'].includes(paymentMethod);
  };

  return (
    <div className="pt-0 mt-0 font-raleway">
      <h1 className="text-xl font-normal text-gray-800 mb-2 hidden md:block">Sales Point</h1>        
      <TransactionNav 
        onQueueOrder={handleQueueOrder}
        onRecallOrder={handleRecallOrder}
        queuedOrdersCount={queuedOrders.length}
      />
      
      {/* Queue Status Indicator */}
      {queuedOrders.length > 0 && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">
              Queued Orders: {queuedOrders.length}/3
            </span>
            <span className="text-xs text-blue-600">
             Click &quot;Recall Order&quot; to continue with queued orders
            </span>   
          </div>
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-6 mt-6">
        {/* Products Section */}
        <div className="flex-1 bg-white rounded-lg shadow-md p-4">
          {/* Search and Category Header */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Products</h2>
            
            <div className="flex flex-col sm:flex-row gap-3 mb-4 w-full">
              <div className="flex-1 min-w-0">
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex-1 min-w-0 flex">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 min-w-0 px-4 py-3 border border-gray-300 rounded-l-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                <button className="px-4 py-3 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 transition-colors outline-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                  <FaSearch />
                </button>
              </div>
            </div>
          </div>

          {/* Most Sold Products */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4 border-b pb-2">Most Sold Products</h3>
            <div className="space-y-2">
              {mostSoldProducts.map(product => {
                const inCart = isInCart(product.id);
                return (
                  <div 
                    key={product.id} 
                    onClick={() => toggleProductInCart(product)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      inCart 
                        ? 'bg-indigo-50 border border-indigo-200' 
                        : product.stockStatus === 'out-of-stock'
                        ? 'bg-gray-100 cursor-not-allowed opacity-70'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 flex items-center">
                        <span className="truncate">{product.name}</span>
                        {inCart && (
                          <FaCheck className="ml-2 text-green-600 text-sm flex-shrink-0" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500">ID: {product.id}</div>
                      <div className="mt-1">
                        {getStockBadge(product.stockStatus, product.stock)}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="font-semibold text-gray-800">${product.price.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">Sold: {product.sold}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cart Section */}
        <div className="w-full lg:w-96 bg-white rounded-lg text-black shadow-md p-4">
          <div className="flex items-center mb-4">
            <FaShoppingCart className="text-indigo-600 mr-2 text-sm" />
            <h2 className="text-base font-semibold text-gray-800">Order preview</h2>
            <span className="ml-auto bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs">
              {cartItems.length} items
            </span>
          </div>

          {/* Cart Items */}
          <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
            {cartItems.length === 0 ? (
              <div className="text-center text-gray-500 py-6">
                <FaShoppingCart className="text-3xl mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Your cart is empty</p>
                <p className="text-xs mt-1">Click on products to add them to cart</p>
              </div>
            ) : (
              cartItems.map(item => (
                <div key={item.id} className="flex items-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 truncate text-sm">{item.name}</div>
                    <div className="text-xs text-gray-500">ID: {item.id}</div>
                    <div className="mt-1">
                      {getStockBadge(item.stockStatus, item.stock)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(item.id, -1);
                      }}
                      className="p-1 text-gray-500 hover:text-indigo-600 outline-none focus:outline-none"
                    >
                      <FaMinus size={10} />
                    </button>
                    <span className="w-6 text-center font-medium text-xs">{item.quantity}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(item.id, 1);
                      }}
                      className="p-1 text-gray-500 hover:text-indigo-600 outline-none focus:outline-none"
                    >
                      <FaPlus size={10} />
                    </button>
                  </div>
                  <div className="w-16 text-right font-semibold text-xs flex-shrink-0 ml-2">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromCart(item.id);
                    }}
                    className="ml-2 p-1 text-gray-400 hover:text-red-600 flex-shrink-0 outline-none focus:outline-none"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary */}
          {cartItems.length > 0 && (
            <div className="border-t pt-3">
              <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold text-gray-700">Total:</span>
                <span className="text-lg font-bold text-indigo-600">
                  ${getCartTotal().toFixed(2)}
                </span>
              </div>

              {/* Additional Payment Fields */}
              <div className="space-y-4 mb-4">
                {/* Invoice Number and Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Invoice # (e.g. INV-001)"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {/* Currency Selection */}
                <div>
                    <select 
                      value={selectedCurrency}
                      onChange={(e) => setSelectedCurrency(e.target.value)}
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    >
                      {currencies.map(currency => (
                        <option key={currency.id} value={currency.id}>
                          {currency.name}
                        </option>
                      ))}
                    </select>
                  </div>

                {/* Customer Type and Payment Method */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <select 
                      value={customerType}
                      onChange={(e) => setCustomerType(e.target.value)}
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    >
                      {customerTypes.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <select 
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    >
                      {paymentMethods.map(method => (
                        <option key={method.id} value={method.id}>
                          {method.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Conditional Payment Fields */}
                {requiresBankAccount() && (
                  <div>
                    <select 
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    >
                      <option value="">Select Bank Account</option>
                      {bankAccounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {requiresAmountTendered() && (
                  <div>
                    <input
                      type="number"
                      placeholder={paymentMethod === 'cash' ? 'Amount Tendered' : 'Amount Paid'}
                      value={amountTendered}
                      onChange={(e) => setAmountTendered(e.target.value)}
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                    {paymentMethod === 'cash' && amountTendered && (
                      <div className="text-sm text-gray-600 mt-2 p-2 bg-blue-50 rounded">
                        Change: ${getChangeAmount().toFixed(2)}
                      </div>
                    )}
                  </div>
                )}

                {/* Save to Print Later */}
                <div className="flex items-center p-2">
                  <input
                    type="checkbox"
                    id="saveForLater"
                    checked={saveForLater}
                    onChange={(e) => setSaveForLater(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="saveForLater" className="ml-2 block text-sm text-gray-700">
                    Save to print later
                  </label>
                </div>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={handleProcessPayment}
                  disabled={isProcessing}
                  className={`w-full py-3 rounded font-medium text-sm outline-none focus:outline-none focus:ring-2 ${
                    isProcessing 
                      ? 'bg-indigo-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 text-white'
                  } transition-colors`}
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    'Process Order'
                  )}
                </button>
                <button 
                  onClick={() => setCartItems([])}
                  className="w-full bg-gray-200 text-gray-700 py-2.5 rounded hover:bg-gray-300 transition-colors text-sm outline-none focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success Popup with Receipt */}
      {showSuccessPopup && processedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 max-w-md w-full mx-4">
            <div className="flex flex-col items-center mb-3">
              <FaCheckCircle className="text-green-500 text-3xl mb-2" />
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Order Processed!</h3>
              <p className="text-xs text-gray-600 text-center">
                Your order has been processed successfully.
              </p>
            </div>
            
            {/* Compact Receipt */}
            <div id="receipt" className="border border-gray-200 rounded p-3 mb-3 bg-white text-xs">
              <div className="text-center mb-2">
                <h2 className="text-sm font-bold">STORE RECEIPT</h2>
                <p className="text-[10px] text-gray-600">123 Business Street, City, State</p>
              </div>
              
              <div className="flex justify-between mb-2">
                <span>Invoice: {processedOrder.invoiceNumber}</span>
                <span>{new Date(processedOrder.timestamp).toLocaleDateString()}</span>
              </div>
              
              {/* Display the user who processed the order */}
              <div className="flex justify-between mb-2 text-[10px]">
                <span>Processed By:</span>
                <span className="font-medium">{processedOrder.processedBy}</span>
              </div>
              
              <div className="border-t border-gray-200 pt-1 mb-2">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left pb-1 text-[10px]">Item</th>
                      <th className="text-center pb-1 text-[10px]">Qty</th>
                      <th className="text-right pb-1 text-[10px]">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedOrder.cartItems.map(item => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-1 text-[10px]">{item.name}</td>
                        <td className="text-center py-1 text-[10px]">{item.quantity}</td>
                        <td className="text-right py-1 text-[10px]">${(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="border-t border-gray-200 pt-2 text-[11px]">
                <div className="flex justify-between font-bold">
                  <span>TOTAL:</span>
                  <span>${processedOrder.total.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="border-t border-gray-200 mt-2 pt-2 text-[10px]">
                <div className="flex justify-between mb-1">
                  <span>Payment:</span>
                  <span>{paymentMethods.find(m => m.id === processedOrder.paymentMethod)?.name}</span>
                </div>
                {processedOrder.amountTendered && (
                  <div className="flex justify-between">
                    <span>Amount Tendered:</span>
                    <span>${parseFloat(processedOrder.amountTendered).toFixed(2)}</span>
                  </div>
                )}
                {processedOrder.paymentMethod === 'cash' && processedOrder.amountTendered && (
                  <div className="flex justify-between">
                    <span>Change:</span>
                    <span>${(parseFloat(processedOrder.amountTendered) - processedOrder.total).toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              <div className="text-center text-[9px] mt-2 pt-2 border-t border-gray-200">
                <p>Thank you for your purchase!</p>
              </div>
            </div>
            
            <div className="flex gap-2 justify-center">
              <button
                onClick={printReceipt}
                className="flex items-center bg-indigo-600 text-white px-3 py-1.5 rounded text-sm hover:bg-indigo-700 transition-colors"
              >
                <FaPrint className="mr-1 text-xs" />
                Print Receipt
              </button>
              <button
                onClick={() => setShowSuccessPopup(false)}
                className="bg-gray-200 text-gray-800 px-3 py-1.5 rounded text-sm hover:bg-gray-300 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message Popup */}
      {showError && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-50 flex items-center">
          <FaExclamationTriangle className="mr-2" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loading Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-xs mx-auto">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-3"></div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">Processing Order</h3>
                <p className="text-xs text-gray-600 text-center">Please wait while we save your order&apos;s details</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}