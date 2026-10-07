import { useState, useEffect } from "react";
import InventoryNav from "../../components/InventoryNav";
import {
  FaSearch,
  FaPlus,
  FaFileImport,
  FaFileCsv,
  FaDownload,
  FaSlidersH,
  FaShoppingCart,
  FaUniversity,
  FaTag,
  FaMoneyBillWave,
  FaTimes,
  FaEdit,
  FaTrash,
  FaStore,
  FaBox,
  FaSortNumericUp,
  FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa";

import { inventoryAPI, productAPI, storeAPI } from "../../../services/api";

// ---------------------------------------------------------------------------
// Number / data helpers
// ---------------------------------------------------------------------------

const LOW_STOCK_DEFAULT_THRESHOLD = 10;

// Coerce API/CSV values ("1,500.00", "₦200", 12, null) into a finite number
const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  const num =
    typeof value === "number"
      ? value
      : parseFloat(String(value).replace(/[₦,\s]/g, ""));
  return Number.isFinite(num) ? num : 0;
};

// Round to kobo so summed currency values don't drift
const roundMoney = (value) => Math.round(value * 100) / 100;

// Numeric ids go to the API as numbers, anything else is passed through
const toId = (value) =>
  /^\d+$/.test(String(value).trim()) ? Number(value) : value;

// Ids may arrive as strings or numbers depending on the source
const sameId = (a, b) =>
  a !== null && a !== undefined && b !== null && b !== undefined &&
  String(a) === String(b);

