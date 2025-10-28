import { useEffect, useState } from "react";
import axios from "axios";
import { FaBoxes, FaTags } from "react-icons/fa";
import BASE_URL from "../../config";
import { getLocalStorage } from "../../utils/auth";

export default function InventorySummary() {
	const [summary, setSummary] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchInventorySummary = async () => {
			try {
				const token = getLocalStorage("token");
				if (!token) return;

				const response = await axios.get(`${BASE_URL}/admin-get-summary`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				console.log("✅ Inventory summary fetched:", response.data);
				setSummary(response.data);
			} catch (error) {
				console.error("❌ Failed to fetch inventory summary:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchInventorySummary();
	}, []);

	const formatCurrency = (value) => {
		if (!value && value !== 0) return "₦0.00";
		return `₦${parseFloat(value).toLocaleString(undefined, {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		})}`;
	};

	return (
		<div className="bg-white shadow-md rounded-lg p-6">
			<h2 className="text-lg font-semibold mb-6 text-gray-800">
				Inventory Summary
			</h2>

			{loading ? (
				<div className="flex justify-center items-center py-6 text-gray-500">
					<div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
					Loading summary...
				</div>
			) : (
				<div className="space-y-6">
					{/* Stock Value Section */}
					<div className="flex items-start gap-4">
						<div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
							<FaBoxes className="text-blue-600 text-xl" />
						</div>
						<div className="flex-1 gap-8">
							<div className="flex flex-col gap-4 mb-1">
								<span className="text-gray-600 font-medium">Stock Value</span>
								<span className="font-bold text-blue-600">
									{formatCurrency(summary?.stock_value)}
								</span>
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
								<span className="font-bold text-green-600">
									{formatCurrency(summary?.retail_value)}
								</span>
							</div>
							<div className="text-sm text-gray-500">
								Profit Margin: <span className="font-medium">83.7%</span>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
