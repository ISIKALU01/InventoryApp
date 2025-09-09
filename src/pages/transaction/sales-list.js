// pages/transaction/sales-list.js
import { useState, useEffect } from 'react';
import TransactionNav from '../../components/TransactionNav';
import { FaSearch, FaFileExport, FaShoppingCart, FaMoneyBillWave, FaTrash, FaEye, FaSlidersH, FaTimes } from 'react-icons/fa';

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
        transaction.customerType?.toLowerCase().includes(searchTerm.toLowerCase())
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
    const headers = ['Date', 'Transaction ID', 'Customer Type', 'Amount', 'Discount', 'Payment Method'];
    const csvData = filteredTransactions.map(transaction => [
      transaction.selectedDate || (transaction.timestamp ? new Date(transaction.timestamp).toLocaleDateString() : 'N/A'),
      transaction.transactionId || 'N/A',
      transaction.customerType || 'N/A',
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
                  <tr key={transaction.transactionId}>
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
                      ${(transaction.total || 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      $0.00
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                      <button
                        onClick={() => deleteTransaction(transaction.transactionId)}
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
              <div key={transaction.transactionId} className="border-b border-gray-200 p-2">
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
                        onClick={() => toggleTransactionDetails(transaction.transactionId)}
                        className="text-blue-600 p-0.5"
                        aria-label="View details"
                      >
                        <FaEye className="text-xs" />
                      </button>
                      <button
                        onClick={() => deleteTransaction(transaction.transactionId)}
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