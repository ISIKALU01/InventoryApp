import { useEffect, useState } from "react";
import Head from "next/head";
import InventorySummary from "@/components/InventorySummary";
import SalesAnalysis from "@/components/SalesAnalysis";
import Trend from "@/components/TrendChart";
import TopCategory from "@/components/TopCatgry";
import CashFlow from "@/components/CashFlow";
import ProfitLoss from "@/components/ProfitLoss";
import DebtorCreditor from "@/components/DebtorCreditor";
import http from "../../services/http";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
	// RouteGuard has already checked the login and the dashboard.view permission
	const { user, can, logout } = useAuth();
	const [cards, setCards] = useState(null);
	const showFinancials = can("reports.view");

	useEffect(() => {
		const fetchDashboardData = async () => {
			try {
				const response = await http.get("/dashboardCards");
				setCards(response.data);
			} catch (error) {
				console.error("Failed to fetch dashboard data:", error);
			}
		};

		fetchDashboardData();
	}, []);

	const handleLogout = logout;

	if (!user) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Redirecting...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Head>
				<title>Dashboard - SellaPad</title>
			</Head>

			{/* HEADER */}
			<header className="bg-white shadow">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-raleway">
					<div className="flex flex-col sm:flex-row justify-between items-center py-4 sm:py-0 sm:h-16">
						<div className="mb-4 sm:mb-0 text-center sm:text-left">
							<p className="text-xl text-gray-600">Welcome, {user.name}</p>
						</div>
						<div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
							<div className="text-center sm:text-right">
								<p className="text-sm font-medium text-gray-900">{user.name}</p>
								<p className="text-xs text-gray-600 capitalize">
									{user.role_label || user.role}
								</p>
							</div>
							<button
								onClick={handleLogout}
								className="bg-indigo-600 text-white px-4 py-2 cursor-pointer rounded-md text-sm font-medium w-full 
                sm:w-auto hover:bg-indigo-700 transition-colors"
							>
								Logout
							</button>
						</div>
					</div>
				</div>
			</header>

			{/* MAIN CONTENT */}
			<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="px-4 py-6 sm:px-0">
					{/* Role-specific header */}
					<div className="bg-white overflow-hidden shadow mb-8">
						<div className="px-4 py-5 sm:p-6">
							<h2 className="text-2xl font-bold text-gray-900 mb-6">
								Ops Center
							</h2>

							{/* DASHBOARD CARDS - Show for both roles */}
							<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
								<div className="bg-gradient-to-r from-indigo-500 to-indigo-700 overflow-hidden shadow rounded-lg p-5 text-white">
									<h3 className="text-sm font-medium">Sales for today</h3>
									<p className="mt-1 text-3xl font-semibold">
										₦
										{cards
											? parseFloat(cards.sales_today).toLocaleString()
											: "0.00"}
									</p>
								</div>
								<div className="bg-gradient-to-r from-purple-500 to-purple-700 overflow-hidden shadow rounded-lg p-5 text-white">
									<h3 className="text-sm font-medium">Cost of goods sold</h3>
									<p className="mt-1 text-3xl font-semibold">
										₦
										{cards
											? parseFloat(
													cards.cost_of_goods_sold_today
											  ).toLocaleString()
											: "0.00"}
									</p>
								</div>
								<div className="bg-gradient-to-r from-pink-500 to-pink-700 overflow-hidden shadow rounded-lg p-5 text-white">
									<h3 className="text-sm font-medium">Expenses for today</h3>
									<p className="mt-1 text-3xl font-semibold">
										₦
										{cards
											? parseFloat(cards.expenses_today).toLocaleString()
											: "0.00"}
									</p>
								</div>
								<div className="bg-gradient-to-r from-teal-500 to-teal-700 overflow-hidden shadow rounded-lg p-5 text-white">
									<h3 className="text-sm font-medium">Profit for today</h3>
									<p className="mt-1 text-3xl font-semibold">
										₦
										{cards
											? parseFloat(cards.profit_today).toLocaleString()
											: "0.00"}
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* REMAINING SECTIONS - Show for both roles */}
					<div className={`grid grid-cols-1 ${showFinancials ? "md:grid-cols-[2fr_1fr]" : ""} gap-4 mb-8`}>
						<SalesAnalysis />
						{showFinancials && <InventorySummary />}
					</div>

					<div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 mb-8">
						<Trend />
						<TopCategory />
					</div>

					{/* Money reports need reports.view */}
					{showFinancials && (
						<div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4">
							<CashFlow />
							<div className="grid grid-cols-1 gap-8">
								<ProfitLoss />
								<DebtorCreditor />
							</div>
						</div>
					)}

		
				</div>
			</main>
		</div>
	);
}