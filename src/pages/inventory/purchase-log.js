import { useState, useEffect } from "react";
import InventoryNav from "../../components/InventoryNav";
import { useAuth } from "../../context/AuthContext";
import {
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  Download,
  Eye,
  Hourglass,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Trash2,
  User,
  Wallet,
  X,
} from "lucide-react";

import { purchaseOrderAPI, supplierAPI } from "../../../services/api";
import {
  Badge,
  ConfirmDeleteModal,
  EmptyState,
  FilterBar,
  FilterSelect,
  FormModal,
  LoadingState,
  ModalFooter,
  ModalShell,
  PageTitle,
  Pagination,
  PanelHeader,
  StatTiles,
  SummaryRow,
  filterFieldClass,
  formatDay,
  formatNaira,
  iconButtonClass,
  matchesTerm,
  secondaryButtonClass,
  statLabelClass,
  toDate,
  toList,
  toolbarButtonClass,
  usePagination,
  useToast,
} from "../../components/ui/Boxy";

const STATUSES = [
  { value: "pending", label: "Pending", badge: "bg-amber-50 text-amber-700" },
  { value: "approved", label: "Approved", badge: "bg-blue-50 text-blue-700" },
  { value: "received", label: "Received", badge: "bg-green-50 text-green-700" },
  { value: "cancelled", label: "Cancelled", badge: "bg-red-50 text-red-700" },
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "credit_card", label: "Credit Card" },
  { value: "debit_card", label: "Debit Card" },
  { value: "online", label: "Online Payment" },
];

const statusOf = (value) => STATUSES.find((s) => s.value === value);
const statusLabel = (value) => statusOf(value)?.label || value || "—";
const paymentLabel = (value) => PAYMENT_METHODS.find((m) => m.value === value)?.label || value || "—";

const StatusBadge = ({ status }) => (
  <Badge className={statusOf(status)?.badge || undefined}>{statusLabel(status)}</Badge>
);

// Suppliers store the person as contact_name; older orders embed contact_person
const contactOf = (supplier) => supplier?.contact_name || supplier?.contact_person;
const hasContactLines = (supplier) =>
  Boolean(contactOf(supplier) || supplier.email || supplier.phone || supplier.address);

const amountOf = (order) => parseFloat(order.total_amount) || 0;

// "2025-03-01T00:00:00Z" or "2025-03-01" -> "2025-03-01", for date inputs and the date filter
const dayKey = (value) => (value ? String(value).slice(0, 10) : "");
const today = () => new Date().toISOString().split("T")[0];

// Still waiting on a delivery whose expected date has passed
const isOverdue = (order) =>
  ["pending", "approved"].includes(order.status) && Boolean(order.expected_date) && dayKey(order.expected_date) < today();

const EMPTY_ORDER = {
  supplier_id: "",
  order_number: "",
  status: "pending",
  payment_method: "",
  total_amount: "",
  order_date: "",
  expected_date: "",
  notes: "",
};

