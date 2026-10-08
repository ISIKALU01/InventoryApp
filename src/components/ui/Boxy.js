// components/ui/Boxy.js
// Shared building blocks for the boxy page style: square panels, slim flat
// filters, toasts, modals with a lightly blurred backdrop, and pagination.
// Animations (.toast-in, .toast-progress, .modal-in) live in globals.css.
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Class names
// ---------------------------------------------------------------------------

export const filterFieldClass =
  "block w-full h-8 px-2.5 text-xs text-gray-800 bg-gray-100 border-0 rounded-none outline-none shadow-none appearance-none transition-colors placeholder:text-gray-400 focus:bg-gray-50 focus:outline-none focus:ring-0";

export const fieldClass = (hasError = false) =>
  `block w-full px-3 py-2.5 text-sm text-gray-800 bg-white border rounded-none outline-none transition-colors placeholder:text-gray-400 disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed ${
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
      : "border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
  }`;

export const labelClass = "block mb-1.5 text-xs font-semibold tracking-wide text-gray-600 uppercase";

export const statLabelClass = "text-[10px] font-semibold tracking-wide text-gray-500 uppercase";

export const primaryButtonClass =
  "flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-none transition-colors hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed";

export const secondaryButtonClass =
  "flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-none transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed";

export const dangerButtonClass =
  "flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-none transition-colors hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed";

// Small buttons for panel headers
export const toolbarButtonClass = {
  primary:
    "flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white transition-colors bg-blue-600 hover:bg-blue-700 disabled:opacity-50",
  secondary:
    "flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 transition-colors bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-60",
  ghost: "flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100",
};

export const iconButtonClass = (tone = "blue") =>
  `flex items-center justify-center w-8 h-8 text-gray-500 transition-colors hover:bg-gray-100 ${
    tone === "red" ? "hover:text-red-600" : "hover:text-blue-600"
  }`;

// ---------------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------------

export const TOAST_DURATION = { success: 3000, error: 5000 };

export const Toast = ({ toast, onClose }) => {
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

// const { notify, toastElement } = useToast(); render {toastElement} once
export const useToast = () => {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const notify = (type, message, title) => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), type, message, title });
    timer.current = setTimeout(() => setToast(null), TOAST_DURATION[type] || 3000);
  };

  const close = () => {
    clearTimeout(timer.current);
    setToast(null);
  };

  return {
    notify,
    toastElement: toast ? <Toast key={toast.id} toast={toast} onClose={close} /> : null,
  };
};

// ---------------------------------------------------------------------------
// Modals
// ---------------------------------------------------------------------------

