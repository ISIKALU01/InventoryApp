// pages/transaction/sales-list.js
import { useState, useEffect, useRef } from 'react';
import TransactionNav from '../../components/TransactionNav';
import http from "../../../services/http";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Loader2,
  Package,
  Printer,
  Receipt,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Trash2,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';

const PAGE_SIZE = 25;
const MAX_ORDER_PAGES = 100;
const TOAST_DURATION = { success: 3000, error: 5000 };

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

// API responses may be a bare array, { data: [...] } (Laravel paginator)
// or { orders: [...] }
const toList = (body) => {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.orders)) return body.orders;
  return [];
};

// Laravel can send "2026-10-07 13:25:00", which Safari won't parse
const toDate = (value) => {
  if (!value) return null;
  const date = new Date(typeof value === 'string' ? value.replace(' ', 'T') : value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// Calendar day in the user's timezone (an ISO slice would use UTC and
// count late-night sales on the wrong day)
const dayKey = (date) =>
  date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate()
      ).padStart(2, '0')}`
    : '';

const itemQty = (item) =>
  Number(item.quantity) || Number(item.quantity_sold) || Number(item.qty) || 0;

const itemPrice = (item) => parseFloat(item.unit_price ?? item.product_price ?? item.price) || 0;

const orderQty = (order) => {
  if (Array.isArray(order.items)) return order.items.reduce((sum, item) => sum + itemQty(item), 0);
  return Number(order.total_quantity) || Number(order.items_count) || Number(order.quantity) || 0;
};

const orderAmount = (order) =>
  Number(order.total_amount) ||
  Number(order.amount) ||
  Number(order.total) ||
  Number(order.grand_total) ||
  0;

const orderRef = (order) => order.transaction_id || order.id;
const customerOf = (order) => order.customer_name || order.customer?.name || 'Walk-in Customer';
const locationOf = (order) => order.store?.name || order.store || order.location || '';
const userOf = (order) => order.processed_by || order.user_name || '';

const paymentLabel = (method) =>
  method
    ? method
        .toString()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : 'N/A';

const formatCurrency = (amount) =>
  `₦${Number(amount || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDay = (date) =>
  date ? date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';

const formatClock = (date) =>
  date ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';

const escapeHtml = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

// ---------------------------------------------------------------------------
// Shared pieces (same look as the sales point and inventory modals)
// ---------------------------------------------------------------------------

// Slim, flat filter field: square corners, no border or focus ring; the
// fill lightens on focus instead
const fieldClass =
  'block w-full h-8 px-2.5 text-xs text-gray-800 bg-gray-100 border-0 rounded-none outline-none shadow-none appearance-none transition-colors placeholder:text-gray-400 focus:bg-gray-50 focus:outline-none focus:ring-0';

const labelClass = 'block mb-1.5 text-xs font-semibold tracking-wide text-gray-600 uppercase';

const statLabelClass = 'text-[10px] font-semibold tracking-wide text-gray-500 uppercase';

const primaryButtonClass =
  'flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-none transition-colors hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed';

const dangerButtonClass =
  'flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-none transition-colors hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed';

const secondaryButtonClass =
  'flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-none transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed';

const iconButtonClass =
  'flex items-center justify-center w-8 h-8 text-gray-500 transition-colors border border-transparent hover:border-gray-300 hover:bg-white';

// Borderless dropdown with its own chevron in place of the browser arrow
const Select = ({ className = '', children, ...props }) => (
  <div className={`relative ${className}`}>
    <select {...props} className={`${fieldClass} pr-7 cursor-pointer`}>
      {children}
    </select>
    <ChevronDown
      size={13}
      className="absolute text-gray-400 -translate-y-1/2 pointer-events-none right-2.5 top-1/2"
    />
  </div>
);

const EmptyState = ({ icon: Icon, title, hint, tone = 'gray', action }) => (
  <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
    <div
      className={`flex items-center justify-center w-12 h-12 mb-3 ${
        tone === 'red' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-400'
      }`}
    >
      <Icon size={22} />
    </div>
    <p className="text-sm font-medium text-gray-700">{title}</p>
    {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// Toast for quick confirmations and failures; the bar shows time left
const Toast = ({ toast, onClose }) => {
  const isError = toast.type === 'error';
  const Icon = isError ? XCircle : CheckCircle2;

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className="fixed z-[60] top-4 right-4 left-4 sm:left-auto sm:w-96 toast-in"
    >
      <div
        className={`relative overflow-hidden bg-white border border-gray-200 border-l-4 shadow-xl ${
          isError ? 'border-l-red-600' : 'border-l-green-600'
        }`}
      >
        <div className="flex items-start gap-3 px-4 py-3.5">
          <Icon
            size={20}
            className={`mt-0.5 shrink-0 ${isError ? 'text-red-600' : 'text-green-600'}`}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              {toast.title || (isError ? 'Something went wrong' : 'Done')}
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
          className={`h-1 toast-progress ${isError ? 'bg-red-600/30' : 'bg-green-600/30'}`}
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
  iconClass = 'bg-blue-600',
  onClose,
  busy = false,
  maxWidth = 'max-w-md',
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
          className="flex items-center justify-center w-8 h-8 text-gray-400 transition-colors border border-transparent shrink-0 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50"
        >
          <X size={16} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const ModalFooter = ({ children, className = 'justify-end' }) => (
  <div className={`flex flex-wrap gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 ${className}`}>
    {children}
  </div>
);

const SummaryRow = ({ label, value, strong = false, valueClass = '' }) => (
  <div className="flex items-center justify-between px-4 py-2.5 bg-white">
    <span className={strong ? 'text-sm font-semibold text-gray-900' : 'text-sm text-gray-600'}>
      {label}
    </span>
    <span
      className={`${
        strong ? 'text-base font-bold text-gray-900' : 'text-sm font-medium text-gray-900'
      } ${valueClass}`}
    >
      {value}
    </span>
  </div>
);

const StatTile = ({ icon: Icon, iconClass, label, value, hint }) => (
  <div className="flex items-center gap-3 px-4 py-4 bg-white">
    <div className={`flex items-center justify-center w-10 h-10 shrink-0 ${iconClass}`}>
      <Icon size={18} />
    </div>
    <div className="min-w-0">
      <div className={statLabelClass}>{label}</div>
      <div className="text-lg font-bold leading-tight text-gray-900 truncate">{value}</div>
      {hint && <div className="text-xs text-gray-500 truncate">{hint}</div>}
    </div>
  </div>
);

const PaymentBadge = ({ method }) => (
  <span className="inline-block px-2 py-0.5 text-[11px] font-medium text-gray-700 bg-gray-100 whitespace-nowrap">
    {paymentLabel(method)}
  </span>
);

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SalesList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [viewOrder, setViewOrder] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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

  // Fetch orders data (following pagination if the API pages it)
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const allOrders = [];
      let currentPage = 1;
      let lastPage = 1;

      do {
        const response = await http.get('/orders', { params: { page: currentPage } });
        const body = response.data;
        allOrders.push(...toList(body));
        lastPage = Number(body?.last_page ?? body?.meta?.last_page ?? 1);
        currentPage += 1;
      } while (currentPage <= lastPage && currentPage <= MAX_ORDER_PAGES);

      setOrders(allOrders);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Newest first; ties fall back to the higher id
  const sortedOrders = [...orders].sort((a, b) => {
    const diff = (toDate(b.created_at)?.getTime() || 0) - (toDate(a.created_at)?.getTime() || 0);
    return diff !== 0 ? diff : (Number(b.id) || 0) - (Number(a.id) || 0);
  });

  const locations = [...new Set(orders.map(locationOf).filter(Boolean))].sort();
  const users = [...new Set(orders.map(userOf).filter(Boolean))].sort();

  // Filter orders based on search and filters
  const term = searchTerm.trim().toLowerCase();
  const filteredTransactions = sortedOrders.filter((order) => {
    const matchesSearch =
      term === '' ||
      [orderRef(order), customerOf(order), userOf(order), paymentLabel(order.payment_method)].some(
        (field) => field && field.toString().toLowerCase().includes(term)
      );

    const matchesDate = selectedDate === '' || dayKey(toDate(order.created_at)) === selectedDate;
    const matchesLocation = selectedLocation === '' || locationOf(order) === selectedLocation;
    const matchesUser = selectedUser === '' || userOf(order) === selectedUser;

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

  // Today's totals
  const today = dayKey(new Date());
  const todayTransactions = orders.filter((order) => dayKey(toDate(order.created_at)) === today);
  const totalProductsSold = todayTransactions.reduce((total, order) => total + orderQty(order), 0);
  const totalSalesAmount = todayTransactions.reduce((total, order) => total + orderAmount(order), 0);
  const filteredAmount = filteredTransactions.reduce((total, order) => total + orderAmount(order), 0);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDate('');
    setSelectedLocation('');
    setSelectedUser('');
  };

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) {
      notify('error', 'There are no transactions to export.', 'Nothing to export');
      return;
    }

    const headers = ['Date', 'Transaction ID', 'Customer', 'Payment Method', 'Items', 'Subtotal', 'Tax', 'Discount', 'Total', 'Processed By'];

    const csvData = filteredTransactions.map((order) => [
      order.created_at || '',
      orderRef(order) || '',
      customerOf(order),
      order.payment_method || '',
      Array.isArray(order.items)
        ? order.items.map((item) => `${item.product_name || item.name} (${itemQty(item)})`).join('; ')
        : '',
      order.subtotal ?? '',
      order.tax_amount ?? '',
      order.discount_amount ?? '',
      orderAmount(order),
      userOf(order),
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${dayKey(new Date())}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    notify(
      'success',
      `${filteredTransactions.length} transaction${filteredTransactions.length === 1 ? '' : 's'} exported.`,
      'Export ready'
    );
  };

  const handlePrintReceipt = (order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      notify('error', 'Allow pop-ups for this site to print receipts.', 'Print blocked');
      return;
    }

    const date = toDate(order.created_at) || new Date();
    const items = Array.isArray(order.items) ? order.items : [];
    const row = (label, value, cls = '') =>
      `<tr class="${cls}"><td>${label}</td><td class="r">${value}</td></tr>`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${escapeHtml(orderRef(order))}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 12px; color: #111; max-width: 320px; margin: 0 auto; padding: 16px; }
            h2 { margin: 0 0 4px; font-size: 16px; letter-spacing: 1px; }
            .center { text-align: center; }
            .muted { color: #555; }
            .rule { border-top: 1px dashed #999; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 3px 0; vertical-align: top; }
            .r { text-align: right; white-space: nowrap; }
            .total td { font-size: 14px; font-weight: bold; border-top: 1px solid #111; padding-top: 6px; }
          </style>
        </head>
        <body>
          <div class="center">
            <h2>SALES RECEIPT</h2>
            <div class="muted">#${escapeHtml(orderRef(order))}</div>
            <div class="muted">${escapeHtml(date.toLocaleString())}</div>
          </div>
          <div class="rule"></div>
          <table>
            ${row('Customer', escapeHtml(customerOf(order)))}
            ${row('Payment', escapeHtml(paymentLabel(order.payment_method)))}
          </table>
          <div class="rule"></div>
          <table>
            ${
              items.length
                ? items
                    .map(
                      (item) => `
                <tr><td colspan="2">${escapeHtml(item.product_name || item.name)}</td></tr>
                <tr class="muted"><td>${itemQty(item)} × ${formatCurrency(itemPrice(item))}</td>
                  <td class="r">${formatCurrency(itemQty(item) * itemPrice(item))}</td></tr>`
                    )
                    .join('')
                : '<tr><td class="muted">No items</td></tr>'
            }
          </table>
          <div class="rule"></div>
          <table>
            ${row('Subtotal', formatCurrency(order.subtotal ?? orderAmount(order)))}
            ${row('Tax', formatCurrency(order.tax_amount))}
            ${row('Discount', formatCurrency(order.discount_amount))}
            ${row('Total', formatCurrency(orderAmount(order)), 'total')}
          </table>
          <div class="rule"></div>
          <div class="center muted">Processed by ${escapeHtml(userOf(order) || 'System')}</div>
          <div class="center" style="margin-top:8px">Thank you for your patronage</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const openDelete = (order) => {
    setDeleteError('');
    setDeleteTarget(order);
  };

  const closeDelete = () => {
    if (!deleting) setDeleteTarget(null);
  };

  // Delete order method
  const deleteOrder = async () => {
    const order = deleteTarget;
    try {
      setDeleting(true);
      setDeleteError('');
      await http.delete(`/orders/${order.id}`);
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      setDeleteTarget(null);
      if (viewOrder?.id === order.id) setViewOrder(null);
      notify('success', `Transaction ${orderRef(order)} was deleted.`, 'Transaction deleted');
    } catch (err) {
      console.error('Failed to delete order:', err);
      setDeleteError(err.response?.data?.message || 'Could not delete this transaction. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Escape closes the top-most dialog
  useEffect(() => {
    if (!viewOrder && !deleteTarget) return;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (deleteTarget) closeDelete();
      else setViewOrder(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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
          className={fieldClass}
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
        <label htmlFor="filter-user" className={`${labelClass} md:sr-only`}>User</label>
        <Select id="filter-user" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
          <option value="">All Users</option>
          {users.map((user) => (
            <option key={user} value={user}>{user}</option>
          ))}
        </Select>
      </div>
    </>
  );

  const viewItems = viewOrder && Array.isArray(viewOrder.items) ? viewOrder.items : [];
  const viewDate = viewOrder ? toDate(viewOrder.created_at) : null;

  return (
    <div className="pt-0 mt-0 font-raleway">
      {toast && <Toast key={toast.id} toast={toast} onClose={closeToast} />}

      {/* Transaction Details Modal */}
      {viewOrder && (
        <ModalShell
          title={`Transaction ${orderRef(viewOrder)}`}
          subtitle={viewDate ? `${formatDay(viewDate)} · ${formatClock(viewDate)}` : undefined}
          icon={Receipt}
          onClose={() => setViewOrder(null)}
          maxWidth="max-w-xl"
        >
          <div className="px-6 py-5 space-y-5">
            <div className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200">
              {[
                ['Customer', customerOf(viewOrder)],
                ['Payment', paymentLabel(viewOrder.payment_method)],
                ['Processed By', userOf(viewOrder) || 'System'],
                ['Location', locationOf(viewOrder) || '—'],
              ].map(([label, value]) => (
                <div key={label} className="px-3 py-2.5 bg-white">
                  <div className={statLabelClass}>{label}</div>
                  <div className="mt-0.5 text-sm font-medium text-gray-900 truncate">{value}</div>
                </div>
              ))}
            </div>

            <div className="border border-gray-200">
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2 bg-gray-50 border-b border-gray-200">
                <span className={statLabelClass}>Item</span>
                <span className={`${statLabelClass} w-12 text-right`}>Qty</span>
                <span className={`${statLabelClass} w-24 text-right`}>Amount</span>
              </div>
              {viewItems.length === 0 ? (
                <p className="px-4 py-6 text-sm text-center text-gray-500">No item details on this transaction</p>
              ) : (
                <ul className="overflow-y-auto divide-y divide-gray-100 max-h-64">
                  {viewItems.map((item, index) => (
                    <li key={item.id ?? index} className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2.5 items-center">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.product_name || item.name || 'Unknown product'}
                        </p>
                        <p className="text-xs text-gray-500">{formatCurrency(itemPrice(item))} each</p>
                      </div>
                      <span className="w-12 text-sm text-right text-gray-700">{itemQty(item)}</span>
                      <span className="w-24 text-sm font-medium text-right text-gray-900">
                        {formatCurrency(itemQty(item) * itemPrice(item))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid gap-px bg-gray-200 border border-gray-200">
              <SummaryRow label="Subtotal" value={formatCurrency(viewOrder.subtotal ?? orderAmount(viewOrder))} />
              <SummaryRow label="Tax" value={formatCurrency(viewOrder.tax_amount)} />
              <SummaryRow label="Discount" value={formatCurrency(viewOrder.discount_amount)} valueClass="text-green-700" />
              <SummaryRow label="Total" value={formatCurrency(orderAmount(viewOrder))} strong />
            </div>
          </div>

          <ModalFooter className="justify-between">
            <button
              type="button"
              onClick={() => openDelete(viewOrder)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash2 size={16} />
              Delete
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={() => setViewOrder(null)} className={secondaryButtonClass}>
                Close
              </button>
              <button type="button" onClick={() => handlePrintReceipt(viewOrder)} className={primaryButtonClass}>
                <Printer size={16} />
                Print Receipt
              </button>
            </div>
          </ModalFooter>
        </ModalShell>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ModalShell
          title="Delete Transaction"
          subtitle="This can't be undone"
          icon={Trash2}
          iconClass="bg-red-600"
          onClose={closeDelete}
          busy={deleting}
        >
          <div className="px-6 py-5 space-y-4">
            {deleteError && (
              <div
                role="alert"
                className="flex items-start gap-3 px-4 py-3 text-sm text-red-800 border border-red-200 bg-red-50"
              >
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" />
                <div>
                  <p className="font-semibold">Not deleted</p>
                  <p className="mt-0.5 text-red-700">{deleteError}</p>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-600">
              You&apos;re about to permanently delete this transaction from the sales records.
            </p>

            <div className="grid gap-px bg-gray-200 border border-gray-200">
              <SummaryRow label="Transaction" value={orderRef(deleteTarget)} />
              <SummaryRow label="Customer" value={customerOf(deleteTarget)} />
              <SummaryRow label="Date" value={formatDay(toDate(deleteTarget.created_at))} />
              <SummaryRow label="Amount" value={formatCurrency(orderAmount(deleteTarget))} strong />
            </div>
          </div>

          <ModalFooter>
            <button type="button" onClick={closeDelete} disabled={deleting} className={secondaryButtonClass}>
              Cancel
            </button>
            <button type="button" onClick={deleteOrder} disabled={deleting} className={dangerButtonClass}>
              {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              {deleting ? 'Deleting…' : 'Delete Transaction'}
            </button>
          </ModalFooter>
        </ModalShell>
      )}

      <h1 className="hidden mb-2 text-xl font-normal text-gray-800 md:block">Sales List</h1>
      <TransactionNav />

      <div className="mt-5 space-y-5">
        {/* Summary Tiles */}
        <div className="grid grid-cols-1 gap-px bg-gray-200 border border-gray-200 sm:grid-cols-3">
          <StatTile
            icon={Wallet}
            iconClass="bg-green-50 text-green-700"
            label="Total Sales Today"
            value={loading ? '…' : formatCurrency(totalSalesAmount)}
          />
          <StatTile
            icon={Receipt}
            iconClass="bg-blue-50 text-blue-700"
            label="Transactions Today"
            value={loading ? '…' : todayTransactions.length}
          />
          <StatTile
            icon={ShoppingCart}
            iconClass="bg-amber-50 text-amber-700"
            label="Products Sold Today"
            value={loading ? '…' : totalProductsSold}
          />
        </div>

        {/* Sales Log */}
        <section className="bg-white border border-gray-200">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-200">
            <div className="flex items-baseline min-w-0 gap-2">
              <h2 className="text-base font-semibold text-gray-900">Transactions</h2>
              <span className="text-xs text-gray-500 truncate">
                {loading
                  ? 'Loading…'
                  : `${filteredTransactions.length} ${hasFilters ? 'matching' : 'total'} · ${formatCurrency(filteredAmount)} · newest first`}
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
                Export CSV
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
                  placeholder="Search by transaction, customer, user or payment"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${fieldClass} pl-8`}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters((open) => !open)}
                aria-expanded={showFilters}
                className={`flex items-center h-8 gap-1.5 px-2.5 text-xs font-medium transition-colors md:hidden ${
                  showFilters || selectedDate || selectedLocation || selectedUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
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
              Loading sales data…
            </div>
          ) : error ? (
            <EmptyState
              icon={AlertTriangle}
              tone="red"
              title="Couldn't load transactions"
              hint={error}
              action={
                <button type="button" onClick={fetchOrders} className={secondaryButtonClass}>
                  Try again
                </button>
              }
            />
          ) : filteredTransactions.length === 0 ? (
            <EmptyState
              icon={Package}
              title={orders.length === 0 ? 'No transactions yet' : 'No transactions match your filters'}
              hint={orders.length === 0 ? 'Sales from the sales point will appear here' : 'Try a different search or filter'}
              action={
                hasFilters && (
                  <button type="button" onClick={clearFilters} className={secondaryButtonClass}>
                    Clear filters
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
                      <th className={`px-3 py-2.5 ${statLabelClass}`}>Transaction</th>
                      <th className={`px-3 py-2.5 ${statLabelClass}`}>Customer</th>
                      <th className={`px-3 py-2.5 ${statLabelClass}`}>Payment</th>
                      <th className={`px-3 py-2.5 text-right ${statLabelClass}`}>Items</th>
                      <th className={`px-3 py-2.5 text-right ${statLabelClass}`}>Total</th>
                      <th className={`px-3 py-2.5 ${statLabelClass}`}>Processed By</th>
                      <th className={`px-5 py-2.5 text-right ${statLabelClass}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pageRows.map((order) => {
                      const date = toDate(order.created_at);
                      return (
                        <tr
                          key={order.id || order.transaction_id}
                          onClick={() => setViewOrder(order)}
                          className="transition-colors cursor-pointer hover:bg-blue-50/50"
                        >
                          <td className="px-5 py-3 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{formatDay(date)}</div>
                            <div className="text-xs text-gray-500">{formatClock(date)}</div>
                          </td>
                          <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap">
                            {orderRef(order)}
                          </td>
                          <td className="max-w-[12rem] px-3 py-3 text-gray-700 truncate">{customerOf(order)}</td>
                          <td className="px-3 py-3">
                            <PaymentBadge method={order.payment_method} />
                          </td>
                          <td className="px-3 py-3 text-right text-gray-700">{orderQty(order)}</td>
                          <td className="px-3 py-3 font-semibold text-right text-gray-900 whitespace-nowrap">
                            {formatCurrency(orderAmount(order))}
                          </td>
                          <td className="max-w-[10rem] px-3 py-3 text-gray-700 truncate">{userOf(order) || 'System'}</td>
                          <td className="px-5 py-2" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setViewOrder(order)}
                                className={`${iconButtonClass} hover:text-blue-600`}
                                title="View details"
                                aria-label={`View transaction ${orderRef(order)}`}
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePrintReceipt(order)}
                                className={`${iconButtonClass} hover:text-green-600`}
                                title="Print receipt"
                                aria-label={`Print receipt for ${orderRef(order)}`}
                              >
                                <Printer size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => openDelete(order)}
                                className={`${iconButtonClass} hover:text-red-600`}
                                title="Delete transaction"
                                aria-label={`Delete transaction ${orderRef(order)}`}
                              >
                                <Trash2 size={16} />
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
              <ul className="divide-y divide-gray-100 md:hidden">
                {pageRows.map((order) => {
                  const date = toDate(order.created_at);
                  return (
                    <li key={order.id || order.transaction_id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{orderRef(order)}</p>
                          <p className="text-xs text-gray-500">
                            {formatDay(date)} · {formatClock(date)}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-gray-900 whitespace-nowrap">
                          {formatCurrency(orderAmount(order))}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center mt-2 text-xs text-gray-600 gap-x-3 gap-y-1">
                        <span className="truncate">{customerOf(order)}</span>
                        <PaymentBadge method={order.payment_method} />
                        <span>{orderQty(order)} item{orderQty(order) === 1 ? '' : 's'}</span>
                        <span>By {userOf(order) || 'System'}</span>
                      </div>

                      <div className="grid grid-cols-3 mt-3 border border-gray-200 divide-x divide-gray-200">
                        <button
                          type="button"
                          onClick={() => setViewOrder(order)}
                          className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Eye size={14} /> View
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrintReceipt(order)}
                          className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Printer size={14} /> Print
                        </button>
                        <button
                          type="button"
                          onClick={() => openDelete(order)}
                          className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </li>
                  );
                })}
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
