// pages/deletedTransactions.js
import { useState, useEffect, useRef } from "react";
import http from "../../services/http";
import {
  AlertTriangle,
  Archive,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  Users,
  Wallet,
  X,
  XCircle,
} from "lucide-react";

const PAGE_SIZE = 25;
const TOAST_DURATION = { success: 3000, error: 5000 };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const toList = (body) => (Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : []);

// Laravel can send "2026-10-07 13:25:00", which Safari won't parse
const toDate = (value) => {
  if (!value) return null;
  const date = new Date(typeof value === "string" ? value.replace(" ", "T") : value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDay = (value) =>
  toDate(value)?.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" }) || "N/A";

const formatClock = (value) =>
  toDate(value)?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) || "";

const formatDateTime = (value) => {
  const day = formatDay(value);
  const clock = formatClock(value);
  return clock ? `${day} · ${clock}` : day;
};

const formatCurrency = (amount) =>
  `₦${Number(amount || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const amountOf = (t) => parseFloat(t.total_amount) || 0;

const label = (value) =>
  value
    ? value
        .toString()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : "Unknown";

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

// Deleted-at date range filter (local calendar days)
const inDateRange = (value, range) => {
  if (range === "all") return true;
  const date = toDate(value);
  if (!date) return false;
  const today = startOfToday();
  const daysAgo = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d;
  };
  if (range === "today") return date >= today;
  if (range === "yesterday") return date >= daysAgo(1) && date < today;
  if (range === "week") return date >= daysAgo(7);
  if (range === "month") return date >= daysAgo(30);
  return true;
};

const DATE_RANGES = [
  { id: "all", label: "All Time" },
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "week", label: "Last 7 Days" },
  { id: "month", label: "Last 30 Days" },
];

const STATUS_BADGE = {
  completed: "bg-green-50 text-green-700",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-700",
  cancelled: "bg-gray-100 text-gray-600",
};

const itemName = (item, index) => item.name || item.product_name || `Item ${index + 1}`;
const itemQty = (item) => Number(item.quantity) || Number(item.qty) || 0;
const itemPrice = (item) => parseFloat(item.price ?? item.unit_price ?? item.product_price) || 0;

// ---------------------------------------------------------------------------
// Shared pieces (same look as the other redesigned pages)
// ---------------------------------------------------------------------------

const filterFieldClass =
  "block w-full h-8 px-2.5 text-xs text-gray-800 bg-gray-100 border-0 rounded-none outline-none shadow-none appearance-none transition-colors placeholder:text-gray-400 focus:bg-gray-50 focus:outline-none focus:ring-0";

const statLabelClass = "text-[10px] font-semibold tracking-wide text-gray-500 uppercase";

const secondaryButtonClass =
  "flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-none transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed";

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

const Badge = ({ className, children }) => (
  <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${className}`}>
    {children}
  </span>
);

const StatusBadge = ({ status }) => (
  <Badge className={STATUS_BADGE[status?.toLowerCase()] || "bg-gray-100 text-gray-600"}>{label(status)}</Badge>
);

const PaymentBadge = ({ method }) => <Badge className="text-gray-700 bg-gray-100">{label(method)}</Badge>;

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

const SummaryRow = ({ label: rowLabel, value, strong = false }) => (
  <div className="flex items-center justify-between gap-4 px-4 py-2.5 bg-white">
    <span className={strong ? "text-sm font-semibold text-gray-900" : "text-sm text-gray-600"}>{rowLabel}</span>
    <span className={`text-right ${strong ? "text-base font-bold text-gray-900" : "text-sm font-medium text-gray-900"}`}>
      {value}
    </span>
  </div>
);