export const ModalShell = ({
  title,
  subtitle,
  icon: Icon,
  iconClass = "bg-blue-600",
  onClose,
  busy = false,
  maxWidth = "max-w-md",
  children,
}) => {
  // Escape closes unless something is saving
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  return (
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
            {Icon && (
              <div className={`flex items-center justify-center w-10 h-10 text-white shrink-0 ${iconClass}`}>
                <Icon size={20} />
              </div>
            )}
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
};

export const ModalFooter = ({ children, className = "justify-end" }) => (
  <div className={`flex flex-wrap gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 ${className}`}>{children}</div>
);

export const ErrorBox = ({ title, message }) => (
  <div role="alert" className="flex items-start gap-3 px-4 py-3 text-sm text-red-800 border border-red-200 bg-red-50">
    <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" />
    <div>
      <p className="font-semibold">{title}</p>
      <p className="mt-0.5 text-red-700">{message}</p>
    </div>
  </div>
);

export const SummaryRow = ({ label, value, strong = false }) => (
  <div className="flex items-center justify-between gap-4 px-4 py-2.5 bg-white">
    <span className={strong ? "text-sm font-semibold text-gray-900" : "text-sm text-gray-600"}>{label}</span>
    <span
      className={`text-right truncate ${strong ? "text-base font-bold text-gray-900" : "text-sm font-medium text-gray-900"}`}
    >
      {value}
    </span>
  </div>
);

// Add/edit form built from a field list:
// { name, label, type: text|email|tel|number|date|select|textarea, required,
//   options: [{ value, label }], placeholder, span: "full" | "half", prefix }
export const FormModal = ({
  title,
  subtitle,
  icon,
  fields,
  initialValues,
  submitLabel,
  busyLabel = "Saving…",
  errorTitle = "Not saved",
  onSubmit,
  onClose,
}) => {
  const [values, setValues] = useState(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError("");
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      await onSubmit(values);
    } catch (err) {
      setError(err?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field, index) => {
    const id = `field-${field.name}`;
    const common = {
      id,
      name: field.name,
      value: values[field.name] ?? "",
      onChange: handleChange,
      required: field.required,
      disabled: saving,
      placeholder: field.placeholder,
      autoFocus: index === 0,
    };

    let control;
    if (field.type === "select") {
      control = (
        <div className="relative">
          <select {...common} className={`${fieldClass()} pr-9 appearance-none cursor-pointer`}>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute text-gray-400 -translate-y-1/2 pointer-events-none right-3 top-1/2" />
        </div>
      );
    } else if (field.type === "textarea") {
      control = <textarea {...common} rows={field.rows || 3} className={`${fieldClass()} resize-none`} />;
    } else {
      control = (
        <div className="relative">
          {field.prefix && (
            <span className="absolute text-sm text-gray-500 -translate-y-1/2 pointer-events-none left-3 top-1/2">
              {field.prefix}
            </span>
          )}
          <input
            {...common}
            type={field.type || "text"}
            step={field.type === "number" ? field.step || "0.01" : undefined}
            className={`${fieldClass()} ${field.prefix ? "pl-7" : ""}`}
          />
        </div>
      );
    }

    return (
      <div key={field.name} className={field.span === "half" ? "" : "sm:col-span-2"}>
        <label htmlFor={id} className={labelClass}>
          {field.label}
          {field.required ? (
            <span className="ml-0.5 text-red-500">*</span>
          ) : (
            <span className="ml-1 font-normal text-gray-400 normal-case">(optional)</span>
          )}
        </label>
        {control}
        {field.hint && <p className="mt-1 text-xs text-gray-500">{field.hint}</p>}
      </div>
    );
  };

  return (
    <ModalShell title={title} subtitle={subtitle} icon={icon} onClose={onClose} busy={saving} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-5 space-y-4">
          {error && <ErrorBox title={errorTitle} message={error} />}
          <div className="grid gap-4 sm:grid-cols-2">{fields.map(renderField)}</div>
        </div>
        <ModalFooter>
          <button type="button" onClick={onClose} disabled={saving} className={secondaryButtonClass}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? busyLabel : submitLabel}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  );
};

// Red confirmation for a destructive action; `onConfirm` may throw to show
// its message inside the modal
export const ConfirmDeleteModal = ({
  title,
  message,
  details = [],
  confirmLabel = "Delete",
  busyLabel = "Deleting…",
  icon = Trash2,
  onConfirm,
  onClose,
}) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    try {
      setBusy(true);
      setError("");
      await onConfirm();
    } catch (err) {
      setError(err?.message || "Please try again.");
      setBusy(false);
    }
  };

  const ConfirmIcon = icon;

  return (
    <ModalShell title={title} subtitle="This can't be undone" icon={icon} iconClass="bg-red-600" onClose={onClose} busy={busy}>
      <div className="px-6 py-5 space-y-4">
        {error && <ErrorBox title="Not deleted" message={error} />}
        {message && <p className="text-sm text-gray-600">{message}</p>}
        {details.length > 0 && (
          <div className="grid gap-px bg-gray-200 border border-gray-200">
            {details.map(([label, value]) => (
              <SummaryRow key={label} label={label} value={value} />
            ))}
          </div>
        )}
      </div>
      <ModalFooter>
        <button type="button" onClick={onClose} disabled={busy} className={secondaryButtonClass}>
          Cancel
        </button>
        <button type="button" onClick={handleConfirm} disabled={busy} className={dangerButtonClass}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <ConfirmIcon size={16} />}
          {busy ? busyLabel : confirmLabel}
        </button>
      </ModalFooter>
    </ModalShell>
  );
};

// ---------------------------------------------------------------------------
// Page pieces
// ---------------------------------------------------------------------------

export const PageTitle = ({ title, description }) => (
  <>
    <h1 className="hidden mb-1 text-xl font-normal text-gray-800 md:block">{title}</h1>
    {description && <p className="hidden mb-5 text-sm text-gray-500 md:block">{description}</p>}
  </>
);

// tiles: [{ icon, iconClass, label, value, hint, hintClass }]
export const StatTiles = ({ tiles, loading = false, columns = "sm:grid-cols-3" }) => (
  <div className={`grid grid-cols-1 gap-px bg-gray-200 border border-gray-200 ${columns}`}>
    {tiles.map(({ icon: Icon, iconClass, label, value, hint, hintClass = "text-gray-500" }) => (
      <div key={label} className="flex items-center gap-3 px-4 py-4 bg-white">
        <div className={`flex items-center justify-center w-10 h-10 shrink-0 ${iconClass}`}>
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <div className={statLabelClass}>{label}</div>
          <div className="text-lg font-bold leading-tight text-gray-900 truncate">{loading ? "…" : value}</div>
          {hint && !loading && <div className={`text-xs truncate ${hintClass}`}>{hint}</div>}
        </div>
      </div>
    ))}
  </div>
);

