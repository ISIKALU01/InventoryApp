// pages/admin/user-approval.js
import { useState, useEffect } from "react";
import axios from "axios";
import BASE_URL from "../../config";
import { Check, X, Search, Filter, Clock, Users, Calendar, RefreshCw, Menu, Phone, Mail, LogOut } from "lucide-react";

export default function UserApproval() {
	const [users, setUsers] = useState([]);
	const [approvedStaff, setApprovedStaff] = useState([]);
	const [loading, setLoading] = useState(true);
	const [approvedLoading, setApprovedLoading] = useState(false);
	const [error, setError] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [roleFilter, setRoleFilter] = useState("all");
	const [approvingId, setApprovingId] = useState(null);
	const [showSuccessPopup, setShowSuccessPopup] = useState(false);
	const [successMessage, setSuccessMessage] = useState("");
	const [activeTab, setActiveTab] = useState("pending");
	const [showMobileFilters, setShowMobileFilters] = useState(false);
	const [loggingOutId, setLoggingOutId] = useState(null); // Track which user is being logged out

	const token = localStorage.getItem("token");

	// Show success pop-up
	const showSuccess = (message) => {
		setSuccessMessage(message);
		setShowSuccessPopup(true);
		setTimeout(() => {
			setShowSuccessPopup(false);
		}, 3000);
	};

	// Fetch login requests
	const fetchLoginRequests = async () => {
		try {
			setLoading(true);
			const response = await axios.get(`${BASE_URL}/admin/login-requests`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			
			// Handle different response formats
			const usersData = Array.isArray(response.data) 
				? response.data 
				: response.data.data || [];
				
			setUsers(usersData);
		} catch (err) {
			console.error("Failed to fetch login requests:", err);
			setError(err.response?.data?.message || "Failed to load users");
		} finally {
			setLoading(false);
		}
	};

	// Fetch approved staff for today
	const fetchApprovedStaff = async () => {
		try {
			setApprovedLoading(true);
			const response = await axios.get(`${BASE_URL}/admin/approved-staff-today`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			console.log("Approved staff response:", response.data);
			
			const staffData = Array.isArray(response.data) 
				? response.data 
				: response.data.data || [];
				
			setApprovedStaff(staffData);
		} catch (err) {
			console.error("Failed to fetch approved staff:", err);
			// Don't set error for approved staff to avoid breaking the UI
		} finally {
			setApprovedLoading(false);
		}
	};

	// Approve user
	const handleApprove = async (userId) => {
		try {
			setApprovingId(userId);
			const response = await axios.post(
				`${BASE_URL}/admin/approve/${userId}`,
				{},
				{
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				}
			);

			showSuccess("User approved successfully!");
			
			// Update the user status locally
			setUsers(prevUsers => 
				prevUsers.map(user => 
					user.id === userId 
						? { ...user, is_approved: true, approved_at: new Date().toISOString() }
						: user
				)
			);

			// Refresh approved staff list
			await fetchApprovedStaff();
			
		} catch (err) {
			console.error("Failed to approve user:", err);
			alert(err.response?.data?.message || "Failed to approve user");
		} finally {
			setApprovingId(null);
		}
	};

	// Logout user (force logout from all devices)
	const handleLogoutUser = async (staffId, staffName) => {
		if (!confirm(`Are you sure you want to force logout ${staffName || 'this user'}? This will log them out from all devices.`)) {
			return;
		}

		try {
			setLoggingOutId(staffId);
			
			const response = await axios.post(
				`${BASE_URL}/staff/${staffId}/logout`,
				{},
				{
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				}
			);

			showSuccess(`User ${staffName} has been logged out successfully!`);
			
			// Update the staff list to reflect the change
			setApprovedStaff(prevStaff => 
				prevStaff.map(staff => 
					staff.id === staffId 
						? { 
							...staff, 
							is_logged_out: true,
							logged_out_at: new Date().toISOString() 
						}
						: staff
				)
			);
			
		} catch (err) {
			console.error("Failed to logout user:", err);
			alert(err.response?.data?.message || "Failed to logout user");
		} finally {
			setLoggingOutId(null);
		}
	};

	// Filter pending users based on search and status
	const filteredPendingUsers = users.filter((user) => {
		const matchesSearch = 
			user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.role?.toLowerCase().includes(searchTerm.toLowerCase());

		const matchesStatus = 
			statusFilter === "all" || 
			(statusFilter === "pending" && !user.is_approved) ||
			(statusFilter === "approved" && user.is_approved);

		return matchesSearch && matchesStatus;
	});

	// Filter approved staff based on search and role
	const filteredApprovedStaff = approvedStaff.filter((staff) => {
		const matchesSearch = 
			staff.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			staff.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			staff.role?.toLowerCase().includes(searchTerm.toLowerCase());

		const matchesRole = 
			roleFilter === "all" || 
			staff.role?.toLowerCase() === roleFilter.toLowerCase();

		return matchesSearch && matchesRole;
	});

	// Refresh all data
	const handleRefresh = async () => {
		await fetchLoginRequests();
		if (activeTab === "approved") {
			await fetchApprovedStaff();
		}
	};

	useEffect(() => {
		fetchLoginRequests();
	}, []);

	useEffect(() => {
		if (activeTab === "approved") {
			fetchApprovedStaff();
		}
	}, [activeTab]);

	// Format date
	const formatDate = (dateString) => {
		if (!dateString) return "N/A";
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// Format date for mobile
	const formatDateMobile = (dateString) => {
		if (!dateString) return "N/A";
		return new Date(dateString).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// Get status badge
	const getStatusBadge = (isApproved) => {
		if (isApproved) {
			return (
				<span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center gap-1 w-fit">
					<Check size={12} />
					Approved
				</span>
			);
		}
		return (
			<span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1 w-fit">
				<Clock size={12} />
				Pending
			</span>
		);
	};

	// Get login status badge
	const getLoginStatusBadge = (staff) => {
		if (staff.is_logged_out) {
			return (
				<span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 flex items-center gap-1 w-fit">
					<LogOut size={12} />
					Logged Out
				</span>
			);
		}
		return (
			<span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center gap-1 w-fit">
				<Check size={12} />
				Logged In
			</span>
		);
	};

	// Get time since approval
	const getTimeSinceApproval = (approvedAt) => {
		if (!approvedAt) return "";
		const approvedDate = new Date(approvedAt);
		const now = new Date();
		const diffInMinutes = Math.floor((now - approvedDate) / (1000 * 60));
		const diffInHours = Math.floor(diffInMinutes / 60);
		
		if (diffInMinutes < 1) {
			return "Just now";
		} else if (diffInMinutes < 60) {
			return `${diffInMinutes}m ago`;
		} else if (diffInHours < 24) {
			return `${diffInHours}h ago`;
		} else {
			const days = Math.floor(diffInHours / 24);
			return `${days}d ago`;
		}
	};

	// Get unique roles for filter
	const uniqueRoles = [...new Set(approvedStaff.map(staff => staff.role).filter(Boolean))];

	return (
		<div className="pt-0 mt-0 font-raleway px-3 sm:px-4 lg:px-6">
			{/* Success Pop-up */}
			{showSuccessPopup && (
				<div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 max-w-sm sm:max-w-md mx-auto sm:mx-0">
					<div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 animate-fade-in">
						<div className="flex items-center justify-between">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<Check className="w-5 h-5 text-green-400" />
								</div>
								<div className="ml-3">
									<p className="text-sm font-medium text-green-800">
										{successMessage}
									</p>
								</div>
							</div>
							<button
								onClick={() => setShowSuccessPopup(false)}
								className="ml-auto pl-3 flex-shrink-0"
							>
								<X className="w-4 h-4 text-green-400 hover:text-green-600" />
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
				<div className="mb-4 sm:mb-0">
					<h1 className="text-xl sm:text-2xl font-normal text-gray-800 mb-2">
						User Management
					</h1>
					<p className="text-gray-600 text-sm">
						Manage user approvals and view approved staff
					</p>
				</div>
				<div className="flex items-center gap-3">
					<button
						onClick={handleRefresh}
						className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors flex items-center gap-2"
					>
						<RefreshCw size={16} />
						<span className="hidden sm:inline">Refresh</span>
					</button>
					<div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
						{activeTab === "pending" 
							? `${filteredPendingUsers.length} ${filteredPendingUsers.length === 1 ? "user" : "users"}`
							: `${filteredApprovedStaff.length} ${filteredApprovedStaff.length === 1 ? "staff" : "staff members"}`
						}
					</div>
				</div>
			</div>

			{/* Tab Navigation */}
			<div className="bg-white rounded-lg shadow-sm border mb-6 overflow-x-auto">
				<div className="flex min-w-max">
					<button
						onClick={() => setActiveTab("pending")}
						className={`flex items-center gap-2 px-4 py-3 sm:px-6 sm:py-4 text-sm font-medium border-b-2 transition-colors flex-1 justify-center sm:flex-none sm:justify-start ${
							activeTab === "pending"
								? "border-indigo-600 text-indigo-600"
								: "border-transparent text-gray-500 hover:text-gray-700"
						}`}
					>
						<Clock size={16} />
						<span className="whitespace-nowrap">Pending Approval</span>
						{users.filter(u => !u.is_approved).length > 0 && (
							<span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
								{users.filter(u => !u.is_approved).length}
							</span>
						)}
					</button>
					<button
						onClick={() => setActiveTab("approved")}
						className={`flex items-center gap-2 px-4 py-3 sm:px-6 sm:py-4 text-sm font-medium border-b-2 transition-colors flex-1 justify-center sm:flex-none sm:justify-start ${
							activeTab === "approved"
								? "border-indigo-600 text-indigo-600"
								: "border-transparent text-gray-500 hover:text-gray-700"
						}`}
					>
						<Users size={16} />
						<span className="whitespace-nowrap">Approved Today</span>
						{approvedStaff.length > 0 && (
							<span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">
								{approvedStaff.length}
							</span>
						)}
					</button>
				</div>
			</div>

			{/* Mobile Filter Toggle */}
			<div className="sm:hidden mb-4">
				<button
					onClick={() => setShowMobileFilters(!showMobileFilters)}
					className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700"
				>
					<Filter size={16} />
					{showMobileFilters ? "Hide Filters" : "Show Filters"}
				</button>
			</div>

			{/* Filters and Search */}
			<div className={`bg-white rounded-lg shadow-md p-4 mb-6 ${showMobileFilters ? 'block' : 'hidden sm:block'}`}>
				<div className="flex flex-col sm:flex-row gap-4">
					{/* Search */}
					<div className="flex-1 relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Search className="h-4 w-4 text-gray-400" />
						</div>
						<input
							type="text"
							placeholder={
								activeTab === "pending" 
									? "Search by name, email, or role..."
									: "Search approved staff..."
							}
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black outline-none"
						/>
					</div>

					{/* Filters */}
					{activeTab === "pending" ? (
						<div className="sm:w-48">
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Filter className="h-4 w-4 text-gray-400" />
								</div>
								<select
									value={statusFilter}
									onChange={(e) => setStatusFilter(e.target.value)}
									className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black outline-none appearance-none"
								>
									<option value="all">All Users</option>
									<option value="pending">Pending Only</option>
									<option value="approved">Approved Only</option>
								</select>
							</div>
						</div>
					) : (
						<div className="sm:w-48">
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Filter className="h-4 w-4 text-gray-400" />
								</div>
								<select
									value={roleFilter}
									onChange={(e) => setRoleFilter(e.target.value)}
									className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black outline-none appearance-none"
								>
									<option value="all">All Roles</option>
									{uniqueRoles.map(role => (
										<option key={role} value={role}>
											{role.charAt(0).toUpperCase() + role.slice(1)}
										</option>
									))}
								</select>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Pending Users Tab Content */}
			{activeTab === "pending" && (
				<div className="bg-white rounded-lg shadow-md overflow-hidden">
					{loading ? (
						<div className="flex items-center justify-center h-32">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
							<span className="ml-3 text-gray-600">Loading users...</span>
						</div>
					) : error ? (
						<div className="text-center py-8">
							<div className="text-red-500 mb-4">
								<X className="w-12 h-12 mx-auto mb-2 text-red-300" />
								<p className="text-sm font-medium">Error loading users</p>
								<p className="text-xs mt-1 text-gray-600">{error}</p>
							</div>
							<button
								onClick={fetchLoginRequests}
								className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
							>
								Try Again
							</button>
						</div>
					) : filteredPendingUsers.length === 0 ? (
						<div className="text-center py-12">
							<div className="text-gray-400 mb-4">
								<Users className="w-16 h-16 mx-auto mb-3" />
								<p className="text-lg font-medium text-gray-600">No users found</p>
								<p className="text-sm text-gray-500 mt-1">
									{users.length === 0 
										? "No user requests pending approval"
										: "Try adjusting your search or filters"
									}
								</p>
							</div>
						</div>
					) : (
						<>
							{/* Desktop Table */}
							<div className="hidden md:block overflow-x-auto">
								<table className="w-full">
									<thead className="bg-gray-50 border-b">
										<tr>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												User
											</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Role
											</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Status
											</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Request Date
											</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Actions
											</th>
										</tr>
									</thead>
									<tbody className="bg-white divide-y divide-gray-200">
										{filteredPendingUsers.map((user) => (
											<tr key={user.id} className="hover:bg-gray-50 transition-colors">
												<td className="px-4 py-4 whitespace-nowrap">
													<div className="flex items-center">
														<div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
															<span className="text-indigo-600 font-medium text-sm">
																{user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
															</span>
														</div>
														<div className="ml-4">
															<div className="text-sm font-medium text-gray-900">
																{user.name || "N/A"}
															</div>
															<div className="text-sm text-gray-500">
																{user.email}
															</div>
														</div>
													</div>
												</td>
												<td className="px-4 py-4 whitespace-nowrap">
													<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
														{user.role || "user"}
													</span>
												</td>
												<td className="px-4 py-4 whitespace-nowrap">
													{getStatusBadge(user.is_approved)}
												</td>
												<td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
													{user.created_at ? formatDate(user.created_at) : "N/A"}
												</td>
												<td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
													{!user.is_approved ? (
														<button
															onClick={() => handleApprove(user.id)}
															disabled={approvingId === user.id}
															className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md ${
																approvingId === user.id
																	? "bg-gray-300 text-gray-500 cursor-not-allowed"
																	: "bg-indigo-600 text-white hover:bg-indigo-700"
															} transition-colors`}
														>
															{approvingId === user.id ? (
																<>
																	<div className="animate-spin rounded-full h-3 w-3 border-b-1 border-white mr-1"></div>
																	Approving...
																</>
															) : (
																<>
																	<Check className="w-3 h-3 mr-1" />
																	Approve
																</>
															)}
														</button>
													) : (
														<div className="flex flex-col gap-1">
															<span className="text-green-600 text-sm font-medium">Approved</span>
															<span className="text-xs text-gray-400">
																{getTimeSinceApproval(user.approved_at)}
															</span>
														</div>
													)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							{/* Mobile Cards */}
							<div className="md:hidden space-y-4 p-4">
								{filteredPendingUsers.map((user) => (
									<div key={user.id} className="bg-gray-50 rounded-lg p-4 border">
										<div className="flex items-start justify-between mb-3">
											<div className="flex items-center">
												<div className="flex-shrink-0 h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
													<span className="text-indigo-600 font-medium">
														{user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
													</span>
												</div>
												<div className="ml-3">
													<div className="font-medium text-gray-900">
														{user.name || "N/A"}
													</div>
													<div className="text-sm text-gray-500 flex items-center gap-1">
														<Mail size={12} />
														{user.email}
													</div>
												</div>
											</div>
											{getStatusBadge(user.is_approved)}
										</div>
										
										<div className="grid grid-cols-2 gap-4 text-sm mb-3">
											<div>
												<div className="text-gray-500">Role</div>
												<div className="font-medium capitalize">{user.role || "user"}</div>
											</div>
											<div>
												<div className="text-gray-500">Requested</div>
												<div className="font-medium">
													{user.created_at ? formatDateMobile(user.created_at) : "N/A"}
												</div>
											</div>
										</div>

										<div className="flex justify-end">
											{!user.is_approved ? (
												<button
													onClick={() => handleApprove(user.id)}
													disabled={approvingId === user.id}
													className={`w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
														approvingId === user.id
															? "bg-gray-300 text-gray-500 cursor-not-allowed"
															: "bg-indigo-600 text-white hover:bg-indigo-700"
													} transition-colors`}
												>
													{approvingId === user.id ? (
														<>
															<div className="animate-spin rounded-full h-3 w-3 border-b-1 border-white mr-2"></div>
															Approving...
														</>
													) : (
														<>
															<Check className="w-4 h-4 mr-2" />
															Approve User
														</>
													)}
												</button>
											) : (
												<div className="text-center w-full">
													<div className="text-green-600 font-medium">Approved</div>
													<div className="text-xs text-gray-400">
														{getTimeSinceApproval(user.approved_at)}
													</div>
												</div>
											)}
										</div>
									</div>
								))}
							</div>
						</>
					)}
				</div>
			)}

			{/* Approved Staff Tab Content */}
			{activeTab === "approved" && (
				<div className="bg-white rounded-lg shadow-md overflow-hidden">
					{approvedLoading ? (
						<div className="flex items-center justify-center h-32">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
							<span className="ml-3 text-gray-600">Loading approved staff...</span>
						</div>
					) : filteredApprovedStaff.length === 0 ? (
						<div className="text-center py-12">
							<div className="text-gray-400 mb-4">
								<Calendar className="w-16 h-16 mx-auto mb-3" />
								<p className="text-lg font-medium text-gray-600">No staff approved today</p>
								<p className="text-sm text-gray-500 mt-1">
									Approved staff members will appear here
								</p>
							</div>
						</div>
					) : (
						<>
							{/* Desktop Table */}
							<div className="hidden md:block overflow-x-auto">
								<table className="w-full">
									<thead className="bg-gray-50 border-b">
										<tr>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Staff Member
											</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Role
											</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Contact
											</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Approval Time
											</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Login Status
											</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Actions
											</th>
										</tr>
									</thead>
									<tbody className="bg-white divide-y divide-gray-200">
										{filteredApprovedStaff.map((staff) => (
											<tr key={staff.id} className="hover:bg-gray-50 transition-colors">
												<td className="px-4 py-4 whitespace-nowrap">
													<div className="flex items-center">
														<div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
															<span className="text-green-600 font-medium text-sm">
																{staff.name?.charAt(0).toUpperCase() || staff.email?.charAt(0).toUpperCase()}
															</span>
														</div>
														<div className="ml-4">
															<div className="text-sm font-medium text-gray-900">
																{staff.name || "N/A"}
															</div>
															<div className="text-sm text-gray-500">
																ID: {staff.id}
															</div>
														</div>
													</div>
												</td>
												<td className="px-4 py-4 whitespace-nowrap">
													<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
														{staff.role || "staff"}
													</span>
												</td>
												<td className="px-4 py-4 whitespace-nowrap">
													<div className="text-sm text-gray-900">{staff.email}</div>
													{staff.phone && (
														<div className="text-sm text-gray-500 flex items-center gap-1">
															<Phone size={12} />
															{staff.phone}
														</div>
													)}
												</td>
												<td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
													<div>{staff.approved_at ? formatDate(staff.login_approved_at) : ""}</div>
													<div className="text-xs text-gray-400">
														{getTimeSinceApproval(staff.login_approved_at)}
													</div>
												</td>
												<td className="px-4 py-4 whitespace-nowrap">
													{getLoginStatusBadge(staff)}
												</td>
												<td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
													<button
														onClick={() => handleLogoutUser(staff.id, staff.name)}
														disabled={loggingOutId === staff.id || staff.is_logged_out}
														className={`inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-md ${
															loggingOutId === staff.id
																? "bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300"
																: staff.is_logged_out
																? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
																: "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
														} transition-colors`}
													>
														{loggingOutId === staff.id ? (
															<>
																<div className="animate-spin rounded-full h-3 w-3 border-b-1 border-red-600 mr-1"></div>
																Logging out...
															</>
														) : staff.is_logged_out ? (
															<>
																<LogOut className="w-3 h-3 mr-1" />
																Already Logged Out
															</>
														) : (
															<>
																<LogOut className="w-3 h-3 mr-1" />
																Force Logout
															</>
														)}
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							{/* Mobile Cards */}
							<div className="md:hidden space-y-4 p-4">
								{filteredApprovedStaff.map((staff) => (
									<div key={staff.id} className="bg-gray-50 rounded-lg p-4 border">
										<div className="flex items-start justify-between mb-3">
											<div className="flex items-center">
												<div className="flex-shrink-0 h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
													<span className="text-green-600 font-medium">
														{staff.name?.charAt(0).toUpperCase() || staff.email?.charAt(0).toUpperCase()}
													</span>
												</div>
												<div className="ml-3">
													<div className="font-medium text-gray-900">
														{staff.name || "N/A"}
													</div>
													<div className="text-sm text-gray-500">
														ID: {staff.id}
													</div>
												</div>
											</div>
											{getLoginStatusBadge(staff)}
										</div>
										
										<div className="space-y-2 text-sm mb-4">
											<div className="flex justify-between">
												<span className="text-gray-500">Role</span>
												<span className="font-medium capitalize">{staff.role || "staff"}</span>
											</div>
											<div className="flex justify-between">
												<span className="text-gray-500">Email</span>
												<span className="font-medium text-right">{staff.email}</span>
											</div>
											{staff.phone && (
												<div className="flex justify-between">
													<span className="text-gray-500">Phone</span>
													<span className="font-medium">{staff.phone}</span>
												</div>
											)}
											<div className="flex justify-between">
												<span className="text-gray-500">Approved</span>
												<span className="font-medium text-right">
														{staff.approved_at ? formatDateMobile(staff.login_approved_at) : ""}
													</span>
												</div>
											<div className="flex justify-between">
												<span className="text-gray-500">Time Since</span>
												<span className="font-medium">{getTimeSinceApproval(staff.login_approved_at)}</span>
											</div>
										</div>

										<div className="flex justify-end">
											<button
												onClick={() => handleLogoutUser(staff.id, staff.name)}
												disabled={loggingOutId === staff.id || staff.is_logged_out}
												className={`w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md ${
													loggingOutId === staff.id
														? "bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300"
														: staff.is_logged_out
														? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
														: "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
												} transition-colors`}
											>
												{loggingOutId === staff.id ? (
													<>
														<div className="animate-spin rounded-full h-3 w-3 border-b-1 border-red-600 mr-2"></div>
														Logging out...
													</>
												) : staff.is_logged_out ? (
													<>
														<LogOut className="w-4 h-4 mr-2" />
														Already Logged Out
													</>
												) : (
													<>
														<LogOut className="w-4 h-4 mr-2" />
														Force Logout
													</>
												)}
											</button>
										</div>
									</div>
								))}
							</div>
						</>
					)}
				</div>
			)}

			{/* Stats Summary */}
			{!loading && (
				<div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
					<div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4">
						<div className="text-xs sm:text-sm font-medium text-gray-500">Total Requests</div>
						<div className="text-xl sm:text-2xl font-semibold text-gray-900 mt-1">
							{users.length}
						</div>
					</div>
					<div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4">
						<div className="text-xs sm:text-sm font-medium text-gray-500">Pending Approval</div>
						<div className="text-xl sm:text-2xl font-semibold text-yellow-600 mt-1">
							{users.filter(user => !user.is_approved).length}
						</div>
					</div>
					<div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4">
						<div className="text-xs sm:text-sm font-medium text-gray-500">Approved Today</div>
						<div className="text-xl sm:text-2xl font-semibold text-green-600 mt-1">
							{approvedStaff.length}
						</div>
					</div>
				</div>
			)}

			<style jsx>{`
				@keyframes fade-in {
					from {
						opacity: 0;
						transform: translateY(-10px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}
				.animate-fade-in {
					animation: fade-in 0.3s ease-out;
				}
			`}</style>
		</div>
	);
}