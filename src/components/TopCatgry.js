import { useState, useEffect } from "react";
import http from "../../services/http";
import { useAuth } from "../context/AuthContext";

// Lists come back bare ([...]) or wrapped ({ data: [...] } / { products: [...] })
const toList = (body, key) => {
	if (Array.isArray(body)) return body;
	if (Array.isArray(body?.data)) return body.data;
	if (Array.isArray(body?.[key])) return body[key];
	return [];
};

const byName = (a, b) => String(a.name || "").localeCompare(String(b.name || ""));

const capitalize = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : "");

// What each dropdown option lists, and the second column it shows
const SOURCES = {
	product: {
		label: "Products",
		heading: "Product Name",
		valueHeading: "Price (₦)",
		load: async () => toList((await http.get("/products")).data, "products"),
		value: (item) => `₦${Number(item.price || 0).toLocaleString()}`,
	},
	store: {
		label: "Stores",
		heading: "Store",
		valueHeading: "Type",
		load: async () => toList((await http.get("/stores")).data, "stores"),
		value: (item) => (item.type === "back_store" ? "Back store" : "Shop"),
	},
	user: {
		label: "Users",
		heading: "Signed-in User",
		valueHeading: "Role",
		// Staff whose sign-in was approved today and who haven't signed out since
		permission: "users.manage",
		load: async () =>
			toList((await http.get("/admin/approved-staff-today")).data, "staff").filter((staff) => !staff.is_logged_out),
		value: (item) => capitalize(item.role?.name || item.role) || "N/A",
	},
};

export default function TopCatgry() {
	const { can } = useAuth();
	const [filterBy, setFilterBy] = useState("product");
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const source = SOURCES[filterBy];
	const allowed = !source.permission || can(source.permission);

	useEffect(() => {
		if (!allowed) {
			setItems([]);
			setError("");
			return;
		}

		let cancelled = false;
		setLoading(true);
		setError("");
		source
			.load()
			.then((list) => {
				if (!cancelled) setItems([...list].sort(byName));
			})
			.catch((err) => {
				console.error(`Error fetching ${filterBy} list:`, err);
				if (!cancelled) {
					setItems([]);
					setError(err.response?.status === 403 ? "Your role can't see this list." : "Couldn't load this list.");
				}
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [filterBy, allowed]); // eslint-disable-line react-hooks/exhaustive-deps

	const emptyMessage = !allowed
		? "Your role can't see who is signed in."
		: error || (filterBy === "user" ? "No one is signed in right now." : `No ${source.label.toLowerCase()} yet.`);

	return (
		<div className="bg-white shadow-md rounded-lg p-6">
			{/* Header with list picker */}
			<div className="flex flex-wrap items-center justify-between gap-3 mb-6">
				<select
					className="text-xs text-gray-600 bg-transparent border-none py-1 pr-7 focus:ring-0"
					value={filterBy}
					onChange={(e) => setFilterBy(e.target.value)}
				>
					{Object.entries(SOURCES).map(([id, s]) => (
						<option key={id} value={id}>
							{s.label}
						</option>
					))}
				</select>
				{!loading && items.length > 0 && <span className="text-xs text-gray-500">{items.length} total</span>}
			</div>

			{/* Table Section */}
			{loading ? (
				<p className="text-center text-gray-500 text-sm py-6">Loading...</p>
			) : items.length > 0 ? (
				<div className="overflow-y-auto max-h-80">
					<table className="w-full">
						<thead className="sticky top-0 bg-white">
							<tr className="text-xs text-gray-500 font-medium">
								<th className="pb-2 text-left">#</th>
								<th className="pb-2 text-left">{source.heading}</th>
								<th className="pb-2 text-right">{source.valueHeading}</th>
							</tr>
						</thead>
						<tbody>
							{items.map((item, index) => (
								<tr key={item.id || index} className="text-xs hover:bg-gray-50 even:bg-gray-50/30">
									<td className="py-3 text-gray-500">{index + 1}</td>
									<td className="py-3 font-medium text-gray-700">{item.name || item.email || "N/A"}</td>
									<td className="py-3 text-right font-medium text-gray-800">{source.value(item)}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			) : (
				<p className="text-center text-gray-400 text-sm py-6">{emptyMessage}</p>
			)}
		</div>
	);
}
