// pages/transaction/sales-list.js
import { useState, useEffect } from 'react';
import TransactionNav from '../../components/TransactionNav';
import { FaSearch, FaFileExport, FaShoppingCart, FaMoneyBillWave, FaTrash, FaEye, FaSlidersH, FaTimes, FaPrint, FaArrowLeft, FaUser } from 'react-icons/fa';
import axios from 'axios';
import BASE_URL from '../../../config';

export default function SalesList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);

  const token = localStorage.getItem("token");

  // Fetch orders data
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        const ordersData = response.data;
        console.log(ordersData)
        console.log('Fetched orders data:', {fetchOrders});
        setOrders(ordersData);

        // Extract unique locations and users
        const uniqueLocations = [...new Set(ordersData.map(order => order.store || order.location).filter(Boolean))];
        const uniqueUsers = [...new Set(ordersData.map(order => order.processed_by || order.user_name).filter(Boolean))];
        
        setLocations(uniqueLocations);
        setUsers(uniqueUsers);
        
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  // Handle mobile view detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Filter orders based on search and filters
  const filteredTransactions = orders.filter(order => {
    const matchesSearch = 
      searchTerm === '' ||
      (order.transaction_id && order.transaction_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.processed_by && order.processed_by.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDate = 
      selectedDate === '' ||
      (order.created_at && order.created_at.includes(selectedDate));

    const matchesLocation = 
      selectedLocation === '' ||
      (order.store && order.store === selectedLocation) ||
      (order.location && order.location === selectedLocation);

    const matchesUser = 
      selectedUser === '' ||
      (order.processed_by && order.processed_by === selectedUser);

    return matchesSearch && matchesDate && matchesLocation && matchesUser;
  });

  // Calculate totals for today
  const today = new Date().toISOString().split('T')[0];
  const todayTransactions = orders.filter(order => 
    order.created_at && order.created_at.includes(today)
  );

  const totalProductsSold = todayTransactions.reduce((total, order) => {
    return total + (order.items ? order.items.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0);
  }, 0);

  const totalSalesAmount = todayTransactions.reduce((total, order) => {
    return total + (parseFloat(order.total_amount) || 0);
  }, 0);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDate('');
    setSelectedLocation('');
    setSelectedUser('');
  };

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Date', 'Transaction ID', 'Customer', 'Payment Method', 'Items', 'Subtotal', 'Tax', 'Discount', 'Total', 'Processed By'];
    
    const csvData = filteredTransactions.map(order => [
      order.created_at || '',
      order.transaction_id || order.id || '',
      order.customer_name || 'Walk-in Customer',
      order.payment_method || '',
      order.items ? order.items.map(item => `${item.product_name} (${item.quantity})`).join('; ') : '',
      order.subtotal || '',
      order.tax_amount || '',
      order.discount_amount || '',
      order.total_amount || '',
      order.processed_by || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handlePrintReceipt = (order) => {
    // Simple print functionality - you can enhance this with a proper receipt template
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${order.transaction_id || order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .item { margin: 5px 0; }
            .total { border-top: 1px solid #000; padding-top: 10px; margin-top: 10px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>SALES RECEIPT</h2>
            <p>Transaction: ${order.transaction_id || order.id}</p>
            <p>Date: ${order.created_at || new Date().toLocaleString()}</p>
          </div>
          <div>
            <p><strong>Customer:</strong> ${order.customer_name || 'Walk-in Customer'}</p>
            <p><strong>Payment Method:</strong> ${order.payment_method || 'N/A'}</p>
            <hr>
            <h3>Items:</h3>
            ${order.items ? order.items.map(item => `
              <div class="item">
                ${item.product_name} - ${item.quantity} × ₦${parseFloat(item.unit_price || item.product_price).toFixed(2)} = ₦${(item.quantity * parseFloat(item.unit_price || item.product_price)).toFixed(2)}
              </div>
            `).join('') : 'No items'}
            <div class="total">
              <p>Subtotal: ₦${parseFloat(order.subtotal).toFixed(2)}</p>
              <p>Tax: ₦${parseFloat(order.tax_amount).toFixed(2)}</p>
              <p>Discount: ₦${parseFloat(order.discount_amount).toFixed(2)}</p>
              <p><strong>Total: ₦${parseFloat(order.total_amount).toFixed(2)}</strong></p>
            </div>
            <p><strong>Processed by:</strong> ${order.processed_by || 'System'}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleViewDetails = (order) => {
    // You can implement a modal or redirect to detailed view
    alert(`Order Details:\nTransaction ID: ${order.transaction_id || order.id}\nCustomer: ${order.customer_name || 'Walk-in'}\nTotal: ₦${parseFloat(order.total_amount).toFixed(2)}\nPayment: ${order.payment_method}\nItems: ${order.items ? order.items.length : 0}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatCurrency = (amount) => {
    return `₦${parseFloat(amount || 0).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="pt-0 mt-0 font-raleway">
        <h1 className="text-xl font-normal text-gray-800 mb-6 hidden md:block">Sales List</h1>
        <TransactionNav />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading sales data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-0 mt-0 font-raleway">
      <h1 className="text-xl font-normal font-raleway text-gray-800 mb-6 hidden md:block">Sales List</h1>
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
                <p className="text-lg font-bold text-gray-800">{formatCurrency(totalSalesAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Export */}
        <div className="bg-white rounded shadow p-3">
          <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
            {/* Mobile layout */}
            {isMobile && (
              <div className="w-full flex gap-2 items-center">
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
                
                <div className="w-full md:w-auto">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs"
                  />
                </div>
                
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
          
          {/* Mobile filter dropdown */}
          {isMobile && showFilters && (
            <div className="mt-3 grid grid-cols-1 gap-2 p-2 bg-gray-50 rounded">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs"
                />
              </div>
              
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
                    Customer
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Processed By
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-3 py-4 text-center text-xs text-gray-500">
                      {orders.length === 0 ? 'No transactions found' : 'No transactions match your filters'}
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((order) => (
                    <tr key={order.id || order.transaction_id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs text-gray-900">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-3 py-2 text-xs font-medium text-gray-900">
                        {order.transaction_id || order.id}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900">
                        {order.customer_name || 'Walk-in Customer'}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900 capitalize">
                        {order.payment_method || 'N/A'}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900">
                        {order.items ? order.items.length : 0} items
                      </td>
                      <td className="px-3 py-2 text-xs font-semibold text-gray-900">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900">
                        {order.processed_by || 'System'}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleViewDetails(order)}
                            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                            title="View Details"
                          >
                            <FaEye size={14} />
                          </button>
                          <button
                            onClick={() => handlePrintReceipt(order)}
                            className="p-1 text-green-600 hover:text-green-800 transition-colors"
                            title="Print Receipt"
                          >
                            <FaPrint size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Cards */}
          <div className="md:hidden">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 text-xs">
                  {orders.length === 0 ? 'No transactions found' : 'No transactions match your filters'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {filteredTransactions.map((order) => (
                  <div key={order.id || order.transaction_id} className="bg-gray-50 rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-900">
                          {order.transaction_id || order.id}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                      <p className="text-xs font-bold text-gray-900">
                        {formatCurrency(order.total_amount)}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-1 text-xs text-gray-600 mb-2">
                      <div>
                        <p><strong>Customer:</strong> {order.customer_name || 'Walk-in'}</p>
                        <p><strong>Payment:</strong> {order.payment_method || 'N/A'}</p>
                      </div>
                      <div>
                        <p><strong>Items:</strong> {order.items ? order.items.length : 0}</p>
                        <p><strong>By:</strong> {order.processed_by || 'System'}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleViewDetails(order)}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs flex items-center"
                      >
                        <FaEye className="mr-1" size={10} />
                        View
                      </button>
                      <button
                        onClick={() => handlePrintReceipt(order)}
                        className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs flex items-center"
                      >
                        <FaPrint className="mr-1" size={10} />
                        Print
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}