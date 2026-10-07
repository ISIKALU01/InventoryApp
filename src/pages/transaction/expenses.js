// pages/transaction/expenses.js
import { useState, useEffect, useRef } from "react";
import TransactionNav from "../../components/TransactionNav";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Receipt,
  Search,
  SlidersHorizontal,
  Trash2,
  Wallet,
  X,
  XCircle,
} from "lucide-react";

import { expenseAPI, userAPI } from "../../../services/api";

const PAGE_SIZE = 25;
const TOAST_DURATION = { success: 3000, error: 5000 };

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

const pad = (n) => String(n).padStart(2, "0");

// Calendar day in the user's timezone (an ISO slice of "now" would use UTC)
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const nowTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Expense dates come back as "YYYY-MM-DD" or a full ISO string; keep the
// calendar day as written rather than shifting it through UTC
const dateKeyOf = (value) => String(value || "").slice(0, 10);

const dateOnly = (value) => {
  const m = dateKeyOf(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};

const timeKeyOf = (value) => String(value || "").slice(0, 5);

// Sortable "YYYY-MM-DD HH:MM" for newest-first ordering
const sortKey = (expense) => `${dateKeyOf(expense.date)} ${timeKeyOf(expense.time) || "00:00"}`;

const formatDisplayDate = (value) => {
  const date = dateOnly(value);
  return date
    ? date.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })
    : value || "N/A";
};

// "HH:MM" or "HH:MM:SS" to 12-hour time
const formatDisplayTime = (value) => {
  const [h, m] = timeKeyOf(value).split(":");
  if (h === undefined || m === undefined || h === "") return value || "";
  const hours = Number(h);
  return `${hours % 12 || 12}:${m} ${hours >= 12 ? "PM" : "AM"}`;
};

const amountOf = (expense) => parseFloat(expense.amount) || 0;

