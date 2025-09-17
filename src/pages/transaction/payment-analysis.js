// pages/transaction/payment-analysis.js
import { useState, useEffect } from 'react';
import TransactionNav from '../../components/TransactionNav';
import { FaSearch, FaFileExport, FaShoppingCart, FaMoneyBillWave, FaTrash, FaEye, FaSlidersH, FaTimes, FaPrint, FaArrowLeft, FaUser } from 'react-icons/fa';

export default function SalesSummary() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [expandedTransaction, setExpandedTransaction] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
    
    return (
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl font-normal font-raleway text-gray-800 mb-6 hidden md:block">Payment Analysis</h1>
          <TransactionNav />
          <div className="bg-white p-6 rounded-lg shadow-md mt-6">
            <p className="text-gray-600">Payment content goes here...</p>
          </div>
        </div>
    );
  }



