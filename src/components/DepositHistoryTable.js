import { useState, useEffect } from "react";
import { FaDownload, FaSearch, FaExclamationTriangle } from "react-icons/fa";
import { formatCurrency } from "../utils/formatters";

const DepositHistoryTable = ({ deposits, customerId }) => {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDeposits = deposits.filter(deposit => {
    const matchesFilter = filter === "all" || deposit.status === filter;
    const matchesSearch = deposit.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deposit.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deposit.message?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "failed": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (deposits.length === 0) {
    return (
      <div className="text-center py-8">
        <FaExclamationTriangle className="mx-auto text-gray-400 text-3xl mb-3" />
        <p className="text-gray-500">No transaction history available</p>
        <p className="text-sm text-gray-400 mt-1">
          Deposit records will appear here once transactions are made
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center">
          <FaDownload className="mr-2" />
          Export
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block overflow-hidden border border-gray-200 rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDeposits.map((deposit) => (
              <tr key={deposit.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-900">
                  {new Date(deposit.date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {formatCurrency(deposit.amount)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{deposit.purpose}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeClass(deposit.status)}`}>
                    {deposit.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 font-mono">{deposit.reference}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{deposit.message}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredDeposits.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No transactions found</p>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-3">
        {filteredDeposits.map((deposit) => (
          <div key={deposit.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(deposit.amount)}
              </span>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeClass(deposit.status)}`}>
                {deposit.status}
              </span>
            </div>
            <p className="text-sm text-gray-700 mb-1">{deposit.purpose}</p>
            <p className="text-xs text-gray-500 mb-2">
              {new Date(deposit.date).toLocaleDateString()}
            </p>
            {deposit.reference && (
              <p className="text-xs text-gray-400 font-mono mb-1">{deposit.reference}</p>
            )}
            {deposit.message && (
              <p className="text-xs text-gray-600">{deposit.message}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DepositHistoryTable;