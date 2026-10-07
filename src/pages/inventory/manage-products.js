import { useState, useEffect } from "react";
import InventoryNav from "../../components/InventoryNav";
import {
	FaSearch,
	FaPlus,
	FaFileImport,
	FaFileCsv,
	FaDownload,
	FaSlidersH,
	FaTimes,
	FaStore,
	FaChartBar,
	FaEdit,
	FaTrash,
	FaMoneyBillWave,
	FaTags,
	FaTag,
	FaBarcode,
	FaAlignLeft,
	FaBox,
	FaCheckCircle,
	FaExclamationTriangle,
} from "react-icons/fa";
import { useRouter } from "next/router";

import { productAPI } from "../../../services/api";

// ---------------------------------------------------------------------------
// Number / data helpers
// ---------------------------------------------------------------------------

// Coerce API/CSV values ("1,500.00", "₦200", 12, null) into a finite number
const toNumber = (value) => {
	if (value === null || value === undefined || value === "") return 0;
	const num =
		typeof value === "number"
			? value
			: parseFloat(String(value).replace(/[₦,\s]/g, ""));
	return Number.isFinite(num) ? num : 0;
};

// Round to kobo so currency values don't drift
const roundMoney = (value) => Math.round(value * 100) / 100;

// Ids may arrive as strings or numbers depending on the source
const sameId = (a, b) =>
	a !== null && a !== undefined && b !== null && b !== undefined &&
	String(a) === String(b);

