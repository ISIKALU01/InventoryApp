// components/ProductList.js
import { useState, useEffect } from 'react';
import { orderItemAPI } from '../../../utils/salesApi';

export default function ProductList({ 
  inventory, 
  loading, 
  error, 
  onAddToCart,
  stores,
  currentOrderId // Add this prop to track the current order
}) {
  const [selectedStore, setSelectedStore] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [addingToCart, setAddingToCart] = useState(null); // Track which item is being added

  // Filter inventory based on store and search term
  useEffect(() => {
    let filtered = inventory;
    
    // Filter by store
    if (selectedStore) {
      filtered = filtered.filter(item => 
        item.store && item.store.name === selectedStore
      );
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        const productName = item.name || (item.product && item.product.name) || '';
        const productSku = (item.product && item.product.sku) || '';
        const storeName = (item.store && item.store.name) || '';
        
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

  // Handle adding product to cart with API call
  const handleAddToCart = async (item) => {
    if (!currentOrderId) {
      alert('Please create an order first');
      return;
    }

    const stockStatus = getStockStatus(item.quantity || item.stockQuantity);
    
    // Don't add out of stock items
    if (stockStatus === 'out-of-stock') {
      alert('This product is out of stock');
      return;
    }

    // Check if item is already in cart (prevent duplicates)
    if (addingToCart === item.id) {
      return; // Prevent multiple clicks
    }

    setAddingToCart(item.id);

    try {
      const productId = item.product?.id || item.product_id || item.id;
      const unitPrice = parseFloat(item.product?.price) || 0;
      const quantity = 1;
      const lineTotal = unitPrice * quantity;

      const orderItemData = {
        order_id: currentOrderId,
        product_id: productId,
        quantity: quantity,
        unit_price: unitPrice.toFixed(2),
        line_total: lineTotal.toFixed(2)
      };

      console.log('Creating order item:', orderItemData);

      // Create order item via API
      const response = await orderItemAPI.createOrderItem(orderItemData);
      
      if (response && response.data) {
        // Transform the API response to match our cart structure
        const cartItem = {
          id: response.data.id || response.data._id,
          orderItemId: response.data.id || response.data._id,
          productId: productId,
          name: item.name || (item.product && item.product.name) || 'Unknown Product',
          price: unitPrice,
          quantity: quantity,
          maxQuantity: parseInt(item.quantity || item.stockQuantity) || 0,
          store: item.store?.name || 'Unknown Store',
          lineTotal: lineTotal
        };

        // Notify parent component
        onAddToCart(cartItem);
      } else {
        throw new Error('Invalid response from server');
      }

    } catch (error) {
      console.error('Failed to add item to cart:', error);
      alert(`Failed to add item to cart: ${error.message}`);
    } finally {
      setAddingToCart(null);
    }
  };

  // Helper function to determine stock status
  const getStockStatus = (stock) => {
    const stockNum = parseInt(stock) || 0;
    if (stockNum === 0) return 'out-of-stock';
    if (stockNum <= 10) return 'low-stock';
    return 'in-stock';
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

  return (
    <div className="flex-1 bg-white rounded-lg shadow-md p-4">
      {/* Search Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Products</h2>
        
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 mb-4 w-full">
          <div className="flex-1 min-w-0">
            <select 
              value={selectedStore}
              onChange={handleStoreChange}
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              <option value="">All Stores</option>
              {stores.map(store => (
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
              className="flex-1 min-w-0 px-4 py-3 border border-gray-300 rounded-l-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
            <button 
              type="submit"
              className="px-4 py-3 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 transition-colors outline-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>

        {!currentOrderId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-yellow-700 text-sm">Please create an order first to add products to cart</span>
            </div>
          </div>
        )}
      </div>

      {/* Products List */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-4 border-b pb-2">
          Available Products ({loading ? '...' : filteredInventory.length})
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
            <svg className="w-8 h-8 mx-auto mb-2 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">Error loading products</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="text-center text-gray-500 py-6">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-sm">No products found</p>
            <p className="text-xs mt-1">
              {selectedStore || searchTerm 
                ? 'Try changing your filters or search term' 
                : 'Add products to your inventory to see them here'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredInventory.map((item) => {
              const stockStatus = getStockStatus(item.quantity || item.stockQuantity);
              const isAdding = addingToCart === item.id;
              const isDisabled = !currentOrderId || stockStatus === 'out-of-stock' || isAdding;

              return (
                <div 
                  key={item.id || item._id}
                  onClick={() => !isDisabled && handleAddToCart(item)}
                  className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                    isDisabled
                      ? 'bg-gray-100 opacity-50 cursor-not-allowed' 
                      : 'bg-gray-50 hover:bg-gray-100 hover:shadow-sm cursor-pointer'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 truncate">
                      {item.name || (item.product && item.product.name) || 'Unknown Product'}
                      {isAdding && (
                        <span className="ml-2 text-xs text-indigo-600">Adding...</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 flex flex-wrap gap-2 mt-1">
                      <span>ID: {item.id || item._id}</span>
                      {item.product?.sku && <span>SKU: {item.product.sku}</span>}
                      {item.store?.name && <span>Store: {item.store.name}</span>}
                    </div>
                    <div className="flex items-center mt-1 space-x-2">
                      {getStockBadge(stockStatus, item.quantity || item.stockQuantity)}
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}