// Clickable column header with a sort arrow
const SortHeader = ({ column, sortBy, sortOrder, onSort, align = "left", className = "", children }) => {
  const active = sortBy === column;
  return (
    <th className={`py-2.5 ${className} ${align === "right" ? "text-right" : "text-left"}`}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={`inline-flex items-center gap-1 ${statLabelClass} hover:text-gray-800 ${
          active ? "text-gray-800" : ""
        }`}
      >
        {children}
        {active ? (
          sortOrder === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />
        ) : (
          <ChevronDown size={11} className="opacity-0" />
        )}
      </button>
    </th>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DeletedTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("deleted_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

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

  // Fetch deleted transactions
  const fetchDeletedTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await http.get("/view-deleted-transaction");
      setTransactions(toList(response.data));
    } catch (err) {
      console.error("Failed to fetch deleted transactions:", err);
      setError(err.response?.data?.message || "Failed to load deleted transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedTransactions();
  }, []);

  // ---- Filter + sort -------------------------------------------------------

  const term = searchTerm.trim().toLowerCase();
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      term === "" ||
      [t.id, t.total_amount, t.processed_by, t.customer_id, t.payment_method, t.status].some((field) =>
        field?.toString().toLowerCase().includes(term)
      );
    const matchesStatus = statusFilter === "all" || t.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesPayment =
      paymentMethodFilter === "all" || t.payment_method?.toLowerCase() === paymentMethodFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesPayment && inDateRange(t.deleted_at, dateFilter);
  });

  const sortValue = (t) => {
    switch (sortBy) {
      case "total_amount":
        return amountOf(t);
      case "deleted_at":
      case "created_at":
        return toDate(t[sortBy])?.getTime() || 0;
      case "id":
        return Number(t.id) || 0;
      default:
        return (t[sortBy] ?? "").toString().toLowerCase();
    }
  };

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const av = sortValue(a);
    const bv = sortValue(b);
    const diff = av < bv ? -1 : av > bv ? 1 : 0;
    return sortOrder === "asc" ? diff : -diff;
  });

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder((order) => (order === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const hasFilters = Boolean(
    searchTerm || statusFilter !== "all" || paymentMethodFilter !== "all" || dateFilter !== "all"
  );

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPaymentMethodFilter("all");
    setDateFilter("all");
  };

  // Back to the first page whenever the result set or order changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, paymentMethodFilter, dateFilter, sortBy, sortOrder]);

  const pageCount = Math.max(1, Math.ceil(sortedTransactions.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageRows = sortedTransactions.slice(pageStart, pageStart + PAGE_SIZE);

  const uniqueStatuses = [...new Set(transactions.map((t) => t.status).filter(Boolean))].sort();
  const uniquePaymentMethods = [...new Set(transactions.map((t) => t.payment_method).filter(Boolean))].sort();

  const totalAmount = transactions.reduce((sum, t) => sum + amountOf(t), 0);
  const filteredAmount = filteredTransactions.reduce((sum, t) => sum + amountOf(t), 0);
  const deletedToday = transactions.filter((t) => inDateRange(t.deleted_at, "today")).length;
  const processorCount = new Set(transactions.map((t) => t.processed_by).filter(Boolean)).size;

  // ---- Export --------------------------------------------------------------

  const handleExportCSV = () => {
    if (sortedTransactions.length === 0) {
      notify("error", "There are no transactions to export.", "Nothing to export");
      return;
    }
    try {
      const headers = ["ID", "Amount", "Status", "Payment Method", "Processed By", "Customer ID", "Deleted At", "Created At"];
      const cell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
      const csvContent = [
        headers.join(","),
        ...sortedTransactions.map((t) =>
          [t.id, t.total_amount, t.status, t.payment_method, t.processed_by, t.customer_id, t.deleted_at, t.created_at]
            .map(cell)
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const today = startOfToday();
      link.href = url;
      link.download = `deleted-transactions-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
        today.getDate()
      ).padStart(2, "0")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      notify(
        "success",
        `${sortedTransactions.length} transaction${sortedTransactions.length === 1 ? "" : "s"} exported.`,
        "Export ready"
      );
    } catch (err) {
      console.error("Export failed:", err);
      notify("error", "Could not export the transactions.", "Export failed");
    }
  };

  // Escape closes the details modal
  useEffect(() => {
    if (!selectedTransaction) return;
    const onKey = (e) => {
      if (e.key === "Escape") setSelectedTransaction(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedTransaction]);

  // ---- Render --------------------------------------------------------------

  const tiles = [
    { icon: Trash2, iconClass: "bg-red-50 text-red-700", label: "Total Deleted", value: transactions.length },
    { icon: Wallet, iconClass: "bg-blue-50 text-blue-700", label: "Total Amount", value: formatCurrency(totalAmount) },
    { icon: CalendarDays, iconClass: "bg-amber-50 text-amber-700", label: "Deleted Today", value: deletedToday },
    { icon: Users, iconClass: "bg-purple-50 text-purple-700", label: "Processed By", value: `${processorCount} ${processorCount === 1 ? "person" : "people"}` },
  ];

  const filterFields = (
    <>
      <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
        <option value="all">All Statuses</option>
        {uniqueStatuses.map((status) => (
          <option key={status} value={status}>
            {label(status)}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect
        value={paymentMethodFilter}
        onChange={(e) => setPaymentMethodFilter(e.target.value)}
        aria-label="Filter by payment method"
      >
        <option value="all">All Payment Methods</option>
        {uniquePaymentMethods.map((method) => (
          <option key={method} value={method}>
            {label(method)}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} aria-label="Filter by date deleted">
        {DATE_RANGES.map((range) => (
          <option key={range.id} value={range.id}>
            {range.label}
          </option>
        ))}
      </FilterSelect>
    </>
  );

  const sortProps = { sortBy, sortOrder, onSort: handleSort };
  const selected = selectedTransaction;
  const selectedItems = Array.isArray(selected?.items) ? selected.items : [];

  return (
    <div className="pt-0 mt-0 font-raleway">
      {toast && <Toast key={toast.id} toast={toast} onClose={closeToast} />}

      {/* Transaction Details Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto bg-gray-900/20 backdrop-blur-[2px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedTransaction(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-xl bg-white border border-gray-300 rounded-none shadow-2xl modal-in"
          >
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center min-w-0 gap-3">
                <div className="flex items-center justify-center w-10 h-10 text-white bg-red-600 shrink-0">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold leading-tight text-gray-900 truncate">Transaction #{selected.id}</h2>
                  <p className="text-xs text-gray-500">Deleted {formatDateTime(selected.deleted_at)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                aria-label="Close"
                className="flex items-center justify-center w-8 h-8 text-gray-400 transition-colors shrink-0 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="px-4 py-5 text-center border border-gray-200 bg-gray-50">
                <p className={statLabelClass}>Amount</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{formatCurrency(amountOf(selected))}</p>
                <div className="flex justify-center gap-2 mt-2">
                  <StatusBadge status={selected.status} />
                  <PaymentBadge method={selected.payment_method} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200">
                {[
                  ["Customer ID", selected.customer_id || "N/A"],
                  ["Processed By", selected.processed_by || "System"],
                  ["Created", formatDateTime(selected.created_at)],
                  ["Deleted", formatDateTime(selected.deleted_at)],
                ].map(([rowLabel, value]) => (
                  <div key={rowLabel} className="px-3 py-2.5 bg-white">
                    <div className={statLabelClass}>{rowLabel}</div>
                    <div className="mt-0.5 text-sm font-medium text-gray-900 truncate">{value}</div>
                  </div>
                ))}
              </div>

              {selectedItems.length > 0 && (
                <div className="border border-gray-200">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2 border-b border-gray-200 bg-gray-50">
                    <span className={statLabelClass}>Item</span>
                    <span className={`${statLabelClass} w-12 text-right`}>Qty</span>
                    <span className={`${statLabelClass} w-24 text-right`}>Price</span>
                  </div>
                  <ul className="overflow-y-auto divide-y divide-gray-100 max-h-64">
                    {selectedItems.map((item, index) => (
                      <li key={item.id ?? index} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-2.5">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{itemName(item, index)}</p>
                          {item.description && <p className="text-xs text-gray-500 truncate">{item.description}</p>}
                        </div>
                        <span className="w-12 text-sm text-right text-gray-700">{itemQty(item) || "—"}</span>
                        <span className="w-24 text-sm font-medium text-right text-gray-900">{formatCurrency(itemPrice(item))}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selected.notes && (
                <div>
                  <p className={`${statLabelClass} mb-1.5`}>Notes</p>
                  <p className="px-4 py-3 text-sm text-gray-700 border border-gray-200 bg-gray-50">{selected.notes}</p>
                </div>
              )}

              {selectedItems.length === 0 && !selected.notes && (
                <div className="grid gap-px bg-gray-200 border border-gray-200">
                  <SummaryRow label="Items" value="No item details on this record" />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button type="button" onClick={() => setSelectedTransaction(null)} className={secondaryButtonClass}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="hidden mb-1 text-xl font-normal text-gray-800 md:block">Deleted Transactions</h1>
      <p className="hidden mb-5 text-sm text-gray-500 md:block">An audit trail of sales that were removed from the records</p>

      <div className="space-y-5">
        {/* Summary Tiles */}
        <div className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200 lg:grid-cols-4">
          {tiles.map(({ icon: Icon, iconClass, label: tileLabel, value }) => (
            <div key={tileLabel} className="flex items-center gap-3 px-4 py-4 bg-white">
              <div className={`flex items-center justify-center w-10 h-10 shrink-0 ${iconClass}`}>
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <div className={statLabelClass}>{tileLabel}</div>
                <div className="text-lg font-bold leading-tight text-gray-900 truncate">{loading ? "…" : value}</div>
              </div>
            </div>
          ))}
        </div>

        <section className="bg-white border border-gray-200">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-200">
            <div className="flex items-baseline min-w-0 gap-2">
              <h2 className="text-base font-semibold text-gray-900">Deleted Records</h2>
              <span className="text-xs text-gray-500 truncate">
                {loading
                  ? "Loading…"
                  : `${filteredTransactions.length} ${hasFilters ? "matching" : "total"} · ${formatCurrency(filteredAmount)}`}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
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
                onClick={fetchDeletedTransactions}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 transition-colors bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-60"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
              <button
                onClick={handleExportCSV}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white transition-colors bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <Download size={13} />
                Export CSV
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="px-5 py-3 border-b border-gray-200">
            <div className="flex gap-2 md:grid md:grid-cols-[minmax(0,1fr)_10rem_12rem_9rem]">
              <div className="relative flex-1 min-w-0">
                <Search
                  size={13}
                  className="absolute text-gray-400 -translate-y-1/2 pointer-events-none left-2.5 top-1/2"
                />
                <input
                  type="search"
                  placeholder="Search by ID, amount, processor, customer or payment"
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
                  showFilters || statusFilter !== "all" || paymentMethodFilter !== "all" || dateFilter !== "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {showFilters ? <X size={13} /> : <SlidersHorizontal size={13} />}
                Filters
              </button>
              <div className="hidden md:contents">{filterFields}</div>
            </div>
            {showFilters && <div className="grid gap-2 mt-2 md:hidden">{filterFields}</div>}
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 text-sm text-gray-500 py-14">
              <Loader2 size={20} className="text-blue-600 animate-spin" />
              Loading deleted transactions…
            </div>
          ) : error ? (
            <EmptyState
              icon={AlertTriangle}
              tone="red"
              title="Couldn't load deleted transactions"
              hint={error}
              action={
                <button onClick={fetchDeletedTransactions} className={secondaryButtonClass}>
                  Try again
                </button>
              }
            />
          ) : sortedTransactions.length === 0 ? (
            <EmptyState
              icon={Archive}
              title={transactions.length === 0 ? "No deleted transactions" : "No transactions match your filters"}
              hint={transactions.length === 0 ? "Sales removed from the sales list will appear here" : "Try a different search or filter"}
              action={
                hasFilters && (
                  <button onClick={clearFilters} className={secondaryButtonClass}>
                    Clear filters
                  </button>
                )
              }
            />
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="w-full text-sm table-fixed">
                  <colgroup>
                    <col className="w-[9%]" />
                    <col className="w-[15%]" />
                    <col className="w-[12%]" />
                    <col className="w-[13%]" />
                    <col className="w-[10%]" />
                    <col />
                    <col className="w-[17%]" />
                    <col className="w-[4.5rem]" />
                  </colgroup>
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <SortHeader column="id" className="px-5" {...sortProps}>ID</SortHeader>
                      <SortHeader column="total_amount" className="px-3" align="right" {...sortProps}>Amount</SortHeader>
                      <SortHeader column="status" className="px-3" {...sortProps}>Status</SortHeader>
                      <SortHeader column="payment_method" className="px-3" {...sortProps}>Payment</SortHeader>
                      <SortHeader column="customer_id" className="px-3" {...sortProps}>Customer</SortHeader>
                      <SortHeader column="processed_by" className="px-3" {...sortProps}>Processed By</SortHeader>
                      <SortHeader column="deleted_at" className="px-3" {...sortProps}>Deleted</SortHeader>
                      <th className={`px-5 py-2.5 text-right ${statLabelClass}`}>View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pageRows.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedTransaction(t)}
                        className="transition-colors cursor-pointer hover:bg-blue-50/50"
                      >
                        <td className="px-5 py-3 font-medium text-gray-900 truncate">#{t.id}</td>
                        <td className="px-3 py-3 font-semibold text-right text-gray-900 truncate">
                          {formatCurrency(amountOf(t))}
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="px-3 py-3">
                          <PaymentBadge method={t.payment_method} />
                        </td>
                        <td className="px-3 py-3 text-gray-700 truncate">{t.customer_id || "—"}</td>
                        <td className="px-3 py-3 text-gray-700 truncate" title={t.processed_by}>
                          {t.processed_by || "System"}
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-gray-900 truncate">{formatDay(t.deleted_at)}</div>
                          <div className="text-xs text-gray-500">{formatClock(t.deleted_at)}</div>
                        </td>
                        <td className="px-5 py-2" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end">
                            <button
                              onClick={() => setSelectedTransaction(t)}
                              className="flex items-center justify-center w-8 h-8 text-gray-500 transition-colors hover:bg-gray-100 hover:text-blue-600"
                              title="View details"
                              aria-label={`View transaction ${t.id}`}
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <ul className="divide-y divide-gray-100 md:hidden">
                {pageRows.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedTransaction(t)}
                      className="w-full px-5 py-4 text-left transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">#{t.id}</p>
                          <p className="text-xs text-gray-500">Deleted {formatDateTime(t.deleted_at)}</p>
                        </div>
                        <p className="text-sm font-bold text-gray-900 whitespace-nowrap">{formatCurrency(amountOf(t))}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <StatusBadge status={t.status} />
                        <PaymentBadge method={t.payment_method} />
                      </div>
                      <div className="grid grid-cols-2 gap-px mt-3 bg-gray-200 border border-gray-200">
                        <div className="px-2.5 py-2 bg-white">
                          <div className={statLabelClass}>Customer</div>
                          <div className="text-xs font-semibold text-gray-900 truncate">{t.customer_id || "N/A"}</div>
                        </div>
                        <div className="px-2.5 py-2 bg-white">
                          <div className={statLabelClass}>Processed By</div>
                          <div className="text-xs font-semibold text-gray-900 truncate">{t.processed_by || "System"}</div>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>

              {/* Pagination */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-gray-200 bg-gray-50">
                <span className="text-xs text-gray-500">
                  Showing {pageStart + 1}–{pageStart + pageRows.length} of {sortedTransactions.length}
                </span>
                {pageCount > 1 && (
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      aria-label="Previous page"
                      className="flex items-center justify-center w-8 h-8 text-gray-600 transition-colors bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="flex items-center h-8 px-3 text-xs font-medium text-gray-700 bg-white border-gray-300 border-y">
                      Page {currentPage} of {pageCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage(currentPage + 1)}
                      disabled={currentPage === pageCount}
                      aria-label="Next page"
                      className="flex items-center justify-center w-8 h-8 text-gray-600 transition-colors bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
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
