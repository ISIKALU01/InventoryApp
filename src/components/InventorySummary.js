// components/InventorySummary.js
import { FaBoxes, FaTags } from "react-icons/fa";

export default function InventorySummary() {
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-6 text-gray-800">Inventory Summary</h2>
      
      <div className="space-y-6">
        {/* Stock Value Section */}
        <div className="flex items-start gap-4">
          <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
            <FaBoxes className="text-blue-600 text-xl" />
          </div>
          <div className="flex-1 gap-8">
            <div className="flex flex-col gap-4 mb-1">
              <span className="text-gray-600 font-medium">Stock Value</span>
              <span className="font-bold text-blue-600">N643,391.00</span>
            </div>
            <div className="text-sm text-gray-500">
              Mark up: <span className="font-medium">63.1%</span>
            </div>
          </div>
        </div>
        
        {/* Retail Value Section */}
        <div className="flex items-start gap-4">
          <div className="bg-green-100 p-3 rounded-full flex-shrink-0">
            <FaTags className="text-green-600 text-xl" />
          </div>
          <div className="flex-1 gap-8">
            <div className="flex flex-col gap-4 mb-1">
              <span className="text-gray-600 font-medium">Retail Value</span>
              <span className="font-bold text-blue-600">N1,790,700.00</span>
            </div>
            <div className="text-sm text-gray-500">
              Profit Margin: <span className="font-medium">83.7%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}