const formatCurrency = (amount) =>
  `₦${Number(amount || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// "jane.doe@x.com" -> "Jane.doe"
const usernameFromEmail = (email) => {
  const name = (email || "").split("@")[0];
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : "";
};

const toList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  throw new Error("Unexpected response format");
};

// ---------------------------------------------------------------------------
// Shared pieces (same look as the sales list and sales point)
// ---------------------------------------------------------------------------

// Slim, flat filter field: square corners, no border or focus ring
const filterFieldClass =
  "block w-full h-8 px-2.5 text-xs text-gray-800 bg-gray-100 border-0 rounded-none outline-none shadow-none appearance-none transition-colors placeholder:text-gray-400 focus:bg-gray-50 focus:outline-none focus:ring-0";

// Form field in modals: same flat look at a comfortable size
const fieldClass =
  "block w-full h-10 px-3 text-sm text-gray-800 bg-gray-100 border-0 rounded-none outline-none shadow-none transition-colors placeholder:text-gray-400 focus:bg-gray-50 focus:outline-none focus:ring-0 read-only:text-gray-500 read-only:cursor-not-allowed";

const labelClass = "block mb-1.5 text-xs font-semibold tracking-wide text-gray-600 uppercase";

const statLabelClass = "text-[10px] font-semibold tracking-wide text-gray-500 uppercase";

const primaryButtonClass =
  "flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-none transition-colors hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed";

const dangerButtonClass =
  "flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-none transition-colors hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed";

const secondaryButtonClass =
  "flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-none transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed";

const iconButtonClass =
  "flex items-center justify-center w-8 h-8 text-gray-500 transition-colors hover:bg-gray-100";

// Borderless dropdown with its own chevron in place of the browser arrow
const Select = ({ className = "", children, ...props }) => (
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

const EmptyState = ({ icon: Icon, title, hint, tone = "gray", action }) => (
  <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
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

const ErrorBox = ({ title, message }) => (
  <div
    role="alert"
    className="flex items-start gap-3 px-4 py-3 text-sm text-red-800 border border-red-200 bg-red-50"
  >
    <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" />
    <div>
      <p className="font-semibold">{title}</p>
      <p className="mt-0.5 text-red-700">{message}</p>
    </div>
  </div>
);

// Toast for quick confirmations and failures; the bar shows time left
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
          <Icon
            size={20}
            className={`mt-0.5 shrink-0 ${isError ? "text-red-600" : "text-green-600"}`}
          />
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
            className="flex items-center justify-center w-7 h-7 -mr-1 text-gray-400 transition-colors shrink-0 hover:bg-gray-100 hover:text-gray-700"
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

// Floating panel over a lightly blurred page
const ModalShell = ({
  title,
  subtitle,
  icon: Icon,
  iconClass = "bg-blue-600",
  onClose,
  busy = false,
  maxWidth = "max-w-md",
  children,
}) => (
  <div
    className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto bg-gray-900/20 backdrop-blur-[2px]"
    onClick={(e) => {
      if (e.target === e.currentTarget && !busy) onClose();
    }}
  >
    <div
      role="dialog"
      aria-modal="true"
      className={`relative w-full ${maxWidth} bg-white border border-gray-300 rounded-none shadow-2xl modal-in`}
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

const ModalFooter = ({ children, className = "justify-end" }) => (
  <div className={`flex flex-wrap gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 ${className}`}>
    {children}
  </div>
);

const SummaryRow = ({ label, value, strong = false }) => (
  <div className="flex items-center justify-between gap-4 px-4 py-2.5 bg-white">
    <span className={strong ? "text-sm font-semibold text-gray-900" : "text-sm text-gray-600"}>
      {label}
    </span>
    <span
      className={`text-right ${
        strong ? "text-base font-bold text-gray-900" : "text-sm font-medium text-gray-900"
      }`}
    >
      {value}
    </span>
  </div>
);

const StatTile = ({ icon: Icon, iconClass, label, value }) => (
  <div className="flex items-center gap-3 px-4 py-4 bg-white">
    <div className={`flex items-center justify-center w-10 h-10 shrink-0 ${iconClass}`}>
      <Icon size={18} />
    </div>
    <div className="min-w-0">
      <div className={statLabelClass}>{label}</div>
      <div className="text-lg font-bold leading-tight text-gray-900 truncate">{value}</div>
    </div>
  </div>
);

const CategoryBadge = ({ category }) =>
  category ? (
    <span className="inline-block px-2 py-0.5 text-[11px] font-medium text-blue-800 bg-blue-50 whitespace-nowrap">
      {category}
    </span>
  ) : (
    <span className="text-gray-400">—</span>
  );

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const emptyForm = (postedBy = "") => ({
  description: "",
  category: "",
  amount: "",
  date: todayKey(),
  time: nowTime(),
  posted_by: postedBy,
  location: "",
});

export default function Expenses() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [postedBy, setPostedBy] = useState("");

  // Add / edit form
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseFormData, setExpenseFormData] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Details and delete
  const [viewExpense, setViewExpense] = useState(null);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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

  // "Posted by" is the signed-in user; fall back to the first user
  const fetchPostedBy = async () => {
    try {
      const userData = await userAPI.getCurrentUser();
      setPostedBy(usernameFromEmail(userData?.email));
    } catch (err) {
      console.error("Error fetching current user:", err);
      try {
        const usersData = await userAPI.getAllUsers();
        if (Array.isArray(usersData) && usersData.length > 0) {
          setPostedBy(usernameFromEmail(usersData[0].email));
        }
      } catch (usersErr) {
        console.error("Error fetching users:", usersErr);
      }
    }
  };

  // Fetch expenses from API
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError("");
      setTransactions(toList(await expenseAPI.getAllExpenses()));
    } catch (err) {
      setError(err.message);
      console.error("Error fetching expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load expenses and user data on component mount
  useEffect(() => {
    fetchExpenses();
    fetchPostedBy();
  }, []);

  // Newest first by date then time; ties fall back to the higher id
  const sortedTransactions = [...transactions].sort((a, b) => {
    const diff = sortKey(b).localeCompare(sortKey(a));
    return diff !== 0 ? diff : (Number(b.id) || 0) - (Number(a.id) || 0);
  });

  const locations = [...new Set(transactions.map((t) => t.location).filter(Boolean))].sort();
  const postedByUsers = [...new Set(transactions.map((t) => t.posted_by).filter(Boolean))].sort();
  const categories = [...new Set(transactions.map((t) => t.category).filter(Boolean))].sort();

  // Filter transactions based on filters
  const term = searchTerm.trim().toLowerCase();
  const filteredTransactions = sortedTransactions.filter((t) => {
    const matchesSearch =
      term === "" ||
      [t.description, t.category, t.posted_by, t.location, t.amount].some(
        (field) => field !== undefined && field !== null && field.toString().toLowerCase().includes(term)
      );
    const matchesDate = selectedDate === "" || dateKeyOf(t.date) === selectedDate;
    const matchesLocation = selectedLocation === "" || t.location === selectedLocation;
    const matchesUser = selectedUser === "" || t.posted_by === selectedUser;
    return matchesSearch && matchesDate && matchesLocation && matchesUser;
  });

  const hasFilters = Boolean(searchTerm || selectedDate || selectedLocation || selectedUser);

  // Back to the first page whenever the result set changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedDate, selectedLocation, selectedUser]);

  const pageCount = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filteredTransactions.slice(pageStart, pageStart + PAGE_SIZE);

  // Totals
  const totalExpenses = transactions.reduce((sum, t) => sum + amountOf(t), 0);
  const today = todayKey();
  const todayExpenses = transactions.filter((t) => dateKeyOf(t.date) === today);
  const todayTotal = todayExpenses.reduce((sum, t) => sum + amountOf(t), 0);
  const filteredTotal = filteredTransactions.reduce((sum, t) => sum + amountOf(t), 0);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDate("");
    setSelectedLocation("");
    setSelectedUser("");
  };

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) {
      notify("error", "There are no expenses to export.", "Nothing to export");
      return;
    }

    const headers = ["Description", "Category", "Amount", "Date", "Time", "Posted By", "Location"];
    const csvData = filteredTransactions.map((t) => [
      t.description,
      t.category,
      amountOf(t).toFixed(2),
      dateKeyOf(t.date),
      timeKeyOf(t.time),
      t.posted_by,
      t.location,
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((field) => `"${String(field ?? "").replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `expenses-report-${todayKey()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    notify(
      "success",
      `${filteredTransactions.length} expense${filteredTransactions.length === 1 ? "" : "s"} exported.`,
      "Export ready"
    );
  };

  // ---- Add / edit -------------------------------------------------------

  const handleMakeExpense = () => {
    setEditingExpense(null);
    setExpenseFormData(emptyForm(postedBy));
    setFormError("");
    setShowExpenseForm(true);
  };

  const handleEditExpense = (expense) => {
    setViewExpense(null);
    setEditingExpense(expense);
    setExpenseFormData({
      description: expense.description || "",
      category: expense.category || "",
      amount: expense.amount ?? "",
      date: dateKeyOf(expense.date),
      time: timeKeyOf(expense.time),
      posted_by: expense.posted_by || postedBy,
      location: expense.location || "",
    });
    setFormError("");
    setShowExpenseForm(true);
  };

  const handleCloseExpenseForm = () => {
    if (saving) return;
    setShowExpenseForm(false);
    setEditingExpense(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormError("");
    setExpenseFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitExpense = async (e) => {
    e.preventDefault();

    const amount = parseFloat(expenseFormData.amount);
    if (!(amount > 0)) {
      setFormError("Enter an amount greater than zero.");
      return;
    }

    try {
      setSaving(true);
      setFormError("");
      const expenseData = { ...expenseFormData, amount };

      if (editingExpense) {
        await expenseAPI.updateExpense(editingExpense.id, expenseData);
      } else {
        await expenseAPI.createExpense(expenseData);
      }

      await fetchExpenses();
      setShowExpenseForm(false);
      setEditingExpense(null);
      notify(
        "success",
        `${expenseData.description} · ${formatCurrency(amount)}`,
        editingExpense ? "Expense updated" : "Expense posted"
      );
    } catch (err) {
      console.error(`Error ${editingExpense ? "updating" : "creating"} expense:`, err);
      setFormError(err.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ---- Delete -----------------------------------------------------------

  const handleDeleteExpense = (expense) => {
    setDeleteError("");
    setExpenseToDelete(expense);
  };

  const closeDelete = () => {
    if (!deleting) setExpenseToDelete(null);
  };

  const confirmDelete = async () => {
    const expense = expenseToDelete;
    try {
      setDeleting(true);
      setDeleteError("");
      await expenseAPI.deleteExpense(expense.id);
      setTransactions((prev) => prev.filter((t) => t.id !== expense.id));
      setExpenseToDelete(null);
      if (viewExpense?.id === expense.id) setViewExpense(null);
      notify("success", `${expense.description || "The expense"} was deleted.`, "Expense deleted");
    } catch (err) {
      console.error("Error deleting expense:", err);
      setDeleteError(err.message || "Could not delete this expense. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  // Escape closes the top-most dialog
  useEffect(() => {
    if (!showExpenseForm && !viewExpense && !expenseToDelete) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (expenseToDelete) closeDelete();
      else if (showExpenseForm) handleCloseExpenseForm();
      else setViewExpense(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const filterFields = (
    <>
      <div>
        <label htmlFor="filter-date" className={`${labelClass} md:sr-only`}>Date</label>
        <input
          id="filter-date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className={filterFieldClass}
        />
      </div>
      <div>
        <label htmlFor="filter-location" className={`${labelClass} md:sr-only`}>Location</label>
        <Select
          id="filter-location"
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
        >
          <option value="">All Locations</option>
          {locations.map((location) => (
            <option key={location} value={location}>{location}</option>
          ))}
        </Select>
      </div>
      <div>
        <label htmlFor="filter-user" className={`${labelClass} md:sr-only`}>Posted By</label>
        <Select id="filter-user" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
          <option value="">All Users</option>
          {postedByUsers.map((user) => (
            <option key={user} value={user}>{user}</option>
          ))}
        </Select>
      </div>
    </>
  );

  return (
    <div className="pt-0 mt-0 font-raleway">
      {toast && <Toast key={toast.id} toast={toast} onClose={closeToast} />}

      {/* Expense Details Modal */}
      {viewExpense && (
        <ModalShell
          title="Expense Details"
          subtitle={`${formatDisplayDate(viewExpense.date)} · ${formatDisplayTime(viewExpense.time)}`}
          icon={Receipt}
          onClose={() => setViewExpense(null)}
        >
          <div className="px-6 py-5 space-y-4">
            <div className="px-4 py-5 text-center border border-gray-200 bg-gray-50">
              <p className={statLabelClass}>Amount</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{formatCurrency(amountOf(viewExpense))}</p>
            </div>
            <div className="grid gap-px bg-gray-200 border border-gray-200">
              <SummaryRow label="Description" value={viewExpense.description || "—"} />
              <SummaryRow label="Category" value={<CategoryBadge category={viewExpense.category} />} />
              <SummaryRow label="Location" value={viewExpense.location || "—"} />
              <SummaryRow label="Posted By" value={viewExpense.posted_by || "—"} />
            </div>
          </div>
          <ModalFooter className="justify-between">
            <button
              type="button"
              onClick={() => handleDeleteExpense(viewExpense)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash2 size={16} />
              Delete
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={() => setViewExpense(null)} className={secondaryButtonClass}>
                Close
              </button>
              <button type="button" onClick={() => handleEditExpense(viewExpense)} className={primaryButtonClass}>
                <Pencil size={16} />
                Edit
              </button>
            </div>
          </ModalFooter>
        </ModalShell>
      )}

      {/* Expense Form Modal */}
      {showExpenseForm && (
        <ModalShell
          title={editingExpense ? "Edit Expense" : "Post Expense"}
          subtitle={editingExpense ? "Update the details of this expense" : "Record money spent from the business"}
          icon={editingExpense ? Pencil : Plus}
          onClose={handleCloseExpenseForm}
          busy={saving}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSubmitExpense}>
            <div className="px-6 py-5 space-y-4">
              {formError && (
                <ErrorBox
                  title={editingExpense ? "Expense not updated" : "Expense not posted"}
                  message={formError}
                />
              )}

              <div>
                <label htmlFor="expense-description" className={labelClass}>Description</label>
                <input
                  id="expense-description"
                  type="text"
                  name="description"
                  value={expenseFormData.description}
                  onChange={handleInputChange}
                  className={fieldClass}
                  required
                  autoFocus
                  placeholder="What was the money spent on?"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="expense-category" className={labelClass}>Category</label>
                  <input
                    id="expense-category"
                    type="text"
                    name="category"
                    list="expense-categories"
                    value={expenseFormData.category}
                    onChange={handleInputChange}
                    className={fieldClass}
                    required
                    placeholder="e.g. Transport"
                  />
                  <datalist id="expense-categories">
                    {categories.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label htmlFor="expense-amount" className={labelClass}>Amount</label>
                  <div className="relative">
                    <span className="absolute text-sm text-gray-500 -translate-y-1/2 pointer-events-none left-3 top-1/2">
                      ₦
                    </span>
                    <input
                      id="expense-amount"
                      type="number"
                      name="amount"
                      value={expenseFormData.amount}
                      onChange={handleInputChange}
                      className={`${fieldClass} pl-7`}
                      required
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="expense-date" className={labelClass}>Date</label>
                  <input
                    id="expense-date"
                    type="date"
                    name="date"
                    value={expenseFormData.date}
                    onChange={handleInputChange}
                    className={fieldClass}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="expense-time" className={labelClass}>Time</label>
                  <input
                    id="expense-time"
                    type="time"
                    name="time"
                    value={expenseFormData.time}
                    onChange={handleInputChange}
                    className={fieldClass}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="expense-location" className={labelClass}>Location</label>
                <input
                  id="expense-location"
                  type="text"
                  name="location"
                  list="expense-locations"
                  value={expenseFormData.location}
                  onChange={handleInputChange}
                  className={fieldClass}
                  required
                  placeholder="Where was it spent?"
                />
                <datalist id="expense-locations">
                  {locations.map((location) => (
                    <option key={location} value={location} />
                  ))}
                </datalist>
              </div>

              <div>
                <label htmlFor="expense-posted-by" className={labelClass}>Posted By</label>
                <input
                  id="expense-posted-by"
                  type="text"
                  name="posted_by"
                  value={expenseFormData.posted_by}
                  className={fieldClass}
                  required
                  readOnly
                  placeholder="Auto-filled from your account"
                />
                <p className="mt-1.5 text-xs text-gray-500">Filled in from your account.</p>
              </div>
            </div>

            <ModalFooter>
              <button
                type="button"
                onClick={handleCloseExpenseForm}
                disabled={saving}
                className={secondaryButtonClass}
              >
                Cancel
              </button>
              <button type="submit" disabled={saving} className={primaryButtonClass}>
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? "Saving…" : editingExpense ? "Update Expense" : "Post Expense"}
              </button>
            </ModalFooter>
          </form>
        </ModalShell>
      )}

      {/* Delete Confirmation Modal */}
      {expenseToDelete && (
        <ModalShell
          title="Delete Expense"
          subtitle="This can't be undone"
          icon={Trash2}
          iconClass="bg-red-600"
          onClose={closeDelete}
          busy={deleting}
        >
          <div className="px-6 py-5 space-y-4">
            {deleteError && <ErrorBox title="Not deleted" message={deleteError} />}
            <p className="text-sm text-gray-600">
              You&apos;re about to permanently delete this expense from the records.
            </p>
            <div className="grid gap-px bg-gray-200 border border-gray-200">
              <SummaryRow label="Description" value={expenseToDelete.description || "—"} />
              <SummaryRow label="Date" value={formatDisplayDate(expenseToDelete.date)} />
              <SummaryRow label="Amount" value={formatCurrency(amountOf(expenseToDelete))} strong />
            </div>
          </div>
          <ModalFooter>
            <button type="button" onClick={closeDelete} disabled={deleting} className={secondaryButtonClass}>
              Cancel
            </button>
            <button type="button" onClick={confirmDelete} disabled={deleting} className={dangerButtonClass}>
              {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              {deleting ? "Deleting…" : "Delete Expense"}
            </button>
          </ModalFooter>
        </ModalShell>
      )}

      <h1 className="hidden mb-2 text-xl font-normal text-gray-800 md:block">Expenses</h1>
      <TransactionNav />

      <div className="mt-5 space-y-5">
        {/* Summary Tiles */}
        <div className="grid grid-cols-1 gap-px bg-gray-200 border border-gray-200 sm:grid-cols-3">
          <StatTile
            icon={Wallet}
            iconClass="bg-red-50 text-red-700"
            label="Total Expenses"
            value={loading ? "…" : formatCurrency(totalExpenses)}
          />
          <StatTile
            icon={CalendarDays}
            iconClass="bg-amber-50 text-amber-700"
            label="Spent Today"
            value={loading ? "…" : formatCurrency(todayTotal)}
          />
          <StatTile
            icon={Receipt}
            iconClass="bg-blue-50 text-blue-700"
            label="Expenses Today"
            value={loading ? "…" : todayExpenses.length}
          />
        </div>

        {/* Expenses Log */}
        <section className="bg-white border border-gray-200">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-200">
            <div className="flex items-baseline min-w-0 gap-2">
              <h2 className="text-base font-semibold text-gray-900">Expenses</h2>
              <span className="text-xs text-gray-500 truncate">
                {loading
                  ? "Loading…"
                  : `${filteredTransactions.length} ${hasFilters ? "matching" : "total"} · ${formatCurrency(filteredTotal)} · newest first`}
              </span>
            </div>
            <div className="flex gap-2">
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
                >
                  <X size={14} />
                  Clear filters
                </button>
              )}
              <button
                type="button"
                onClick={exportToCSV}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white transition-colors bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <Download size={14} />
                Export
              </button>
              <button
                type="button"
                onClick={handleMakeExpense}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white transition-colors bg-blue-600 hover:bg-blue-700"
              >
                <Plus size={14} />
                Post Expense
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="px-5 py-3 border-b border-gray-200">
            <div className="flex gap-2 md:grid md:grid-cols-[minmax(0,1fr)_9rem_11rem_11rem]">
              <div className="relative flex-1 min-w-0">
                <Search
                  size={13}
                  className="absolute text-gray-400 -translate-y-1/2 pointer-events-none left-2.5 top-1/2"
                />
                <input
                  type="search"
                  placeholder="Search by description, category, location or amount"
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
                  showFilters || selectedDate || selectedLocation || selectedUser
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
            <div className="flex items-center justify-center gap-3 py-14 text-sm text-gray-500">
              <Loader2 size={20} className="text-blue-600 animate-spin" />
              Loading expenses…
            </div>
          ) : error ? (
            <EmptyState
              icon={AlertTriangle}
              tone="red"
              title="Couldn't load expenses"
              hint={error}
              action={
                <button type="button" onClick={fetchExpenses} className={secondaryButtonClass}>
                  Try again
                </button>
              }
            />
          ) : filteredTransactions.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title={transactions.length === 0 ? "No expenses yet" : "No expenses match your filters"}
              hint={transactions.length === 0 ? "Posted expenses will appear here" : "Try a different search or filter"}
              action={
                hasFilters ? (
                  <button type="button" onClick={clearFilters} className={secondaryButtonClass}>
                    Clear filters
                  </button>
                ) : (
                  <button type="button" onClick={handleMakeExpense} className={primaryButtonClass}>
                    <Plus size={16} />
                    Post Expense
                  </button>
                )
              }
            />
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr className="text-left">
                      <th className={`px-5 py-2.5 ${statLabelClass}`}>Date &amp; Time</th>
                      <th className={`px-3 py-2.5 ${statLabelClass}`}>Description</th>
                      <th className={`px-3 py-2.5 ${statLabelClass}`}>Category</th>
                      <th className={`px-3 py-2.5 ${statLabelClass}`}>Posted By</th>
                      <th className={`px-3 py-2.5 ${statLabelClass}`}>Location</th>
                      <th className={`px-3 py-2.5 text-right ${statLabelClass}`}>Amount</th>
                      <th className={`px-5 py-2.5 text-right ${statLabelClass}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pageRows.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => setViewExpense(t)}
                        className="transition-colors cursor-pointer hover:bg-blue-50/50"
                      >
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{formatDisplayDate(t.date)}</div>
                          <div className="text-xs text-gray-500">{formatDisplayTime(t.time)}</div>
                        </td>
                        <td className="max-w-[16rem] px-3 py-3 text-gray-900 truncate">{t.description}</td>
                        <td className="px-3 py-3">
                          <CategoryBadge category={t.category} />
                        </td>
                        <td className="max-w-[10rem] px-3 py-3 text-gray-700 truncate">{t.posted_by}</td>
                        <td className="max-w-[10rem] px-3 py-3 text-gray-700 truncate">{t.location}</td>
                        <td className="px-3 py-3 font-semibold text-right text-gray-900 whitespace-nowrap">
                          {formatCurrency(amountOf(t))}
                        </td>
                        <td className="px-5 py-2" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setViewExpense(t)}
                              className={`${iconButtonClass} hover:text-blue-600`}
                              title="View"
                              aria-label={`View ${t.description}`}
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditExpense(t)}
                              className={`${iconButtonClass} hover:text-green-600`}
                              title="Edit"
                              aria-label={`Edit ${t.description}`}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(t)}
                              className={`${iconButtonClass} hover:text-red-600`}
                              title="Delete"
                              aria-label={`Delete ${t.description}`}
                            >
                              <Trash2 size={16} />
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
                  <li key={t.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{t.description}</p>
                        <p className="text-xs text-gray-500">
                          {formatDisplayDate(t.date)} · {formatDisplayTime(t.time)}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-gray-900 whitespace-nowrap">
                        {formatCurrency(amountOf(t))}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center mt-2 text-xs text-gray-600 gap-x-3 gap-y-1">
                      <CategoryBadge category={t.category} />
                      {t.location && <span>{t.location}</span>}
                      {t.posted_by && <span>By {t.posted_by}</span>}
                    </div>

                    <div className="grid grid-cols-3 mt-3 border border-gray-200 divide-x divide-gray-200">
                      <button
                        type="button"
                        onClick={() => setViewExpense(t)}
                        className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Eye size={14} /> View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditExpense(t)}
                        className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(t)}
                        className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Pagination */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-gray-200 bg-gray-50">
                <span className="text-xs text-gray-500">
                  Showing {pageStart + 1}–{pageStart + pageRows.length} of {filteredTransactions.length}
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