// Helper function to safely format numbers in Naira
const formatCurrency = (value) => {
  const num = toNumber(value);
  return `${num < 0 ? "-" : ""}₦${Math.abs(num).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Quantity, status and value figures for a single inventory row
const getStockFigures = (item, product) => {
  const quantity = toNumber(item?.quantity);
  const rawThreshold = product?.low_stock_threshold;
  const threshold =
    rawThreshold === null || rawThreshold === undefined || rawThreshold === ""
      ? LOW_STOCK_DEFAULT_THRESHOLD
      : toNumber(rawThreshold);
  const isOutOfStock = quantity <= 0;
  // Negative stock (oversold) shouldn't subtract from the totals
  const valuedQuantity = Math.max(0, quantity);
  const unitPrice = toNumber(product?.price);
  const unitCost = toNumber(product?.cost_price);
  const stockValue = roundMoney(unitCost * valuedQuantity);
  const retailValue = roundMoney(unitPrice * valuedQuantity);

  return {
    quantity,
    isOutOfStock,
    isLowStock: !isOutOfStock && quantity <= threshold,
    stockValue,
    retailValue,
    unitPrice,
    unitCost,
    hasCost: unitCost > 0,
    unitProfit: roundMoney(unitPrice - unitCost),
    // Margin is profit as a share of selling price, markup as a share of cost
    marginPct: unitCost > 0 && unitPrice > 0 ? ((unitPrice - unitCost) / unitPrice) * 100 : null,
    markupPct: unitCost > 0 ? ((unitPrice - unitCost) / unitCost) * 100 : null,
    potentialProfit: roundMoney(retailValue - stockValue),
  };
};

const formatPercent = (value) =>
  value === null ? "—" : `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;

const marginTone = (marginPct) => {
  if (marginPct === null) return { text: "text-gray-300", bar: "bg-gray-500", pill: "bg-white/10 text-gray-300" };
  if (marginPct < 0) return { text: "text-rose-400", bar: "bg-rose-400", pill: "bg-rose-500/15 text-rose-300" };
  if (marginPct < 15) return { text: "text-amber-300", bar: "bg-amber-300", pill: "bg-amber-400/15 text-amber-200" };
  return { text: "text-emerald-400", bar: "bg-emerald-400", pill: "bg-emerald-500/15 text-emerald-300" };
};

// API responses may be wrapped as { data }, { [key] } or returned bare
const unwrapResponse = (response, key) => {
  if (response?.data && typeof response.data === "object") return response.data;
  if (key && response?.[key] && typeof response[key] === "object") return response[key];
  return response;
};

// Safe data access helper functions
// The catalogue entry wins over the nested copy: the nested product can be
// stale after a price edit or come back without cost_price, which zeroes
// the row's stock value
const safeGetProduct = (item, products = []) => {
  const nested = item?.product && typeof item.product === "object" ? item.product : null;
  const productId = item?.product_id ?? nested?.id;
  const fromList =
    productId !== undefined && Array.isArray(products)
      ? products.find((p) => sameId(p?.id, productId))
      : null;
  if (nested || fromList) return { ...nested, ...fromList };
  return {};
};

const safeGetStore = (item, stores = []) => {
  if (item?.store && typeof item.store === "object") {
    return item.store;
  }
  if (item?.store_id !== undefined && Array.isArray(stores)) {
    return stores.find((s) => sameId(s?.id, item.store_id)) || {};
  }
  return {};
};

// Merge a server response over the data we sent, dropping nested
// product/store objects that no longer match the row's ids
const normalizeInventoryItem = (response, fallback) => {
  const raw = unwrapResponse(response, "inventory");
  const serverFields =
    raw && typeof raw === "object"
      ? Object.fromEntries(
          Object.entries(raw).filter(([, v]) => v !== undefined && v !== null)
        )
      : {};
  const item = { ...fallback, ...serverFields };

  if (item.id === undefined) item.id = `tmp-${Date.now()}-${Math.random()}`;
  if (item.product && !sameId(item.product.id, item.product_id)) delete item.product;
  if (item.store && !sameId(item.store.id, item.store_id)) delete item.store;
  return item;
};

// ---------------------------------------------------------------------------
// Row hover card
// ---------------------------------------------------------------------------

const INSIGHT_CARD_WIDTH = 288;

// Fixed-position so the table's overflow container can't clip it
const RowInsightCard = ({ insight }) => {
  if (!insight) return null;
  const { product, figures, rect, visible } = insight;
  const tone = marginTone(figures.marginPct);
  const openUpward = rect.top > 260;
  const left = Math.min(
    Math.max(8, rect.left + 16),
    window.innerWidth - INSIGHT_CARD_WIDTH - 8
  );
  // Share of the selling price that is cost vs profit
  const costShare =
    figures.unitPrice > 0 ? Math.min(100, (figures.unitCost / figures.unitPrice) * 100) : 100;

  const rows = [
    { label: "Profit per unit", value: formatCurrency(figures.unitProfit), negative: figures.unitProfit < 0 },
    { label: "Markup on cost", value: formatPercent(figures.markupPct), negative: figures.markupPct < 0 },
    { label: "Stock value", value: formatCurrency(figures.stockValue) },
    { label: "Retail value", value: formatCurrency(figures.retailValue) },
  ];

  return (
    <div
      role="tooltip"
      className={`fixed z-40 pointer-events-none transition-[opacity,transform] duration-150 ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{
        left,
        top: openUpward ? rect.top - 8 : rect.bottom + 8,
        width: INSIGHT_CARD_WIDTH,
        transform: `translateY(calc(${openUpward ? "-100%" : "0px"} + ${visible ? 0 : 4}px))`,
      }}
    >
      <div className="overflow-hidden text-white rounded-xl shadow-2xl bg-gray-900/95 ring-1 ring-white/10 backdrop-blur">
        <div className="flex items-start justify-between gap-3 px-4 pt-3.5">
          <div className="min-w-0">
            <p className="text-[10px] font-medium tracking-wider text-gray-400 uppercase">
              Margin
            </p>
            <p className={`text-2xl font-semibold leading-tight tabular-nums ${tone.text}`}>
              {figures.marginPct === null ? "—" : `${figures.marginPct.toFixed(1)}%`}
            </p>
          </div>
          <span className={`mt-1 shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${tone.pill}`}>
            {figures.marginPct === null
              ? "No cost price"
              : figures.marginPct < 0
              ? "Selling at a loss"
              : figures.marginPct < 15
              ? "Thin margin"
              : "Healthy"}
          </span>
        </div>

        <p className="px-4 mt-0.5 text-xs text-gray-400 truncate">
          {product.name || "Unnamed product"}
        </p>

        {figures.hasCost && figures.unitPrice > 0 ? (
          <div className="px-4 mt-3">
            <div className="flex h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-gray-500" style={{ width: `${costShare}%` }} />
              <div className={`h-full ${tone.bar}`} style={{ width: `${100 - costShare}%` }} />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-gray-400 tabular-nums">
              <span>Cost {formatCurrency(figures.unitCost)}</span>
              <span>Price {formatCurrency(figures.unitPrice)}</span>
            </div>
          </div>
        ) : (
          <p className="px-4 mt-3 text-xs text-gray-400">
            Add a cost price to this product to see its margin.
          </p>
        )}

        <dl className="px-4 mt-3 space-y-1.5 text-xs">
          {rows.map(({ label, value, negative }) => (
            <div key={label} className="flex justify-between gap-3">
              <dt className="text-gray-400">{label}</dt>
              <dd className={`font-medium tabular-nums ${negative ? "text-rose-300" : "text-gray-100"}`}>
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex items-center justify-between px-4 py-2.5 mt-3 text-xs border-t border-white/10 bg-white/5">
          <span className="text-gray-400">
            Potential profit · {Math.max(0, figures.quantity).toLocaleString()} units
          </span>
          <span className={`font-semibold tabular-nums ${figures.potentialProfit < 0 ? "text-rose-300" : "text-emerald-300"}`}>
            {formatCurrency(figures.potentialProfit)}
          </span>
        </div>
      </div>
    </div>
  );
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

// Accepted header names for each field (compared after normalizing)
const CSV_COLUMNS = {
  product_id: ["product_id"],
  sku: ["sku", "product_sku", "code", "item_code", "barcode"],
  name: ["name", "product", "product_name", "item", "item_name"],
  description: ["description", "desc"],
  price: ["price", "unit_price", "selling_price", "retail_price"],
  cost_price: ["cost_price", "cost", "purchase_price", "buying_price"],
  quantity: ["quantity", "qty", "stock", "units"],
  store_id: ["store_id"],
  store: ["store", "store_name"],
};

const normalizeHeader = (header) =>
  header.trim().toLowerCase().replace(/[\s-]+/g, "_");

const isNumeric = (value) => Number.isFinite(Number(value.replace(/[₦,\s]/g, "")));

// Turn CSV text into validated row objects ready for import
const readInventoryCSV = (text) => {
  const table = parseCSV(text);
  if (table.length < 2) {
    return { rows: [], problems: [], fatal: "The file has no data rows." };
  }

  const headers = table[0].map(normalizeHeader);
  const columnIndex = {};
  Object.entries(CSV_COLUMNS).forEach(([field, aliases]) => {
    const idx = headers.findIndex((h) => aliases.includes(h));
    if (idx !== -1) columnIndex[field] = idx;
  });

  if (columnIndex.quantity === undefined) {
    return { rows: [], problems: [], fatal: 'Missing a "quantity" column.' };
  }
  if (
    columnIndex.product_id === undefined &&
    columnIndex.sku === undefined &&
    columnIndex.name === undefined
  ) {
    return {
      rows: [],
      problems: [],
      fatal: 'Add a "sku" or "name" column so products can be matched.',
    };
  }

  const rows = [];
  const problems = [];

  table.slice(1).forEach((cells, i) => {
    const line = i + 2; // spreadsheet row number, counting the header as row 1
    const get = (field) =>
      columnIndex[field] === undefined
        ? ""
        : (cells[columnIndex[field]] || "").trim();

    const row = {
      line,
      product_id: get("product_id"),
      sku: get("sku"),
      name: get("name"),
      description: get("description"),
      price: get("price"),
      cost_price: get("cost_price"),
      store_id: get("store_id"),
      store: get("store"),
    };

    const rawQuantity = get("quantity").replace(/,/g, "");
    const quantity = Number(rawQuantity);

    if (!row.product_id && !row.sku && !row.name) {
      problems.push({ line, message: "No SKU or product name" });
    } else if (rawQuantity === "" || !Number.isFinite(quantity)) {
      problems.push({ line, message: `Quantity "${get("quantity")}" is not a number` });
    } else if (quantity < 0 || !Number.isInteger(quantity)) {
      problems.push({ line, message: "Quantity must be a whole number of 0 or more" });
    } else if (row.price && !isNumeric(row.price)) {
      problems.push({ line, message: `Price "${row.price}" is not a number` });
    } else if (row.cost_price && !isNumeric(row.cost_price)) {
      problems.push({ line, message: `Cost price "${row.cost_price}" is not a number` });
    } else {
      rows.push({ ...row, quantity });
    }
  });

  return {
    rows,
    problems,
    fatal: null,
    hasStoreColumn: columnIndex.store !== undefined || columnIndex.store_id !== undefined,
  };
};

const downloadCSVTemplate = (stores) => {
  const storeName = (stores[0]?.name || "Main Store").replace(/"/g, '""');
  const csv = [
    "sku,name,description,price,cost_price,quantity,store",
    `SKU-001,Sample Product,Optional description,2500,1800,25,"${storeName}"`,
  ].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "inventory-import-template.csv";
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

const primaryButtonClass = (color = "blue") =>
  `flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white border rounded-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
    color === "green"
      ? "bg-green-600 border-green-600 hover:bg-green-700"
      : "bg-blue-600 border-blue-600 hover:bg-blue-700"
  }`;

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

// Store + product + quantity fields shared by the add and edit modals
const StockFormFields = ({ formData, onChange, disabled, stores, products, minQuantity }) => {
  const selectedProduct = products.find((p) => sameId(p.id, formData.product_id));
  const quantity = toNumber(formData.quantity);

  return (
    <div className="grid grid-cols-1 gap-5 px-6 py-6">
      <div>
        <label className={labelClass}>
          <FaStore className="text-gray-400" />
          Store <span className="text-red-500">*</span>
        </label>
        <select
          name="store_id"
          value={formData.store_id}
          onChange={onChange}
          required
          disabled={disabled}
          className={fieldClass()}
        >
          <option value="">Select a Store</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name} {store.address ? `- ${store.address}` : ""}
            </option>
          ))}
        </select>
        {stores.length === 0 && (
          <p className="mt-1 text-xs text-red-600">
            No stores available. Please create a store first.
          </p>
        )}
      </div>

      <div>
        <label className={labelClass}>
          <FaBox className="text-gray-400" />
          Product <span className="text-red-500">*</span>
        </label>
        <select
          name="product_id"
          value={formData.product_id}
          onChange={onChange}
          required
          disabled={disabled}
          className={fieldClass()}
        >
          <option value="">Select a Product</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} - {product.sku || "No SKU"} ({formatCurrency(product.price)})
            </option>
          ))}
        </select>
        {products.length === 0 && (
          <p className="mt-1 text-xs text-red-600">
            No products available. Please create a product first.
          </p>
        )}
      </div>

      <div>
        <label className={labelClass}>
          <FaSortNumericUp className="text-gray-400" />
          Quantity <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          name="quantity"
          value={formData.quantity}
          onChange={onChange}
          required
          min={minQuantity}
          step="1"
          disabled={disabled}
          placeholder="Enter quantity"
          className={fieldClass()}
        />
      </div>

      {selectedProduct && (
        <StatGrid
          stats={[
            { label: "Unit Price", value: formatCurrency(selectedProduct.price) },
            {
              label: "Cost Price",
              value: selectedProduct.cost_price ? formatCurrency(selectedProduct.cost_price) : "—",
            },
            {
              label: "Stock Value",
              value: formatCurrency(toNumber(selectedProduct.cost_price) * quantity),
            },
            {
              label: "Retail Value",
              value: formatCurrency(toNumber(selectedProduct.price) * quantity),
            },
          ]}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Modals
// ---------------------------------------------------------------------------

const ImportCSVModal = ({ isOpen, onClose, onImport, stores }) => {
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState(null);
  const [defaultStoreId, setDefaultStoreId] = useState("");
  const [mode, setMode] = useState("add");
  const [createMissing, setCreateMissing] = useState(true);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [fileKey, setFileKey] = useState(0);

  const importing = progress !== null && result === null;

  const reset = () => {
    setFileName("");
    setParsed(null);
    setDefaultStoreId("");
    setMode("add");
    setCreateMissing(true);
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
      setParsed(readInventoryCSV(await file.text()));
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
      { rows: parsed.rows, defaultStoreId, mode, createMissing },
      (done) => setProgress({ done, total })
    );
    setResult(importResult);
  };

  if (!isOpen) return null;

  const needsDefaultStore = parsed && !parsed.fatal && !parsed.hasStoreColumn;
  const canImport =
    parsed?.rows.length > 0 && (!needsDefaultStore || defaultStoreId) && !importing;

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
              { label: "New Products", value: result.productsCreated },
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
      title="Import Stock from CSV"
      subtitle="Add or update inventory in bulk"
      icon={FaFileImport}
      onClose={handleClose}
      busy={importing}
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-5 px-6 py-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className={`${labelClass} mb-0`}>
                <FaFileCsv className="text-gray-400" />
                CSV File <span className="text-red-500">*</span>
              </span>
              <button
                type="button"
                onClick={() => downloadCSVTemplate(stores)}
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
                Columns: sku or name, quantity — optional: price, cost_price,
                description, store
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
          </div>

          {parsed?.fatal && (
            <div className="px-3 py-2 text-sm text-red-700 border border-red-200 bg-red-50 sm:col-span-2">
              {parsed.fatal}
            </div>
          )}

          {parsed && !parsed.fatal && (
            <div className="space-y-2 sm:col-span-2">
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

          <div className="sm:col-span-2">
            <label className={labelClass}>
              <FaStore className="text-gray-400" />
              Default Store
              {needsDefaultStore ? (
                <span className="text-red-500">*</span>
              ) : (
                <span className="font-normal text-gray-400 normal-case">
                  (for rows without a store)
                </span>
              )}
            </label>
            <select
              value={defaultStoreId}
              onChange={(e) => setDefaultStoreId(e.target.value)}
              disabled={importing}
              required={Boolean(needsDefaultStore)}
              className={fieldClass()}
            >
              <option value="">Select a Store</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Existing Stock</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              disabled={importing}
              className={fieldClass()}
            >
              <option value="add">Add to current quantity</option>
              <option value="replace">Replace current quantity</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Unknown Products</label>
            <select
              value={createMissing ? "create" : "skip"}
              onChange={(e) => setCreateMissing(e.target.value === "create")}
              disabled={importing}
              className={fieldClass()}
            >
              <option value="create">Create them</option>
              <option value="skip">Skip the row</option>
            </select>
          </div>

          {importing && (
            <div className="sm:col-span-2">
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
                Import {parsed?.rows.length ? `${parsed.rows.length} Rows` : "Stock"}
              </>
            )}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  );
};

const AddStockModal = ({ isOpen, onClose, onAdd, stores, products }) => {
  const [formData, setFormData] = useState({
    store_id: "",
    product_id: "",
    quantity: "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.store_id || !formData.product_id || !formData.quantity) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const processedData = {
        store_id: toId(formData.store_id),
        product_id: toId(formData.product_id),
        quantity: Math.max(0, Math.trunc(toNumber(formData.quantity))),
      };

      await onAdd(processedData);
      onClose();
      setFormData({
        store_id: "",
        product_id: "",
        quantity: "",
      });
    } catch (error) {
      console.error("Error adding inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!isOpen) return null;

  return (
    <ModalShell
      title="Add Inventory"
      subtitle="Stock a product in one of your stores"
      icon={FaPlus}
      iconClass="bg-green-600"
      onClose={onClose}
      busy={loading}
    >
      <form onSubmit={handleSubmit}>
        <StockFormFields
          formData={formData}
          onChange={handleChange}
          disabled={loading}
          stores={stores}
          products={products}
          minQuantity="1"
        />
        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={secondaryButtonClass}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              loading ||
              !formData.store_id ||
              !formData.product_id ||
              !formData.quantity
            }
            className={primaryButtonClass("green")}
          >
            {loading ? (
              <>
                <Spinner />
                Adding...
              </>
            ) : (
              <>
                <FaPlus className="mr-2" />
                Add Inventory
              </>
            )}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  );
};

const EditStockModal = ({
  isOpen,
  onClose,
  onUpdate,
  inventoryItem,
  stores,
  products,
}) => {
  const [formData, setFormData] = useState({
    store_id: "",
    product_id: "",
    quantity: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (inventoryItem) {
      setFormData({
        store_id: inventoryItem.store_id?.toString() || "",
        product_id: inventoryItem.product_id?.toString() || "",
        quantity: inventoryItem.quantity?.toString() || "",
      });
    }
  }, [inventoryItem]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.store_id || !formData.product_id || formData.quantity === "") {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const processedData = {
        store_id: toId(formData.store_id),
        product_id: toId(formData.product_id),
        quantity: Math.max(0, Math.trunc(toNumber(formData.quantity))),
      };

      await onUpdate(inventoryItem.id, processedData);
      onClose();
    } catch (error) {
      console.error("Error updating inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!isOpen || !inventoryItem) return null;

  return (
    <ModalShell
      title="Edit Inventory"
      subtitle="Update store, product or quantity"
      icon={FaEdit}
      onClose={onClose}
      busy={loading}
    >
      <form onSubmit={handleSubmit}>
        <StockFormFields
          formData={formData}
          onChange={handleChange}
          disabled={loading}
          stores={stores}
          products={products}
          minQuantity="0"
        />
        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={secondaryButtonClass}
          >
            Cancel
          </button>
          <button type="submit" disabled={loading} className={primaryButtonClass()}>
            {loading ? (
              <>
                <Spinner />
                Updating...
              </>
            ) : (
              <>
                <FaEdit className="mr-2" />
                Update Inventory
              </>
            )}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  );
};

// Main Inventory Component
export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showEditStockModal, setShowEditStockModal] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingInventory, setAddingInventory] = useState(false);
  const [rowInsight, setRowInsight] = useState(null);

  const showRowInsight = (event, product, figures) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setRowInsight({ product, figures, rect, visible: true });
  };

  const hideRowInsight = () =>
    setRowInsight((prev) => (prev ? { ...prev, visible: false } : prev));

  // The card is pinned to the row's on-screen position, so drop it on scroll
  useEffect(() => {
    if (!rowInsight?.visible) return;
    window.addEventListener("scroll", hideRowInsight, true);
    return () => window.removeEventListener("scroll", hideRowInsight, true);
  }, [rowInsight?.visible]);

  // Fetch data from API
  const fetchInventory = async () => {
    try {
      setError(null);
      const data = await inventoryAPI.getAllInventory();
      setInventory(Array.isArray(data) ? data : []);
      setFilteredInventory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const data = await storeAPI.getAllStores();
      setStores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching stores:", error);
      setError((prev) => prev || `Stores: ${error.message}`);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await productAPI.getAllProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError((prev) => prev || `Products: ${error.message}`);
    }
  };

  // Add new inventory - FIXED VERSION
  const handleAddInventory = async (inventoryData) => {
    if (addingInventory) return;
    
    setAddingInventory(true);
    try {
      const response = await inventoryAPI.createInventory(inventoryData);
      const processedItem = normalizeInventoryItem(response, inventoryData);

      setInventory((prev) => [...(Array.isArray(prev) ? prev : []), processedItem]);

      setShowAddStockModal(false);
      alert("Inventory added successfully!");
    } catch (error) {
      console.error("Error adding inventory:", error);
      alert(error.message || "Failed to add inventory");
      throw error;
    } finally {
      setAddingInventory(false);
    }
  };

  // Update inventory
  const handleUpdateInventory = async (id, inventoryData) => {
    try {
      const response = await inventoryAPI.updateInventory(id, inventoryData);
      setInventory((prev) =>
        prev.map((item) =>
          sameId(item.id, id)
            ? normalizeInventoryItem(response, { ...item, ...inventoryData })
            : item
        )
      );
      setShowEditStockModal(false);
      setSelectedInventoryItem(null);
      alert("Inventory updated successfully!");
    } catch (error) {
      console.error("Error updating inventory:", error);
      alert(error.message || "Failed to update inventory");
      throw error;
    }
  };

  // Delete inventory
  const handleDeleteInventory = async (id) => {
    if (!confirm("Are you sure you want to delete this inventory item?")) {
      return;
    }

    try {
      await inventoryAPI.deleteInventory(id);
      setInventory((prev) => prev.filter((item) => !sameId(item.id, id)));
      alert("Inventory deleted successfully!");
    } catch (error) {
      console.error("Error deleting inventory:", error);
      alert(error.message || "Failed to delete inventory item.");
    }
  };

  // Calculate summary metrics
  // Totals follow the active search/store filter
  const calculateSummary = () => {
    // Stock Value = Σ cost_price × quantity, Retail Value = Σ price × quantity
    const summary = filteredInventory.reduce(
      (acc, item) => {
        const figures = getStockFigures(item, safeGetProduct(item, products));
        acc.totalUnits += Math.max(0, figures.quantity);
        acc.totalStockValue = roundMoney(acc.totalStockValue + figures.stockValue);
        acc.totalRetailValue = roundMoney(acc.totalRetailValue + figures.retailValue);
        if (figures.isLowStock) acc.lowStockItems += 1;
        if (figures.isOutOfStock) acc.outOfStockItems += 1;
        return acc;
      },
      {
        totalItems: filteredInventory.length,
        totalUnits: 0,
        totalStockValue: 0,
        totalRetailValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
      }
    );

    return summary;
  };

  const summary = calculateSummary();
  const isFiltered = Boolean(searchTerm || selectedStore);
  const selectedStoreName = stores.find((s) => sameId(s.id, selectedStore))?.name;

  // Detect mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchInventory(), fetchStores(), fetchProducts()]);
      } catch (error) {
        console.error("Error loading data:", error);
        setError("Failed to load data. Please try again.");
      }
    };
    loadData();
  }, []);

  // Filter inventory based on filters
  useEffect(() => {
    let filtered = inventory;

    if (searchTerm) {
      filtered = filtered.filter((item) => {
        const product = safeGetProduct(item, products);
        const store = safeGetStore(item, stores);

        return (
          product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          store?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (selectedStore) {
      filtered = filtered.filter(
        (item) => item.store_id?.toString() === selectedStore
      );
    }

    setFilteredInventory(filtered);
  }, [inventory, searchTerm, selectedStore, products, stores]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStore("");
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleEditClick = (item) => {
    setSelectedInventoryItem(item);
    setShowEditStockModal(true);
  };

  // Import validated CSV rows one at a time: resolve the store and product
  // (creating the product if allowed), then create or update the inventory row
  const handleImportCSV = async ({ rows, defaultStoreId, mode, createMissing }, onProgress) => {
    const result = { created: 0, updated: 0, productsCreated: 0, failed: [] };
    const knownProducts = [...products];
    const knownInventory = inventory.map((item) => ({ ...item }));
    const lower = (value) => String(value || "").trim().toLowerCase();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // Store: explicit id, then name, then the modal's default
        let storeId = null;
        if (row.store_id) {
          const store = stores.find((s) => sameId(s.id, row.store_id));
          if (!store) throw new Error(`Store id "${row.store_id}" not found`);
          storeId = store.id;
        } else if (row.store) {
          const store = stores.find((s) => lower(s.name) === lower(row.store));
          if (!store) throw new Error(`Store "${row.store}" not found`);
          storeId = store.id;
        } else if (defaultStoreId) {
          storeId = toId(defaultStoreId);
        } else {
          throw new Error("No store given and no default store selected");
        }

        // Product: id, then SKU, then name
        let product = null;
        if (row.product_id) {
          product = knownProducts.find((p) => sameId(p.id, row.product_id));
          if (!product) throw new Error(`Product id "${row.product_id}" not found`);
        } else {
          product =
            (row.sku && knownProducts.find((p) => p.sku && lower(p.sku) === lower(row.sku))) ||
            (row.name && knownProducts.find((p) => lower(p.name) === lower(row.name))) ||
            null;
        }

        if (!product) {
          const label = row.sku || row.name;
          if (!createMissing) throw new Error(`Product "${label}" not found`);
          if (!row.name) throw new Error(`Product "${label}" not found; add a name to create it`);
          if (!row.price) throw new Error(`Product "${label}" not found; add a price to create it`);

          const response = await productAPI.createProduct({
            sku: row.sku,
            name: row.name,
            description: row.description,
            price: toNumber(row.price),
            cost_price: toNumber(row.cost_price),
          });
          product = unwrapResponse(response, "product");
          if (!product?.id) throw new Error(`Product "${label}" was not created`);
          knownProducts.push(product);
          result.productsCreated += 1;
        }

        // Inventory: update the existing store/product row or create one
        const existing = knownInventory.find(
          (item) => sameId(item.store_id, storeId) && sameId(item.product_id, product.id)
        );
        if (existing) {
          const quantity =
            mode === "replace" ? row.quantity : toNumber(existing.quantity) + row.quantity;
          await inventoryAPI.updateInventory(existing.id, {
            store_id: toId(storeId),
            product_id: toId(product.id),
            quantity,
          });
          existing.quantity = quantity;
          result.updated += 1;
        } else {
          const payload = {
            store_id: toId(storeId),
            product_id: toId(product.id),
            quantity: row.quantity,
          };
          const response = await inventoryAPI.createInventory(payload);
          knownInventory.push(normalizeInventoryItem(response, payload));
          result.created += 1;
        }
      } catch (error) {
        result.failed.push({ line: row.line, message: error.message || "Import failed" });
      }
      onProgress?.(i + 1);
    }

    // Reload so the table reflects exactly what the server stored
    await Promise.all([fetchInventory(), fetchProducts()]);
    return result;
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    Promise.all([fetchInventory(), fetchStores(), fetchProducts()]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading inventory...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative max-w-6xl mx-auto pb-16 md:pb-0">
        <h1 className="hidden mb-6 text-xl font-normal text-gray-800 md:block font-raleway">
          Inventory
        </h1>
        <InventoryNav />

        <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-lg text-center">
          <FaExclamationTriangle className="mx-auto text-red-500 text-3xl mb-4" />
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Unable to Load Inventory
          </h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
            <div className="text-sm text-red-500">
              <p>If this problem persists, please check:</p>
              <ul className="list-disc list-inside mt-2 text-left max-w-md mx-auto">
                <li>Your internet connection</li>
                <li>Server status</li>
                <li>Authentication token validity</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-6xl mx-auto pb-16 md:pb-0">
      <h1 className="hidden mb-6 text-xl font-normal text-gray-800 md:block font-raleway">
        Inventory
      </h1>
      <InventoryNav />

      <div className="mt-4 space-y-4 px-2 md:px-0">
        {/* Summary Cards */}
        <div className="">
          <div className="p-2 bg-white rounded shadow">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-nowrap sm:overflow-x-auto sm:justify-between sm:space-x-1 md:space-x-2">
              {/* ITEMS */}
              <div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
                <div className="flex items-center">
                  <div className="p-1 mr-1 rounded bg-blue-100 md:mr-2 md:p-1.5">
                    <FaShoppingCart className="text-xs text-blue-600 md:text-sm" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
                      Total Items
                    </h3>
                    <p className="text-sm font-bold text-gray-800 md:text-lg">
                      {summary.totalItems}
                    </p>
                    <p className="text-[8px] text-gray-500 md:text-xs">
                      {summary.totalUnits.toLocaleString()} units
                    </p>
                  </div>
                </div>
              </div>

              {/* Stock Value card - Now using cost price */}
              <div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
                <div className="flex items-center">
                  <div className="p-1 mr-1 rounded bg-green-100 md:mr-2 md:p-1.5">
                    <FaUniversity className="text-xs text-green-600 md:text-sm" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
                      Stock Value
                    </h3>
                    <p className="text-sm font-bold text-gray-800 md:text-lg">
                      {formatCurrency(summary.totalStockValue)}
                    </p>
                    <p className="text-[8px] text-gray-500 md:text-xs">
                      Based on cost price
                    </p>
                  </div>
                </div>
              </div>

              {/* Retail value - Now using unit price */}
              <div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
                <div className="flex items-center">
                  <div className="p-1 mr-1 rounded bg-red-100 md:mr-2 md:p-1.5">
                    <FaTag className="text-xs text-red-600 md:text-sm" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
                      Retail Value
                    </h3>
                    <p className="text-sm font-bold text-gray-800 md:text-lg">
                      {formatCurrency(summary.totalRetailValue)}
                    </p>
                    <p className="text-[8px] text-gray-500 md:text-xs">
                      Based on unit price
                    </p>
                  </div>
                </div>
              </div>

              {/* Low Stock Items */}
              <div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
                <div className="flex items-center">
                  <div className="p-1 mr-1 rounded bg-yellow-100 md:mr-2 md:p-1.5">
                    <FaMoneyBillWave className="text-xs text-yellow-600 md:text-sm" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
                      Low Stock
                    </h3>
                    <p className="text-sm font-bold text-gray-800 md:text-lg">
                      {summary.lowStockItems}
                    </p>
                    <p className="text-[8px] text-gray-500 md:text-xs">
                      {summary.outOfStockItems} out of stock
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {isFiltered && (
              <div className="flex items-center justify-between gap-2 px-2 pt-2 mt-1 text-[10px] text-gray-500 border-t border-gray-100 md:text-xs">
                <span className="truncate">
                  Totals for {summary.totalItems} of {inventory.length} items
                  {selectedStoreName && ` · ${selectedStoreName}`}
                  {searchTerm && ` · “${searchTerm}”`}
                </span>
                <button
                  onClick={clearFilters}
                  className="shrink-0 font-medium text-indigo-600 hover:text-indigo-800"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="p-3 bg-white rounded shadow">
          <div className="flex flex-col w-full gap-3 md:flex-row items-stretch">
            {/* Left side - Search and filters */}
            <div className="flex flex-col flex-grow gap-3 md:flex-row">
              {/* Search bar and filter button for mobile */}
              {isMobile ? (
                <div className="flex w-full gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Search products, SKU, stores..."
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
                  {/* Search bar for desktop */}
                  <div className="relative w-full md:w-64">
                    <input
                      type="text"
                      placeholder="Search products, SKU, stores..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <FaSearch className="absolute right-2 top-1.5 text-xs text-gray-400" />
                  </div>

                  {/* Desktop filters */}
                  <div className="flex gap-3">
                    {/* Store filter */}
                    <div className="w-48">
                      <select
                        value={selectedStore}
                        onChange={(e) => setSelectedStore(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">All Stores</option>
                        {stores.map((store) => (
                          <option key={store.id} value={store.id}>
                            {store.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right side - Action buttons */}
            <div className="hidden md:flex justify-start w-full gap-2 md:justify-end md:w-auto">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center px-3 py-1.5 text-xs text-white transition-colors bg-blue-600 rounded hover:bg-blue-700"
              >
                <FaFileImport className="mr-1 text-xs" />
                Import CSV
              </button>
              <button
                onClick={() => setShowAddStockModal(true)}
                className="flex items-center px-3 py-1.5 text-xs text-white transition-colors bg-green-600 rounded hover:bg-green-700"
              >
                <FaPlus className="mr-1 text-xs" />
                Add Inventory
              </button>
            </div>
          </div>

          {/* Filter dropdown for mobile */}
          {isMobile && showFilters && (
            <div className="grid grid-cols-1 gap-2 p-2 mt-3 bg-gray-50 rounded">
              {/* Store filter */}
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-700">
                  Store
                </label>
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Stores</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
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

        {/* Inventory Table */}
        <div className="overflow-hidden bg-white rounded shadow">
          {/* Desktop Table */}
          <div className="hidden overflow-x-auto text-black md:block">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Product Details
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Store
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Cost Price
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Stock Value
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item) => {
                  const product = safeGetProduct(item, products);
                  const store = safeGetStore(item, stores);
                  const figures = getStockFigures(item, product);
                  const { quantity, stockValue, isLowStock, isOutOfStock } = figures;

                  return (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-gray-50"
                      onMouseEnter={(e) => showRowInsight(e, product, figures)}
                      onMouseLeave={hideRowInsight}
                    >
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <div className="font-medium text-black">
                            {product.name || "N/A"}
                          </div>
                          <div className="text-xs text-gray-500">
                            SKU: {product.sku || "No SKU"}
                            {product.description && ` • ${product.description}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        <div className="font-medium">{store.name || "N/A"}</div>
                        {store.address && (
                          <div className="text-xs text-gray-500">
                            {store.address}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        <span
                          className={`font-medium ${
                            isOutOfStock
                              ? "text-red-600"
                              : isLowStock
                              ? "text-yellow-600"
                              : "text-green-600"
                          }`}
                        >
                          {quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        {product.cost_price
                          ? formatCurrency(product.cost_price)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-black">
                        {formatCurrency(stockValue)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isOutOfStock
                              ? "bg-red-100 text-red-800"
                              : isLowStock
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {isOutOfStock
                            ? "Out of Stock"
                            : isLowStock
                            ? "Low Stock"
                            : "In Stock"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="p-1 text-blue-600 transition-colors hover:text-blue-800 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <FaEdit className="text-sm" />
                          </button>
                          <button
                            onClick={() => handleDeleteInventory(item.id)}
                            className="p-1 text-red-600 transition-colors hover:text-red-800 hover:bg-red-50 rounded"
                            title="Delete"
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

          {/* Mobile Cards */}
          <div className="text-black md:hidden">
            {filteredInventory.map((item) => {
              const product = safeGetProduct(item, products);
              const store = safeGetStore(item, stores);
              const figures = getStockFigures(item, product);
              const { quantity, stockValue, isLowStock, isOutOfStock, marginPct } = figures;

              return (
                <div key={item.id} className="p-4 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-black">
                        {product.name || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">
                        SKU: {product.sku || "No SKU"}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        isOutOfStock
                          ? "bg-red-100 text-red-800"
                          : isLowStock
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {isOutOfStock
                        ? "Out of Stock"
                        : isLowStock
                        ? "Low Stock"
                        : "In Stock"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Store</div>
                      <div className="font-medium">{store.name || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Quantity</div>
                      <div
                        className={`font-medium ${
                          isOutOfStock
                            ? "text-red-600"
                            : isLowStock
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {quantity}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Unit Price</div>
                      <div className="font-medium">
                        {formatCurrency(product.price)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Cost Price</div>
                      <div className="font-medium">
                        {product.cost_price
                          ? formatCurrency(product.cost_price)
                          : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Stock Value</div>
                      <div className="font-medium">
                        {formatCurrency(stockValue)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Margin</div>
                      <div
                        className={`font-medium ${
                          marginPct === null
                            ? "text-gray-400"
                            : marginPct < 0
                            ? "text-rose-600"
                            : marginPct < 15
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {marginPct === null ? "—" : `${marginPct.toFixed(1)}%`}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleEditClick(item)}
                      className="flex-1 px-3 py-1.5 text-xs text-blue-600 border border-blue-600 rounded transition-colors hover:bg-blue-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteInventory(item.id)}
                      className="flex-1 px-3 py-1.5 text-xs text-red-600 border border-red-600 rounded transition-colors hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredInventory.length === 0 && (
            <div className="py-12 text-center">
              <div className="text-gray-400 mb-2">
                <FaBox className="inline text-3xl" />
              </div>
              <p className="text-sm text-gray-500">No inventory items found</p>
              {inventory.length === 0 && (
                <button
                  onClick={() => setShowAddStockModal(true)}
                  className="mt-2 px-4 py-2 text-xs text-white bg-green-600 rounded hover:bg-green-700"
                >
                  Add Your First Inventory Item
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Action Buttons for Mobile */}
      {isMobile && (
        <div className="fixed bottom-4 right-4 md:hidden">
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center justify-center w-12 h-12 text-white transition-transform bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 hover:scale-110"
              title="Import CSV"
            >
              <FaFileImport className="text-lg" />
            </button>
            <button
              onClick={() => setShowAddStockModal(true)}
              className="flex items-center justify-center w-12 h-12 text-white transition-transform bg-green-600 rounded-full shadow-lg hover:bg-green-700 hover:scale-110"
              title="Add Inventory"
            >
              <FaPlus className="text-lg" />
            </button>
          </div>
        </div>
      )}

      <RowInsightCard insight={rowInsight} />

      {/* Modals */}
      <ImportCSVModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportCSV}
        stores={stores}
      />

      <AddStockModal
        isOpen={showAddStockModal}
        onClose={() => setShowAddStockModal(false)}
        onAdd={handleAddInventory}
        stores={stores}
        products={products}
      />

      <EditStockModal
        isOpen={showEditStockModal}
        onClose={() => {
          setShowEditStockModal(false);
          setSelectedInventoryItem(null);
        }}
        onUpdate={handleUpdateInventory}
        inventoryItem={selectedInventoryItem}
        stores={stores}
        products={products}
      />
    </div>
  );
}
