// Goods Received: deliveries against purchase orders. Each delivery gets a GRN
// with the delivery note and invoice, what was delivered, accepted and
// rejected, and three sign-offs: store manager (goods checked), inventory
// officer (posted into stock) and procurement (PO, invoice and GRN match).
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { AlertTriangle, CheckCircle2, Circle, Download, History, Loader2, Pencil, Plus, RefreshCw, Trash2, Truck } from "lucide-react";
import PurchasingNav from "../../components/PurchasingNav";
import http from "../../../services/http";
import { useAuth } from "../../context/AuthContext";
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
  { value: "", label: "All deliveries" },
  { value: "awaiting_store_check", label: "Waiting for store check" },
  { value: "awaiting_stock_posting", label: "Waiting for stock posting" },
  { value: "awaiting_procurement", label: "Waiting for procurement check" },
  { value: "approved", label: "Goods approved" },
];

const STATUS_BADGE = {
  awaiting_store_check: "text-amber-800 bg-amber-50",
  awaiting_stock_posting: "text-blue-800 bg-blue-50",
  awaiting_procurement: "text-purple-800 bg-purple-50",
  approved: "text-green-800 bg-green-50",
};

// The three sign-offs, in the order they are usually done
const SIGN_OFFS = [
  { key: "store_check", path: "store-check", permission: "goods-receipts.store-check", title: "Store manager", statement: "I checked the goods", button: "Goods checked" },
  { key: "stock_posting", path: "post-stock", permission: "goods-receipts.post-stock", title: "Inventory officer", statement: "I posted the accepted goods into stock", button: "Post into stock" },
  { key: "procurement_check", path: "procurement-check", permission: "goods-receipts.procurement-check", title: "Procurement officer", statement: "PO, invoice and GRN match", button: "PO, invoice and GRN match" },
];

const INVOICE_FIELDS = ["invoice_number", "invoice_date", "invoice_amount", "invoice_bank_name", "invoice_account_name", "invoice_account_number"];

const errorText = (err, fallback) => err.response?.data?.message || fallback;
const todayIso = () => new Date().toISOString().slice(0, 10);
const money = (value) => formatNaira(Number(value || 0));
const wholeOk = (value) => /^\d+$/.test(String(value));

const csvCell = (value) => {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const StatusBadge = ({ receipt }) => <Badge className={STATUS_BADGE[receipt.status] || "text-gray-700 bg-gray-100"}>{receipt.status_label}</Badge>;

const invoiceFrom = (receipt) =>
  Object.fromEntries(INVOICE_FIELDS.map((field) => [field, receipt?.[field] === null || receipt?.[field] === undefined ? "" : String(receipt[field])]));

const invoiceBody = (invoice) =>
  Object.fromEntries(INVOICE_FIELDS.map((field) => [field, String(invoice[field]).trim() === "" ? null : field === "invoice_amount" ? Number(invoice[field]) : String(invoice[field]).trim()]));

// ---------------------------------------------------------------------------
// Invoice fields (used when recording a delivery and on their own later)
// ---------------------------------------------------------------------------

const InvoiceFields = ({ invoice, onChange, disabled }) => {
  const set = (field) => (e) => onChange({ ...invoice, [field]: e.target.value });
  const accountBad = invoice.invoice_account_number !== "" && !/^\d{10}$/.test(invoice.invoice_account_number);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div>
        <label htmlFor="inv-number" className={labelClass}>Invoice no.</label>
        <input id="inv-number" value={invoice.invoice_number} onChange={set("invoice_number")} maxLength={100} disabled={disabled} className={fieldClass()} />
      </div>
      <div>
        <label htmlFor="inv-date" className={labelClass}>Invoice date</label>
        <input id="inv-date" type="date" value={invoice.invoice_date} max={todayIso()} onChange={set("invoice_date")} disabled={disabled} className={fieldClass()} />
      </div>
      <div>
        <label htmlFor="inv-amount" className={labelClass}>Invoice amount (₦)</label>
        <input id="inv-amount" type="number" min="0" step="0.01" value={invoice.invoice_amount} onChange={set("invoice_amount")} disabled={disabled} className={fieldClass()} />
      </div>
      <div>
        <label htmlFor="inv-bank" className={labelClass}>Bank on invoice</label>
        <input id="inv-bank" value={invoice.invoice_bank_name} onChange={set("invoice_bank_name")} maxLength={100} disabled={disabled} className={fieldClass()} />
      </div>
      <div>
        <label htmlFor="inv-account-name" className={labelClass}>Account name on invoice</label>
        <input id="inv-account-name" value={invoice.invoice_account_name} onChange={set("invoice_account_name")} maxLength={150} disabled={disabled} className={fieldClass()} />
      </div>
      <div>
        <label htmlFor="inv-account-number" className={labelClass}>Account no. on invoice</label>
        <input id="inv-account-number" inputMode="numeric" value={invoice.invoice_account_number} onChange={set("invoice_account_number")} maxLength={10} disabled={disabled} className={fieldClass(accountBad)} />
        {accountBad && <p className="mt-1 text-xs text-red-600">An account number is 10 digits.</p>}
      </div>
    </div>
  );
};

