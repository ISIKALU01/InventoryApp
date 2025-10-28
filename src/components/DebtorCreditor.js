import { useState, useEffect } from "react";
import axios from "axios";
import { FaChartBar, FaArrowUp, FaArrowDown, FaEye } from "react-icons/fa";
import BASE_URL from "../../config";

export default function DebtorCreditor() {
	const [dateRange, setDateRange] = useState("today");
	const [data, setData] = useState({
		debtors: 0,
		creditors: 0,
		net_position: 0,
		net_percentage: 0,
	});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchDebtorCreditorData = async () => {
			try {
				setLoading(true);
				const token = localStorage.getItem("token"); // if you’re storing token after login
				const response = await axios.get(
					`${BASE_URL}/admin-debtors-creditors?filter=${dateRange}`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);
				setData(response.data);
			} catch (error) {
				console.error("Error fetching debtor/creditor data:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchDebtorCreditorData();
	}, [dateRange]);

	const debtors = parseFloat(data.debtors) || 0;
	const creditors = parseFloat(data.creditors) || 0;
	const netPosition = parseFloat(data.net_position) || 0;
	const netPercentage = parseFloat(data.net_percentage) || 0;

	const total = debtors + creditors;
	const debtorsPercentage = total ? (debtors / total) * 100 : 0;
	const creditorsPercentage = total ? (creditors / total) * 100 : 0;

	return (
		<div className="bg-white shadow-md rounded-lg overflow-hidden">
			{/* Header with Date Filtering */}
			<div className="p-5">
				<div className="flex justify-between items-center">
					<h1 className="text-xs font-semibold">Debtors & Creditors</h1>
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
				{loading ? (
					<p className="text-center text-gray-500 text-sm py-8">
						Loading data...
					</p>
				) : (
					<>
						{/* Progress Bar */}
						<div className="mb-4">
							<div className="flex justify-between text-sm mb-2">
								<div className="flex items-center gap-2">
									<FaArrowUp className="text-green-500" />
									<span className="font-medium">Debtors</span>
								</div>
								<div className="flex items-center gap-2">
									<FaArrowDown className="text-red-500" />
									<span className="font-medium">Creditors</span>
								</div>
							</div>

							<div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden mb-0">
								<div className="flex h-full">
									<div
										className="bg-green-500 h-full transition-all duration-300"
										style={{ width: `${debtorsPercentage}%` }}
									></div>
									<div
										className="bg-red-500 h-full transition-all duration-300"
										style={{ width: `${creditorsPercentage}%` }}
									></div>
								</div>
							</div>

							{/* Figures directly under the bar without spacing */}
							<div className="flex w-full mt-0">
								<div
									className="text-left text-xs font-medium text-green-600"
									style={{ width: `${debtorsPercentage}%` }}
								>
									₦{debtors.toLocaleString()}
								</div>
								<div
									className="text-right text-xs font-medium text-red-600"
									style={{ width: `${creditorsPercentage}%` }}
								>
									₦{creditors.toLocaleString()}
								</div>
							</div>
						</div>

						{/* Net Position */}
						<div className="mt-[50px]">
							<div className="flex items-start justify-start mb-2">
								<div>
									<span className="text-md font-semibold text-gray-700">
										Net Position
									</span>
									<div className="flex items-center gap-2 mt-0">
										<p
											className={`text-lg font-semibold ${
												netPosition >= 0 ? "text-green-700" : "text-red-700"
											}`}
										>
											₦{netPosition.toLocaleString()}
										</p>
										<div className="flex items-center gap-1">
											<FaChartBar
												className={
													netPosition >= 0 ? "text-green-400" : "text-red-400"
												}
											/>
											<span
												className={`text-sm font-medium ${
													netPosition >= 0 ? "text-green-600" : "text-red-600"
												}`}
											>
												{netPercentage >= 0 ? "+" : ""}
												{netPercentage}%
											</span>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* View Buttons */}
						<div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
							<button className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-all duration-200">
								<FaEye className="text-xs" />
								View Debtors
							</button>

							<button className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-all duration-200">
								<FaEye className="text-xs" />
								View Creditors
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
