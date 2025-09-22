import { useState } from "react";
import { FaMoneyBillWave, FaUniversity, FaArrowDown, FaArrowUp } from "react-icons/fa";

export default function CashFlow() {
  const [dateRange, setDateRange] = useState("today");

  // Demo data
  const cashData = {
    received: 12540,
    sent: 8740,
    balance: 3800
  };

  const bankData = {
    received: 35620,
    sent: 28950,
    balance: 6670
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {/* Header with Date Filtering */}
      <div className="p-5">
        <div className="flex justify-between items-center">
          <h1 className="text-xs font-semibold">Cash Flow</h1>
          <select
            className="text-black text-xs px-3 py-1"
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

      <div className="p-5">
        <div className="flex flex-col gap-6">
          {/* Cash Section */}
          <div className="w-full">
            {/* Header */}
            <div className="flex items-center gap-2 p-4">
              <FaMoneyBillWave className="text-blue-500" />
              <h2 className="font-medium">Cash</h2>
            </div>
            
            {/* Received and Sent - side by side */}
            <div className="flex p-4 gap-[100px]">
              {/* Received - takes start position */}
              <div className="flex-1 gap-8">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500"></div>
                  <FaArrowDown className="text-green-500 text-sm"/>
                  <span className="text-xs text-gray-600">Received</span>
                </div>
                <p className="text-lg font-semibold">${cashData.received.toLocaleString()}</p>
              </div>
              
              {/* Sent - takes end position */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-red-500"></div>
                  <FaArrowUp className="text-red-500 text-sm" />
                  <span className="text-xs text-gray-600">Sent</span>
                </div>
                <p className="text-lg font-semibold">${cashData.sent.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Bank Section */}
          <div className="w-full">
            {/* Header */}
            <div className="flex items-center gap-2 p-4">
              <FaUniversity className="text-purple-500" />
              <h2 className="font-medium">Bank</h2>
            </div>
            
            {/* Received and Sent - side by side */}
            <div className="flex p-4 gap-[100px]">
              {/* Received - takes start position */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500"></div>
                  <FaArrowDown className="text-green-500 text-sm" />
                  <span className="text-xs text-gray-600">Received</span>
                </div>
                <p className="text-lg font-semibold">${bankData.received.toLocaleString()}</p>
              </div>
              
              {/* Sent - takes end position */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-red-500"></div>
                  <FaArrowUp className="text-red-500 text-sm" />
                  <span className="text-xs text-gray-600">Sent</span>
                </div>
                <p className="text-lg font-semibold">${bankData.sent.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Balance - at bottom */}
          <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-purple-500"></div>
                <span className="text-sm font-medium text-gray-700">Current Balance</span>
              </div>
              <p className="text-xl font-semibold text-purple-700">${bankData.balance.toLocaleString()}</p>
          </div>

        </div>
      </div>
    </div>
  );
}