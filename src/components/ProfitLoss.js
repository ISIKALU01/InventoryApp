import { useState } from "react";
import {
  FaChartBar,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";

export default function ProfitLoss() {
  const [dateRange, setDateRange] = useState("today");

  // Demo data
  const data = {
    revenue: 125000,
    operatingExpense: 87500,
    profit: 37500,
  };

  const total = data.revenue + data.operatingExpense;
  const revenuePercentage = (data.revenue / total) * 100;
  const expensePercentage = (data.operatingExpense / total) * 100;
  const profitPercentage = ((data.profit / data.revenue) * 100).toFixed(1);

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {/* Header with Date Filtering */}
      <div className="p-5">
        <div className="flex justify-between items-center">
          <h1 className="text-xs font-semibold">Profit & Loss</h1>
          <select
            className="text-black rounded-md text-xs px-3 py-1"
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

      <div className="p-6">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <div className="flex items-center gap-2">
              <FaArrowUp className="text-green-500" />
              <span className="font-medium">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <FaArrowDown className="text-blue-500" />
              <span className="font-medium">Operating Expense</span>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden mb-0">
            <div className="flex h-full">
              <div
                className="bg-blue-900 h-full transition-all duration-300"
                style={{ width: `${revenuePercentage}%` }}
              ></div>
              <div
                className="bg-blue-500 h-full transition-all duration-300"
                style={{ width: `${expensePercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Figures directly under the bar without spacing */}
          <div className="flex w-full mt-0">
            <div
              className="text-left text-xs font-medium text-green-600"
              style={{ width: `${revenuePercentage}%` }}
            >
              ${(data.revenue / 1000).toFixed(0)}k
            </div>
            <div
              className="text-right text-xs font-medium text-blue-600"
              style={{ width: `${expensePercentage}%` }}
            >
              ${(data.operatingExpense / 1000).toFixed(0)}k
            </div>
          </div>
        </div>

        {/* Profit Figure - Aligned to start and percentage beside amount */}
        <div className="mt-[50px]">
          <div className="flex items-start justify-start mb-2">
            <div>
              <span className="text-md font-semibold text-gray-700">
                Profit
              </span>
              <div className="flex items-center gap-2 mt-0">
                <p className="text-lg font-semibold text-black">
                  N{data.profit.toLocaleString()}
                </p>
                <div className="flex items-center gap-1">
                  <FaChartBar className="text-green-400 text-sm" />
                  <span className="text-sm text-green-600 font-medium">
                    {profitPercentage}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
