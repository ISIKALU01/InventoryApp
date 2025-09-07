// pages/transaction/sales-invoice.js
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import TransactionNav from '../../components/TransactionNav';
import { useState } from 'react';
import { FaSearch, FaShoppingCart, FaPlus, FaMinus, FaTrash } from 'react-icons/fa';

export default function SalesInvoice() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState([]);

  // Sample categories
  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'electronics', name: 'Electronics' },
    { id: 'clothing', name: 'Clothing' },
    { id: 'books', name: 'Books' },
    { id: 'food', name: 'Food & Beverages' },
    { id: 'sports', name: 'Sports Equipment' }
  ];

  // Sample products
  const products = [
    { id: 'P001', name: 'Wireless Headphones', price: 79.99, category: 'electronics', sold: 142 },
    { id: 'P002', name: 'Cotton T-Shirt', price: 19.99, category: 'clothing', sold: 89 },
    { id: 'P003', name: 'Programming Book', price: 34.99, category: 'books', sold: 56 },
    { id: 'P004', name: 'Energy Drink', price: 2.99, category: 'food', sold: 231 },
    { id: 'P005', name: 'Basketball', price: 24.99, category: 'sports', sold: 34 },
    { id: 'P006', name: 'Smart Watch', price: 199.99, category: 'electronics', sold: 78 },
    { id: 'P007', name: 'Running Shorts', price: 29.99, category: 'clothing', sold: 67 },
    { id: 'P008', name: 'Coffee Maker', price: 49.99, category: 'electronics', sold: 45 }
  ];

  // Filter products based on category and search
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         product.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort by most sold
  const mostSoldProducts = [...filteredProducts].sort((a, b) => b.sold - a.sold).slice(0, 5);

  // Cart functions
  const addToCart = (product) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
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

  return (
    <div className="pt-0 mt-0 font-raleway">
      <h1 className="text-xl font-normal text-gray-800 mb-2 hidden md:block">Sales Point</h1>        
      <TransactionNav />
      
      <div className="flex flex-col lg:flex-row gap-6 mt-6">
        {/* Products Section */}
        <div className="flex-1 bg-white rounded-lg shadow-md p-2">
          {/* Search and Category Header */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Products</h2>
            
            <div className="flex flex-col sm:flex-row gap-3 mb-0">
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 px-1 py-1 text-sm border border-gray-300"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              
              <div className="flex flex-1">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-1 py-1 border border-gray-300 text-sm"
                />
                <button className="text-white text-sm transition-colors">
                  <FaSearch />
                </button>
              </div>
            </div>
          </div>

          {/* Most Sold Products */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4 border-b pb-2">Most Sold Products</h3>
            <div className="space-y-3 text-sm">
              {mostSoldProducts.map(product => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{product.name}</div>
                    <div className="text-sm text-gray-500">ID: {product.id}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-800">${product.price.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">Sold: {product.sold}</div>
                  </div>
                  <button 
                    onClick={() => addToCart(product)}
                    className="ml-4 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Section */}
        <div className="w-full lg:w-96 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <FaShoppingCart className="text-indigo-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800">Shopping Cart</h2>
            <span className="ml-auto bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-sm">
              {cartItems.length} items
            </span>
          </div>

          {/* Cart Items */}
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {cartItems.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <FaShoppingCart className="text-4xl mx-auto mb-2 text-gray-300" />
                <p>Your cart is empty</p>
              </div>
            ) : (
              cartItems.map(item => (
                <div key={item.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{item.name}</div>
                    <div className="text-sm text-gray-500">ID: {item.id}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-1 text-gray-500 hover:text-indigo-600"
                    >
                      <FaMinus size={12} />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-1 text-gray-500 hover:text-indigo-600"
                    >
                      <FaPlus size={12} />
                    </button>
                  </div>
                  <div className="w-20 text-right font-semibold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="ml-3 p-1 text-gray-400 hover:text-red-600"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary */}
          {cartItems.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold text-gray-700">Total:</span>
                <span className="text-xl font-bold text-indigo-600">
                  ${getCartTotal().toFixed(2)}
                </span>
              </div>
              
              <div className="space-y-2">
                <button className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                  Process Payment
                </button>
                <button 
                  onClick={() => setCartItems([])}
                  className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}