export const PanelHeader = ({ title, meta, children }) => (
  <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-200">
    <div className="flex items-baseline min-w-0 gap-2">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {meta && <span className="text-xs text-gray-500 truncate">{meta}</span>}
    </div>
    {children && <div className="flex flex-wrap gap-2">{children}</div>}
  </div>
);

export const FilterSelect = ({ className = "", children, ...props }) => (
  <div className={`relative ${className}`}>
    <select {...props} className={`${filterFieldClass} pr-7 cursor-pointer`}>
      {children}
    </select>
    <ChevronDown size={13} className="absolute text-gray-400 -translate-y-1/2 pointer-events-none right-2.5 top-1/2" />
  </div>
);

// Search box plus optional filters; on phones the filters fold behind a button
export const FilterBar = ({ search, onSearch, placeholder, filters, filtersActive = false, columns = "md:grid-cols-[minmax(0,1fr)_12rem]" }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="px-5 py-3 border-b border-gray-200">
      <div className={`flex gap-2 md:grid ${filters ? columns : "md:grid-cols-1"}`}>
        <div className="relative flex-1 min-w-0">
          <Search size={13} className="absolute text-gray-400 -translate-y-1/2 pointer-events-none left-2.5 top-1/2" />
          <input
            type="search"
            placeholder={placeholder}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className={`${filterFieldClass} pl-8`}
          />
        </div>
        {filters && (
          <>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className={`flex items-center h-8 gap-1.5 px-2.5 text-xs font-medium transition-colors md:hidden ${
                open || filtersActive ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              {open ? <X size={13} /> : <SlidersHorizontal size={13} />}
              Filters
            </button>
            <div className="hidden md:contents">{filters}</div>
          </>
        )}
      </div>
      {filters && open && <div className="grid gap-2 mt-2 md:hidden">{filters}</div>}
    </div>
  );
};

export const LoadingState = ({ label }) => (
  <div className="flex items-center justify-center gap-3 text-sm text-gray-500 py-14">
    <Loader2 size={20} className="text-blue-600 animate-spin" />
    {label}
  </div>
);

export const EmptyState = ({ icon: Icon, title, hint, tone = "gray", action }) => (
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

export const Badge = ({ className = "text-gray-700 bg-gray-100", children }) => (
  <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${className}`}>{children}</span>
);

// Client-side paging; resets to page 1 when `resetKey` changes
export const usePagination = (rows, pageSize = 25, resetKey = "") => {
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  return {
    pageRows: rows.slice(start, start + pageSize),
    page: current,
    pageCount,
    start,
    total: rows.length,
    setPage,
  };
};

export const Pagination = ({ page, pageCount, start, shown, total, setPage }) => (
  <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-gray-200 bg-gray-50">
    <span className="text-xs text-gray-500">
      Showing {total === 0 ? 0 : start + 1}–{start + shown} of {total}
    </span>
    {pageCount > 1 && (
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
          className="flex items-center justify-center w-8 h-8 text-gray-600 transition-colors bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="flex items-center h-8 px-3 text-xs font-medium text-gray-700 bg-white border-gray-300 border-y">
          Page {page} of {pageCount}
        </span>
        <button
          type="button"
          onClick={() => setPage(page + 1)}
          disabled={page === pageCount}
          aria-label="Next page"
          className="flex items-center justify-center w-8 h-8 text-gray-600 transition-colors bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Formatting / data helpers
// ---------------------------------------------------------------------------

export const formatNaira = (value) =>
  `₦${Number(parseFloat(value) || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const toDate = (value) => {
  if (!value) return null;
  const date = new Date(typeof value === "string" ? value.replace(" ", "T") : value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDay = (value) =>
  toDate(value)?.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" }) || "—";

// API bodies may be a bare value, { data: ... } or { [key]: ... }
export const unwrap = (body, key) => {
  if (body?.data && typeof body.data === "object") return body.data;
  if (key && body?.[key] && typeof body[key] === "object") return body[key];
  return body;
};

export const toList = (body) => {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  return [];
};

export const matchesTerm = (term, fields) =>
  !term || fields.some((field) => field !== undefined && field !== null && field.toString().toLowerCase().includes(term));
