import { useState, useEffect } from "react";
import axios from "axios";
import BASE_URL from "../../config";

export default function TopCatgry() {
	const [showAll, setShowAll] = useState(false);
	const [filterBy, setFilterBy] = useState("product");
	const [timeFilter, setTimeFilter] = useState("last_7_days");
	const [salesData, setSalesData] = useState([]);
	const [loading, setLoading] = useState(false);

	// Fetch data from API
	const fetchData = async () => {
		try {
			setLoading(true);
			const token = localStorage.getItem("token"); // if authentication is required
			const response = await axios.get(
				`${BASE_URL}/filter-options?filter_by=${filterBy}&time_filter=${timeFilter}`,
				{
					headers: token ? { Authorization: `Bearer ${token}` } : {},
				}
			);

			// Response structure:
			// { filter_by, time_filter, data: [{ id, name, price }] }
			setSalesData(response.data?.data || []);
		} catch (error) {
			console.error("Error fetching filter data:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [filterBy, timeFilter]);

	const displayedData = showAll ? salesData : salesData.slice(0, 5);

	return (
		<div className="bg-white shadow-md rounded-lg p-6">
			{/* Header with filters */}
			<div className="flex flex-wrap items-center justify-between gap-3 mb-6">
				<div className="flex items-center gap-2">
					{/* Filter By dropdown */}
					<select
						className="text-xs text-gray-600 bg-transparent border-none py-1 pr-7 focus:ring-0"
						value={filterBy}
						onChange={(e) => setFilterBy(e.target.value)}
					>
						<option value="product">Products</option>
						<option value="store">Stores</option>
						<option value="user">Users</option>
					</select>

					{/* Time Filter dropdown */}
					<select
						className="text-xs text-gray-600 bg-transparent border-none py-1 pr-7 focus:ring-0"
						value={timeFilter}
						onChange={(e) => setTimeFilter(e.target.value)}
					>
						<option value="last_7_days">Last 7 Days</option>
						<option value="last_30_days">Last 30 Days</option>
						<option value="last_90_days">Last 90 Days</option>
					</select>

					{/* Toggle button */}
					<button
						className="text-xs text-blue-500 hover:text-blue-600 bg-transparent border-none py-1"
						onClick={() => setShowAll(!showAll)}
					>
						{showAll ? "Show Less" : "View All"}
					</button>
				</div>
			</div>

			{/* Table Section */}
			{loading ? (
				<p className="text-center text-gray-500 text-sm py-6">Loading...</p>
			) : (
				<div className={`overflow-y-auto ${showAll ? "max-h-80" : ""}`}>
					{salesData.length > 0 ? (
						<table className="w-full">
							<thead>
								<tr className="text-xs text-gray-500 font-medium">
									<th className="pb-2 text-left">#</th>
									<th className="pb-2 text-left capitalize">
										{filterBy === "product"
											? "Product Name"
											: filterBy === "store"
											? "Store"
											: "User"}
									</th>
									<th className="pb-2 text-right">Value (₦)</th>
								</tr>
							</thead>
							<tbody>
								{displayedData.map((item, index) => (
									<tr
										key={item.id || index}
										className="text-xs hover:bg-gray-50 even:bg-gray-50/30"
									>
										<td className="py-3 text-gray-500">{index + 1}</td>
										<td className="py-3 font-medium text-gray-700">
											{item.name || "N/A"}
										</td>
										<td className="py-3 text-right font-medium text-gray-800">
											₦{Number(item.price || 0).toLocaleString()}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					) : (
						<p className="text-center text-gray-400 text-sm py-6">
							No data available for this selection.
						</p>
					)}
				</div>
			)}
		</div>
	);
}
