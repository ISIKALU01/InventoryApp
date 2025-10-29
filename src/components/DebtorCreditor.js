import { useState, useEffect } from "react";
import axios from "axios";
import { FaChartBar, FaArrowUp, FaArrowDown, FaEye, FaSpinner, FaTimes } from "react-icons/fa";
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
	const [viewLoading, setViewLoading] = useState(null);
	const [viewError, setViewError] = useState(null);
	const [listData, setListData] = useState(null);
	const [activeList, setActiveList] = useState(null);

	useEffect(() => {
		const fetchDebtorCreditorData = async () => {
			try {
				setLoading(true);
				const token = localStorage.getItem("token");
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

	const handleViewData = async (type) => {
		try {
			setViewLoading(type);
			setViewError(null);
			const token = localStorage.getItem("token");
			
			const response = await axios.get(
				`${BASE_URL}/view-debtors-creditors?type=${type}&filter=${dateRange}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			console.log(`${type} API Response:`, response.data);
			
			setListData(response.data);
			setActiveList(type);
			
		} catch (error) {
			console.error(`Error fetching ${type}:`, error);
			setViewError(`Failed to load ${type}. Please try again.`);
			setTimeout(() => setViewError(null), 5000);
		} finally {
			setViewLoading(null);
		}
	};

	const handleCloseList = () => {
		setListData(null);
		setActiveList(null);
	};

	const debtors = parseFloat(data.debtors) || 0;
	const creditors = parseFloat(data.creditors) || 0;
	const netPosition = parseFloat(data.net_position) || 0;
	const netPercentage = parseFloat(data.net_percentage) || 0;

	const total = debtors + creditors;
	const debtorsPercentage = total ? (debtors / total) * 100 : 0;
	const creditorsPercentage = total ? (creditors / total) * 100 : 0;

	// Extract the actual list items from the response object based on type
	const getListItems = () => {
		if (!listData || !activeList) return [];
		
		if (activeList === 'debtors') {
			return listData.debtors || listData.customers || [];
		} else if (activeList === 'creditors') {
			return listData.creditors || listData.suppliers || listData.vendors || [];
		}
		
		return [];
	};

	const getListTitle = () => {
		if (!listData) return activeList;
		
		return `${activeList} (${listData.filter || dateRange})`;
	};

	const getTotalAmount = () => {
		if (!listData) return 0;
		
		if (activeList === 'debtors') {
			return listData.total_debit || 0;
		} else if (activeList === 'creditors') {
			return listData.total_credit || 0;
		}
		
		return 0;
	};

	const listItems = getListItems();

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

						{/* Error Message */}
						{viewError && (
							<div className="mt-2 p-2 text-xs text-red-700 bg-red-50 rounded-md text-center">
								{viewError}
							</div>
						)}

						{/* List Container */}
						{activeList && (
							<div className="mt-4 border border-gray-200 rounded-lg bg-gray-50 max-h-60 overflow-y-auto">
								<div className="sticky top-0 bg-gray-100 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
									<div>
										<h3 className="text-sm font-semibold text-gray-700 capitalize">
											{getListTitle()}
										</h3>
										{listData && (
											<div className="text-xs text-gray-500 mt-1">
												Total: ₦{getTotalAmount().toLocaleString()} • 
												{listItems.length} {activeList}
											</div>
										)}
									</div>
									<button
										onClick={handleCloseList}
										className="text-gray-500 hover:text-gray-700 transition-colors"
									>
										<FaTimes className="text-xs" />
									</button>
								</div>
								
								<div className="p-3">
									{listItems.length > 0 ? (
										<ul className="space-y-2">
											{listItems.map((item) => (
												<li key={item.id} className="flex justify-between items-center p-2 bg-white rounded border border-gray-200">
													<div className="flex-1">
														<p className="text-xs font-medium text-gray-800">{item.name}</p>
														<p className="text-xs text-gray-500">
															{item.phone} {item.email && `• ${item.email}`}
														</p>
													</div>
													<div className={`text-xs font-semibold ${
														activeList === 'debtors' ? 'text-green-600' : 'text-red-600'
													}`}>
														₦{(parseFloat(item.balance) || 0).toLocaleString()}
													</div>
												</li>
											))}
										</ul>
									) : (
										<p className="text-center text-gray-500 text-xs py-4">
											No {activeList} data found for {dateRange}
										</p>
									)}
								</div>
							</div>
						)}

						{/* View Buttons */}
						<div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
							<button 
								onClick={() => handleViewData('debtors')}
								disabled={viewLoading === 'debtors'}
								className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{viewLoading === 'debtors' ? (
									<FaSpinner className="text-xs animate-spin" />
								) : (
									<FaEye className="text-xs" />
								)}
								{viewLoading === 'debtors' ? 'Loading...' : 'View Debtors'}
							</button>

							<button 
								onClick={() => handleViewData('creditors')}
								disabled={viewLoading === 'creditors'}
								className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{viewLoading === 'creditors' ? (
									<FaSpinner className="text-xs animate-spin" />
								) : (
									<FaEye className="text-xs" />
								)}
								{viewLoading === 'creditors' ? 'Loading...' : 'View Creditors'}
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	);
}