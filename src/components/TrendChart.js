import { useEffect, useState } from "react";
import axios from "axios";
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
import BASE_URL from "../../config";
import { getLocalStorage } from "../../utils/auth";

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
	const [trendData, setTrendData] = useState([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);

	const fetchTrendData = async (filter) => {
		try {
			setLoading(true);
			const token = getLocalStorage("token");
			if (!token) return;

			// Handle default mapping — empty means “today”
			const finalFilter = filter === "today" ? "" : `this_${filter}`;

			const response = await axios.get(`${BASE_URL}/sales-trend`, {
				headers: { Authorization: `Bearer ${token}` },
				params: { filter: finalFilter },
			});

			console.log(`✅ Trend data (${filter}) fetched:`, response.data);

			const { total, trend } = response.data;
			setTotal(total || 0);
			setTrendData(trend || []);
		} catch (error) {
			console.error("❌ Failed to fetch trend data:", error);
			setTrendData([]);
			setTotal(0);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchTrendData(dateRange);
	}, [dateRange]);

	// 🟢 Correctly pick label key based on dateRange
	const labels = trendData.map((item) =>
		dateRange === "today" ? item.hour : item.date
	);

	const values = trendData.map((item) => parseFloat(item.total_sales || 0));

	const chartData = {
		labels,
		datasets: [
			{
				label: "Transaction Amount",
				data: values,
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
			legend: { display: false },
			tooltip: {
				mode: "index",
				intersect: false,
				backgroundColor: "rgba(0, 0, 0, 0.7)",
				titleFont: { size: 14 },
				bodyFont: { size: 13 },
				callbacks: {
					label: (context) => `₦${context.parsed.y.toLocaleString()}`,
				},
			},
		},
		scales: {
			x: {
				grid: { display: false },
				ticks: {
					color: "#6B7280",
					font: { size: 12 },
				},
			},
			y: {
				grid: { color: "rgba(0, 0, 0, 0.05)" },
				ticks: {
					color: "#6B7280",
					font: { size: 12 },
					callback: (value) => "₦" + value.toLocaleString(),
				},
			},
		},
	};

	const formatAmount = (amount) => `₦${amount.toLocaleString("en-NG")}`;

	return (
		<div className="bg-white shadow-md rounded-lg overflow-hidden">
			{/* Header with Date Filtering */}
			<div className="p-5 border-b border-gray-100">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
					<h1 className="text-lg font-semibold text-gray-800">Trend</h1>
					<div className="flex items-center space-x-2">
						<span className="text-sm text-gray-600">Filter by:</span>
						<select
							className="text-gray-700 border border-gray-300 text-xs px-2 py-1 mr-4 rounded"
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
						{dateRange === "today"
							? "Today"
							: dateRange === "week"
							? "This Week"
							: dateRange === "month"
							? "This Month"
							: dateRange === "quarter"
							? "This Quarter"
							: "This Year"}
					</h2>
					{loading ? (
						<p className="text-gray-400 text-sm">Loading total...</p>
					) : (
						<p className="text-2xl font-bold text-indigo-600">
							{formatAmount(total)}
						</p>
					)}
				</div>

				{/* Chart Container */}
				<div className="h-60 w-full">
					{loading ? (
						<div className="flex justify-center items-center h-full text-gray-400">
							<div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full mr-2"></div>
							Loading trend...
						</div>
					) : (
						<Line data={chartData} options={chartOptions} />
					)}
				</div>
			</div>
		</div>
	);
}
