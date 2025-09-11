// pages/transaction/sales-list.js
import { useState, useEffect } from 'react';
import TransactionNav from '../../components/TransactionNav';
import { FaSearch, FaFileExport, FaShoppingCart, FaMoneyBillWave, FaTrash, FaEye, FaSlidersH, FaTimes, FaPrint, FaArrowLeft, FaUser } from 'react-icons/fa';

export default function SalesList() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [expandedTransaction, setExpandedTransaction] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewReceipt, setViewReceipt] = useState(null); // State for viewing receipt

  // Sample locations and users
  const locations = ['Main Store', 'Branch 1', 'Branch 2', 'Online'];
  const users = ['Admin User', 'Sales Staff 1', 'Sales Staff 2', 'Cashier 1'];

  useEffect(() => {
    // Load transactions from localStorage
    const savedTransactions = JSON.parse(localStorage.getItem('salesTransactions') || '[]');
    setTransactions(savedTransactions);
    setFilteredTransactions(savedTransactions);

    // Check screen size
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 769);
    };

    // Initial check
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize);
    
    // Clean up
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    // Filter transactions based on search criteria
    let filtered = transactions;
    
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.customerType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.processedBy?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedDate) {
      filtered = filtered.filter(transaction =>
        transaction.selectedDate === selectedDate
      );
    }
    
    if (selectedLocation) {
      filtered = filtered.filter(transaction =>
        transaction.location === selectedLocation
      );
    }
    
    if (selectedUser) {
      filtered = filtered.filter(transaction =>
        transaction.user === selectedUser
      );
    }
    
    setFilteredTransactions(filtered);
  }, [searchTerm, selectedDate, selectedLocation, selectedUser, transactions]);

  // Calculate totals
  const totalProductsSold = filteredTransactions.reduce((total, transaction) => {
    return total + (transaction.cartItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0);
  }, 0);

  const totalSalesAmount = filteredTransactions.reduce((total, transaction) => {
    return total + (transaction.total || 0);
  }, 0);

  const exportToCSV = () => {
    const headers = ['Date', 'Transaction ID', 'Customer Type', 'Processed By', 'Amount', 'Discount', 'Payment Method'];
    const csvData = filteredTransactions.map(transaction => [
      transaction.selectedDate || (transaction.timestamp ? new Date(transaction.timestamp).toLocaleDateString() : 'N/A'),
      transaction.transactionId || 'N/A',
      transaction.customerType || 'N/A',
      transaction.processedBy || 'Unknown User',
      `$${(transaction.total || 0).toFixed(2)}`,
      '$0.00',
      transaction.paymentMethod || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const deleteTransaction = (transactionId) => {
    const updatedTransactions = transactions.filter(t => t.transactionId !== transactionId);
    setTransactions(updatedTransactions);
    localStorage.setItem('salesTransactions', JSON.stringify(updatedTransactions));
  };

  const toggleTransactionDetails = (transactionId) => {
    if (expandedTransaction === transactionId) {
      setExpandedTransaction(null);
    } else {
      setExpandedTransaction(transactionId);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDate('');
    setSelectedLocation('');
    setSelectedUser('');
  };

  // Print receipt function
  const printReceipt = (transaction) => {
    const receiptElement = document.getElementById(`receipt-${transaction.transactionId}`);
    if (receiptElement) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Receipt - ${transaction.transactionId}</title>
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
                justify-content: space-between;
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

  // View receipt function
  const viewTransactionReceipt = (transaction) => {
    setViewReceipt(transaction);
  };

  // Back to list function
  const backToList = () => {
    setViewReceipt(null);
  };

  // If we're viewing a receipt, show the receipt view
  if (viewReceipt) {
    return (
      <div className="pt-0 mt-0 font-raleway min-h-screen bg-gray-100">
        <div className="bg-white p-4 shadow">
          <div className="flex items-center">
            <button
              onClick={backToList}
              className="flex items-center text-indigo-600 hover:text-indigo-800 mr-4"
            >
              <FaArrowLeft className="mr-1" />
            </button>
            <h1 className="text-xl font-normal text-gray-800">Transaction Receipt</h1>
          </div>
        </div>
        
        <div className="p-4">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-4">
            {/* Compact Receipt */}
            <div id={`receipt-${viewReceipt.transactionId}`} className="border border-gray-200 rounded p-3 mb-3 bg-white text-xs">
              <div className="text-center mb-2">
                <h2 className="text-sm font-bold">STORE RECEIPT</h2>
                <p className="text-[10px] text-gray-600">123 Business Street, City, State</p>
              </div>
              
              <div className="flex justify-between mb-2">
                <span>Invoice: {viewReceipt.invoiceNumber}</span>
                <span>{new Date(viewReceipt.timestamp).toLocaleDateString()}</span>
              </div>
              
              {/* Display the user who processed the order */}
              <div className="flex justify-between mb-2 text-[10px]">
                <span>Processed By:</span>
                <span className="font-medium">{viewReceipt.processedBy || 'Unknown User'}</span>
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
                    {viewReceipt.cartItems.map(item => (
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
                  <span>${viewReceipt.total.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="border-t border-gray-200 mt-2 pt-2 text-[10px]">
                <div className="flex justify-between mb-1">
                  <span>Payment:</span>
                  <span>{viewReceipt.paymentMethod}</span>
                </div>
                {viewReceipt.amountTendered && (
                  <div className="flex justify-between">
                    <span>Amount Tendered:</span>
                    <span>${parseFloat(viewReceipt.amountTendered).toFixed(2)}</span>
                  </div>
                )}
                {viewReceipt.paymentMethod === 'cash' && viewReceipt.amountTendered && (
                  <div className="flex justify-between">
                    <span>Change:</span>
                    <span>${(parseFloat(viewReceipt.amountTendered) - viewReceipt.total).toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              <div className="text-center text-[9px] mt-2 pt-2 border-t border-gray-200">
                <p>Thank you for your purchase!</p>
              </div>
            </div>
            
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => printReceipt(viewReceipt)}
                className="flex items-center bg-indigo-600 text-white px-3 py-1.5 rounded text-sm hover:bg-indigo-700 transition-colors"
              >
                <FaPrint className="mr-1 text-xs" />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal sales list view
  return (
    <div className="pt-0 mt-0 font-raleway">
      <TransactionNav />
      
      <div className="mt-4 space-y-4 px-2 md:px-0">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white rounded shadow p-3">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded mr-2">
                <FaShoppingCart className="text-blue-600 text-sm" />
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-600">Products Sold Today</h3>
                <p className="text-lg font-bold text-gray-800">{totalProductsSold}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded shadow p-3">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded mr-2">
                <FaMoneyBillWave className="text-green-600 text-sm" />
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-600">Total Sales Today</h3>
                <p className="text-lg font-bold text-gray-800">${totalSalesAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Export - All in one row on desktop */}
        <div className="bg-white rounded shadow p-3">
          <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
            {/* Search bar and filter button container for mobile */}
            {isMobile && (
              <div className="w-full flex gap-2 items-center">
                {/* Search bar */}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-2 pr-7 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs"
                  />
                  <FaSearch className="absolute right-2 top-1.5 text-gray-400 text-xs" />
                </div>
                
                {/* Filter button for mobile */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded flex items-center text-xs transition-colors whitespace-nowrap"
                >
                  {showFilters ? <FaTimes className="mr-1" /> : <FaSlidersH className="mr-1" />}
                  {showFilters ? 'Hide' : 'Filter'}
                </button>
              </div>
            )}
            
            {/* Desktop layout */}
            {!isMobile && (
              <>
                {/* Search bar */}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-2 pr-7 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs"
                  />
                  <FaSearch className="absolute right-2 top-1.5 text-gray-400 text-xs" />
                </div>
                
                {/* Date filter */}
                <div className="w-full md:w-auto">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs"
                  />
                </div>
                
                {/* Location filter */}
                <div className="w-full md:w-auto">
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs"
                  >
                    <option value="">All Locations</option>
                    {locations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
                
                {/* User filter */}
                <div className="w-full md:w-auto">
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs"
                  >
                    <option value="">All Users</option>
                    {users.map(user => (
                      <option key={user} value={user}>{user}</option>
                    ))}
                  </select>
                </div>
                
                {/* Action buttons */}
                <div className="flex gap-1.5 w-full md:w-auto">
                  <button
                    onClick={clearFilters}
                    className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs transition-colors whitespace-nowrap"
                  >
                    Clear
                  </button>
                  
                  <button
                    onClick={exportToCSV}
                    className="px-2 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center text-xs"
                  >
                    <FaFileExport className="mr-1 text-xs" />
                    Export
                  </button>
                </div>
              </>
            )}
          </div>
          
          {/* Filter dropdown for mobile */}
          {isMobile && showFilters && (
            <div className="mt-3 grid grid-cols-1 gap-2 p-2 bg-gray-50 rounded">
              {/* Date filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs"
                />
              </div>
              
              {/* Location filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs"
                >
                  <option value="">All Locations</option>
                  {locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
              
              {/* User filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">User</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs"
                >
                  <option value="">All Users</option>
                  {users.map(user => (
                    <option key={user} value={user}>{user}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-1.5 pt-1">
                <button
                  onClick={clearFilters}
                  className="flex-1 px-2 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs transition-colors"
                >
                  Clear Filters
                </button>
                
                <button
                  onClick={exportToCSV}
                  className="flex-1 px-2 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center text-xs"
                >
                    <FaFileExport className="mr-1 text-xs" />
                    Export CSV
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sales Log Table */}
        <div className="bg-white rounded shadow overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer Type
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Processed By
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr 
                    key={transaction.transactionId} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => viewTransactionReceipt(transaction)}
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {transaction.selectedDate || (transaction.timestamp ? new Date(transaction.timestamp).toLocaleDateString() : 'N/A')}
                      <br />
                      <span className="text-gray-500 text-2xs">
                        {transaction.timestamp ? new Date(transaction.timestamp).toLocaleTimeString() : 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {transaction.transactionId || 'N/A'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {transaction.customerType || 'N/A'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div className="flex items-center">
                        <FaUser className="mr-1 text-gray-400 text-2xs" />
                        {transaction.processedBy || 'Unknown User'}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      ${(transaction.total || 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      $0.00
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTransaction(transaction.transactionId);
                        }}
                        className="text-red-600 hover:text-red-900 p-0.5"
                        aria-label="Delete transaction"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Cards */}
          <div className="md:hidden">
            {filteredTransactions.map((transaction) => (
              <div 
                key={transaction.transactionId} 
                className="border-b border-gray-200 p-2 cursor-pointer"
                onClick={() => viewTransactionReceipt(transaction)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-xs text-gray-900">
                      {transaction.selectedDate || (transaction.timestamp ? new Date(transaction.timestamp).toLocaleDateString() : 'N/A')}
                    </p>
                    <p className="text-2xs text-gray-500">
                      {transaction.timestamp ? new Date(transaction.timestamp).toLocaleTimeString() : 'N/A'}
                    </p>
                    <p className="text-2xs mt-0.5">
                      ID: {transaction.transactionId || 'N/A'}
                    </p>
                    <p className="text-2xs">
                      Customer: {transaction.customerType || 'N/A'}
                    </p>
                    <p className="text-2xs flex items-center">
                      <FaUser className="mr-1 text-gray-400" />
                      {transaction.processedBy || 'Unknown User'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-xs text-gray-900">
                      ${(transaction.total || 0).toFixed(2)}
                    </p>
                    <p className="text-2xs text-gray-500">
                      Discount: $0.00
                    </p>
                    <div className="flex justify-end space-x-1 mt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTransactionDetails(transaction.transactionId);
                        }}
                        className="text-blue-600 p-0.5"
                        aria-label="View details"
                      >
                        <FaEye className="text-xs" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTransaction(transaction.transactionId);
                        }}
                        className="text-red-600 p-0.5"
                        aria-label="Delete transaction"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {expandedTransaction === transaction.transactionId && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                    <p className="font-medium mb-0.5">Transaction Details</p>
                    <div className="grid grid-cols-2 gap-1">
                      <span className="text-gray-600">Payment Method:</span>
                      <span>{transaction.paymentMethod || 'Not specified'}</span>
                      
                      <span className="text-gray-600">Items:</span>
                      <span>{transaction.cartItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}</span>
                      
                      {transaction.location && (
                        <>
                          <span className="text-gray-600">Location:</span>
                          <span>{transaction.location}</span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => viewTransactionReceipt(transaction)}
                      className="mt-2 text-indigo-600 text-xs flex items-center"
                    >
                      <FaEye className="mr-1" />
                      View Receipt
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {filteredTransactions.length === 0 && (
            <div className="text-center py-6">
              <p className="text-gray-500 text-xs">No transactions found</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .text-2xs {
          font-size: 0.65rem;
          line-height: 0.9rem;
        }
        
        @media (max-width: 768px) {
          .mobile-export-btn {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}