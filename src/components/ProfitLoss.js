import { useEffect, useState } from "react";
import axios from "axios";
import { FaChartBar, FaArrowUp, FaArrowDown } from "react-icons/fa";
import BASE_URL from "../../config";
import { getLocalStorage } from "../../utils/auth";

export default function ProfitLoss() {
	const [dateRange, setDateRange] = useState("today");
	const [data, setData] = useState({
		revenue: 0,
		operating_expense: 0,
		profit: 0,
		profit_percentage: 0,
	});
	const [loading, setLoading] = useState(true);

	const fetchProfitLoss = async (filter) => {
		try {
			setLoading(true);
			const token = getLocalStorage("token");
			if (!token) return;

			const finalFilter = filter === "today" ? "" : `this_${filter}`;

			const response = await axios.get(`${BASE_URL}/admin-profit-loss`, {
				headers: { Authorization: `Bearer ${token}` },
				params: { filter: finalFilter },
			});

			console.log(`✅ Profit & Loss (${filter}) fetched:`, response.data);
			setData(response.data);
		} catch (error) {
			console.error("❌ Failed to fetch profit/loss data:", error);
			setData({
				revenue: 0,
				operating_expense: 0,
				profit: 0,
				profit_percentage: 0,
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchProfitLoss(dateRange);
	}, [dateRange]);

	const total =
		parseFloat(data.revenue) + parseFloat(data.operating_expense || 0);
	const revenuePercentage =
		total > 0 ? (parseFloat(data.revenue) / total) * 100 : 0;
	const expensePercentage =
		total > 0 ? (parseFloat(data.operating_expense) / total) * 100 : 0;

	return (
		<div className="bg-white shadow-md rounded-lg overflow-hidden">
			{/* Header with Date Filtering */}
			<div className="p-5">
				<div className="flex justify-between items-center">
					<h1 className="text-xs font-semibold text-gray-700">Profit & Loss</h1>
					<select
						className="text-black rounded-md text-xs px-3 py-1 border border-gray-300"
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
				{loading ? (
					<div className="flex justify-center items-center h-32 text-gray-400">
						<div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full mr-2"></div>
						Loading profit & loss...
					</div>
				) : (
					<>
						{/* Progress Bar */}
						<div className="mb-4">
							<div className="flex justify-between text-sm mb-2">
								<div className="flex items-center gap-2">
									<FaArrowUp className="text-green-500" />
									<span className="font-medium text-gray-700">Revenue</span>
								</div>
								<div className="flex items-center gap-2">
									<FaArrowDown className="text-blue-500" />
									<span className="font-medium text-gray-700">
										Operating Expense
									</span>
								</div>
							</div>

							<div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
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

							{/* Figures under the bar */}
							<div className="flex w-full mt-0">
								<div
									className="text-left text-xs font-medium text-green-600"
									style={{ width: `${revenuePercentage}%` }}
								>
									₦{Number(data.revenue).toLocaleString()}
								</div>
								<div
									className="text-right text-xs font-medium text-blue-600"
									style={{ width: `${expensePercentage}%` }}
								>
									₦{Number(data.operating_expense).toLocaleString()}
								</div>
							</div>
						</div>

						{/* Profit Figure */}
						<div className="mt-[50px]">
							<div className="flex items-start justify-start mb-2">
								<div>
									<span className="text-md font-semibold text-gray-700">
										Profit
									</span>
									<div className="flex items-center gap-2 mt-0">
										<p className="text-lg font-semibold text-black">
											₦{Number(data.profit).toLocaleString()}
										</p>
										<div className="flex items-center gap-1">
											<FaChartBar className="text-green-400 text-sm" />
											<span className="text-sm text-green-600 font-medium">
												{Number(data.profit_percentage).toFixed(1)}%
											</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