const invoiceValid = (invoice) => invoice.invoice_account_number === "" || /^\d{10}$/.test(invoice.invoice_account_number);

// ---------------------------------------------------------------------------
// Record / correct a delivery
// ---------------------------------------------------------------------------

const DeliveryForm = ({ existing, initialOrderId, stores, onClose, onSaved }) => {
  const [orders, setOrders] = useState(null);
  const [order, setOrder] = useState(null);
  const [orderId, setOrderId] = useState(existing ? String(existing.purchase_order.id) : initialOrderId || "");
  const [storeId, setStoreId] = useState(existing ? String(existing.store?.id ?? "") : "");
  const [deliveryNote, setDeliveryNote] = useState(existing?.delivery_note_ref || "");
  const [deliveredOn, setDeliveredOn] = useState(existing?.delivered_on || todayIso());
  const [notes, setNotes] = useState(existing?.notes || "");
  const [invoice, setInvoice] = useState(invoiceFrom(existing));
  const [lines, setLines] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Orders that can still receive goods
  useEffect(() => {
    if (existing) return;
    Promise.all([
      http.get("/purchase-orders", { params: { status: "issued" } }),
      http.get("/purchase-orders", { params: { status: "partly_received" } }),
    ])
      .then(([issued, partly]) => setOrders([...toList(partly.data), ...toList(issued.data)]))
      .catch(() => setOrders([]));
  }, [existing]);

  // The chosen order, with its lines and what each has received so far
  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      return;
    }
    http
      .get(`/purchase-orders/${orderId}`)
      .then(({ data }) => {
        setOrder(data);
        if (!existing) setStoreId(String(data.store?.id ?? ""));
        const mine = Object.fromEntries((existing?.items || []).map((item) => [item.purchase_order_item_id, item]));
        setLines(
          Object.fromEntries(
            data.items.map((item) => {
              const was = mine[item.id];
              return [
                item.id,
                {
                  delivered: was ? String(was.delivered_quantity) : "",
                  accepted: was ? String(was.accepted_quantity) : "",
                  acceptedTouched: Boolean(was),
                  reason: was?.rejection_reason || "",
                  expiry: was?.expiry_date || "",
                  batch: was?.batch_number || "",
                },
              ];
            })
          )
        );
      })
      .catch((err) => setError(errorText(err, "Could not load that order.")));
  }, [orderId, existing]);

  const outstandingOf = (item) => {
    const mine = existing?.items.find((i) => i.purchase_order_item_id === item.id)?.accepted_quantity || 0;
    return Math.max(0, item.quantity - item.received_quantity + mine);
  };

  const setLine = (id, changes) =>
    setLines((prev) => {
      const next = { ...prev[id], ...changes };
      // Accepted follows delivered until someone changes it
      if ("delivered" in changes && !next.acceptedTouched) next.accepted = changes.delivered;
      return { ...prev, [id]: next };
    });

  const problems = useMemo(() => {
    if (!order) return {};
    const out = {};
    for (const item of order.items) {
      const line = lines[item.id];
      if (!line || line.delivered === "") continue;
      const name = item.product?.name;
      if (!wholeOk(line.delivered)) out[item.id] = "Delivered must be a whole number.";
      else if (!wholeOk(line.accepted)) out[item.id] = "Accepted must be a whole number.";
      else if (Number(line.accepted) > Number(line.delivered)) out[item.id] = `You can't accept more ${name} than was delivered.`;
      else if (Number(line.accepted) > outstandingOf(item)) out[item.id] = `Only ${outstandingOf(item)} more are outstanding on this order.`;
      else if (Number(line.delivered) > Number(line.accepted) && !line.reason.trim()) out[item.id] = `Say why ${Number(line.delivered) - Number(line.accepted)} were rejected.`;
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, lines]);

  const delivered = order ? order.items.filter((item) => lines[item.id] && lines[item.id].delivered !== "" && Number(lines[item.id].delivered) > 0) : [];
  const acceptedValue = delivered.reduce((sum, item) => sum + (wholeOk(lines[item.id].accepted) ? Number(lines[item.id].accepted) * Number(item.unit_cost) : 0), 0);
  const invoiceAmount = invoice.invoice_amount === "" ? null : Number(invoice.invoice_amount);

  const canSave =
    order && storeId && deliveryNote.trim() && deliveredOn && delivered.length > 0 && Object.keys(problems).length === 0 && invoiceValid(invoice) && !saving;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError("");
    setFieldErrors({});
    const body = {
      ...(existing ? {} : { purchase_order_id: order.id }),
      store_id: Number(storeId),
      delivery_note_ref: deliveryNote.trim(),
      delivered_on: deliveredOn,
      notes: notes.trim() || null,
      ...invoiceBody(invoice),
      items: delivered.map((item) => {
        const line = lines[item.id];
        return {
          purchase_order_item_id: item.id,
          delivered_quantity: Number(line.delivered),
          accepted_quantity: Number(line.accepted),
          rejection_reason: line.reason.trim() || null,
          expiry_date: line.expiry || null,
          batch_number: line.batch.trim() || null,
        };
      }),
    };
    try {
      const { data } = existing ? await http.put(`/goods-receipts/${existing.id}`, body) : await http.post("/goods-receipts", body);
      onSaved(data, Boolean(existing));
    } catch (err) {
      setError(errorText(err, "Could not save the delivery."));
      setFieldErrors(err.response?.data?.errors || {});
    } finally {
      setSaving(false);
    }
  };

  const lineError = (index) => fieldErrors[`items.${index}.accepted_quantity`]?.[0] || fieldErrors[`items.${index}.rejection_reason`]?.[0] || fieldErrors[`items.${index}.expiry_date`]?.[0];

  return (
    <ModalShell
      title={existing ? `Correct ${existing.grn_number}` : "Record a Delivery"}
      subtitle={existing ? "Deliveries can be corrected until the store manager checks them" : "Stock changes only when the inventory officer posts it"}
      icon={Truck}
      onClose={onClose}
      busy={saving}
      maxWidth="max-w-5xl"
    >
      <form onSubmit={submit}>
        <div className="px-6 py-5 space-y-5 text-sm">
          {error && <ErrorBox title="Not saved" message={error} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="grn-order" className={labelClass}>Purchase order</label>
              {existing ? (
                <p className="py-2.5 font-semibold text-gray-900">{existing.purchase_order.order_number} · {existing.supplier?.name}</p>
              ) : (
                <select id="grn-order" value={orderId} onChange={(e) => setOrderId(e.target.value)} disabled={saving || orders === null} className={fieldClass()}>
                  <option value="">{orders === null ? "Loading orders…" : orders.length ? "Choose the order this delivery is for" : "No issued orders waiting for goods"}</option>
                  {(orders || []).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.order_number} · {o.supplier?.name} · {o.type_label}{o.status === "partly_received" ? " (partly received)" : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label htmlFor="grn-store" className={labelClass}>Goods went to</label>
              <select id="grn-store" value={storeId} onChange={(e) => setStoreId(e.target.value)} disabled={saving || !order} className={fieldClass()}>
                <option value="">Choose a store</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}{s.type === "back_store" ? " (back store)" : ""}</option>
                ))}
              </select>
            </div>
          </div>

          {order && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="grn-dn" className={labelClass}>Delivery note no.</label>
                  <input id="grn-dn" value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)} maxLength={100} disabled={saving} placeholder="From the driver's paper" className={fieldClass()} />
                </div>
                <div>
                  <label htmlFor="grn-date" className={labelClass}>Delivered on</label>
                  <input id="grn-date" type="date" value={deliveredOn} max={todayIso()} onChange={(e) => setDeliveredOn(e.target.value)} disabled={saving} className={fieldClass()} />
                </div>
                <div>
                  <label htmlFor="grn-notes" className={labelClass}>Notes</label>
                  <input id="grn-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} disabled={saving} className={fieldClass()} />
                </div>
              </div>

              <div className="overflow-x-auto border border-gray-200">
                <table className="w-full min-w-[56rem]">
                  <thead className="text-left bg-gray-50">
                    <tr>
                      <th className={`px-3 py-2 ${statLabelClass}`}>Product</th>
                      <th className={`px-3 py-2 text-right ${statLabelClass}`}>Outstanding</th>
                      <th className={`px-3 py-2 ${statLabelClass}`}>Delivered</th>
                      <th className={`px-3 py-2 ${statLabelClass}`}>Accepted</th>
                      <th className={`px-3 py-2 ${statLabelClass}`}>Why rejected</th>
                      <th className={`px-3 py-2 ${statLabelClass}`}>Expiry</th>
                      <th className={`px-3 py-2 ${statLabelClass}`}>Batch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 tabular-nums">
                    {order.items.map((item) => {
                      const line = lines[item.id];
                      if (!line) return null;
                      const outstanding = outstandingOf(item);
                      const index = delivered.findIndex((d) => d.id === item.id);
                      const message = problems[item.id] || (index >= 0 ? lineError(index) : null);
                      const rejected = wholeOk(line.delivered) && wholeOk(line.accepted) ? Number(line.delivered) - Number(line.accepted) : 0;
                      return (
                        <tr key={item.id} className={outstanding === 0 && line.delivered === "" ? "text-gray-400" : ""}>
                          <td className="px-3 py-2">
                            <span className="text-gray-900">{item.product?.name}</span>
                            <span className="block text-xs text-gray-500">{money(item.unit_cost)} each</span>
                            {message && <span className="block text-xs text-red-600">{message}</span>}
                          </td>
                          <td className="px-3 py-2 text-right">{outstanding}</td>
                          <td className="px-3 py-2">
                            <input type="number" min="0" step="1" value={line.delivered} onChange={(e) => setLine(item.id, { delivered: e.target.value })} disabled={saving} aria-label={`Delivered ${item.product?.name}`} className={`${fieldClass(Boolean(problems[item.id]))} w-20`} />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" min="0" step="1" value={line.accepted} onChange={(e) => setLine(item.id, { accepted: e.target.value, acceptedTouched: true })} disabled={saving || line.delivered === ""} aria-label={`Accepted ${item.product?.name}`} className={`${fieldClass(Boolean(problems[item.id]))} w-20`} />
                          </td>
                          <td className="px-3 py-2">
                            <input value={line.reason} onChange={(e) => setLine(item.id, { reason: e.target.value })} disabled={saving || rejected <= 0} maxLength={255} placeholder={rejected > 0 ? `${rejected} rejected` : ""} aria-label={`Why ${item.product?.name} was rejected`} className={`${fieldClass()} w-40`} />
                          </td>
                          <td className="px-3 py-2">
                            <input type="date" value={line.expiry} min={deliveredOn} onChange={(e) => setLine(item.id, { expiry: e.target.value })} disabled={saving || line.delivered === ""} aria-label={`Expiry date of ${item.product?.name}`} className={`${fieldClass()} w-36`} />
                          </td>
                          <td className="px-3 py-2">
                            <input value={line.batch} onChange={(e) => setLine(item.id, { batch: e.target.value })} disabled={saving || line.delivered === ""} maxLength={50} aria-label={`Batch number of ${item.product?.name}`} className={`${fieldClass()} w-24`} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="font-semibold bg-gray-50">
                    <tr>
                      <td className="px-3 py-2" colSpan={7}>Accepted goods value: <span className="tabular-nums">{money(acceptedValue)}</span></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <p className="-mt-3 text-xs text-gray-500">Leave Delivered empty for products that didn&apos;t come. Add an expiry date and the stock is tracked on the Expiry page.</p>

              <fieldset className="p-4 space-y-3 border border-gray-200">
                <legend className="px-1 text-xs font-semibold text-gray-700">Supplier&apos;s invoice <span className="font-normal text-gray-400">(can be added later)</span></legend>
                <InvoiceFields invoice={invoice} onChange={setInvoice} disabled={saving} />
                {invoiceAmount !== null && Number.isFinite(invoiceAmount) && Math.abs(invoiceAmount - acceptedValue) >= 0.01 && (
                  <p className="flex items-center gap-2 text-xs text-amber-800">
                    <AlertTriangle size={14} />
                    The invoice is {money(Math.abs(invoiceAmount - acceptedValue))} {invoiceAmount > acceptedValue ? "more" : "less"} than the accepted goods value.
                  </p>
                )}
              </fieldset>
            </>
          )}
        </div>
        <ModalFooter>
          <button type="button" onClick={onClose} disabled={saving} className={secondaryButtonClass}>Cancel</button>
          <button type="submit" disabled={!canSave} className={primaryButtonClass}>
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Saving…" : existing ? "Save changes" : "Record delivery"}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  );
};

// ---------------------------------------------------------------------------
// Details and sign-offs
// ---------------------------------------------------------------------------

const DetailsModal = ({ receipt, onClose, onChanged, onEdit }) => {
  const { user, can } = useAuth();
  const [history, setHistory] = useState(null);
  const [mode, setMode] = useState(null); // a sign-off key, "invoice" or "delete"
  const [note, setNote] = useState("");
  const [invoice, setInvoice] = useState(invoiceFrom(receipt));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    http
      .get(`/goods-receipts/${receipt.id}/history`)
      .then(({ data }) => setHistory(toList(data)))
      .catch(() => setHistory([]));
  }, [receipt.id, receipt.status, receipt.invoice_number]);

  const canRecord = can("goods-receipts.create");
  const signedByMe = SIGN_OFFS.find((step) => receipt[step.key]?.by?.id === user?.id);

  const run = async (request, action) => {
    setBusy(true);
    setError("");
    try {
      const { data } = await request();
      onChanged(data, action);
      setMode(null);
      setNote("");
    } catch (err) {
      setError(errorText(err, "That didn't work. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const signStep = SIGN_OFFS.find((step) => step.key === mode);
  const difference = receipt.invoice_difference === null ? null : Number(receipt.invoice_difference);

  return (
    <ModalShell title={receipt.grn_number} subtitle={`${receipt.purchase_order?.order_number} · ${receipt.supplier?.name}`} icon={Truck} onClose={onClose} busy={busy} maxWidth="max-w-4xl">
      <div className="px-6 py-5 space-y-5 text-sm">
        {error && <ErrorBox title="Not done" message={error} />}

        <dl className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200 sm:grid-cols-4">
          {[
            ["Status", <StatusBadge key="s" receipt={receipt} />],
            ["Purchase type", receipt.purchase_order?.type_label],
            ["Delivered on", formatDay(receipt.delivered_on)],
            ["Delivery note", receipt.delivery_note_ref],
            ["Goods went to", receipt.store?.name],
            ["Recorded by", receipt.received_by?.name],
            ["PO amount", money(receipt.purchase_order?.total_amount)],
            ["Accepted value", money(receipt.accepted_value)],
          ].map(([label, value]) => (
            <div key={label} className="px-3 py-2 bg-white">
              <dt className={statLabelClass}>{label}</dt>
              <dd className="text-gray-900 break-words">{value || "—"}</dd>
            </div>
          ))}
        </dl>
        {receipt.notes && <p className="text-gray-700">Notes: {receipt.notes}</p>}

        <div className="overflow-x-auto border border-gray-200">
          <table className="w-full">
            <thead className="text-left bg-gray-50">
              <tr>
                <th className={`px-3 py-2 ${statLabelClass}`}>Product</th>
                <th className={`px-3 py-2 text-right ${statLabelClass}`}>Ordered</th>
                <th className={`px-3 py-2 text-right ${statLabelClass}`}>Delivered</th>
                <th className={`px-3 py-2 text-right ${statLabelClass}`}>Accepted</th>
                <th className={`px-3 py-2 text-right ${statLabelClass}`}>Rejected</th>
                <th className={`px-3 py-2 ${statLabelClass}`}>Expiry</th>
                <th className={`px-3 py-2 text-right ${statLabelClass}`}>Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 tabular-nums">
              {receipt.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2 text-gray-900">
                    {item.product?.name}
                    {item.rejection_reason && <span className="block text-xs text-red-700">Rejected: {item.rejection_reason}</span>}
                  </td>
                  <td className="px-3 py-2 text-right">{item.ordered_quantity}</td>
                  <td className="px-3 py-2 text-right">{item.delivered_quantity}</td>
                  <td className="px-3 py-2 text-right">{item.accepted_quantity}</td>
                  <td className="px-3 py-2 text-right">{item.rejected_quantity || "—"}</td>
                  <td className="px-3 py-2">{item.expiry_date ? `${formatDay(item.expiry_date)}${item.batch_number ? ` · ${item.batch_number}` : ""}` : "—"}</td>
                  <td className="px-3 py-2 text-right">{money(item.accepted_value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 space-y-2 border border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={statLabelClass}>Supplier&apos;s invoice</p>
            {canRecord && receipt.can_edit_invoice && mode !== "invoice" && (
              <button type="button" onClick={() => { setInvoice(invoiceFrom(receipt)); setMode("invoice"); }} className={secondaryButtonClass}>
                <Pencil size={14} /> {receipt.invoice_number ? "Correct invoice" : "Add invoice"}
              </button>
            )}
          </div>
          {mode === "invoice" ? (
            <>
              <InvoiceFields invoice={invoice} onChange={setInvoice} disabled={busy} />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setMode(null)} disabled={busy} className={secondaryButtonClass}>Back</button>
                <button type="button" disabled={busy || !invoiceValid(invoice)} onClick={() => run(() => http.put(`/goods-receipts/${receipt.id}/invoice`, invoiceBody(invoice)), "invoice")} className={primaryButtonClass}>
                  {busy && <Loader2 size={16} className="animate-spin" />} Save invoice
                </button>
              </div>
            </>
          ) : receipt.invoice_number ? (
            <>
              <p className="text-gray-900">
                {receipt.invoice_number} · {formatDay(receipt.invoice_date)} · <span className="font-semibold tabular-nums">{money(receipt.invoice_amount)}</span>
                {difference !== null && Math.abs(difference) >= 0.01 && (
                  <span className="ml-2 text-amber-800">({money(Math.abs(difference))} {difference > 0 ? "more" : "less"} than accepted value)</span>
                )}
              </p>
              {receipt.invoice_account_number && (
                <p className="text-gray-700">
                  Pay to: {receipt.invoice_bank_name || "—"} · {receipt.invoice_account_name || "—"} · {receipt.invoice_account_number}{" "}
                  {receipt.invoice_bank_matches_supplier === true && <Badge className="text-green-800 bg-green-50">Matches supplier register</Badge>}
                  {receipt.invoice_bank_matches_supplier === false && <Badge className="text-red-700 bg-red-50">Different from supplier register</Badge>}
                </p>
              )}
            </>
          ) : (
            <p className="text-gray-500">No invoice recorded yet. Procurement needs it before signing off.</p>
          )}
        </div>

        <div>
          <p className={`${statLabelClass} mb-2`}>Sign-offs</p>
          <ol className="grid gap-2 sm:grid-cols-3">
            {SIGN_OFFS.map((step) => {
              const done = receipt[step.key];
              const waitingForStore = step.key !== "store_check" && !receipt.store_check;
              const needsInvoice = step.key === "procurement_check" && !receipt.invoice_number;
              const blockedBySelf = signedByMe && signedByMe.key !== step.key;
              const mayAct = !done && can(step.permission) && !waitingForStore && !needsInvoice && !blockedBySelf && !mode;
              return (
                <li key={step.key} className={`p-3 border ${done ? "border-green-200 bg-green-50/50" : "border-gray-200"}`}>
                  <p className="flex items-center gap-2 font-semibold text-gray-900">
                    {done ? <CheckCircle2 size={16} className="text-green-600" /> : <Circle size={16} className="text-gray-300" />}
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-600">&ldquo;{step.statement}&rdquo;</p>
                  {done ? (
                    <p className="mt-1 text-xs text-gray-700">{done.by?.name}, {formatDay(done.at)}</p>
                  ) : can(step.permission) ? (
                    <>
                      {waitingForStore && <p className="mt-1 text-xs text-gray-500">After the store check.</p>}
                      {!waitingForStore && needsInvoice && <p className="mt-1 text-xs text-gray-500">Add the invoice first.</p>}
                      {!waitingForStore && !needsInvoice && blockedBySelf && <p className="mt-1 text-xs text-gray-500">You signed the {signedByMe.title.toLowerCase()} step, so someone else must do this.</p>}
                      {mayAct && (
                        <button type="button" onClick={() => setMode(step.key)} className={`${primaryButtonClass} mt-2`}>{step.button}</button>
                      )}
                    </>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">Waiting.</p>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {signStep && (
          <div className="p-3 space-y-2 border border-gray-200 bg-gray-50">
            <p className="text-gray-900">
              Sign as {signStep.title.toLowerCase()}: &ldquo;{signStep.statement}&rdquo;?
              {signStep.key === "stock_posting" && ` This adds the accepted quantities to ${receipt.store?.name}'s stock.`}
              {signStep.key === "store_check" && " After this the quantities can't be changed."}
            </p>
            <label htmlFor="grn-note" className={labelClass}>Note <span className="font-normal text-gray-400 normal-case">(optional)</span></label>
            <input id="grn-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} disabled={busy} className={fieldClass()} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setMode(null)} disabled={busy} className={secondaryButtonClass}>Back</button>
              <button type="button" disabled={busy} onClick={() => run(() => http.post(`/goods-receipts/${receipt.id}/${signStep.path}`, { note: note.trim() || null }), signStep.key)} className={primaryButtonClass}>
                {busy && <Loader2 size={16} className="animate-spin" />} Sign
              </button>
            </div>
          </div>
        )}

        {mode === "delete" && (
          <div className="p-3 space-y-2 border border-red-200 bg-red-50">
            <p className="text-red-900">Delete {receipt.grn_number}? The order&apos;s received quantities go back down. Stock hasn&apos;t been touched yet.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setMode(null)} disabled={busy} className={secondaryButtonClass}>Back</button>
              <button type="button" disabled={busy} onClick={() => run(() => http.delete(`/goods-receipts/${receipt.id}`).then(() => ({ data: null })), "delete")} className={dangerButtonClass}>
                {busy && <Loader2 size={16} className="animate-spin" />} Delete delivery
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

      {canRecord && receipt.can_edit && !mode && (
        <ModalFooter className="justify-between">
          <button type="button" onClick={() => setMode("delete")} className={secondaryButtonClass}>
            <Trash2 size={14} /> Delete
          </button>
          <button type="button" onClick={() => onEdit(receipt)} className={secondaryButtonClass}>
            <Pencil size={14} /> Correct delivery
          </button>
        </ModalFooter>
      )}
    </ModalShell>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const Tick = ({ done, label }) => (
  <span title={done ? `${label}: ${done.by?.name}, ${formatDay(done.at)}` : `${label}: not yet`} className="inline-flex">
    {done ? <CheckCircle2 size={15} className="text-green-600" /> : <Circle size={15} className="text-gray-300" />}
  </span>
);

export default function GoodsReceived() {
  const router = useRouter();
  const { can } = useAuth();
  const canRecord = can("goods-receipts.create");

  const [receipts, setReceipts] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [status, setStatus] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(undefined); // undefined closed, null new, receipt = correct
  const [formOrderId, setFormOrderId] = useState("");
  const [viewing, setViewing] = useState(null);
  const { notify, toastElement } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { data } = await http.get("/goods-receipts", { params: { page, status: status || undefined, supplier_id: supplierId || undefined } });
      setReceipts(toList(data));
      setLastPage(Number(data?.last_page) || 1);
    } catch (err) {
      setLoadError(errorText(err, "Could not load deliveries."));
    } finally {
      setLoading(false);
    }
  }, [page, status, supplierId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    Promise.all([http.get("/suppliers"), http.get("/stores")])
      .then(([s, st]) => {
        setSuppliers(toList(s.data));
        setStores(toList(st.data).sort((a, b) => String(a.name).localeCompare(String(b.name))));
      })
      .catch(() => {});
  }, []);

  // Purchase Orders links here with ?po=ID to record a delivery for that order
  useEffect(() => {
    if (!router.isReady || !canRecord) return;
    const po = router.query.po;
    if (po) {
      setFormOrderId(String(po));
      setForm(null);
      router.replace("/inventory/goods-received", undefined, { shallow: true });
    }
  }, [router, canRecord]);

  const exportCsv = () => {
    // Same columns as the client's "Orders & receipts" sheet
    const headers = [
      "PO ID", "PO date", "Supplier ID", "Supplier name", "Items", "Purchase type", "Invoice no.", "Invoice date",
      "PO amount", "Invoice amount", "GRN ref", "Delivery note", "Delivered on", "Accepted goods value",
      "Store manager", "Store sign-off date", "Inventory officer", "Stock posting date",
      "Procurement officer", "Procurement sign-off", "Status",
    ];
    const rows = receipts.map((r) => [
      r.purchase_order?.order_number, r.purchase_order?.order_date?.slice(0, 10), r.supplier?.id, r.supplier?.name,
      r.items.map((i) => `${i.product?.name} x${i.accepted_quantity}`).join("; "), r.purchase_order?.type_label,
      r.invoice_number, r.invoice_date, r.purchase_order?.total_amount, r.invoice_amount, r.grn_number,
      r.delivery_note_ref, r.delivered_on, r.accepted_value,
      r.store_check?.by?.name, r.store_check?.at?.slice(0, 10), r.stock_posting?.by?.name, r.stock_posting?.at?.slice(0, 10),
      r.procurement_check?.by?.name, r.procurement_check?.at?.slice(0, 10), r.status_label,
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const url = window.URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `orders-and-receipts-${todayIso()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSaved = (saved, wasEdit) => {
    setForm(undefined);
    setViewing(saved);
    notify("success", wasEdit ? `${saved.grn_number} was corrected.` : `${saved.grn_number} was recorded. The store manager checks it next.`, wasEdit ? "Delivery corrected" : "Delivery recorded");
    load();
  };

  const handleChanged = (saved, action) => {
    const words = {
      store_check: "Goods checked",
      stock_posting: "Accepted goods posted into stock",
      procurement_check: "PO, invoice and GRN matched",
      invoice: "Invoice saved",
      delete: "Delivery deleted",
    };
    notify("success", saved?.status === "approved" ? `${saved.grn_number}: all three sign-offs done. Goods approved.` : words[action], words[action]);
    setViewing(action === "delete" ? null : saved);
    load();
  };

  return (
    <div className="pt-0 mt-0 font-raleway">
      {toastElement}
      <PageTitle title="Goods Received" description="Deliveries against purchase orders: what came, what was accepted, the invoice, and the three sign-offs" />
      <PurchasingNav />

      <section className="mt-5 bg-white border border-gray-200">
        <PanelHeader title="Orders & receipts" meta={loading ? "Loading…" : `${receipts.length} shown`}>
          <button onClick={exportCsv} disabled={receipts.length === 0} className={toolbarButtonClass.secondary}>
            <Download size={13} />
            Export CSV
          </button>
          <button onClick={load} disabled={loading} className={toolbarButtonClass.secondary}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          {canRecord && (
            <button onClick={() => { setFormOrderId(""); setForm(null); }} disabled={stores.length === 0} className={toolbarButtonClass.primary}>
              <Plus size={14} />
              Record Delivery
            </button>
          )}
        </PanelHeader>

        <div className="flex flex-wrap gap-3 px-5 py-3 border-b border-gray-200">
          <FilterSelect value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Status">
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </FilterSelect>
          <FilterSelect value={supplierId} onChange={(e) => { setSupplierId(e.target.value); setPage(1); }} aria-label="Supplier">
            <option value="">All suppliers</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </FilterSelect>
        </div>

        {loading && receipts.length === 0 ? (
          <LoadingState label="Loading deliveries…" />
        ) : loadError ? (
          <EmptyState icon={Truck} tone="red" title="Couldn't load deliveries" hint={loadError} action={<button onClick={load} className={secondaryButtonClass}>Try again</button>} />
        ) : receipts.length === 0 ? (
          <EmptyState
            icon={Truck}
            title={status || supplierId ? "No deliveries match" : "No deliveries yet"}
            hint={canRecord ? "When goods arrive for an issued purchase order, record the delivery here." : "Deliveries against purchase orders will appear here."}
          />
        ) : (
          <ul className="divide-y divide-gray-100">
            {receipts.map((receipt) => (
              <li key={receipt.id}>
                <button type="button" onClick={() => setViewing(receipt)} className="flex flex-wrap items-center justify-between w-full gap-3 px-5 py-3 text-left hover:bg-blue-50/50">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900">
                      <span className="font-mono text-xs text-gray-500">{receipt.grn_number}</span>
                      {receipt.supplier?.name}
                      <span className="font-mono text-xs font-normal text-gray-500">{receipt.purchase_order?.order_number}</span>
                      <StatusBadge receipt={receipt} />
                      {receipt.invoice_bank_matches_supplier === false && <Badge className="text-red-700 bg-red-50">Invoice bank differs</Badge>}
                    </p>
                    <p className="text-xs text-gray-600 truncate max-w-[40rem]">
                      {receipt.items.map((i) => `${i.product?.name} ${i.accepted_quantity}/${i.delivered_quantity}`).join(", ")} · to {receipt.store?.name}
                      {receipt.invoice_number ? ` · invoice ${receipt.invoice_number}` : " · no invoice yet"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="flex gap-1" aria-label="Sign-offs">
                      {SIGN_OFFS.map((step) => <Tick key={step.key} done={receipt[step.key]} label={step.title} />)}
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 tabular-nums">{money(receipt.accepted_value)}</p>
                      <p className="text-xs text-gray-500">{formatDay(receipt.delivered_on)}</p>
                    </div>
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
        <DeliveryForm existing={form} initialOrderId={formOrderId} stores={stores} onClose={() => setForm(undefined)} onSaved={handleSaved} />
      )}

      {viewing && form === undefined && (
        <DetailsModal key={`${viewing.id}-${viewing.status}`} receipt={viewing} onClose={() => setViewing(null)} onChanged={handleChanged} onEdit={(r) => setForm(r)} />
      )}
    </div>
  );
}
