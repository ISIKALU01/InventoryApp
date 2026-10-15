// Purchase Orders: orders placed with suppliers, with item lines and agreed
// costs, outright or sales-on-return. Drafts can be changed; once issued an
// order is fixed and can only be cancelled until goods arrive.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ClipboardList, Download, History, List, Loader2, Pencil, Plus, RefreshCw, Search, Send, Trash2, Truck, X, XCircle } from "lucide-react";
import Link from "next/link";
import ProductPicker from "../../components/ProductPicker";
import PurchasingNav from "../../components/PurchasingNav";
import http from "../../../services/http";
import { useAuth } from "../../context/AuthContext";
import { findProductByCode } from "../../../utils/barcode";
import {
  Badge,
  EmptyState,
  ErrorBox,
  FilterSelect,
  LoadingState,
  ModalFooter,
  ModalShell,
  PageTitle,
  PanelHeader,
  dangerButtonClass,
  fieldClass,
  formatDay,
  formatNaira,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  statLabelClass,
  toList,
  toolbarButtonClass,
  useToast,
} from "../../components/ui/Boxy";

const STATUS_OPTIONS = [
  { value: "", label: "All orders" },
  { value: "draft", label: "Draft" },
  { value: "issued", label: "Issued to supplier" },
  { value: "partly_received", label: "Partly received" },
  { value: "received", label: "Received" },
  { value: "closed", label: "Closed" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_BADGE = {
  draft: "text-gray-700 bg-gray-100",
  issued: "text-blue-800 bg-blue-50",
  partly_received: "text-amber-800 bg-amber-50",
  received: "text-green-800 bg-green-50",
  closed: "text-green-900 bg-green-100",
  cancelled: "text-red-700 bg-red-50",
};

const TYPE_OPTIONS = [
  { value: "outright", label: "Outright purchase", help: "We buy the goods and pay for everything accepted." },
  { value: "sor", label: "Sales on return (SOR)", help: "We pay only for what sells; unsold goods go back." },
];

const errorText = (err, fallback) => err.response?.data?.message || fallback;
const todayIso = () => new Date().toISOString().slice(0, 10);
const money = (value) => formatNaira(Number(value || 0));

const csvCell = (value) => {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const StatusBadge = ({ order }) => <Badge className={STATUS_BADGE[order.status] || "text-gray-700 bg-gray-100"}>{order.status_label}</Badge>;

// ---------------------------------------------------------------------------
// New / edit
// ---------------------------------------------------------------------------

const OrderForm = ({ existing, suppliers, stores, products, onClose, onSaved }) => {
  const defaultStore = stores.find((s) => s.type === "back_store") || stores[0];
  const [requisitions, setRequisitions] = useState([]);
  const [requisitionId, setRequisitionId] = useState("");
  const [supplierId, setSupplierId] = useState(existing ? String(existing.supplier?.id) : "");
  const [purchaseType, setPurchaseType] = useState(existing?.purchase_type || "outright");
  const [storeId, setStoreId] = useState(existing ? String(existing.store?.id ?? "") : String(defaultStore?.id ?? ""));
  const [orderDate, setOrderDate] = useState(existing?.order_date?.slice(0, 10) || todayIso());
  const [expectedDate, setExpectedDate] = useState(existing?.expected_date?.slice(0, 10) || "");
  const [notes, setNotes] = useState(existing?.notes || "");
  const [lines, setLines] = useState(
    existing ? existing.items.map((item) => ({ product: item.product, quantity: String(item.quantity), unit_cost: String(item.unit_cost) })) : []
  );
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [duplicate, setDuplicate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [browsing, setBrowsing] = useState(false);
  const searchRef = useRef(null);

  // Approved requisitions waiting to be ordered (new orders only)
  useEffect(() => {
    if (existing) return;
    http
      .get("/purchase-requests", { params: { status: "approved" } })
      .then(({ data }) => setRequisitions(toList(data)))
      .catch(() => setRequisitions([]));
  }, [existing]);

  const costOf = (productId) => products.find((p) => p.id === productId)?.cost_price;

  const fillFromRequisition = (id) => {
    setRequisitionId(id);
    const requisition = requisitions.find((r) => String(r.id) === id);
    if (!requisition) return;
    setLines(
      requisition.items.map((item) => ({
        product: item.product,
        quantity: String(item.quantity),
        unit_cost: costOf(item.product.id) !== undefined ? String(Number(costOf(item.product.id))) : "",
      }))
    );
    if (!notes) setNotes(`For ${requisition.reference} (${requisition.store?.name})`);
  };

  const available = useMemo(() => products.filter((p) => !lines.some((line) => line.product.id === p.id)), [products, lines]);
  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return available.filter((p) => [p.name, p.sku, p.barcode].some((v) => String(v || "").toLowerCase().includes(term))).slice(0, 8);
  }, [available, query]);

  const addLine = (product) => {
    setQuery("");
    setMessage("");
    setLines((prev) => [...prev, { product, quantity: "", unit_cost: product.cost_price !== undefined ? String(Number(product.cost_price)) : "" }]);
    searchRef.current?.focus();
  };

  // Several products ticked in "Browse products"
  const addPicked = (picked) => {
    setMessage("");
    setLines((prev) => [
      ...prev,
      ...picked
        .filter((p) => !prev.some((line) => line.product.id === p.id))
        .map((product) => ({ product, quantity: "", unit_cost: product.cost_price !== undefined ? String(Number(product.cost_price)) : "" })),
    ]);
    setBrowsing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const exact = findProductByCode(available, query);
    if (exact) return addLine(exact);
    if (matches.length === 1) return addLine(matches[0]);
    if (query.trim()) setMessage(`No product matches "${query.trim()}".`);
  };

  const setLine = (productId, changes) => setLines((prev) => prev.map((l) => (l.product.id === productId ? { ...l, ...changes } : l)));

  const quantityOk = (line) => /^\d+$/.test(line.quantity) && Number(line.quantity) >= 1;
  const costOk = (line) => line.unit_cost !== "" && Number.isFinite(Number(line.unit_cost)) && Number(line.unit_cost) >= 0;
  const lineTotal = (line) => (quantityOk(line) && costOk(line) ? Number(line.quantity) * Number(line.unit_cost) : 0);
  const total = lines.reduce((sum, line) => sum + lineTotal(line), 0);

  const supplier = suppliers.find((s) => String(s.id) === supplierId);
  const usableSuppliers = suppliers.filter((s) => s.status !== "suspended" || String(s.id) === supplierId);
  const canSave = supplierId && storeId && lines.length > 0 && lines.every((l) => quantityOk(l) && costOk(l)) && !saving;

  const submit = async (confirmDuplicate = false) => {
    if (!canSave) return;
    setSaving(true);
    setError("");
    const body = {
      supplier_id: Number(supplierId),
      purchase_type: purchaseType,
      store_id: Number(storeId),
      order_date: orderDate || null,
      expected_date: expectedDate || null,
      notes: notes.trim() || null,
      items: lines.map((l) => ({ product_id: l.product.id, quantity: Number(l.quantity), unit_cost: Number(l.unit_cost) })),
      confirm_duplicate: confirmDuplicate,
      ...(requisitionId && !existing ? { purchase_request_id: Number(requisitionId) } : {}),
    };
    try {
      const { data } = existing ? await http.put(`/purchase-orders/${existing.id}`, body) : await http.post("/purchase-orders", body);
      onSaved(data, Boolean(existing));
    } catch (err) {
      const dup = err.response?.data?.errors?.duplicate_of?.[0];
      if (dup) setDuplicate(dup);
      else setError(errorText(err, "Could not save the order."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={existing ? `Edit ${existing.order_number}` : "New Purchase Order"}
      subtitle={existing ? "Drafts can be changed until they are issued" : "Saved as a draft; issue it when it is ready"}
      icon={ClipboardList}
      onClose={onClose}
      busy={saving}
      maxWidth="max-w-4xl"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(false);
        }}
      >
        <div className="px-6 py-5 space-y-4 text-sm">
          {error && <ErrorBox title="Not saved" message={error} />}
          {duplicate && (
            <div className="flex flex-wrap items-center gap-3 px-4 py-3 border text-amber-900 border-amber-300 bg-amber-50">
              <span className="flex-1">{duplicate}</span>
              <button type="button" onClick={() => setDuplicate("")} className={secondaryButtonClass}>Go back</button>
              <button type="button" onClick={() => submit(true)} disabled={saving} className={primaryButtonClass}>Create it anyway</button>
            </div>
          )}

          {!existing && requisitions.length > 0 && (
            <div>
              <label htmlFor="po-requisition" className={labelClass}>Fill an approved requisition <span className="font-normal text-gray-400 normal-case">(optional)</span></label>
              <select id="po-requisition" value={requisitionId} onChange={(e) => fillFromRequisition(e.target.value)} disabled={saving} className={fieldClass()}>
                <option value="">No, start from scratch</option>
                {requisitions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.reference} · {r.store?.name} · {r.total_units} units
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="po-supplier" className={labelClass}>Supplier</label>
              <select id="po-supplier" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} disabled={saving} className={fieldClass()}>
                <option value="">Choose a supplier</option>
                {usableSuppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.status !== "verified" ? ` (${String(s.status_label || "not verified").toLowerCase()})` : ""}
                  </option>
                ))}
              </select>
              {supplier && supplier.status !== "verified" && (
                <p className="mt-1 text-xs text-amber-700">This supplier isn&apos;t verified yet ({String(supplier.status_label).toLowerCase()}). You can order, but it can&apos;t be paid until it has all three checks: junior accountant, senior accountant, then an admin.</p>
              )}
              {supplier && <p className="mt-1 text-xs text-gray-500">Payment terms: {supplier.payment_terms_days ? `${supplier.payment_terms_days} days after delivery` : "on delivery"}</p>}
            </div>
            <div>
              <label htmlFor="po-store" className={labelClass}>Deliver to</label>
              <select id="po-store" value={storeId} onChange={(e) => setStoreId(e.target.value)} disabled={saving} className={fieldClass()}>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}{s.type === "back_store" ? " (back store)" : ""}</option>
                ))}
              </select>
            </div>
          </div>

          <fieldset>
            <legend className={labelClass}>Purchase type</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {TYPE_OPTIONS.map((option) => (
                <label key={option.value} className={`flex gap-3 p-3 border cursor-pointer ${purchaseType === option.value ? "border-blue-600 bg-blue-50" : "border-gray-300"}`}>
                  <input type="radio" name="po-type" value={option.value} checked={purchaseType === option.value} onChange={() => setPurchaseType(option.value)} disabled={saving} className="mt-0.5 accent-blue-600" />
                  <span>
                    <span className="block font-semibold text-gray-900">{option.label}</span>
                    <span className="block text-xs text-gray-500">{option.help}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="po-date" className={labelClass}>Order date</label>
              <input id="po-date" type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} disabled={saving} className={fieldClass()} />
            </div>
            <div>
              <label htmlFor="po-expected" className={labelClass}>Expected delivery</label>
              <input id="po-expected" type="date" value={expectedDate} min={orderDate} onChange={(e) => setExpectedDate(e.target.value)} disabled={saving} className={fieldClass()} />
            </div>
            <div>
              <label htmlFor="po-notes" className={labelClass}>Notes</label>
              <input id="po-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} disabled={saving} placeholder="e.g. Deliver before noon" className={fieldClass()} />
            </div>
          </div>

          <div className="relative">
            <label htmlFor="po-search" className={labelClass}>Products</label>
            <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
              <input
                id="po-search"
                ref={searchRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setMessage("");
                }}
                onKeyDown={handleKeyDown}
                disabled={saving}
                autoComplete="off"
                placeholder="Scan a barcode, or type a name or SKU"
                className={`${fieldClass()} pl-8`}
              />
            </div>
            <button type="button" onClick={() => setBrowsing(true)} disabled={saving} title="Browse products" aria-label="Browse products" className="flex items-center justify-center w-11 shrink-0 text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 hover:text-blue-700 disabled:opacity-50">
              <List size={16} />
            </button>
            </div>
            {matches.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 overflow-y-auto bg-white border border-gray-200 shadow-lg max-h-64">
                {matches.map((product) => (
                  <li key={product.id}>
                    <button type="button" onClick={() => addLine(product)} className="flex justify-between w-full gap-3 px-3 py-2 text-left hover:bg-blue-50">
                      <span className="truncate">{product.name}</span>
                      {product.cost_price !== undefined && <span className="text-xs text-gray-500">cost {money(product.cost_price)}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {message && <p className="mt-1 text-xs text-red-600">{message}</p>}
          </div>

          {lines.length > 0 && (
            <div className="overflow-x-auto border border-gray-200">
              <table className="w-full">
                <thead className="text-left bg-gray-50">
                  <tr>
                    <th className={`px-3 py-2 ${statLabelClass}`}>Product</th>
                    <th className={`px-3 py-2 ${statLabelClass}`}>Quantity</th>
                    <th className={`px-3 py-2 ${statLabelClass}`}>Unit cost (₦)</th>
                    <th className={`px-3 py-2 text-right ${statLabelClass}`}>Line total</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 tabular-nums">
                  {lines.map((line) => (
                    <tr key={line.product.id}>
                      <td className="px-3 py-2 text-gray-900">{line.product.name}</td>
                      <td className="px-3 py-2">
                        <input type="number" min="1" step="1" value={line.quantity} onChange={(e) => setLine(line.product.id, { quantity: e.target.value })} disabled={saving} aria-label={`Quantity of ${line.product.name}`} className={`${fieldClass(line.quantity !== "" && !quantityOk(line))} w-24`} />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="0" step="0.01" value={line.unit_cost} onChange={(e) => setLine(line.product.id, { unit_cost: e.target.value })} disabled={saving} aria-label={`Unit cost of ${line.product.name}`} className={`${fieldClass(line.unit_cost !== "" && !costOk(line))} w-32`} />
                      </td>
                      <td className="px-3 py-2 text-right">{money(lineTotal(line))}</td>
                      <td className="px-1">
                        <button type="button" onClick={() => setLines((prev) => prev.filter((l) => l.product.id !== line.product.id))} className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-red-600" aria-label={`Remove ${line.product.name}`}>
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="font-semibold bg-gray-50">
                  <tr>
                    <td className="px-3 py-2" colSpan={3}>Order total</td>
                    <td className="px-3 py-2 text-right tabular-nums">{money(total)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
        <ModalFooter>
          <button type="button" onClick={onClose} disabled={saving} className={secondaryButtonClass}>Cancel</button>
          <button type="submit" disabled={!canSave} className={primaryButtonClass}>
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Saving…" : existing ? "Save draft" : "Save as draft"}
          </button>
        </ModalFooter>
      </form>
      {browsing && (
        <ProductPicker
          products={products}
          stores={stores}
          priceColumn="cost"
          addedIds={lines.map((line) => line.product.id)}
          onAdd={addPicked}
          onClose={() => setBrowsing(false)}
        />
      )}
    </ModalShell>
  );
};

// ---------------------------------------------------------------------------
// Details
// ---------------------------------------------------------------------------

const DetailsModal = ({ order, canManage, onClose, onChanged, onEdit }) => {
  const { can } = useAuth();
  const canReceive = can("goods-receipts.create") && ["issued", "partly_received"].includes(order.status);
  const [history, setHistory] = useState(null);
  const [mode, setMode] = useState(null); // issue | cancel | delete
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    http
      .get(`/purchase-orders/${order.id}/history`)
      .then(({ data }) => setHistory(toList(data)))
      .catch(() => setHistory([]));
  }, [order.id, order.status]);

  const isDraft = order.status === "draft";
  const nothingReceived = order.items.every((item) => !item.received_quantity);
  const canCancel = ["draft", "issued"].includes(order.status) && nothingReceived;

  const act = async () => {
    if (mode === "cancel" && !reason.trim()) {
      setError("Say why the order is cancelled.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (mode === "delete") {
        await http.delete(`/purchase-orders/${order.id}`);
        onChanged(null, "delete", order);
      } else {
        const { data } = await http.post(`/purchase-orders/${order.id}/${mode}`, mode === "cancel" ? { reason: reason.trim() } : {});
        onChanged(data, mode);
      }
      setMode(null);
    } catch (err) {
      setError(errorText(err, "That didn't work. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title={order.order_number} subtitle={`${order.supplier?.name} · ${order.type_label}`} icon={ClipboardList} onClose={onClose} busy={busy} maxWidth="max-w-3xl">
      <div className="px-6 py-5 space-y-5 text-sm">
        {error && <ErrorBox title="Not done" message={error} />}

        <dl className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200 sm:grid-cols-4">
          {[
            ["Status", <StatusBadge key="s" order={order} />],
            ["Deliver to", order.store?.name],
            ["Ordered", formatDay(order.order_date)],
            ["Expected", order.expected_date ? formatDay(order.expected_date) : "—"],
            ["Supplier status", order.supplier?.status_label],
            ["Payment terms", order.supplier?.payment_terms_days ? `${order.supplier.payment_terms_days} days` : "On delivery"],
            ["Requisition", order.purchase_request?.reference || "—"],
            ["Issued", order.issued_by ? `${order.issued_by.name}, ${formatDay(order.issued_at)}` : "—"],
          ].map(([label, value]) => (
            <div key={label} className="px-3 py-2 bg-white">
              <dt className={statLabelClass}>{label}</dt>
              <dd className="text-gray-900 break-words">{value || "—"}</dd>
            </div>
          ))}
        </dl>
        {order.notes && <p className="text-gray-700">Notes: {order.notes}</p>}
        {order.cancelled_reason && <p className="px-3 py-2 text-red-800 border border-red-200 bg-red-50">Cancelled: {order.cancelled_reason}</p>}

        <div className="overflow-x-auto border border-gray-200">
          <table className="w-full">
            <thead className="text-left bg-gray-50">
              <tr>
                <th className={`px-3 py-2 ${statLabelClass}`}>Product</th>
                <th className={`px-3 py-2 text-right ${statLabelClass}`}>Ordered</th>
                <th className={`px-3 py-2 text-right ${statLabelClass}`}>Received</th>
                <th className={`px-3 py-2 text-right ${statLabelClass}`}>Unit cost</th>
                <th className={`px-3 py-2 text-right ${statLabelClass}`}>Line total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 tabular-nums">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2 text-gray-900">{item.product?.name}</td>
                  <td className="px-3 py-2 text-right">{item.quantity}</td>
                  <td className="px-3 py-2 text-right">{item.received_quantity}</td>
                  <td className="px-3 py-2 text-right">{money(item.unit_cost)}</td>
                  <td className="px-3 py-2 text-right">{money(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="font-semibold bg-gray-50">
              <tr>
                <td className="px-3 py-2" colSpan={4}>Total</td>
                <td className="px-3 py-2 text-right tabular-nums">{money(order.total_amount)}</td>
              </tr>
            </tfoot>
          </table>
          {order.items.length === 0 && <p className="px-3 py-3 text-gray-500">This older order has no item lines.</p>}
        </div>

        {(order.goods_receipts?.length > 0 || canReceive) && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <p className={statLabelClass}>Deliveries</p>
              {canReceive && (
                <Link href={`/inventory/goods-received?po=${order.id}`} className={secondaryButtonClass}>
                  <Truck size={14} /> Record delivery
                </Link>
              )}
            </div>
            {order.goods_receipts?.length > 0 ? (
              <ul className="border border-gray-200 divide-y divide-gray-100">
                {order.goods_receipts.map((receipt) => (
                  <li key={receipt.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                    <span>
                      <span className="font-mono text-xs text-gray-500">{receipt.grn_number}</span> · {formatDay(receipt.delivered_on)} · {receipt.status_label}
                    </span>
                    <span className="font-semibold tabular-nums">{money(receipt.accepted_value)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Nothing delivered yet.</p>
            )}
          </div>
        )}

        {mode && (
          <div className="p-3 space-y-2 border border-gray-200 bg-gray-50">
            {mode === "issue" && <p>Issue {order.order_number} to {order.supplier?.name}? After this it can&apos;t be changed, only cancelled.</p>}
            {mode === "delete" && <p>Delete this draft? It hasn&apos;t been sent, so nothing else changes.</p>}
            {mode === "cancel" && (
              <>
                <label htmlFor="po-cancel" className={labelClass}>Why is it cancelled?</label>
                <input id="po-cancel" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} autoFocus disabled={busy} placeholder="e.g. Supplier can't deliver this week" className={fieldClass()} />
              </>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setMode(null)} disabled={busy} className={secondaryButtonClass}>Back</button>
              <button type="button" onClick={act} disabled={busy} className={mode === "issue" ? primaryButtonClass : dangerButtonClass}>
                {busy && <Loader2 size={16} className="animate-spin" />}
                {mode === "issue" ? "Issue order" : mode === "delete" ? "Delete draft" : "Cancel order"}
              </button>
            </div>
          </div>
        )}

        <div>
          <p className={`${statLabelClass} mb-2`}>History</p>
          {history === null ? (
            <p className="text-gray-500">Loading…</p>
          ) : history.length === 0 ? (
            <p className="text-gray-500">Nothing recorded yet.</p>
          ) : (
            <ul className="border border-gray-200 divide-y divide-gray-100">
              {history.map((entry) => (
                <li key={entry.id} className="flex gap-3 px-3 py-2">
                  <History size={14} className="mt-0.5 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-gray-900">{entry.description}</p>
                    <p className="text-xs text-gray-500">{entry.by?.name || "Someone"} · {formatDay(entry.at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {canManage && !mode && (isDraft || canCancel) && (
        <ModalFooter className="justify-between">
          <div className="flex gap-2">
            {isDraft && (
              <button type="button" onClick={() => onEdit(order)} className={secondaryButtonClass}>
                <Pencil size={14} /> Edit
              </button>
            )}
            {isDraft && (
              <button type="button" onClick={() => setMode("delete")} className={secondaryButtonClass}>
                <Trash2 size={14} /> Delete
              </button>
            )}
            {canCancel && !isDraft && (
              <button type="button" onClick={() => setMode("cancel")} className={dangerButtonClass}>
                <XCircle size={16} /> Cancel order
              </button>
            )}
          </div>
          {isDraft && (
            <button type="button" onClick={() => setMode("issue")} className={primaryButtonClass}>
              <Send size={16} /> Issue to supplier
            </button>
          )}
        </ModalFooter>
      )}
    </ModalShell>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PurchaseOrders() {
  const { can } = useAuth();
  const canManage = can("purchase-orders.manage");

  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [status, setStatus] = useState("");
  const [purchaseType, setPurchaseType] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(undefined); // undefined closed, null new, order = edit
  const [viewing, setViewing] = useState(null);
  const { notify, toastElement } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { data } = await http.get("/purchase-orders", {
        params: { page, status: status || undefined, purchase_type: purchaseType || undefined, supplier_id: supplierId || undefined },
      });
      setOrders(toList(data));
      setLastPage(Number(data?.last_page) || 1);
    } catch (err) {
      setLoadError(errorText(err, "Could not load purchase orders."));
    } finally {
      setLoading(false);
    }
  }, [page, status, purchaseType, supplierId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    Promise.all([http.get("/suppliers"), http.get("/stores"), http.get("/products")])
      .then(([s, st, p]) => {
        setSuppliers(toList(s.data));
        setStores(toList(st.data).sort((a, b) => String(a.name).localeCompare(String(b.name))));
        setProducts(toList(p.data));
      })
      .catch(() => {});
  }, []);

  const exportCsv = () => {
    const headers = ["Order Number", "Supplier", "Type", "Status", "Deliver To", "Order Date", "Expected Date", "Items", "Total", "Requisition", "Notes"];
    const rows = orders.map((o) => [
      o.order_number,
      o.supplier?.name,
      o.type_label,
      o.status_label,
      o.store?.name,
      o.order_date?.slice(0, 10),
      o.expected_date?.slice(0, 10),
      o.items.map((i) => `${i.product?.name} x${i.quantity}`).join("; "),
      o.total_amount,
      o.purchase_request?.reference,
      o.notes,
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const url = window.URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `purchase-orders-${todayIso()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSaved = (saved, wasEdit) => {
    setForm(undefined);
    setViewing(saved);
    notify("success", wasEdit ? `${saved.order_number} was saved.` : `${saved.order_number} was saved as a draft. Issue it when it is ready.`, wasEdit ? "Draft updated" : "Order drafted");
    load();
  };

  const handleChanged = (saved, action, original) => {
    const words = { issue: "issued to the supplier", cancel: "cancelled", delete: "deleted" };
    notify("success", `${(saved || original).order_number} was ${words[action]}.`, "Done");
    setViewing(action === "delete" ? null : saved);
    load();
  };

  return (
    <div className="pt-0 mt-0 font-raleway">
      {toastElement}
      <PageTitle title="Purchase Orders" description="Stock ordered from suppliers: outright or sales-on-return, and where each order stands" />
      <PurchasingNav />

      <section className="mt-5 bg-white border border-gray-200">
        <PanelHeader title="Orders" meta={loading ? "Loading…" : `${orders.length} shown`}>
          <button onClick={exportCsv} disabled={orders.length === 0} className={toolbarButtonClass.secondary}>
            <Download size={13} />
            Export CSV
          </button>
          <button onClick={load} disabled={loading} className={toolbarButtonClass.secondary}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          {canManage && (
            <button onClick={() => setForm(null)} disabled={stores.length === 0} className={toolbarButtonClass.primary}>
              <Plus size={14} />
              New Order
            </button>
          )}
        </PanelHeader>

        <div className="flex flex-wrap gap-3 px-5 py-3 border-b border-gray-200">
          <FilterSelect value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Status">
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </FilterSelect>
          <FilterSelect value={purchaseType} onChange={(e) => { setPurchaseType(e.target.value); setPage(1); }} aria-label="Type">
            <option value="">Outright and SOR</option>
            <option value="outright">Outright</option>
            <option value="sor">Sales on return</option>
          </FilterSelect>
          <FilterSelect value={supplierId} onChange={(e) => { setSupplierId(e.target.value); setPage(1); }} aria-label="Supplier">
            <option value="">All suppliers</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </FilterSelect>
        </div>

        {loading && orders.length === 0 ? (
          <LoadingState label="Loading purchase orders…" />
        ) : loadError ? (
          <EmptyState icon={ClipboardList} tone="red" title="Couldn't load purchase orders" hint={loadError} action={<button onClick={load} className={secondaryButtonClass}>Try again</button>} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={status || purchaseType || supplierId ? "No orders match" : "No purchase orders yet"}
            hint={canManage ? "Raise one from an approved store requisition, or start from scratch." : "Orders placed with suppliers will appear here."}
          />
        ) : (
          <ul className="divide-y divide-gray-100">
            {orders.map((order) => (
              <li key={order.id}>
                <button type="button" onClick={() => setViewing(order)} className="flex flex-wrap items-center justify-between w-full gap-3 px-5 py-3 text-left hover:bg-blue-50/50">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900">
                      <span className="font-mono text-xs text-gray-500">{order.order_number}</span>
                      {order.supplier?.name}
                      <StatusBadge order={order} />
                      <Badge className={order.purchase_type === "sor" ? "text-purple-800 bg-purple-50" : "text-gray-700 bg-gray-100"}>
                        {order.purchase_type === "sor" ? "SOR" : "Outright"}
                      </Badge>
                      {order.supplier?.status !== "verified" && <Badge className="text-amber-800 bg-amber-50">Supplier not verified</Badge>}
                    </p>
                    <p className="text-xs text-gray-600 truncate max-w-[40rem]">
                      {order.items.length ? order.items.map((i) => `${i.product?.name} × ${i.quantity}`).join(", ") : "No item lines"} · to {order.store?.name || "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 tabular-nums">{money(order.total_amount)}</p>
                    <p className="text-xs text-gray-500">{order.expected_date ? `Expected ${formatDay(order.expected_date)}` : formatDay(order.order_date)}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {lastPage > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading} className={secondaryButtonClass}>Newer</button>
            <span className="text-xs text-gray-500">Page {page} of {lastPage}</span>
            <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page >= lastPage || loading} className={secondaryButtonClass}>Older</button>
          </div>
        )}
      </section>

      {form !== undefined && (
        <OrderForm existing={form} suppliers={suppliers} stores={stores} products={products} onClose={() => setForm(undefined)} onSaved={handleSaved} />
      )}

      {viewing && form === undefined && (
        <DetailsModal order={viewing} canManage={canManage} onClose={() => setViewing(null)} onChanged={handleChanged} onEdit={(o) => setForm(o)} />
      )}
    </div>
  );
}
