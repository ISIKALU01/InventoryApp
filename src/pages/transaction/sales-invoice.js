// pages/transaction/sales-invoice.js
import TransactionNav from "../../components/TransactionNav";
import { useState, useEffect } from "react";
import { inventoryAPI } from "../../../utils/salesApi";

export default function SalesInvoice() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredInventory, setFilteredInventory] = useState([]);

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

                  return (
                    <div 
                      key={item.id || item._id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 truncate">
                          {item.name || (item.product && item.product.name) || 'Unknown Product'}
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

        {/* Order Preview Section */}
        <div className="lg:w-1/3 bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Preview</h2>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="text-center text-gray-500 py-8">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-sm">No items in order</p>
              <p className="text-xs mt-1">Select products to add to your order</p>
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">₦0.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax:</span>
              <span className="font-medium">₦0.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Discount:</span>
              <span className="font-medium">₦0.00</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t pt-2">
              <span>Total:</span>
              <span>₦0.00</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              disabled
              className="w-full bg-gray-300 text-gray-500 py-3 px-4 rounded-md font-medium cursor-not-allowed"
            >
              Process Order
            </button>
            <button
              disabled
              className="w-full bg-gray-100 text-gray-400 py-2 px-4 rounded-md font-medium cursor-not-allowed"
            >
              Clear Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}