const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export default function Purchases() {
  // Many roles can look at purchase orders; only procurement (and admins) raise or change them
  const { can } = useAuth();
  const canManage = can("purchase-orders.manage");
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOrder, setFormOrder] = useState(null); // {} = new, order = edit
  const [viewOrder, setViewOrder] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const { notify, toastElement } = useToast();

  // Fetch purchase orders from API
  const fetchPurchaseOrders = async () => {
    setLoading(true);
    setError("");
    try {
      setPurchaseOrders(toList(await purchaseOrderAPI.getAllPurchaseOrders()));
    } catch (err) {
      setError(err.message);
      console.error("Error fetching purchase orders:", err);
    } finally {
      setLoading(false);
    }
  };

  // Suppliers fill the order form's dropdown and the supplier details
  const fetchSuppliers = async () => {
    try {
      setSuppliers(toList(await supplierAPI.getAllSuppliers()));
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      notify("error", err.message, "Couldn't load suppliers");
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
    fetchSuppliers();
  }, []);

  // The order may embed its supplier; otherwise look it up
  const supplierOf = (order) =>
    order?.supplier || suppliers.find((s) => String(s.id) === String(order?.supplier_id)) || null;
  const supplierName = (order) => supplierOf(order)?.name || "—";

  // ---- Save / delete -------------------------------------------------------

  const isEditing = Boolean(formOrder?.id);

  const handleSave = async (values) => {
    const orderData = {
      ...values,
      total_amount: values.total_amount ? parseFloat(values.total_amount) : null,
      supplier_id: parseInt(values.supplier_id),
    };
    if (isEditing) {
      await purchaseOrderAPI.updatePurchaseOrder(formOrder.id, orderData);
      notify("success", `${orderData.order_number} was saved.`, "Order updated");
    } else {
      await purchaseOrderAPI.createPurchaseOrder(orderData);
      notify("success", `${orderData.order_number} was raised.`, "Order created");
    }
    await fetchPurchaseOrders();
    setFormOrder(null);
  };

  const handleDelete = async () => {
    const order = orderToDelete;
    await purchaseOrderAPI.deletePurchaseOrder(order.id);
    setPurchaseOrders((prev) => prev.filter((o) => o.id !== order.id));
    setOrderToDelete(null);
    notify("success", `${order.order_number} was removed.`, "Order deleted");
  };

  const openEdit = (order) => {
    setViewOrder(null);
    setFormOrder(order);
  };

  // ---- Filtering -------------------------------------------------------------

  const term = searchTerm.trim().toLowerCase();
  const filteredOrders = purchaseOrders.filter(
    (order) =>
      matchesTerm(term, [order.order_number, supplierOf(order)?.name, order.notes, order.total_amount]) &&
      (!selectedStatus || order.status === selectedStatus) &&
      (!selectedDate || dayKey(order.order_date) === selectedDate) &&
      (!selectedSupplier || supplierOf(order)?.name === selectedSupplier)
  );

  const hasFilters = Boolean(searchTerm || selectedStatus || selectedDate || selectedSupplier);
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("");
    setSelectedDate("");
    setSelectedSupplier("");
  };

  const pager = usePagination(
    filteredOrders,
    25,
    `${searchTerm}|${selectedStatus}|${selectedDate}|${selectedSupplier}`
  );

  const supplierNames = [...new Set(purchaseOrders.map((o) => supplierOf(o)?.name).filter(Boolean))].sort();

  const totalAmount = purchaseOrders.reduce((sum, o) => sum + amountOf(o), 0);
  const filteredAmount = filteredOrders.reduce((sum, o) => sum + amountOf(o), 0);
  const pending = purchaseOrders.filter((o) => o.status === "pending");
  const received = purchaseOrders.filter((o) => o.status === "received").length;
  const overdue = purchaseOrders.filter(isOverdue).length;

  const tiles = [
    {
      icon: ClipboardList,
      iconClass: "bg-blue-50 text-blue-700",
      label: "Total Orders",
      value: purchaseOrders.length,
      hint: `${received} received`,
    },
    { icon: Wallet, iconClass: "bg-green-50 text-green-700", label: "Total Amount", value: formatNaira(totalAmount) },
    {
      icon: Hourglass,
      iconClass: "bg-amber-50 text-amber-700",
      label: "Pending Orders",
      value: pending.length,
      hint: overdue
        ? `${overdue} overdue for delivery`
        : pending.length
        ? `${formatNaira(pending.reduce((sum, o) => sum + amountOf(o), 0))} awaiting approval`
        : null,
      hintClass: overdue ? "text-red-600" : "text-gray-500",
    },
  ];

  const exportToCSV = () => {
    const headers = [
      "Order Number",
      "Supplier",
      "Supplier Contact",
      "Supplier Email",
      "Status",
      "Total Amount",
      "Order Date",
      "Expected Date",
      "Payment Method",
      "Notes",
    ];
    const rows = filteredOrders.map((order) => {
      const supplier = supplierOf(order);
      return [
        order.order_number,
        supplier?.name || "N/A",
        contactOf(supplier) || "N/A",
        supplier?.email || "N/A",
        statusLabel(order.status),
        amountOf(order).toFixed(2),
        dayKey(order.order_date),
        dayKey(order.expected_date),
        paymentLabel(order.payment_method),
        order.notes,
      ];
    });

    const csvContent = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const url = window.URL.createObjectURL(new Blob([csvContent], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `purchase-orders-report-${today()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // ---- Render ----------------------------------------------------------------

  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn();
  };

  const expectedCell = (order) =>
    order.expected_date ? (
      <>
        <div className="text-gray-900 truncate">{formatDay(order.expected_date)}</div>
        {isOverdue(order) && <div className="text-[11px] font-semibold text-red-600">Overdue</div>}
      </>
    ) : (
      <span className="text-gray-400">—</span>
    );

  const newOrderButton = (
    <button onClick={() => setFormOrder({})} className={toolbarButtonClass.primary}>
      <Plus size={14} />
      New Order
    </button>
  );

  let body;
  if (loading && purchaseOrders.length === 0) {
    body = <LoadingState label="Loading purchase orders…" />;
  } else if (error && purchaseOrders.length === 0) {
    body = (
      <EmptyState
        icon={AlertTriangle}
        tone="red"
        title="Couldn't load purchase orders"
        hint={error}
        action={
          <button onClick={fetchPurchaseOrders} className={secondaryButtonClass}>
            Try again
          </button>
        }
      />
    );
  } else if (filteredOrders.length === 0) {
    body = (
      <EmptyState
        icon={ClipboardList}
        title={purchaseOrders.length === 0 ? "No purchase orders yet" : "No orders match your filters"}
        hint={
          purchaseOrders.length === 0
            ? "Orders you raise with suppliers will appear here"
            : "Try a different search, status, date or supplier"
        }
        action={
          hasFilters ? (
            <button onClick={clearFilters} className={secondaryButtonClass}>
              Clear filters
            </button>
          ) : canManage ? (
            newOrderButton
          ) : null
        }
      />
    );
  } else {
    body = (
      <>
        {/* Desktop Table */}
        <div className="hidden md:block">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col className="w-[19%]" />
              <col />
              <col className="w-[11%]" />
              <col className="w-[15%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className={canManage ? "w-[7.5rem]" : "w-[4rem]"} />
            </colgroup>
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr className="text-left">
                <th className={`px-5 py-2.5 ${statLabelClass}`}>Order</th>
                <th className={`px-3 py-2.5 ${statLabelClass}`}>Supplier</th>
                <th className={`px-3 py-2.5 ${statLabelClass}`}>Status</th>
                <th className={`px-3 py-2.5 text-right ${statLabelClass}`}>Amount</th>
                <th className={`px-3 py-2.5 ${statLabelClass}`}>Ordered</th>
                <th className={`px-3 py-2.5 ${statLabelClass}`}>Expected</th>
                <th className={`px-5 py-2.5 text-right ${statLabelClass}`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pager.pageRows.map((order) => {
                const supplier = supplierOf(order);
                return (
                  <tr
                    key={order.id}
                    onClick={() => setViewOrder(order)}
                    className="transition-colors cursor-pointer hover:bg-blue-50/50"
                    title="View order"
                  >
                    <td className="px-5 py-3">
                      <div className="font-mono font-medium text-gray-900 truncate">{order.order_number}</div>
                      <div className="text-xs text-gray-500 truncate">{paymentLabel(order.payment_method)}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-gray-900 truncate">{supplier?.name || "—"}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {contactOf(supplier) || supplier?.email || supplier?.phone || "No contact on file"}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-3 py-3 font-semibold text-right text-gray-900 truncate">
                      {formatNaira(order.total_amount)}
                    </td>
                    <td className="px-3 py-3 text-gray-700 truncate">{formatDay(order.order_date)}</td>
                    <td className="px-3 py-3">{expectedCell(order)}</td>
                    <td className="px-5 py-2">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={stop(() => setViewOrder(order))}
                          className={iconButtonClass()}
                          title="View"
                          aria-label={`View ${order.order_number}`}
                        >
                          <Eye size={15} />
                        </button>
                        {canManage && (
                          <>
                            <button
                              onClick={stop(() => setFormOrder(order))}
                              className={iconButtonClass()}
                              title="Edit"
                              aria-label={`Edit ${order.order_number}`}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={stop(() => setOrderToDelete(order))}
                              className={iconButtonClass("red")}
                              title="Delete"
                              aria-label={`Delete ${order.order_number}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
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
          {pager.pageRows.map((order) => (
            <li key={order.id} className="px-5 py-4">
              <button type="button" onClick={() => setViewOrder(order)} className="w-full text-left">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold text-gray-900 truncate">{order.order_number}</p>
                    <p className="text-xs text-gray-500 truncate">{supplierName(order)}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 whitespace-nowrap">{formatNaira(order.total_amount)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-600">
                  <StatusBadge status={order.status} />
                  <span>Ordered {formatDay(order.order_date)}</span>
                  {order.expected_date && (
                    <span className={isOverdue(order) ? "font-semibold text-red-600" : ""}>
                      · {isOverdue(order) ? "Overdue since" : "Due"} {formatDay(order.expected_date)}
                    </span>
                  )}
                </div>
                {order.notes && <p className="mt-2 text-xs text-gray-600 line-clamp-2">{order.notes}</p>}
              </button>
              {canManage && (
                <div className="grid grid-cols-2 mt-3 border border-gray-200 divide-x divide-gray-200">
                  <button
                    onClick={() => setFormOrder(order)}
                    className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    onClick={() => setOrderToDelete(order)}
                    className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>

        <Pagination {...pager} shown={pager.pageRows.length} />
      </>
    );
  }

  // ---- Order form fields -------------------------------------------------------

  const supplierOptions = [
    { value: "", label: suppliers.length ? "Select supplier" : "No suppliers yet — add one in Supplier Management" },
    ...suppliers.map((s) => ({ value: String(s.id), label: s.name })),
  ];

  const orderFields = [
    { name: "supplier_id", label: "Supplier", type: "select", required: true, options: supplierOptions },
    { name: "order_number", label: "Order Number", required: true, placeholder: "PO-12345", span: "half" },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      span: "half",
      options: STATUSES.map(({ value, label }) => ({ value, label })),
    },
    {
      name: "payment_method",
      label: "Payment Method",
      type: "select",
      required: true,
      span: "half",
      options: [{ value: "", label: "Select method" }, ...PAYMENT_METHODS],
    },
    { name: "total_amount", label: "Total Amount", type: "number", prefix: "₦", placeholder: "0.00", span: "half" },
    { name: "order_date", label: "Order Date", type: "date", required: true, span: "half" },
    { name: "expected_date", label: "Expected Delivery", type: "date", span: "half" },
    { name: "notes", label: "Notes", type: "textarea", placeholder: "Items ordered, delivery terms, anything to remember" },
  ];

  const orderInitialValues = isEditing
    ? {
        ...Object.fromEntries(Object.keys(EMPTY_ORDER).map((k) => [k, formOrder[k] ?? EMPTY_ORDER[k]])),
        supplier_id: formOrder.supplier_id != null ? String(formOrder.supplier_id) : "",
        order_date: dayKey(formOrder.order_date),
        expected_date: dayKey(formOrder.expected_date),
      }
    : { ...EMPTY_ORDER, order_number: `PO-${Date.now()}`, order_date: today() };

  // ---- Page ------------------------------------------------------------------

  const viewSupplier = supplierOf(viewOrder);

  return (
    <div className="pt-0 mt-0 font-raleway">
      {toastElement}

      <PageTitle title="Purchase Orders" description="Stock you've ordered from suppliers and where each order stands" />
      <InventoryNav />

      <div className="mt-5 space-y-5">
        <StatTiles tiles={tiles} loading={loading && purchaseOrders.length === 0} />

        <section className="bg-white border border-gray-200">
          <PanelHeader
            title="Orders"
            meta={
              loading && purchaseOrders.length === 0
                ? "Loading…"
                : `${filteredOrders.length} ${hasFilters ? "matching" : "orders"} · ${formatNaira(filteredAmount)}`
            }
          >
            {hasFilters && (
              <button onClick={clearFilters} className={toolbarButtonClass.ghost}>
                <X size={14} />
                Clear filters
              </button>
            )}
            <button onClick={fetchPurchaseOrders} disabled={loading} className={toolbarButtonClass.secondary}>
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={exportToCSV}
              disabled={filteredOrders.length === 0}
              className={toolbarButtonClass.secondary}
              title="Download the orders shown as a CSV file"
            >
              <Download size={13} />
              Export
            </button>
            {canManage && newOrderButton}
          </PanelHeader>

          <FilterBar
            search={searchTerm}
            onSearch={setSearchTerm}
            placeholder="Search by order number, supplier, notes or amount"
            columns="md:grid-cols-[minmax(0,1fr)_9rem_10rem_12rem]"
            filtersActive={Boolean(selectedStatus || selectedDate || selectedSupplier)}
            filters={
              <>
                <FilterSelect value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} aria-label="Filter by status">
                  <option value="">All Statuses</option>
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </FilterSelect>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  aria-label="Filter by order date"
                  title="Order date"
                  className={filterFieldClass}
                />
                <FilterSelect value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} aria-label="Filter by supplier">
                  <option value="">All Suppliers</option>
                  {supplierNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </FilterSelect>
              </>
            }
          />

          {body}
        </section>
      </div>

      {/* Order details, with the supplier's contact info */}
      {viewOrder && (
        <ModalShell
          title={viewOrder.order_number}
          subtitle={`Purchase order · ${supplierName(viewOrder)}`}
          icon={ClipboardList}
          onClose={() => setViewOrder(null)}
          maxWidth="max-w-lg"
        >
          <div className="px-6 py-5 space-y-5">
            <div className="grid gap-px bg-gray-200 border border-gray-200">
              <SummaryRow label="Status" value={<StatusBadge status={viewOrder.status} />} />
              <SummaryRow label="Payment Method" value={paymentLabel(viewOrder.payment_method)} />
              <SummaryRow label="Order Date" value={formatDay(viewOrder.order_date)} />
              <SummaryRow
                label="Expected Delivery"
                value={
                  viewOrder.expected_date ? (
                    <span className={isOverdue(viewOrder) ? "text-red-600" : ""}>
                      {formatDay(viewOrder.expected_date)}
                      {isOverdue(viewOrder) && " · Overdue"}
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
              <SummaryRow label="Total Amount" value={formatNaira(viewOrder.total_amount)} strong />
            </div>

            {viewOrder.notes && (
              <div>
                <div className={`mb-1 ${statLabelClass}`}>Notes</div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{viewOrder.notes}</p>
              </div>
            )}

            <div>
              <div className={`mb-2 ${statLabelClass}`}>Supplier</div>
              {viewSupplier ? (
                <div className="px-4 py-3 space-y-1.5 text-sm border border-gray-200">
                  <p className="font-semibold text-gray-900">{viewSupplier.name}</p>
                  {[
                    { icon: User, value: contactOf(viewSupplier) },
                    { icon: Mail, value: viewSupplier.email, href: viewSupplier.email && `mailto:${viewSupplier.email}` },
                    { icon: Phone, value: viewSupplier.phone, href: viewSupplier.phone && `tel:${viewSupplier.phone}` },
                    { icon: MapPin, value: viewSupplier.address },
                  ]
                    .filter((line) => line.value)
                    .map(({ icon: Icon, value, href }) => (
                      <p key={value} className="flex items-start gap-2 text-gray-600">
                        <Icon size={13} className="mt-0.5 text-gray-400 shrink-0" />
                        {href ? (
                          <a href={href} className="text-blue-600 break-all hover:underline">
                            {value}
                          </a>
                        ) : (
                          <span className="break-words">{value}</span>
                        )}
                      </p>
                    ))}
                  {!hasContactLines(viewSupplier) && (
                    <p className="text-xs text-gray-400">No contact details on file</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">This order has no supplier on record.</p>
              )}
            </div>
          </div>
          <ModalFooter>
            <button onClick={() => setViewOrder(null)} className={secondaryButtonClass}>
              Close
            </button>
            {canManage && (
              <button onClick={() => openEdit(viewOrder)} className={`${secondaryButtonClass} text-blue-700`}>
                <Pencil size={15} />
                Edit Order
              </button>
            )}
          </ModalFooter>
        </ModalShell>
      )}

      {canManage && formOrder && (
        <FormModal
          key={formOrder.id || "new"}
          title={isEditing ? "Edit Purchase Order" : "New Purchase Order"}
          subtitle={isEditing ? `${formOrder.order_number} · ${supplierName(formOrder)}` : "Raise an order with a supplier"}
          icon={isEditing ? Pencil : CalendarClock}
          fields={orderFields}
          initialValues={orderInitialValues}
          submitLabel={isEditing ? "Update Order" : "Create Order"}
          errorTitle={isEditing ? "Order not updated" : "Order not created"}
          onSubmit={handleSave}
          onClose={() => setFormOrder(null)}
        />
      )}

      {canManage && orderToDelete && (
        <ConfirmDeleteModal
          title="Delete Purchase Order"
          message="This removes the order from your purchase log."
          details={[
            ["Order", orderToDelete.order_number],
            ["Supplier", supplierName(orderToDelete)],
            ["Amount", formatNaira(orderToDelete.total_amount)],
            ["Status", statusLabel(orderToDelete.status)],
          ]}
          confirmLabel="Delete Order"
          onConfirm={handleDelete}
          onClose={() => setOrderToDelete(null)}
        />
      )}
    </div>
  );
}
