import { useState, useEffect } from "react";
import axios from "axios";
import {
	FaMoneyBillWave,
	FaUniversity,
	FaGift,
	FaStar,
	FaUserCircle,
	FaCreditCard,
	FaArrowDown,
	FaArrowUp,
} from "react-icons/fa";
import BASE_URL from "../../config";
import { getLocalStorage } from "../../utils/auth";

export default function CashFlow() {
	const [dateRange, setDateRange] = useState("today");
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(false);

	// Fetch API Data
	const fetchData = async (filter) => {
		try {
			setLoading(true);
			const token = getLocalStorage("token");
			const res = await axios.get(
				`${BASE_URL}/show-method-amount?filter=${filter}`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			setData(res.data);
		} catch (error) {
			console.error("Error fetching cash flow data:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData(dateRange);
	}, [dateRange]);

	const paymentBreakdown = data?.payment_breakdown || {};
	const totalBalance = data?.total_amount || 0;

	// Icon mapping per method
	const icons = {
		cash: <FaMoneyBillWave className="text-blue-500" />,
		bank_transfer: <FaUniversity className="text-purple-500" />,
		complimentary: <FaGift className="text-pink-500" />,
		loyalty: <FaStar className="text-yellow-500" />,
		customer_balance: <FaUserCircle className="text-orange-500" />,
		credit_limit: <FaCreditCard className="text-teal-500" />,
	};

	return (
		<div className="bg-white shadow-md rounded-lg overflow-hidden">
			{/* Header with Date Filtering */}
			<div className="p-5 border-b">
				<div className="flex justify-between items-center">
					<h1 className="text-xs font-semibold text-gray-700">Cash Flow</h1>
					<select
						className="text-black text-xs px-3 py-1 border rounded"
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

			<div className="p-5">
				{loading ? (
					<p className="text-center text-gray-500 text-sm">Loading...</p>
				) : (
					<div className="flex flex-col gap-6">
						{/* Loop through all payment methods */}
						{Object.entries(paymentBreakdown).map(([method, values]) => (
							<div key={method} className="w-full border-b last:border-none">
								<div className="flex items-center gap-2 p-4">
									{icons[method] || (
										<FaMoneyBillWave className="text-gray-400" />
									)}
									<h2 className="font-medium capitalize text-gray-700">
										{method.replace(/_/g, " ")}
									</h2>
								</div>

								<div className="flex p-4 gap-4 justify-between w-full">
									{/* Received */}
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-2">
											<div className="w-2 h-2 bg-green-500"></div>
											<FaArrowDown className="text-green-500 text-sm" />
											<span className="text-xs text-gray-600">Received</span>
										</div>
										<p className="text-lg font-semibold text-green-700">
											₦{values.received?.toLocaleString() || 0}
										</p>
									</div>

									{/* Sent */}
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-2">
											<div className="w-2 h-2 bg-red-500"></div>
											<FaArrowUp className="text-red-500 text-sm" />
											<span className="text-xs text-gray-600">Sent</span>
										</div>
										<p className="text-lg font-semibold text-red-700">
											₦{values.sent?.toLocaleString() || 0}
										</p>
									</div>
								</div>
							</div>
						))}

						{/* Total Balance */}
						<div className="p-4 border-t bg-gray-50">
							<div className="flex items-center gap-2 mb-1">
								<div className="w-2 h-2 bg-purple-500"></div>
								<span className="text-sm font-medium text-gray-700">
									Current Balance
								</span>
							</div>
							<p className="text-xl font-semibold text-purple-700">
								₦{totalBalance.toLocaleString()}
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
