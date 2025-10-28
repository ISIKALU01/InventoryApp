import { useState, useEffect } from "react";
import axios from "axios";
import BASE_URL from "../../config";

export default function SalesAnalysis() {
	const [dateRange, setDateRange] = useState("today");
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(false);

	const colors = {
		cash: "bg-purple-500",
		bank_transfer: "bg-green-500",
		complimentary: "bg-pink-500",
		loyalty: "bg-yellow-500",
		customer_balance: "bg-red-500",
		pos: "bg-blue-500", // fallback if POS ever appears
	};

	// Fetch Dashboard Data
	const fetchSalesData = async () => {
		try {
			setLoading(true);
			const token = localStorage.getItem("token");
			const filter = dateRange === "today" ? "" : dateRange;
			const url = `${BASE_URL}/dashboardCards${
				filter ? `?filter=${filter}` : ""
			}`;

			const response = await axios.get(url, {
				headers: token ? { Authorization: `Bearer ${token}` } : {},
			});

			setData(response.data);
		} catch (error) {
			console.error("❌ Error fetching sales data:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchSalesData();
	}, [dateRange]);

	// Helper to format currency
	const formatCurrency = (amount) =>
		`₦${parseFloat(amount || 0).toLocaleString(undefined, {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		})}`;

	// Prepare breakdown data
	const paymentBreakdown = data?.payment_breakdown
		? Object.entries(data.payment_breakdown).map(([key, value]) => ({
				name: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
				value: parseFloat(value),
				color: colors[key] || "bg-gray-400",
		  }))
		: [];

	// Calculate total breakdown sum
	const totalBreakdown = paymentBreakdown.reduce(
		(sum, item) => sum + item.value,
		0
	);

	// Calculate percentages dynamically
	const breakdownWithPercent = paymentBreakdown.map((item) => ({
		...item,
		percentage: totalBreakdown ? (item.value / totalBreakdown) * 100 : 0,
	}));

	// Calculate profit margin = (profit_today / sales_today) * 100
	const profitMargin =
		data?.sales_today && data?.profit_today
			? ((data.profit_today / data.sales_today) * 100).toFixed(1)
			: 0;

	return (
		<div className="bg-white shadow-md rounded-lg overflow-hidden">
			{/* Header with Date Filtering */}
			<div className="p-5 border-b border-gray-100 text-black">
				<div className="flex justify-between items-center">
					<h1 className="text-lg font-semibold">Sales Analysis</h1>
					<div className="flex items-center space-x-2">
						<span className="text-sm text-gray-600">Filter by:</span>
						<select
							className="text-black border border-gray-300 text-sm px-2 py-1 rounded-md"
							value={dateRange}
							onChange={(e) => setDateRange(e.target.value)}
						>
							<option value="today">Today</option>
							<option value="this_week">This Week</option>
							<option value="this_month">This Month</option>
							<option value="this_quarter">This Quarter</option>
							<option value="this_year">This Year</option>
						</select>
					</div>
				</div>
			</div>

			<div className="p-6">
				{loading ? (
					<p className="text-center text-gray-500 text-sm">Loading...</p>
				) : (
					<>
						{/* Sales Summary */}
						<div className="mb-8">
							<h2 className="text-sm font-normal text-gray-700 mb-2 capitalize">
								{dateRange === "today" ? "Today" : dateRange.replace("_", " ")}
							</h2>
							<p className="text-xl font-bold text-green-600">
								{formatCurrency(data?.filtered_sales)}
							</p>

							{/* Sales Methods Bar */}
							<div className="mt-4">
								<div className="flex h-6 rounded-md overflow-hidden mb-2">
									{breakdownWithPercent.map((method, index) => (
										<div
											key={index}
											className={`${method.color}`}
											style={{ width: `${method.percentage}%` }}
											title={`${method.name}: ${method.percentage.toFixed(1)}%`}
										></div>
									))}
								</div>
							</div>
						</div>

						{/* Payment Breakdown Cards */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
							{breakdownWithPercent.map((method, index) => (
								<div
									key={index}
									className="flex items-start p-2 md:p-3 bg-gray-50 rounded-lg"
								>
									<span
										className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${method.color}`}
									></span>
									<div className="ml-2 flex-1 min-w-0">
										<span className="text-gray-600 text-sm md:text-base truncate">
											{method.name}
										</span>
										<div className="text-xs md:text-sm font-medium text-gray-800 mt-1">
											{formatCurrency(method.value)}
										</div>
									</div>
								</div>
							))}
						</div>

						{/* Profit Margin */}
						<div className="mt-8 p-4 bg-blue-50 rounded-lg">
							<div className="flex justify-between items-center">
								<span className="text-gray-700 font-medium">Profit Margin</span>
								<span
									className={`text-lg font-bold ${
										profitMargin < 0 ? "text-red-600" : "text-green-600"
									}`}
								>
									{profitMargin}%
								</span>
							</div>
							<div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
								<div
									className={`h-2.5 rounded-full ${
										profitMargin < 0 ? "bg-red-500" : "bg-green-500"
									}`}
									style={{
										width: `${Math.min(Math.abs(profitMargin), 100)}%`,
									}}
								></div>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
