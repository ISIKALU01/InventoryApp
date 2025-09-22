// components/TrendChart.js
import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function TrendChart() {
  const [dateRange, setDateRange] = useState("today");

  // Demo data for different time periods
  const demoData = {
    today: {
      labels: ["9:00", "11:00", "13:00", "15:00", "17:00", "19:00", "21:00"],
      data: [1200, 1900, 3000, 5000, 2000, 3000, 7400],
      total: 27400
    },
    week: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      data: [8200, 12900, 5300, 10800, 9600, 14500, 7400],
      total: 68700
    },
    month: {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      data: [28700, 32300, 29800, 31200],
      total: 122000
    },
    quarter: {
      labels: ["Month 1", "Month 2", "Month 3"],
      data: [122000, 135000, 143000],
      total: 400000
    },
    year: {
      labels: ["Q1", "Q2", "Q3", "Q4"],
      data: [400000, 420000, 435000, 460000],
      total: 1715000
    }
  };

  const chartData = {
    labels: demoData[dateRange].labels,
    datasets: [
      {
        label: "Transaction Amount",
        data: demoData[dateRange].data,
        borderColor: "rgb(79, 70, 229)",
        backgroundColor: "rgba(79, 70, 229, 0.1)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "rgb(79, 70, 229)",
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function(context) {
            return `N${context.parsed.y.toLocaleString()}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#6B7280",
          font: {
            size: 12,
          },
        },
      },
      y: {
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          color: "#6B7280",
          font: {
            size: 12,
          },
          callback: function(value) {
            return "N" + value.toLocaleString();
          },
        },
      },
    },
  };

  // Format total amount with Nigerian Naira formatting
  const formatAmount = (amount) => {
    return `N${amount.toLocaleString('en-NG')}`;
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {/* Header with Date Filtering */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-800">Trend</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Filter by:</span>
            <select
              className="text-gray-700 border border-gray-300 text-xs px-2 py-1 mr-4"
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

      <div className="p-5">
        {/* Summary Section */}
        <div className="mb-6">
          <h2 className="text-sm font-normal text-gray-600 mb-1 capitalize">
            {dateRange === "today" ? "Today" : dateRange === "week" ? "This Week" : 
             dateRange === "month" ? "This Month" : dateRange === "quarter" ? "This Quarter" : "This Year"}
          </h2>
          <p className="text-2xl font-bold text-indigo-600">
            {formatAmount(demoData[dateRange].total)}
          </p>
        </div>

        {/* Chart Container */}
        <div className="h-60 w-full">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}