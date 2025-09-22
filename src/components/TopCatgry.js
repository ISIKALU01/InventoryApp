import { useState } from 'react';

export default function TopCatgry() {
  const [showAll, setShowAll] = useState(false);
  
  // Demo data
  const salesData = [
    { location: "New York", sales: 1245, growth: "+12%" },
    { location: "Los Angeles", sales: 987, growth: "+8%" },
    { location: "Chicago", sales: 843, growth: "+5%" },
    { location: "Houston", sales: 721, growth: "+15%" },
    { location: "Phoenix", sales: 654, growth: "-2%" },
    { location: "Philadelphia", sales: 598, growth: "+7%" },
    { location: "San Antonio", sales: 532, growth: "+9%" },
    { location: "San Diego", sales: 487, growth: "+4%" },
    { location: "Dallas", sales: 432, growth: "+11%" },
    { location: "San Jose", sales: 398, growth: "+3%" }
  ];

  const displayedData = showAll ? salesData : salesData.slice(0, 5);

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      {/* Header with filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        
        <div className="flex items-center gap-2">
          {/* Products dropdown */}
          <select className="text-xs text-gray-600 bg-transparent border-none py-1 pr-7 focus:ring-0">
            <option>All Products</option>
            <option>Electronics</option>
            <option>Clothing</option>
            <option>Home & Garden</option>
          </select>
          
          {/* Date filter dropdown */}
          <select className="text-xs text-gray-600 bg-transparent border-none py-1 pr-7 focus:ring-0">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
          </select>
          
          {/* View All button */}
          <button 
            className="text-xs text-blue-500 hover:text-blue-600 bg-transparent border-none py-1"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show Less' : 'View All'}
          </button>
        </div>
      </div>
      
      {/* Sales Table */}
      <div className={`overflow-y-auto ${showAll ? 'max-h-80' : ''}`}>
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 font-medium">
              <th className="pb-2 text-left">#</th>
              <th className="pb-2 text-left">Locations</th>
              <th className="pb-2 text-right">Sales</th>
            </tr>
          </thead>
          <tbody>
            {displayedData.map((item, index) => (
              <tr key={index} className="text-xs hover:bg-gray-50 even:bg-gray-50/30">
                <td className="py-3 text-gray-500">{index + 1}</td>
                <td className="py-3">
                  <div className="font-medium">{item.location}</div>
                  <div className="text-xs text-gray-400">{item.growth} from last week</div>
                </td>
                <td className="py-3 text-right font-medium">${item.sales.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}