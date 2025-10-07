import { FaSearch, FaSlidersH, FaFileImport, FaPlus } from "react-icons/fa";

const CustomerFilters = ({
  searchTerm,
  setSearchTerm,
  selectedType,
  setSelectedType,
  showFilters,
  setShowFilters,
  isMobile,
  clearFilters,
  onImport,
  onAdd,
  onRefresh,
  isLoading
}) => {
  return (
    <div className="p-3 bg-white rounded shadow">
      <div className="flex flex-col w-full gap-3 md:flex-row items-stretch">
        {/* Left side - Search and filters */}
        <div className="flex flex-col flex-grow gap-3 md:flex-row md:items-center">
          {isMobile ? (
            <div className="flex w-full gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <FaSearch className="absolute right-2 top-1.5 text-xs text-gray-400" />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-1.5 rounded transition-colors flex items-center text-xs ${
                  showFilters
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                <FaSlidersH className="text-xs" />
              </button>
            </div>
          ) : (
            <>
              {/* Search bar for desktop */}
              <div className="relative w-full md:w-48">
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <FaSearch className="absolute right-2 top-1.5 text-xs text-gray-400" />
              </div>

              {/* Desktop filters */}
              <div className="flex gap-3">
                <div className="w-auto">
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Types</option>
                    <option value="regular">Regular</option>
                    <option value="debtor">Debtor</option>
                    <option value="creditor">Creditor</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right side - Action buttons (Desktop only) */}
        {!isMobile && (
          <div className="flex justify-start w-full gap-2 md:justify-end md:w-auto">
            <button
              onClick={onImport}
              className="flex items-center px-3 py-1.5 text-xs text-white transition-colors bg-blue-600 rounded hover:bg-blue-700"
              disabled={isLoading}
            >
              <FaFileImport className="mr-1 text-xs" />
              Import CSV
            </button>
            <button
              onClick={onAdd}
              className="flex items-center px-3 py-1.5 text-xs text-white transition-colors bg-green-600 rounded hover:bg-green-700"
              disabled={isLoading}
            >
              <FaPlus className="mr-1 text-xs" />
              Add Customer
            </button>
            <button
              onClick={onRefresh}
              className="flex items-center px-3 py-1.5 text-xs text-white transition-colors bg-gray-600 rounded hover:bg-gray-700"
              disabled={isLoading}
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        )}
      </div>

      {/* Filter dropdown for mobile */}
      {isMobile && showFilters && (
        <div className="grid grid-cols-1 gap-2 p-2 mt-3 bg-gray-50 rounded">
          <div>
            <label className="block mb-1 text-xs font-medium text-gray-700">
              Customer Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Types</option>
              <option value="regular">Regular</option>
              <option value="debtor">Debtor</option>
              <option value="creditor">Creditor</option>
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={clearFilters}
              className="flex-1 px-2 py-1.5 text-xs text-gray-700 transition-colors bg-gray-200 rounded hover:bg-gray-300"
            >
              Clear Filters
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="flex-1 px-2 py-1.5 text-xs text-white transition-colors bg-blue-600 rounded hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerFilters;