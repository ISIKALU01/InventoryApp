// pages/authorizeUser.js
import { useState, useEffect, useRef } from "react";
import http from "../../services/http";
import {
	AlertTriangle,
	Check,
	CheckCircle2,
	ChevronDown,
	Clock,
	Loader2,
	LogOut,
	Mail,
	Phone,
	RefreshCw,
	Search,
	ShieldCheck,
	SlidersHorizontal,
	UserCheck,
	Users,
	X,
	XCircle,
} from "lucide-react";

const TOAST_DURATION = { success: 3000, error: 5000 };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const toList = (body) => (Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : []);

const initialOf = (person) =>
	(person.name?.charAt(0) || person.email?.charAt(0) || "?").toUpperCase();

const toDate = (value) => {
	if (!value) return null;
	const date = new Date(typeof value === "string" ? value.replace(" ", "T") : value);
	return Number.isNaN(date.getTime()) ? null : date;
};

const formatDay = (value) =>
	toDate(value)?.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" }) || "N/A";

const formatClock = (value) =>
	toDate(value)?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) || "";

const timeAgo = (value) => {
	const date = toDate(value);
	if (!date) return "";
	const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
	if (minutes < 1) return "Just now";
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	return `${Math.floor(hours / 24)}d ago`;
};

const capitalize = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : "");

// When a staff member's login was approved (field name varies by endpoint)
const approvedAtOf = (staff) => staff.login_approved_at || staff.approved_at;

// ---------------------------------------------------------------------------
// Shared pieces (same look as the transaction, inventory and settings pages)
// ---------------------------------------------------------------------------

const filterFieldClass =
	"block w-full h-8 px-2.5 text-xs text-gray-800 bg-gray-100 border-0 rounded-none outline-none shadow-none appearance-none transition-colors placeholder:text-gray-400 focus:bg-gray-50 focus:outline-none focus:ring-0";

const statLabelClass = "text-[10px] font-semibold tracking-wide text-gray-500 uppercase";

const secondaryButtonClass =
	"flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-none transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed";

const dangerButtonClass =
	"flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-none transition-colors hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed";

const FilterSelect = ({ className = "", children, ...props }) => (
	<div className={`relative ${className}`}>
		<select {...props} className={`${filterFieldClass} pr-7 cursor-pointer`}>
			{children}
		</select>
		<ChevronDown
			size={13}
			className="absolute text-gray-400 -translate-y-1/2 pointer-events-none right-2.5 top-1/2"
		/>
	</div>
);

const Toast = ({ toast, onClose }) => {
	const isError = toast.type === "error";
	const Icon = isError ? XCircle : CheckCircle2;

	return (
		<div
			role={isError ? "alert" : "status"}
			className="fixed z-[60] top-4 right-4 left-4 sm:left-auto sm:w-96 toast-in"
		>
			<div
				className={`relative overflow-hidden bg-white border border-gray-200 border-l-4 shadow-xl ${
					isError ? "border-l-red-600" : "border-l-green-600"
				}`}
			>
				<div className="flex items-start gap-3 px-4 py-3.5">
					<Icon size={20} className={`mt-0.5 shrink-0 ${isError ? "text-red-600" : "text-green-600"}`} />
					<div className="flex-1 min-w-0">
						<p className="text-sm font-semibold text-gray-900">
							{toast.title || (isError ? "Something went wrong" : "Done")}
						</p>
						<p className="mt-0.5 text-sm text-gray-600 break-words">{toast.message}</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Dismiss"
						className="flex items-center justify-center -mr-1 text-gray-400 transition-colors w-7 h-7 shrink-0 hover:bg-gray-100 hover:text-gray-700"
					>
						<X size={16} />
					</button>
				</div>
				<div
					className={`h-1 toast-progress ${isError ? "bg-red-600/30" : "bg-green-600/30"}`}
					style={{ animationDuration: `${TOAST_DURATION[toast.type]}ms` }}
				/>
			</div>
		</div>
	);
};

const ModalShell = ({ title, subtitle, icon: Icon, iconClass = "bg-blue-600", onClose, busy, children }) => (
	<div
		className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto bg-gray-900/20 backdrop-blur-[2px]"
		onClick={(e) => {
			if (e.target === e.currentTarget && !busy) onClose();
		}}
	>
		<div
			role="dialog"
			aria-modal="true"
			className="relative w-full max-w-md bg-white border border-gray-300 rounded-none shadow-2xl modal-in"
		>
			<div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-200">
				<div className="flex items-center min-w-0 gap-3">
					<div className={`flex items-center justify-center w-10 h-10 text-white shrink-0 ${iconClass}`}>
						<Icon size={20} />
					</div>
					<div className="min-w-0">
						<h2 className="text-lg font-semibold leading-tight text-gray-900 truncate">{title}</h2>
						{subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
					</div>
				</div>
				<button
					type="button"
					onClick={onClose}
					disabled={busy}
					aria-label="Close"
					className="flex items-center justify-center w-8 h-8 text-gray-400 transition-colors shrink-0 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
				>
					<X size={16} />
				</button>
			</div>
			{children}
		</div>
	</div>
);

const SummaryRow = ({ label, value }) => (
	<div className="flex items-center justify-between gap-4 px-4 py-2.5 bg-white">
		<span className="text-sm text-gray-600">{label}</span>
		<span className="text-sm font-medium text-right text-gray-900 truncate">{value}</span>
	</div>
);

const EmptyState = ({ icon: Icon, title, hint, tone = "gray", action }) => (
	<div className="flex flex-col items-center justify-center px-5 text-center py-14">
		<div
			className={`flex items-center justify-center w-12 h-12 mb-3 ${
				tone === "red" ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-400"
			}`}
		>
			<Icon size={22} />
		</div>
		<p className="text-sm font-medium text-gray-700">{title}</p>
		{hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
		{action && <div className="mt-4">{action}</div>}
	</div>
);

const Avatar = ({ person, tone = "blue" }) => (
	<div
		className={`flex items-center justify-center w-9 h-9 text-sm font-semibold shrink-0 ${
			tone === "green" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"
		}`}
	>
		{initialOf(person)}
	</div>
);

const Badge = ({ className, icon: Icon, children }) => (
	<span
		className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${className}`}
	>
		{Icon && <Icon size={11} />}
		{children}
	</span>
);

const RoleBadge = ({ role, fallback }) => (
	<Badge className="text-gray-700 bg-gray-100">{capitalize(role || fallback)}</Badge>
);

const ApprovalBadge = ({ approved }) =>
	approved ? (
		<Badge className="text-green-700 bg-green-50" icon={Check}>
			Approved
		</Badge>
	) : (
		<Badge className="text-amber-700 bg-amber-50" icon={Clock}>
			Pending
		</Badge>
	);

const LoginBadge = ({ staff }) =>
	staff.is_logged_out ? (
		<Badge className="text-gray-600 bg-gray-100" icon={LogOut}>
			Logged Out
		</Badge>
	) : (
		<Badge className="text-green-700 bg-green-50" icon={Check}>
			Logged In
		</Badge>
	);

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function UserApproval() {
	const [users, setUsers] = useState([]);
	const [approvedStaff, setApprovedStaff] = useState([]);
	const [loading, setLoading] = useState(true);
	const [approvedLoading, setApprovedLoading] = useState(true);
	const [error, setError] = useState(null);
	const [approvedError, setApprovedError] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [roleFilter, setRoleFilter] = useState("all");
	const [approvingId, setApprovingId] = useState(null);
	const [activeTab, setActiveTab] = useState("pending");
	const [showFilters, setShowFilters] = useState(false);
	const [logoutTarget, setLogoutTarget] = useState(null);
	const [loggingOut, setLoggingOut] = useState(false);
	const [logoutError, setLogoutError] = useState("");

	const [toast, setToast] = useState(null);
	const toastTimer = useRef(null);

	const notify = (type, message, title) => {
		clearTimeout(toastTimer.current);
		setToast({ id: Date.now(), type, message, title });
		toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION[type]);
	};

	const closeToast = () => {
		clearTimeout(toastTimer.current);
		setToast(null);
	};

	useEffect(() => () => clearTimeout(toastTimer.current), []);

	// Fetch login requests
	const fetchLoginRequests = async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await http.get("/admin/login-requests");
			setUsers(toList(response.data));
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
			setApprovedError(null);
			const response = await http.get("/admin/approved-staff-today");
			setApprovedStaff(toList(response.data));
		} catch (err) {
			console.error("Failed to fetch approved staff:", err);
			setApprovedError(err.response?.data?.message || "Failed to load approved staff");
		} finally {
			setApprovedLoading(false);
		}
	};

	// Both lists load up front so the tab counts and tiles are right straight away
	useEffect(() => {
		fetchLoginRequests();
		fetchApprovedStaff();
	}, []);

	const refreshing = loading || approvedLoading;
	const handleRefresh = () => {
		fetchLoginRequests();
		fetchApprovedStaff();
	};

	// Approve user
	const handleApprove = async (user) => {
		try {
			setApprovingId(user.id);
			await http.post(`/admin/approve/${user.id}`, {});

			setUsers((prev) =>
				prev.map((u) =>
					u.id === user.id ? { ...u, is_approved: true, approved_at: new Date().toISOString() } : u
				)
			);
			notify("success", `${user.name || user.email} can now sign in.`, "User approved");
			fetchApprovedStaff();
		} catch (err) {
			console.error("Failed to approve user:", err);
			notify("error", err.response?.data?.message || "Failed to approve user", "Not approved");
		} finally {
			setApprovingId(null);
		}
	};

	// Force logout (from all devices), confirmed in a modal first
	const openLogout = (staff) => {
		setLogoutError("");
		setLogoutTarget(staff);
	};

	const closeLogout = () => {
		if (!loggingOut) setLogoutTarget(null);
	};

	const confirmLogout = async () => {
		const staff = logoutTarget;
		try {
			setLoggingOut(true);
			setLogoutError("");
			await http.post(`/staff/${staff.id}/logout`, {});

			setApprovedStaff((prev) =>
				prev.map((s) =>
					s.id === staff.id ? { ...s, is_logged_out: true, logged_out_at: new Date().toISOString() } : s
				)
			);
			setLogoutTarget(null);
			notify("success", `${staff.name || "The user"} was signed out of all devices.`, "User logged out");
		} catch (err) {
			console.error("Failed to logout user:", err);
			setLogoutError(err.response?.data?.message || "Failed to logout user");
		} finally {
			setLoggingOut(false);
		}
	};

	useEffect(() => {
		if (!logoutTarget) return;
		const onKey = (e) => {
			if (e.key === "Escape") closeLogout();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	});

	// ---- Filtering -----------------------------------------------------------

	const term = searchTerm.trim().toLowerCase();
	const matchesSearch = (person) =>
		term === "" ||
		[person.name, person.email, person.role, person.phone].some((field) =>
			field?.toString().toLowerCase().includes(term)
		);

	const filteredPendingUsers = users.filter(
		(user) =>
			matchesSearch(user) &&
			(statusFilter === "all" ||
				(statusFilter === "pending" && !user.is_approved) ||
				(statusFilter === "approved" && user.is_approved))
	);

	const filteredApprovedStaff = approvedStaff.filter(
		(staff) =>
			matchesSearch(staff) &&
			(roleFilter === "all" || staff.role?.toLowerCase() === roleFilter.toLowerCase())
	);

	const uniqueRoles = [...new Set(approvedStaff.map((staff) => staff.role).filter(Boolean))].sort();
	const pendingCount = users.filter((u) => !u.is_approved).length;
	const loggedInCount = approvedStaff.filter((s) => !s.is_logged_out).length;

	const isPendingTab = activeTab === "pending";
	const hasFilters = Boolean(searchTerm) || (isPendingTab ? statusFilter !== "all" : roleFilter !== "all");

	const clearFilters = () => {
		setSearchTerm("");
		setStatusFilter("all");
		setRoleFilter("all");
	};

	const tiles = [
		{ icon: Users, iconClass: "bg-blue-50 text-blue-700", label: "Total Requests", value: users.length, busy: loading },
		{ icon: Clock, iconClass: "bg-amber-50 text-amber-700", label: "Pending Approval", value: pendingCount, busy: loading },
		{
			icon: UserCheck,
			iconClass: "bg-green-50 text-green-700",
			label: "Approved Today",
			value: approvedStaff.length,
			hint: approvedStaff.length ? `${loggedInCount} signed in now` : null,
			busy: approvedLoading,
		},
	];

	const tabs = [
		{ id: "pending", label: "Pending Approval", icon: Clock, count: pendingCount, countClass: "bg-amber-50 text-amber-700" },
		{ id: "approved", label: "Approved Today", icon: Users, count: approvedStaff.length, countClass: "bg-green-50 text-green-700" },
	];

	const filterSelect = isPendingTab ? (
		<FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
			<option value="all">All Users</option>
			<option value="pending">Pending Only</option>
			<option value="approved">Approved Only</option>
		</FilterSelect>
	) : (
		<FilterSelect value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} aria-label="Filter by role">
			<option value="all">All Roles</option>
			{uniqueRoles.map((role) => (
				<option key={role} value={role}>
					{capitalize(role)}
				</option>
			))}
		</FilterSelect>
	);

	const approveButton = (user, full = false) =>
		user.is_approved ? (
			<span className="text-xs text-gray-500">{timeAgo(user.approved_at) || "Approved"}</span>
		) : (
			<button
				onClick={() => handleApprove(user)}
				disabled={approvingId === user.id}
				className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white transition-colors bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed ${
					full ? "w-full" : ""
				}`}
			>
				{approvingId === user.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
				{approvingId === user.id ? "Approving…" : "Approve"}
			</button>
		);

	const logoutButton = (staff, full = false) => (
		<button
			onClick={() => openLogout(staff)}
			disabled={staff.is_logged_out}
			className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border disabled:cursor-not-allowed ${
				staff.is_logged_out
					? "text-gray-400 bg-gray-50 border-gray-200"
					: "text-red-600 bg-white border-gray-300 hover:bg-red-50 hover:border-red-200"
			} ${full ? "w-full" : ""}`}
		>
			<LogOut size={13} />
			{staff.is_logged_out ? "Logged Out" : "Force Logout"}
		</button>
	);

	// ---- Render --------------------------------------------------------------

	const renderPending = () => {
		if (loading) {
			return (
				<div className="flex items-center justify-center gap-3 text-sm text-gray-500 py-14">
					<Loader2 size={20} className="text-blue-600 animate-spin" />
					Loading users…
				</div>
			);
		}
		if (error) {
			return (
				<EmptyState
					icon={AlertTriangle}
					tone="red"
					title="Couldn't load users"
					hint={error}
					action={
						<button onClick={fetchLoginRequests} className={secondaryButtonClass}>
							Try again
						</button>
					}
				/>
			);
		}
		if (filteredPendingUsers.length === 0) {
			return (
				<EmptyState
					icon={Users}
					title={users.length === 0 ? "No login requests" : "No users match your filters"}
					hint={users.length === 0 ? "New sign-in requests will appear here" : "Try a different search or status"}
					action={
						hasFilters && (
							<button onClick={clearFilters} className={secondaryButtonClass}>
								Clear filters
							</button>
						)
					}
				/>
			);
		}

		return (
			<>
				{/* Desktop Table */}
				<div className="hidden md:block">
					<table className="w-full text-sm table-fixed">
						<colgroup>
							<col />
							<col className="w-[14%]" />
							<col className="w-[14%]" />
							<col className="w-[20%]" />
							<col className="w-[9rem]" />
						</colgroup>
						<thead className="border-b border-gray-200 bg-gray-50">
							<tr className="text-left">
								<th className={`px-5 py-2.5 ${statLabelClass}`}>User</th>
								<th className={`px-3 py-2.5 ${statLabelClass}`}>Role</th>
								<th className={`px-3 py-2.5 ${statLabelClass}`}>Status</th>
								<th className={`px-3 py-2.5 ${statLabelClass}`}>Requested</th>
								<th className={`px-5 py-2.5 text-right ${statLabelClass}`}>Action</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{filteredPendingUsers.map((user) => (
								<tr key={user.id} className="transition-colors hover:bg-blue-50/50">
									<td className="px-5 py-3">
										<div className="flex items-center min-w-0 gap-3">
											<Avatar person={user} />
											<div className="min-w-0">
												<div className="font-medium text-gray-900 truncate">{user.name || "N/A"}</div>
												<div className="text-xs text-gray-500 truncate">{user.email}</div>
											</div>
										</div>
									</td>
									<td className="px-3 py-3">
										<RoleBadge role={user.role} fallback="user" />
									</td>
									<td className="px-3 py-3">
										<ApprovalBadge approved={user.is_approved} />
									</td>
									<td className="px-3 py-3">
										<div className="text-gray-900">{formatDay(user.created_at)}</div>
										<div className="text-xs text-gray-500">{formatClock(user.created_at)}</div>
									</td>
									<td className="px-5 py-3 text-right">{approveButton(user)}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* Mobile Cards */}
				<ul className="divide-y divide-gray-100 md:hidden">
					{filteredPendingUsers.map((user) => (
						<li key={user.id} className="px-5 py-4">
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-center min-w-0 gap-3">
									<Avatar person={user} />
									<div className="min-w-0">
										<p className="text-sm font-semibold text-gray-900 truncate">{user.name || "N/A"}</p>
										<p className="flex items-center gap-1 text-xs text-gray-500 truncate">
											<Mail size={11} className="shrink-0" />
											{user.email}
										</p>
									</div>
								</div>
								<ApprovalBadge approved={user.is_approved} />
							</div>
							<div className="grid grid-cols-2 gap-px mt-3 bg-gray-200 border border-gray-200">
								<div className="px-2.5 py-2 bg-white">
									<div className={statLabelClass}>Role</div>
									<div className="text-xs font-semibold text-gray-900">{capitalize(user.role || "user")}</div>
								</div>
								<div className="px-2.5 py-2 bg-white">
									<div className={statLabelClass}>Requested</div>
									<div className="text-xs font-semibold text-gray-900">
										{formatDay(user.created_at)} · {formatClock(user.created_at)}
									</div>
								</div>
							</div>
							{!user.is_approved && <div className="mt-3">{approveButton(user, true)}</div>}
						</li>
					))}
				</ul>
			</>
		);
	};

	const renderApproved = () => {
		if (approvedLoading && approvedStaff.length === 0) {
			return (
				<div className="flex items-center justify-center gap-3 text-sm text-gray-500 py-14">
					<Loader2 size={20} className="text-blue-600 animate-spin" />
					Loading approved staff…
				</div>
			);
		}
		if (approvedError && approvedStaff.length === 0) {
			return (
				<EmptyState
					icon={AlertTriangle}
					tone="red"
					title="Couldn't load approved staff"
					hint={approvedError}
					action={
						<button onClick={fetchApprovedStaff} className={secondaryButtonClass}>
							Try again
						</button>
					}
				/>
			);
		}
		if (filteredApprovedStaff.length === 0) {
			return (
				<EmptyState
					icon={ShieldCheck}
					title={approvedStaff.length === 0 ? "No staff approved today" : "No staff match your filters"}
					hint={approvedStaff.length === 0 ? "Staff you approve today will appear here" : "Try a different search or role"}
					action={
						hasFilters && (
							<button onClick={clearFilters} className={secondaryButtonClass}>
								Clear filters
							</button>
						)
					}
				/>
			);
		}

		return (
			<>
				{/* Desktop Table */}
				<div className="hidden md:block">
					<table className="w-full text-sm table-fixed">
						<colgroup>
							<col />
							<col className="w-[12%]" />
							<col className="w-[22%]" />
							<col className="w-[15%]" />
							<col className="w-[13%]" />
							<col className="w-[9.5rem]" />
						</colgroup>
						<thead className="border-b border-gray-200 bg-gray-50">
							<tr className="text-left">
								<th className={`px-5 py-2.5 ${statLabelClass}`}>Staff Member</th>
								<th className={`px-3 py-2.5 ${statLabelClass}`}>Role</th>
								<th className={`px-3 py-2.5 ${statLabelClass}`}>Contact</th>
								<th className={`px-3 py-2.5 ${statLabelClass}`}>Approved</th>
								<th className={`px-3 py-2.5 ${statLabelClass}`}>Login</th>
								<th className={`px-5 py-2.5 text-right ${statLabelClass}`}>Action</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{filteredApprovedStaff.map((staff) => (
								<tr key={staff.id} className="transition-colors hover:bg-blue-50/50">
									<td className="px-5 py-3">
										<div className="flex items-center min-w-0 gap-3">
											<Avatar person={staff} tone="green" />
											<div className="min-w-0">
												<div className="font-medium text-gray-900 truncate">{staff.name || "N/A"}</div>
												<div className="text-xs text-gray-500">ID {staff.id}</div>
											</div>
										</div>
									</td>
									<td className="px-3 py-3">
										<RoleBadge role={staff.role} fallback="staff" />
									</td>
									<td className="px-3 py-3">
										<div className="text-gray-900 truncate" title={staff.email}>{staff.email}</div>
										{staff.phone && (
											<div className="flex items-center gap-1 text-xs text-gray-500 truncate">
												<Phone size={11} className="shrink-0" />
												{staff.phone}
											</div>
										)}
									</td>
									<td className="px-3 py-3">
										<div className="text-gray-900">{formatClock(approvedAtOf(staff)) || "—"}</div>
										<div className="text-xs text-gray-500">{timeAgo(approvedAtOf(staff))}</div>
									</td>
									<td className="px-3 py-3">
										<LoginBadge staff={staff} />
									</td>
									<td className="px-5 py-3 text-right">{logoutButton(staff)}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* Mobile Cards */}
				<ul className="divide-y divide-gray-100 md:hidden">
					{filteredApprovedStaff.map((staff) => (
						<li key={staff.id} className="px-5 py-4">
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-center min-w-0 gap-3">
									<Avatar person={staff} tone="green" />
									<div className="min-w-0">
										<p className="text-sm font-semibold text-gray-900 truncate">{staff.name || "N/A"}</p>
										<p className="text-xs text-gray-500 truncate">{staff.email}</p>
									</div>
								</div>
								<LoginBadge staff={staff} />
							</div>
							<div className="grid grid-cols-3 gap-px mt-3 bg-gray-200 border border-gray-200">
								{[
									["Role", capitalize(staff.role || "staff")],
									["Approved", formatClock(approvedAtOf(staff)) || "—"],
									["Since", timeAgo(approvedAtOf(staff)) || "—"],
								].map(([label, value]) => (
									<div key={label} className="px-2.5 py-2 bg-white">
										<div className={statLabelClass}>{label}</div>
										<div className="text-xs font-semibold text-gray-900 truncate">{value}</div>
									</div>
								))}
							</div>
							{staff.phone && (
								<p className="flex items-center gap-1 mt-2 text-xs text-gray-500">
									<Phone size={11} />
									{staff.phone}
								</p>
							)}
							<div className="mt-3">{logoutButton(staff, true)}</div>
						</li>
					))}
				</ul>
			</>
		);
	};

	const shownCount = isPendingTab ? filteredPendingUsers.length : filteredApprovedStaff.length;

	return (
		<div className="pt-0 mt-0 font-raleway">
			{toast && <Toast key={toast.id} toast={toast} onClose={closeToast} />}

			{/* Force Logout Confirmation */}
			{logoutTarget && (
				<ModalShell
					title="Force Logout"
					subtitle="Signs them out of every device"
					icon={LogOut}
					iconClass="bg-red-600"
					onClose={closeLogout}
					busy={loggingOut}
				>
					<div className="px-6 py-5 space-y-4">
						{logoutError && (
							<div
								role="alert"
								className="flex items-start gap-3 px-4 py-3 text-sm text-red-800 border border-red-200 bg-red-50"
							>
								<AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" />
								<div>
									<p className="font-semibold">Not logged out</p>
									<p className="mt-0.5 text-red-700">{logoutError}</p>
								</div>
							</div>
						)}
						<p className="text-sm text-gray-600">
							They&apos;ll be signed out of every device they&apos;re using straight away.
						</p>
						<div className="grid gap-px bg-gray-200 border border-gray-200">
							<SummaryRow label="Name" value={logoutTarget.name || "N/A"} />
							<SummaryRow label="Email" value={logoutTarget.email || "—"} />
							<SummaryRow label="Role" value={capitalize(logoutTarget.role || "staff")} />
						</div>
					</div>
					<div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
						<button onClick={closeLogout} disabled={loggingOut} className={secondaryButtonClass}>
							Cancel
						</button>
						<button onClick={confirmLogout} disabled={loggingOut} className={dangerButtonClass}>
							{loggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
							{loggingOut ? "Logging out…" : "Force Logout"}
						</button>
					</div>
				</ModalShell>
			)}

			<h1 className="hidden mb-1 text-xl font-normal text-gray-800 md:block">User Management</h1>
			<p className="hidden mb-5 text-sm text-gray-500 md:block">Approve sign-in requests and manage who is signed in today</p>

			<div className="space-y-5">
				{/* Summary Tiles */}
				<div className="grid grid-cols-1 gap-px bg-gray-200 border border-gray-200 sm:grid-cols-3">
					{tiles.map(({ icon: Icon, iconClass, label, value, hint, busy }) => (
						<div key={label} className="flex items-center gap-3 px-4 py-4 bg-white">
							<div className={`flex items-center justify-center w-10 h-10 shrink-0 ${iconClass}`}>
								<Icon size={18} />
							</div>
							<div className="min-w-0">
								<div className={statLabelClass}>{label}</div>
								<div className="text-lg font-bold leading-tight text-gray-900">{busy ? "…" : value}</div>
								{hint && !busy && <div className="text-xs text-gray-500 truncate">{hint}</div>}
							</div>
						</div>
					))}
				</div>

				<section className="bg-white border border-gray-200">
					{/* Tabs + actions */}
					<div className="flex flex-wrap items-stretch justify-between border-b border-gray-200">
						<div className="flex overflow-x-auto" role="tablist">
							{tabs.map(({ id, label, icon: Icon, count, countClass }) => {
								const active = activeTab === id;
								return (
									<button
										key={id}
										role="tab"
										aria-selected={active}
										onClick={() => setActiveTab(id)}
										className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
											active
												? "border-blue-600 text-blue-700"
												: "border-transparent text-gray-500 hover:text-gray-800"
										}`}
									>
										<Icon size={15} />
										{label}
										{count > 0 && <span className={`px-1.5 py-px text-[11px] font-semibold ${countClass}`}>{count}</span>}
									</button>
								);
							})}
						</div>
						<div className="flex items-center gap-2 px-5 py-2">
							<span className="text-xs text-gray-500">
								{shownCount} {isPendingTab ? (shownCount === 1 ? "user" : "users") : "staff"}
							</span>
							{hasFilters && (
								<button
									onClick={clearFilters}
									className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
								>
									<X size={14} />
									Clear filters
								</button>
							)}
							<button
								onClick={handleRefresh}
								disabled={refreshing}
								className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 transition-colors bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-60"
							>
								<RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
								Refresh
							</button>
						</div>
					</div>

					{/* Filters */}
					<div className="px-5 py-3 border-b border-gray-200">
						<div className="flex gap-2 md:grid md:grid-cols-[minmax(0,1fr)_12rem]">
							<div className="relative flex-1 min-w-0">
								<Search
									size={13}
									className="absolute text-gray-400 -translate-y-1/2 pointer-events-none left-2.5 top-1/2"
								/>
								<input
									type="search"
									placeholder={isPendingTab ? "Search by name, email or role" : "Search approved staff"}
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className={`${filterFieldClass} pl-8`}
								/>
							</div>
							<button
								type="button"
								onClick={() => setShowFilters((open) => !open)}
								aria-expanded={showFilters}
								className={`flex items-center h-8 gap-1.5 px-2.5 text-xs font-medium transition-colors md:hidden ${
									showFilters || (isPendingTab ? statusFilter !== "all" : roleFilter !== "all")
										? "bg-blue-600 text-white"
										: "bg-gray-100 text-gray-700"
								}`}
							>
								{showFilters ? <X size={13} /> : <SlidersHorizontal size={13} />}
								Filters
							</button>
							<div className="hidden md:block">{filterSelect}</div>
						</div>
						{showFilters && <div className="mt-2 md:hidden">{filterSelect}</div>}
					</div>

					{isPendingTab ? renderPending() : renderApproved()}
				</section>
			</div>

			<style jsx global>{`
				@keyframes toast-in {
					from {
						opacity: 0;
						transform: translateY(-8px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}
				@keyframes toast-progress {
					from {
						width: 100%;
					}
					to {
						width: 0%;
					}
				}
				@keyframes modal-in {
					from {
						opacity: 0;
						transform: translateY(8px) scale(0.98);
					}
					to {
						opacity: 1;
						transform: translateY(0) scale(1);
					}
				}
				.toast-in {
					animation: toast-in 0.2s ease-out;
				}
				.toast-progress {
					animation-name: toast-progress;
					animation-timing-function: linear;
					animation-fill-mode: forwards;
				}
				.modal-in {
					animation: modal-in 0.18s ease-out;
				}
			`}</style>
		</div>
	);
}