// Helper function to safely format numbers in Naira
const formatCurrency = (value) =>
	`₦${toNumber(value).toLocaleString(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;

// Profit and margin for a selling price / cost price pair
const getMargin = (price, costPrice) => {
	const sell = toNumber(price);
	const cost = toNumber(costPrice);
	const profit = roundMoney(sell - cost);
	return {
		profit,
		marginPercent: sell > 0 ? (profit / sell) * 100 : 0,
		hasCost: cost > 0,
	};
};

const formatPercent = (value) => `${value.toFixed(1)}%`;

// API responses may be wrapped as { data }, { [key] } or returned bare
const unwrapResponse = (response, key) => {
	if (response?.data && typeof response.data === "object") return response.data;
	if (key && response?.[key] && typeof response[key] === "object") return response[key];
	return response;
};

const toProductList = (response) => {
	if (Array.isArray(response)) return response;
	if (Array.isArray(response?.data)) return response.data;
	if (Array.isArray(response?.products)) return response.products;
	console.warn("Unexpected API response structure:", response);
	return [];
};

// Merge a server response over the data we sent
const normalizeProduct = (response, fallback) => {
	const raw = unwrapResponse(response, "product");
	const serverFields =
		raw && typeof raw === "object"
			? Object.fromEntries(
					Object.entries(raw).filter(([, v]) => v !== undefined && v !== null)
			  )
			: {};
	return { ...fallback, ...serverFields };
};

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

// RFC 4180-style parser: quoted fields, escaped quotes, CRLF, BOM,
// and comma or semicolon delimiters (detected from the header line)
const parseCSV = (text) => {
	const src = text.replace(/^﻿/, "");
	const headerLine = src.split(/\r?\n/, 1)[0] || "";
	const delimiter =
		(headerLine.match(/;/g) || []).length > (headerLine.match(/,/g) || []).length
			? ";"
			: ",";

	const rows = [];
	let row = [];
	let field = "";
	let inQuotes = false;

	for (let i = 0; i < src.length; i++) {
		const c = src[i];
		if (inQuotes) {
			if (c === '"') {
				if (src[i + 1] === '"') {
					field += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				field += c;
			}
		} else if (c === '"') {
			inQuotes = true;
		} else if (c === delimiter) {
			row.push(field);
			field = "";
		} else if (c === "\n" || c === "\r") {
			if (c === "\r" && src[i + 1] === "\n") i++;
			row.push(field);
			rows.push(row);
			row = [];
			field = "";
		} else {
			field += c;
		}
	}
	if (field !== "" || row.length) {
		row.push(field);
		rows.push(row);
	}

	return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
};

// Column headers used by the products table, the template and the import.
// Headers are matched after normalizing, so "SKU (Stock Keeping Unit)",
// "sku" and "SKU" are all accepted.
const CSV_HEADERS = [
	"Product Name",
	"SKU (Stock Keeping Unit)",
	"Description / Category",
	"Price",
	"Cost price",
];

const CSV_COLUMNS = {
	name: ["product_name", "name", "product", "item", "item_name"],
	sku: ["sku_stock_keeping_unit", "sku", "stock_keeping_unit", "product_sku", "code", "item_code", "barcode"],
	description: ["description_category", "description", "category", "desc"],
	price: ["price", "selling_price", "unit_price", "retail_price"],
	cost_price: ["cost_price", "cost", "purchase_price", "buying_price"],
};

const normalizeHeader = (header) =>
	header
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "");

const cleanNumber = (value) => value.replace(/[₦,\s]/g, "");
const isNumeric = (value) => Number.isFinite(Number(cleanNumber(value)));

// Turn CSV text into validated product rows ready for import
const readProductsCSV = (text) => {
	const table = parseCSV(text);
	if (table.length === 0) {
		return { rows: [], problems: [], fatal: "The file is empty." };
	}

	const headers = table[0].map(normalizeHeader);
	const columnIndex = {};
	Object.entries(CSV_COLUMNS).forEach(([field, aliases]) => {
		const idx = headers.findIndex((h) => aliases.includes(h));
		if (idx !== -1) columnIndex[field] = idx;
	});

	if (table.length === 1) {
		const found = Object.keys(columnIndex).length;
		return {
			rows: [],
			problems: [],
			fatal:
				found > 0
					? `Only the header row was found (${found} of ${CSV_HEADERS.length} columns recognized). Add one product per line below the header, e.g. "Rice 50kg,GRN-001,Grains,78000,62780".`
					: `The file has a single line and none of it matches the expected headers: ${CSV_HEADERS.join(", ")}.`,
		};
	}

	const missing = [];
	if (columnIndex.name === undefined) missing.push('"Product Name"');
	if (columnIndex.price === undefined) missing.push('"Price"');
	if (missing.length) {
		return {
			rows: [],
			problems: [],
			fatal: `Missing ${missing.join(" and ")} column${missing.length > 1 ? "s" : ""}. Expected headers: ${CSV_HEADERS.join(", ")}.`,
		};
	}

	const rows = [];
	const problems = [];
	const seenSkus = new Map();

	table.slice(1).forEach((cells, i) => {
		const line = i + 2; // spreadsheet row number, counting the header as row 1
		const get = (field) =>
			columnIndex[field] === undefined
				? ""
				: (cells[columnIndex[field]] || "").trim();

		const row = {
			line,
			name: get("name"),
			sku: get("sku"),
			description: get("description"),
			price: get("price"),
			cost_price: get("cost_price"),
		};
		const skuKey = row.sku.toLowerCase();

		if (!row.name) {
			problems.push({ line, message: "Product name is empty" });
		} else if (!row.price) {
			problems.push({ line, message: "Price is empty" });
		} else if (!isNumeric(row.price)) {
			problems.push({ line, message: `Price "${row.price}" is not a number` });
		} else if (toNumber(row.price) < 0) {
			problems.push({ line, message: "Price cannot be negative" });
		} else if (row.cost_price && !isNumeric(row.cost_price)) {
			problems.push({ line, message: `Cost price "${row.cost_price}" is not a number` });
		} else if (row.cost_price && toNumber(row.cost_price) < 0) {
			problems.push({ line, message: "Cost price cannot be negative" });
		} else if (skuKey && seenSkus.has(skuKey)) {
			problems.push({
				line,
				message: `SKU "${row.sku}" is also on row ${seenSkus.get(skuKey)}`,
			});
		} else {
			if (skuKey) seenSkus.set(skuKey, line);
			rows.push({
				...row,
				price: roundMoney(toNumber(row.price)),
				cost_price: row.cost_price === "" ? null : roundMoney(toNumber(row.cost_price)),
			});
		}
	});

	return { rows, problems, fatal: null };
};

const csvCell = (value) => {
	const text = String(value ?? "");
	return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const downloadCSVTemplate = () => {
	const csv = [
		CSV_HEADERS,
		["Rice 50kg", "GRN-001", "Grains", "78000", "62780"],
		["Vegetable Oil 5L", "OIL-001", "Cooking Oil", "16500", "14030"],
	]
		.map((row) => row.map(csvCell).join(","))
		.join("\n");
	const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
	const link = document.createElement("a");
	link.href = url;
	link.download = "products-import-template.csv";
	link.click();
	URL.revokeObjectURL(url);
};

// ---------------------------------------------------------------------------
// Shared modal pieces
// ---------------------------------------------------------------------------

const fieldClass = (hasError = false) =>
	`block w-full px-3 py-2.5 text-sm text-gray-800 bg-white border rounded-none outline-none transition-colors placeholder:text-gray-400 disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed ${
		hasError
			? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
			: "border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
	}`;

const labelClass =
	"flex items-center gap-2 mb-1.5 text-xs font-semibold tracking-wide text-gray-600 uppercase";

const statLabelClass = "text-[10px] font-semibold tracking-wide text-gray-500 uppercase";

const secondaryButtonClass =
	"px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-none transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed";

const primaryButtonColors = {
	blue: "bg-blue-600 border-blue-600 hover:bg-blue-700",
	green: "bg-green-600 border-green-600 hover:bg-green-700",
	red: "bg-red-600 border-red-600 hover:bg-red-700",
};

const primaryButtonClass = (color = "blue") =>
	`flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white border rounded-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${primaryButtonColors[color]}`;

const Spinner = () => (
	<div className="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
);

// Floating panel over a lightly blurred page (no black backdrop)
const ModalShell = ({
	title,
	subtitle,
	icon: Icon,
	iconClass = "bg-blue-600",
	onClose,
	busy = false,
	maxWidth = "max-w-lg",
	children,
}) => (
	<div
		className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 overflow-y-auto bg-gray-900/10 backdrop-blur-[2px]"
		onClick={(e) => {
			if (e.target === e.currentTarget && !busy) onClose();
		}}
	>
		<div
			className={`relative w-full ${maxWidth} bg-white border border-gray-300 rounded-none shadow-2xl`}
		>
			<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
				<div className="flex items-center gap-3">
					<div className={`flex items-center justify-center w-10 h-10 ${iconClass}`}>
						<Icon className="text-base text-white" />
					</div>
					<div>
						<h2 className="text-lg font-semibold leading-tight text-gray-900">
							{title}
						</h2>
						{subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
					</div>
				</div>
				<button
					type="button"
					onClick={onClose}
					disabled={busy}
					className="flex items-center justify-center w-8 h-8 text-gray-400 transition-colors border border-transparent hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50"
				>
					<FaTimes className="text-sm" />
				</button>
			</div>
			{children}
		</div>
	</div>
);

const ModalFooter = ({ children }) => (
	<div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
		{children}
	</div>
);

// Row of boxed label/value cells (2 per row on phones, all in one row from sm up)
const StatGrid = ({ stats, valueClass = "text-sm font-medium" }) => (
	<div className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200 sm:grid-flow-col sm:auto-cols-fr sm:grid-cols-none">
		{stats.map(({ label, value, color = "text-gray-800" }) => (
			<div key={label} className="px-3 py-2 bg-white">
				<div className={statLabelClass}>{label}</div>
				<div className={`${valueClass} ${color}`}>{value}</div>
			</div>
		))}
	</div>
);

const ProblemList = ({ problems, maxHeight = "max-h-48" }) => (
	<ul
		className={`overflow-y-auto text-xs border border-gray-200 divide-y divide-gray-200 ${maxHeight}`}
	>
		{problems.map((p, i) => (
			<li key={`${p.line}-${i}`} className="flex gap-3 px-3 py-1.5">
				<span className="font-mono text-gray-500 shrink-0">Row {p.line}</span>
				<span className="text-red-700">{p.message}</span>
			</li>
		))}
	</ul>
);

const EMPTY_PRODUCT_FORM = {
	name: "",
	sku: "",
	description: "",
	price: "",
	cost_price: "",
};

// Fields shared by the add and edit modals, with a live margin preview
const ProductFormFields = ({ formData, onChange, disabled }) => {
	const showMargin = formData.price !== "" && formData.cost_price !== "";
	const { profit, marginPercent } = getMargin(formData.price, formData.cost_price);
	const costAbovePrice = showMargin && profit < 0;

	return (
		<div className="grid grid-cols-1 gap-5 px-6 py-6 sm:grid-cols-2">
			<div className="sm:col-span-2">
				<label className={labelClass}>
					<FaBox className="text-gray-400" />
					Product Name <span className="text-red-500">*</span>
				</label>
				<input
					type="text"
					name="name"
					value={formData.name}
					onChange={onChange}
					required
					disabled={disabled}
					placeholder="Enter product name"
					className={fieldClass()}
				/>
			</div>

			<div className="sm:col-span-2">
				<label className={labelClass}>
					<FaBarcode className="text-gray-400" />
					SKU (Stock Keeping Unit)
					<span className="font-normal text-gray-400 normal-case">(optional)</span>
				</label>
				<input
					type="text"
					name="sku"
					value={formData.sku}
					onChange={onChange}
					disabled={disabled}
					placeholder="e.g., SKU001"
					className={fieldClass()}
				/>
			</div>

			<div className="sm:col-span-2">
				<label className={labelClass}>
					<FaAlignLeft className="text-gray-400" />
					Description / Category <span className="text-red-500">*</span>
				</label>
				<textarea
					name="description"
					value={formData.description}
					onChange={onChange}
					required
					disabled={disabled}
					rows="3"
					placeholder="Enter product description or category"
					className={fieldClass()}
				/>
			</div>

			<div>
				<label className={labelClass}>
					<FaTag className="text-gray-400" />
					Price <span className="text-red-500">*</span>
				</label>
				<input
					type="number"
					name="price"
					value={formData.price}
					onChange={onChange}
					required
					min="0"
					step="0.01"
					disabled={disabled}
					placeholder="0.00"
					className={fieldClass()}
				/>
			</div>

			<div>
				<label className={labelClass}>
					<FaMoneyBillWave className="text-gray-400" />
					Cost Price <span className="text-red-500">*</span>
				</label>
				<input
					type="number"
					name="cost_price"
					value={formData.cost_price}
					onChange={onChange}
					required
					min="0"
					step="0.01"
					disabled={disabled}
					placeholder="0.00"
					className={fieldClass(costAbovePrice)}
				/>
			</div>

			{showMargin && (
				<div className="space-y-2 sm:col-span-2">
					<StatGrid
						stats={[
							{
								label: "Profit / Unit",
								value: formatCurrency(profit),
								color: costAbovePrice ? "text-red-600" : "text-green-700",
							},
							{
								label: "Margin",
								value: formatPercent(marginPercent),
								color: costAbovePrice ? "text-red-600" : "text-gray-800",
							},
						]}
					/>
					{costAbovePrice && (
						<p className="text-xs text-red-600">
							Cost price is higher than the selling price.
						</p>
					)}
				</div>
			)}
		</div>
	);
};

// Form strings -> API payload
const toProductPayload = (formData) => ({
	name: formData.name.trim(),
	sku: formData.sku.trim(),
	description: formData.description.trim(),
	price: roundMoney(toNumber(formData.price)),
	cost_price: roundMoney(toNumber(formData.cost_price)),
});

// ---------------------------------------------------------------------------
// Modals
// ---------------------------------------------------------------------------

const ImportCSVModal = ({ isOpen, onClose, onImport }) => {
	const [fileName, setFileName] = useState("");
	const [parsed, setParsed] = useState(null);
	const [updateExisting, setUpdateExisting] = useState(true);
	const [progress, setProgress] = useState(null);
	const [result, setResult] = useState(null);
	const [fileKey, setFileKey] = useState(0);

	const importing = progress !== null && result === null;

	const reset = () => {
		setFileName("");
		setParsed(null);
		setUpdateExisting(true);
		setProgress(null);
		setResult(null);
		setFileKey((k) => k + 1);
	};

	const handleClose = () => {
		if (importing) return;
		reset();
		onClose();
	};

	const handleFileChange = async (e) => {
		const file = e.target.files?.[0];
		setResult(null);
		setProgress(null);
		if (!file) {
			setFileName("");
			setParsed(null);
			return;
		}
		setFileName(file.name);
		try {
			setParsed(readProductsCSV(await file.text()));
		} catch (error) {
			setParsed({ rows: [], problems: [], fatal: `Could not read file: ${error.message}` });
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!parsed?.rows.length) return;

		const total = parsed.rows.length;
		setProgress({ done: 0, total });
		const importResult = await onImport(
			{ rows: parsed.rows, updateExisting },
			(done) => setProgress({ done, total })
		);
		setResult(importResult);
	};

	if (!isOpen) return null;

	const canImport = parsed?.rows.length > 0 && !importing;

	// Finished: show what happened
	if (result) {
		const skipped = [...(parsed?.problems || []), ...result.failed].sort(
			(a, b) => a.line - b.line
		);
		return (
			<ModalShell
				title="Import Complete"
				subtitle={fileName}
				icon={FaCheckCircle}
				iconClass={skipped.length ? "bg-yellow-500" : "bg-green-600"}
				onClose={handleClose}
			>
				<div className="px-6 py-6 space-y-5">
					<StatGrid
						valueClass="text-xl font-semibold"
						stats={[
							{ label: "Added", value: result.created, color: "text-green-700" },
							{ label: "Updated", value: result.updated, color: "text-blue-700" },
							{ label: "Unchanged", value: result.unchanged },
							{
								label: "Skipped",
								value: skipped.length,
								color: skipped.length ? "text-red-600" : "text-gray-800",
							},
						]}
					/>
					{skipped.length > 0 && (
						<div>
							<div className={labelClass}>Skipped rows</div>
							<ProblemList problems={skipped} />
						</div>
					)}
				</div>
				<ModalFooter>
					<button type="button" onClick={reset} className={secondaryButtonClass}>
						Import Another
					</button>
					<button type="button" onClick={handleClose} className={primaryButtonClass()}>
						Done
					</button>
				</ModalFooter>
			</ModalShell>
		);
	}

	return (
		<ModalShell
			title="Import Products from CSV"
			subtitle="Add or update products in bulk"
			icon={FaFileImport}
			onClose={handleClose}
			busy={importing}
		>
			<form onSubmit={handleSubmit}>
				<div className="grid grid-cols-1 gap-5 px-6 py-6">
					<div>
						<div className="flex items-center justify-between mb-1.5">
							<span className={`${labelClass} mb-0`}>
								<FaFileCsv className="text-gray-400" />
								CSV File <span className="text-red-500">*</span>
							</span>
							<button
								type="button"
								onClick={downloadCSVTemplate}
								className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
							>
								<FaDownload className="text-[10px]" />
								Download template
							</button>
						</div>
						<label className="flex flex-col items-center justify-center px-4 py-6 text-center transition-colors border border-gray-300 border-dashed cursor-pointer bg-gray-50 hover:bg-gray-100">
							<FaFileCsv className="mb-2 text-2xl text-gray-400" />
							<span className="text-sm font-medium text-gray-700">
								{fileName || "Choose a .csv file"}
							</span>
							<span className="mt-1 text-xs text-gray-500">
								Columns: {CSV_HEADERS.join(", ")}
							</span>
							<input
								key={fileKey}
								type="file"
								accept=".csv,text/csv"
								onChange={handleFileChange}
								disabled={importing}
								className="sr-only"
							/>
						</label>
						<p className="mt-1.5 text-xs text-gray-500">
							Product Name and Price are required on every row. Cost price
							defaults to 0 for new products when left blank.
						</p>
					</div>

					{parsed?.fatal && (
						<div className="px-3 py-2 text-sm text-red-700 border border-red-200 bg-red-50">
							{parsed.fatal}
						</div>
					)}

					{parsed && !parsed.fatal && (
						<div className="space-y-2">
							<StatGrid
								valueClass="text-lg font-semibold"
								stats={[
									{ label: "Rows ready", value: parsed.rows.length, color: "text-green-700" },
									{
										label: "Rows with problems",
										value: parsed.problems.length,
										color: parsed.problems.length ? "text-red-600" : "text-gray-800",
									},
								]}
							/>
							{parsed.problems.length > 0 && (
								<ProblemList problems={parsed.problems} maxHeight="max-h-28" />
							)}
						</div>
					)}

					<div>
						<label className={labelClass}>
							Existing Products
							<span className="font-normal text-gray-400 normal-case">
								(matched by SKU, or by name when there is no SKU)
							</span>
						</label>
						<select
							value={updateExisting ? "update" : "skip"}
							onChange={(e) => setUpdateExisting(e.target.value === "update")}
							disabled={importing}
							className={fieldClass()}
						>
							<option value="update">Update them with the CSV values</option>
							<option value="skip">Leave them unchanged</option>
						</select>
					</div>

					{importing && (
						<div>
							<div className="flex justify-between mb-1 text-xs text-gray-600">
								<span>Importing…</span>
								<span>
									{progress.done} / {progress.total}
								</span>
							</div>
							<div className="w-full h-2 bg-gray-200">
								<div
									className="h-2 transition-all bg-blue-600"
									style={{ width: `${(progress.done / progress.total) * 100}%` }}
								/>
							</div>
						</div>
					)}
				</div>

				<ModalFooter>
					<button
						type="button"
						onClick={handleClose}
						disabled={importing}
						className={secondaryButtonClass}
					>
						Cancel
					</button>
					<button type="submit" disabled={!canImport} className={primaryButtonClass()}>
						{importing ? (
							<>
								<Spinner />
								Importing...
							</>
						) : (
							<>
								<FaFileImport className="mr-2" />
								Import {parsed?.rows.length ? `${parsed.rows.length} Rows` : "Products"}
							</>
						)}
					</button>
				</ModalFooter>
			</form>
		</ModalShell>
	);
};

const AddProductModal = ({ isOpen, onClose, onAdd, isLoading }) => {
	const [formData, setFormData] = useState(EMPTY_PRODUCT_FORM);

	useEffect(() => {
		if (!isOpen) setFormData(EMPTY_PRODUCT_FORM);
	}, [isOpen]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		await onAdd(toProductPayload(formData));
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	if (!isOpen) return null;

	return (
		<ModalShell
			title="Add Product"
			subtitle="Create a product you can stock in your stores"
			icon={FaPlus}
			iconClass="bg-green-600"
			onClose={onClose}
			busy={isLoading}
		>
			<form onSubmit={handleSubmit}>
				<ProductFormFields
					formData={formData}
					onChange={handleChange}
					disabled={isLoading}
				/>
				<ModalFooter>
					<button
						type="button"
						onClick={onClose}
						disabled={isLoading}
						className={secondaryButtonClass}
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isLoading}
						className={primaryButtonClass("green")}
					>
						{isLoading ? (
							<>
								<Spinner />
								Adding...
							</>
						) : (
							<>
								<FaPlus className="mr-2" />
								Add Product
							</>
						)}
					</button>
				</ModalFooter>
			</form>
		</ModalShell>
	);
};

const EditProductModal = ({ isOpen, onClose, onEdit, isLoading, product }) => {
	const [formData, setFormData] = useState(EMPTY_PRODUCT_FORM);

	// Initialize form data when product changes or modal opens
	useEffect(() => {
		if (product && isOpen) {
			setFormData({
				name: product.name || "",
				sku: product.sku || "",
				description: product.description || "",
				price: product.price?.toString() || "",
				cost_price: product.cost_price?.toString() || "",
			});
		}
	}, [product, isOpen]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		await onEdit(product.id, toProductPayload(formData));
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	if (!isOpen || !product) return null;

	return (
		<ModalShell
			title="Edit Product"
			subtitle={product.name}
			icon={FaEdit}
			onClose={onClose}
			busy={isLoading}
		>
			<form onSubmit={handleSubmit}>
				<ProductFormFields
					formData={formData}
					onChange={handleChange}
					disabled={isLoading}
				/>
				<ModalFooter>
					<button
						type="button"
						onClick={onClose}
						disabled={isLoading}
						className={secondaryButtonClass}
					>
						Cancel
					</button>
					<button type="submit" disabled={isLoading} className={primaryButtonClass()}>
						{isLoading ? (
							<>
								<Spinner />
								Updating...
							</>
						) : (
							<>
								<FaEdit className="mr-2" />
								Update Product
							</>
						)}
					</button>
				</ModalFooter>
			</form>
		</ModalShell>
	);
};

const DeleteProductModal = ({ product, onClose, onConfirm, isLoading }) => {
	if (!product) return null;

	return (
		<ModalShell
			title="Delete Product"
			subtitle="This cannot be undone"
			icon={FaExclamationTriangle}
			iconClass="bg-red-600"
			onClose={onClose}
			busy={isLoading}
			maxWidth="max-w-md"
		>
			<div className="px-6 py-6 space-y-4">
				<p className="text-sm text-gray-700">
					Delete <span className="font-semibold">{product.name || "this product"}</span>?
					Any inventory records that use it may stop showing product details.
				</p>
				<StatGrid
					stats={[
						{ label: "SKU", value: product.sku || "—" },
						{ label: "Price", value: formatCurrency(product.price) },
					]}
				/>
			</div>
			<ModalFooter>
				<button
					type="button"
					onClick={onClose}
					disabled={isLoading}
					className={secondaryButtonClass}
				>
					Cancel
				</button>
				<button
					type="button"
					onClick={() => onConfirm(product.id)}
					disabled={isLoading}
					className={primaryButtonClass("red")}
				>
					{isLoading ? (
						<>
							<Spinner />
							Deleting...
						</>
					) : (
						<>
							<FaTrash className="mr-2" />
							Delete Product
						</>
					)}
				</button>
			</ModalFooter>
		</ModalShell>
	);
};

// Main Products Component
export default function Products() {
	const [products, setProducts] = useState([]);
	const [filteredProducts, setFilteredProducts] = useState([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedDescription, setSelectedDescription] = useState("");
	const [showFilters, setShowFilters] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const [showImportModal, setShowImportModal] = useState(false);
	const [showAddProductModal, setShowAddProductModal] = useState(false);
	const [showEditProductModal, setShowEditProductModal] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState(null);
	const [productToDelete, setProductToDelete] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isAddingProduct, setIsAddingProduct] = useState(false);
	const [isEditingProduct, setIsEditingProduct] = useState(false);
	const [isDeletingProduct, setIsDeletingProduct] = useState(false);
	const [error, setError] = useState("");
	const router = useRouter();

	// Extract unique descriptions for filtering
	const descriptions = [
		...new Set(
			products
				.map((product) => product.description)
				.filter((desc) => desc && desc.trim() !== "")
		),
	].sort();

	useEffect(() => {
		const checkAuth = () => {
			const token = localStorage.getItem("token");
			if (!token) {
				router.push("/");
				return;
			}
		};

		checkAuth();
	}, [router]);

	useEffect(() => {
		loadProducts();
	}, []);

	const loadProducts = async () => {
		setIsLoading(true);
		setError("");
		try {
			setProducts(toProductList(await productAPI.getAllProducts()));
		} catch (err) {
			setError(err.message);
			console.error("Error loading products:", err);
		} finally {
			setIsLoading(false);
		}
	};

	// Calculate summary metrics
	const calculateSummary = () => {
		const totalProducts = products.length;

		// Count unique descriptions/categories
		const uniqueDescriptions = new Set(
			products
				.map((product) => product.description)
				.filter((desc) => desc && desc.trim() !== "")
		).size;

		const totalPrice = products.reduce((sum, product) => sum + toNumber(product.price), 0);
		const averagePrice = totalProducts > 0 ? totalPrice / totalProducts : 0;

		const highestPrice = products.reduce(
			(highest, product) => Math.max(highest, toNumber(product.price)),
			0
		);

		// Average margin across products that have a cost price
		const withCost = products.filter((product) => toNumber(product.cost_price) > 0);
		const averageMargin =
			withCost.length > 0
				? withCost.reduce(
						(sum, product) => sum + getMargin(product.price, product.cost_price).marginPercent,
						0
				  ) / withCost.length
				: 0;

		return {
			totalProducts,
			uniqueDescriptions,
			averagePrice,
			highestPrice,
			averageMargin,
		};
	};

	const summary = calculateSummary();

	useEffect(() => {
		const checkIsMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkIsMobile();
		window.addEventListener("resize", checkIsMobile);
		return () => window.removeEventListener("resize", checkIsMobile);
	}, []);

	useEffect(() => {
		let filtered = products;

		if (searchTerm) {
			filtered = filtered.filter(
				(product) =>
					product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					product.description?.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		if (selectedDescription) {
			filtered = filtered.filter(
				(product) => product.description === selectedDescription
			);
		}

		setFilteredProducts(filtered);
	}, [products, searchTerm, selectedDescription]);

	const clearFilters = () => {
		setSearchTerm("");
		setSelectedDescription("");
	};

	const toggleFilters = () => {
		setShowFilters(!showFilters);
	};

	// Import validated CSV rows one at a time: match an existing product by
	// SKU (or by name when either side has no SKU), then update or create it
	const handleImportCSV = async ({ rows, updateExisting }, onProgress) => {
		const result = { created: 0, updated: 0, unchanged: 0, failed: [] };
		const knownProducts = products.map((product) => ({ ...product }));
		const lower = (value) => String(value || "").trim().toLowerCase();

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			try {
				const existing =
					(row.sku && knownProducts.find((p) => p.sku && lower(p.sku) === lower(row.sku))) ||
					knownProducts.find(
						(p) => lower(p.name) === lower(row.name) && (!row.sku || !p.sku)
					);

				if (existing && !updateExisting) {
					result.unchanged += 1;
				} else if (existing) {
					const payload = {
						name: row.name,
						sku: row.sku || existing.sku || "",
						description: row.description || existing.description || "",
						price: row.price,
						cost_price:
							row.cost_price === null ? toNumber(existing.cost_price) : row.cost_price,
					};
					const response = await productAPI.updateProduct(existing.id, payload);
					Object.assign(existing, normalizeProduct(response, { ...existing, ...payload }));
					result.updated += 1;
				} else {
					const payload = {
						name: row.name,
						sku: row.sku,
						description: row.description,
						price: row.price,
						cost_price: row.cost_price ?? 0,
					};
					const response = await productAPI.createProduct(payload);
					knownProducts.push(normalizeProduct(response, payload));
					result.created += 1;
				}
			} catch (err) {
				result.failed.push({ line: row.line, message: err.message || "Import failed" });
			}
			onProgress?.(i + 1);
		}

		// Reload so the table reflects exactly what the server stored
		await loadProducts();
		return result;
	};

	const handleAddProduct = async (productData) => {
		setIsAddingProduct(true);
		setError("");
		try {
			await productAPI.createProduct(productData);

			// Refresh the products list to get the updated data from the server
			await loadProducts();
			setShowAddProductModal(false);
		} catch (err) {
			setError(err.message);
			console.error("Error adding product:", err);
		} finally {
			setIsAddingProduct(false);
		}
	};

	const handleEditClick = (product) => {
		setSelectedProduct(product);
		setShowEditProductModal(true);
	};

	const handleEditProduct = async (id, productData) => {
		setIsEditingProduct(true);
		setError("");
		try {
			const response = await productAPI.updateProduct(id, productData);
			setProducts((prev) =>
				prev.map((product) =>
					sameId(product.id, id)
						? normalizeProduct(response, { ...product, ...productData })
						: product
				)
			);
			setShowEditProductModal(false);
			setSelectedProduct(null);
		} catch (err) {
			setError(err.message);
			console.error("Error updating product:", err);
		} finally {
			setIsEditingProduct(false);
		}
	};

	const handleDeleteProduct = async (id) => {
		setIsDeletingProduct(true);
		setError("");
		try {
			await productAPI.deleteProduct(id);
			setProducts((prev) => prev.filter((product) => !sameId(product.id, id)));
			setProductToDelete(null);
		} catch (err) {
			setError(err.message);
			console.error("Error deleting product:", err);
		} finally {
			setIsDeletingProduct(false);
		}
	};

	return (
		<div className="relative max-w-6xl mx-auto pb-16 md:pb-0">
			<h1 className="hidden mb-6 text-xl font-normal text-gray-800 md:block font-raleway">
				Products
			</h1>
			<InventoryNav />

			{error && (
				<div className="p-3 mb-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded">
					<strong>Error:</strong> {error}
					<button
						onClick={() => setError("")}
						className="float-right font-bold"
					>
						×
					</button>
				</div>
			)}

			<div className="mt-4 space-y-4 px-2 md:px-0">
				{/* Summary Cards */}
				<div className="">
					<div className="p-2 bg-white rounded shadow">
						<div className="flex flex-col gap-2 sm:flex-row sm:flex-nowrap sm:overflow-x-auto sm:justify-between sm:space-x-1 md:space-x-2">
							<div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
								<div className="flex items-center">
									<div className="p-1 mr-1 rounded bg-blue-100 md:mr-2 md:p-1.5">
										<FaStore className="text-xs text-blue-600 md:text-sm" />
									</div>
									<div>
										<h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
											Total Products
										</h3>
										<p className="text-sm font-bold text-gray-800 md:text-lg">
											{summary.totalProducts}
										</p>
										<p className="text-[8px] text-gray-500 md:text-xs">
											{summary.uniqueDescriptions} categories
										</p>
									</div>
								</div>
							</div>

							<div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
								<div className="flex items-center">
									<div className="p-1 mr-1 rounded bg-purple-100 md:mr-2 md:p-1.5">
										<FaChartBar className="text-xs text-purple-600 md:text-sm" />
									</div>
									<div>
										<h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
											Avg Price
										</h3>
										<p className="text-sm font-bold text-gray-800 md:text-lg">
											{formatCurrency(summary.averagePrice)}
										</p>
									</div>
								</div>
							</div>

							<div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
								<div className="flex items-center">
									<div className="p-1 mr-1 rounded bg-orange-100 md:mr-2 md:p-1.5">
										<FaMoneyBillWave className="text-xs text-orange-600 md:text-sm" />
									</div>
									<div>
										<h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
											Highest Price
										</h3>
										<p className="text-sm font-bold text-gray-800 md:text-lg">
											{formatCurrency(summary.highestPrice)}
										</p>
									</div>
								</div>
							</div>

							<div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
								<div className="flex items-center">
									<div className="p-1 mr-1 rounded bg-green-100 md:mr-2 md:p-1.5">
										<FaTags className="text-xs text-green-600 md:text-sm" />
									</div>
									<div>
										<h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
											Avg Margin
										</h3>
										<p className="text-sm font-bold text-gray-800 md:text-lg">
											{formatPercent(summary.averageMargin)}
										</p>
										<p className="text-[8px] text-gray-500 md:text-xs">
											Price vs cost price
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Search and Actions Section */}
				<div className="p-3 bg-white rounded shadow">
					<div className="flex flex-col w-full gap-3 md:flex-row items-stretch">
						<div className="flex flex-col flex-grow gap-3 md:flex-row">
							{isMobile ? (
								<div className="flex w-full gap-2">
									<div className="flex-1 relative">
										<input
											type="text"
											placeholder="Search products..."
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
											className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
										/>
										<FaSearch className="absolute right-2 top-1.5 text-xs text-gray-400" />
									</div>

									<button
										onClick={toggleFilters}
										className={`px-3 py-1.5 rounded transition-colors flex items-center text-xs ${
											showFilters
												? "bg-indigo-600 text-white"
												: "bg-gray-200 text-gray-700 hover:bg-gray-300"
										}`}
									>
										<FaSlidersH className="text-xs" />
									</button>
								</div>
							) : (
								<>
									<div className="relative w-full md:w-48">
										<input
											type="text"
											placeholder="Search products..."
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
											className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
										/>
										<FaSearch className="absolute right-2 top-1.5 text-xs text-gray-400" />
									</div>

									<div className="w-full md:w-48">
										<select
											value={selectedDescription}
											onChange={(e) => setSelectedDescription(e.target.value)}
											className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
										>
											<option value="">All Categories</option>
											{descriptions.map((description) => (
												<option key={description} value={description}>
													{description}
												</option>
											))}
										</select>
									</div>
								</>
							)}
						</div>

						<div className="hidden md:flex justify-start w-full gap-2 md:justify-end md:w-auto">
							<button
								onClick={() => setShowImportModal(true)}
								className="flex items-center px-3 py-1.5 text-xs text-white transition-colors bg-blue-600 rounded hover:bg-blue-700"
								disabled={isLoading}
							>
								<FaFileImport className="mr-1 text-xs" />
								Import CSV
							</button>
							<button
								onClick={() => setShowAddProductModal(true)}
								className="flex items-center px-3 py-1.5 text-xs text-white transition-colors bg-green-600 rounded hover:bg-green-700"
								disabled={isLoading}
							>
								<FaPlus className="mr-1 text-xs" />
								Add Product
							</button>
							<button
								onClick={loadProducts}
								className="flex items-center px-3 py-1.5 text-xs text-white transition-colors bg-gray-600 rounded hover:bg-gray-700"
								disabled={isLoading}
							>
								{isLoading ? "Refreshing..." : "Refresh"}
							</button>
						</div>
					</div>

					{isMobile && showFilters && descriptions.length > 0 && (
						<div className="grid grid-cols-1 gap-2 p-2 mt-3 bg-gray-50 rounded">
							<div>
								<label className="block mb-1 text-xs font-medium text-gray-700">
									Description / Category
								</label>
								<select
									value={selectedDescription}
									onChange={(e) => setSelectedDescription(e.target.value)}
									className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
								>
									<option value="">All Categories</option>
									{descriptions.map((description) => (
										<option key={description} value={description}>
											{description}
										</option>
									))}
								</select>
							</div>

							<div className="flex gap-2 pt-1">
								<button
									onClick={clearFilters}
									className="flex-1 px-2 py-1.5 text-xs text-gray-700 transition-colors bg-gray-200 rounded hover:bg-gray-300"
								>
									Clear Filters
								</button>
								<button
									onClick={toggleFilters}
									className="flex-1 px-2 py-1.5 text-xs text-white transition-colors bg-blue-600 rounded hover:bg-blue-700"
								>
									Apply Filters
								</button>
							</div>
						</div>
					)}
				</div>

				{/* Products Table */}
				<div className="overflow-hidden bg-white rounded shadow">
					{isLoading && products.length === 0 && (
						<div className="py-12 text-center">
							<div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
							<p className="mt-2 text-sm text-gray-600">Loading products...</p>
						</div>
					)}

					<div className="hidden overflow-x-auto text-black md:block">
						<table className="w-full">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
										Product Name
									</th>
									<th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
										SKU
									</th>
									<th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
										Description / Category
									</th>
									<th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
										Price
									</th>
									<th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{filteredProducts.map((product) => {
									return (
										<tr key={product.id} className="hover:bg-gray-50">
											<td className="px-4 py-3 text-sm font-medium text-black">
												{product.name || "N/A"}
											</td>
											<td className="px-4 py-3 text-sm text-black">
												{product.sku || "—"}
											</td>
											<td className="px-4 py-3 text-sm text-black">
												{product.description || "N/A"}
											</td>
											<td className="px-4 py-3 text-sm text-black">
												{formatCurrency(product.price)}
											</td>
											<td className="px-4 py-3 text-sm">
												<div className="flex gap-2">
													<button
														onClick={() => handleEditClick(product)}
														className="p-1 text-blue-600 transition-colors hover:text-blue-800 hover:bg-blue-50 rounded"
														title="Edit"
														disabled={isLoading}
													>
														<FaEdit className="text-sm" />
													</button>
													<button
														onClick={() => setProductToDelete(product)}
														className="p-1 text-red-600 transition-colors hover:text-red-800 hover:bg-red-50 rounded"
														title="Delete"
														disabled={isLoading}
													>
														<FaTrash className="text-sm" />
													</button>
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>

					<div className="text-black md:hidden">
						{filteredProducts.map((product) => {
							return (
								<div key={product.id} className="p-4 border-b border-gray-200">
									<div className="mb-2">
										<div className="font-medium text-black">
											{product.name || "N/A"}
										</div>
										<div className="text-xs text-gray-500">
											SKU: {product.sku || "No SKU"}
											{product.description && ` • ${product.description}`}
										</div>
									</div>

									<div className="text-sm">
										<div className="text-gray-600">Price</div>
										<div className="font-medium">
											{formatCurrency(product.price)}
										</div>
									</div>

									<div className="flex gap-2 mt-3">
										<button
											onClick={() => handleEditClick(product)}
											className="flex-1 px-3 py-1.5 text-xs text-blue-600 border border-blue-600 rounded transition-colors hover:bg-blue-50"
											disabled={isLoading}
										>
											Edit
										</button>
										<button
											onClick={() => setProductToDelete(product)}
											className="flex-1 px-3 py-1.5 text-xs text-red-600 border border-red-600 rounded transition-colors hover:bg-red-50"
											disabled={isLoading}
										>
											Delete
										</button>
									</div>
								</div>
							);
						})}
					</div>

					{filteredProducts.length === 0 && !isLoading && (
						<div className="py-12 text-center">
							<div className="text-gray-400 mb-2">
								<FaBox className="inline text-3xl" />
							</div>
							<p className="text-sm text-gray-500">No products found</p>
							{products.length === 0 && (
								<div className="flex justify-center gap-2 mt-2">
									<button
										onClick={() => setShowAddProductModal(true)}
										className="px-4 py-2 text-xs text-white bg-green-600 rounded hover:bg-green-700"
									>
										Add Your First Product
									</button>
									<button
										onClick={() => setShowImportModal(true)}
										className="px-4 py-2 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
									>
										Import from CSV
									</button>
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{isMobile && (
				<div className="fixed bottom-4 right-4 md:hidden">
					<div className="flex flex-col gap-3">
						<button
							onClick={() => setShowImportModal(true)}
							className="flex items-center justify-center w-12 h-12 text-white transition-transform bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 hover:scale-110"
							title="Import CSV"
							disabled={isLoading}
						>
							<FaFileImport className="text-lg" />
						</button>
						<button
							onClick={() => setShowAddProductModal(true)}
							className="flex items-center justify-center w-12 h-12 text-white transition-transform bg-green-600 rounded-full shadow-lg hover:bg-green-700 hover:scale-110"
							title="Add Product"
							disabled={isLoading}
						>
							<FaPlus className="text-lg" />
						</button>
						<button
							onClick={loadProducts}
							className="flex items-center justify-center w-12 h-12 text-white transition-transform bg-gray-600 rounded-full shadow-lg hover:bg-gray-700 hover:scale-110"
							title="Refresh"
							disabled={isLoading}
						>
							↻
						</button>
					</div>
				</div>
			)}

			<ImportCSVModal
				isOpen={showImportModal}
				onClose={() => setShowImportModal(false)}
				onImport={handleImportCSV}
			/>

			<AddProductModal
				isOpen={showAddProductModal}
				onClose={() => setShowAddProductModal(false)}
				onAdd={handleAddProduct}
				isLoading={isAddingProduct}
			/>

			<EditProductModal
				isOpen={showEditProductModal}
				onClose={() => {
					setShowEditProductModal(false);
					setSelectedProduct(null);
				}}
				onEdit={handleEditProduct}
				isLoading={isEditingProduct}
				product={selectedProduct}
			/>

			<DeleteProductModal
				product={productToDelete}
				onClose={() => setProductToDelete(null)}
				onConfirm={handleDeleteProduct}
				isLoading={isDeletingProduct}
			/>
		</div>
	);
}
