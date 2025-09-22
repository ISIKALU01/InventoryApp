// components/SalesAnalysis.js
import { useState } from "react";

export default function SalesAnalysis() {
  const [dateRange, setDateRange] = useState("today");

  const salesMethods = [
    { name: "POS", value: 16400, color: "bg-blue-500", percentage: 60 },
    { name: "Transfer", value: 6800, color: "bg-green-500", percentage: 25 },
    { name: "Cash", value: 4200, color: "bg-purple-500", percentage: 15 },
    { name: "Cust-acct", value: 16400, color: "bg-red-500", percentage: 60 },
    { name: "Complimentary", value: 6800, color: "bg-pink-500", percentage: 25},
    { name: "Loyalty", value: 4200, color: "bg-yellow-500", percentage: 15 },
  ];

  return (
    <div className="bg-gray-500">
      <div className="bg-white shadow-md overflow-hidden">
        {/* Header with Date Filtering */}
        <div className="p-5 text-black">
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-semibold">Sales Analysis</h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm">Filter by:</span>
              <select
                className="text-black border-none text-sm px-1 py-1"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Today's Sales Summary */}
          <div className="mb-8">
            <h2 className="text-sm font-normal text-gray-700 mb-2">Today</h2>
            <p className="text-xl font-bold text-green-600">N27,400.00</p>

            {/* Sales Methods Bar */}
            <div className="mt-4">
              <div className="flex h-6 rounded-md overflow-hidden mb-2">
                {salesMethods.map((method, index) => (
                  <div
                    key={index}
                    className={`${method.color}`}
                    style={{ width: `${method.percentage}%` }}
                    title={`${method.name}: ${method.percentage}%`}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* Sales Details - 3 columns layout */}
          <div className="mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {salesMethods.map((method, index) => (
                <div
                  key={index}
                  className="flex items-start p-2 md:p-3 bg-gray-50 rounded-lg"
                >
                  <span
                    className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${method.color}`}
                  ></span>
                  <div className="ml-2 flex-1 min-w-0">
                    <div className="flex items-baseline">
                      <span className="text-gray-600 text-sm md:text-base truncate">
                        {method.name}
                      </span>
                    </div>
                    <div className="text-xs md:text-sm font-medium text-gray-800 mt-1">
                      N{method.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Profit Margin */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Profit Margin</span>
              <span className="text-lg font-bold text-green-600">42.5%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div
                className="bg-green-500 h-2.5 rounded-full"
                style={{ width: "42.5%" }}
              ></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
