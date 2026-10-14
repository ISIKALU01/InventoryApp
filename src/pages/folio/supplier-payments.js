// Supplier Payments: the payment register. Procurement raises a request, the
// junior accountant checks it, the senior accountant approves (or holds) it
// and records it as paid once the money has left the bank. Four automatic
// checks must be green before anything is approved or paid.
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Circle, Download, History, Loader2, Pencil, Plus, RefreshCw, Wallet, XCircle } from "lucide-react";
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
  { value: "", label: "All payments" },
  { value: "requested", label: "Waiting for junior check" },
  { value: "junior_checked", label: "Waiting for senior approval" },
  { value: "approved", label: "Ready to pay" },
  { value: "paid", label: "Paid" },
  { value: "held", label: "On hold" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_BADGE = {
  requested: "text-amber-800 bg-amber-50",
  junior_checked: "text-blue-800 bg-blue-50",
  approved: "text-purple-800 bg-purple-50",
  paid: "text-green-800 bg-green-50",
  held: "text-red-700 bg-red-50",
  cancelled: "text-gray-600 bg-gray-100",
};

const CHECKS = [
  { key: "operations", label: "Operations", help: { outright: "The delivery has all three goods sign-offs", sor: "Every SOR line of the order is reconciled" } },
  { key: "bank_details", label: "Bank details", help: "Supplier verified, and the invoice bank details match the register exactly" },
  { key: "accounting", label: "Accounting", help: "Junior check and senior approval, by two different people" },
  { key: "amount", label: "Amount", help: "More than ₦0 and not more than is available to pay" },
];

const CHECK_METHODS = [
  { value: "documents", label: "Matched PO, GRN and invoice documents" },
  { value: "phone_call", label: "Phone call to the supplier" },
  { value: "bank_confirmation", label: "Bank confirmation" },
  { value: "in_person", label: "In person" },
  { value: "other", label: "Other" },
];

const HOLD_OWNERS = [
  { value: "procurement", label: "Procurement officer" },
  { value: "store", label: "Store manager" },
  { value: "inventory", label: "Inventory officer" },
  { value: "junior_accountant", label: "Junior accountant" },
  { value: "supplier", label: "Supplier" },
];

const SOR_INVOICE_FIELDS = ["invoice_number", "invoice_amount", "invoice_bank_name", "invoice_account_name", "invoice_account_number"];

const errorText = (err, fallback) => err.response?.data?.message || fallback;
const todayIso = () => new Date().toISOString().slice(0, 10);
const money = (value) => formatNaira(Number(value || 0));
const amountOk = (value) => value !== "" && Number.isFinite(Number(value)) && Number(value) > 0;

const csvCell = (value) => {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const StatusBadge = ({ payment }) => <Badge className={STATUS_BADGE[payment.status] || "text-gray-700 bg-gray-100"}>{payment.status_label}</Badge>;

const CheckDots = ({ checks }) => (
  <span className="flex gap-1" aria-label="Automatic checks">
    {CHECKS.map((check) => (
      <span
        key={check.key}
        title={`${check.label}: ${checks?.[check.key] ? "green" : "red"}`}
        className={`inline-block w-2.5 h-2.5 rounded-full ${checks?.[check.key] ? "bg-green-500" : "bg-red-500"}`}
      />
    ))}
  </span>
);

const emptySorInvoice = () => Object.fromEntries(SOR_INVOICE_FIELDS.map((field) => [field, ""]));
const sorInvoiceFrom = (payment) => Object.fromEntries(SOR_INVOICE_FIELDS.map((field) => [field, payment?.[field] == null ? "" : String(payment[field])]));
const sorInvoiceBody = (invoice) =>
  Object.fromEntries(SOR_INVOICE_FIELDS.map((field) => [field, String(invoice[field]).trim() === "" ? null : field === "invoice_amount" ? Number(invoice[field]) : String(invoice[field]).trim()]));
const sorInvoiceValid = (invoice) => invoice.invoice_account_number === "" || /^\d{10}$/.test(invoice.invoice_account_number);

// SOR payments carry the supplier's invoice; outright ones use the GRN's
const SorInvoiceFields = ({ invoice, onChange, disabled }) => {
  const set = (field) => (e) => onChange({ ...invoice, [field]: e.target.value });
  const accountBad = !sorInvoiceValid(invoice);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label htmlFor="sp-inv-number" className={labelClass}>Invoice no.</label>
        <input id="sp-inv-number" value={invoice.invoice_number} onChange={set("invoice_number")} maxLength={100} disabled={disabled} className={fieldClass()} />
      </div>
      <div>
        <label htmlFor="sp-inv-amount" className={labelClass}>Invoice amount (₦)</label>
        <input id="sp-inv-amount" type="number" min="0" step="0.01" value={invoice.invoice_amount} onChange={set("invoice_amount")} disabled={disabled} className={fieldClass()} />
      </div>
      <div>
        <label htmlFor="sp-inv-bank" className={labelClass}>Bank on invoice</label>
        <input id="sp-inv-bank" value={invoice.invoice_bank_name} onChange={set("invoice_bank_name")} maxLength={100} disabled={disabled} className={fieldClass()} />
      </div>
      <div>
        <label htmlFor="sp-inv-account-name" className={labelClass}>Account name on invoice</label>
        <input id="sp-inv-account-name" value={invoice.invoice_account_name} onChange={set("invoice_account_name")} maxLength={150} disabled={disabled} className={fieldClass()} />
      </div>
      <div>
        <label htmlFor="sp-inv-account-number" className={labelClass}>Account no. on invoice</label>
        <input id="sp-inv-account-number" inputMode="numeric" value={invoice.invoice_account_number} onChange={set("invoice_account_number")} maxLength={10} disabled={disabled} className={fieldClass(accountBad)} />
        {accountBad && <p className="mt-1 text-xs text-red-600">An account number is 10 digits.</p>}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// New payment request
// ---------------------------------------------------------------------------

const RequestForm = ({ onClose, onSaved }) => {
  const [orders, setOrders] = useState(null);
  const [orderId, setOrderId] = useState("");
  const [payable, setPayable] = useState(null);
  const [receiptId, setReceiptId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [invoice, setInvoice] = useState(emptySorInvoice());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Orders with goods received that aren't closed yet
  useEffect(() => {
    Promise.all([
      http.get("/purchase-orders", { params: { status: "received" } }),
      http.get("/purchase-orders", { params: { status: "partly_received" } }),
    ])
      .then(([received, partly]) => setOrders([...toList(received.data), ...toList(partly.data)]))
      .catch(() => setOrders([]));
  }, []);

  useEffect(() => {
    setPayable(null);
    setReceiptId("");
    setAmount("");
    if (!orderId) return;
    http
      .get(`/purchase-orders/${orderId}/payable`)
      .then(({ data }) => {
        setPayable(data);
        if (data.purchase_order.purchase_type === "sor") setAmount(Number(data.available) > 0 ? String(Number(data.available)) : "");
      })
      .catch((err) => setError(errorText(err, "Could not load what is owed on that order.")));
  }, [orderId]);

  const isSor = payable?.purchase_order.purchase_type === "sor";
  const receipt = payable?.receipts.find((r) => String(r.id) === receiptId);
  const available = isSor ? Number(payable?.available || 0) : Number(receipt?.available || 0);
  const tooMuch = amountOk(amount) && Number(amount) > available + 0.0001;

  const pickReceipt = (id) => {
    setReceiptId(id);
    const r = payable.receipts.find((x) => String(x.id) === id);
    setAmount(r && Number(r.available) > 0 ? String(Number(r.available)) : "");
  };

  const canSave = payable && (isSor || receipt) && amountOk(amount) && !tooMuch && (!isSor || sorInvoiceValid(invoice)) && !saving;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      const { data } = await http.post("/supplier-payments", {
        purchase_order_id: Number(orderId),
        goods_receipt_id: isSor ? null : Number(receiptId),
        amount: Number(amount),
        notes: notes.trim() || null,
        ...(isSor ? sorInvoiceBody(invoice) : {}),
      });
      onSaved(data);
    } catch (err) {
      setError(errorText(err, "Could not raise the payment request."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="New Payment Request" subtitle="The junior accountant checks it next" icon={Wallet} onClose={onClose} busy={saving} maxWidth="max-w-2xl">
      <form onSubmit={submit}>
        <div className="px-6 py-5 space-y-4 text-sm">
          {error && <ErrorBox title="Not saved" message={error} />}
          <div>
            <label htmlFor="sp-order" className={labelClass}>Purchase order</label>
            <select id="sp-order" value={orderId} onChange={(e) => setOrderId(e.target.value)} disabled={saving || orders === null} className={fieldClass()}>
              <option value="">{orders === null ? "Loading orders…" : orders.length ? "Choose an order with goods received" : "No orders with goods received"}</option>
              {(orders || []).map((o) => (
                <option key={o.id} value={o.id}>{o.order_number} · {o.supplier?.name} · {o.type_label}</option>
              ))}
            </select>
          </div>

          {payable && (
            <>
              <dl className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200 sm:grid-cols-4">
                {[
                  ["Earned", money(payable.earned)],
                  ["Paid to date", money(payable.paid_to_date)],
                  ["Already requested", money(Number(payable.committed) - Number(payable.paid_to_date))],
                  ["Available", money(payable.available)],
                ].map(([label, value]) => (
                  <div key={label} className="px-3 py-2 bg-white">
                    <dt className={statLabelClass}>{label}</dt>
                    <dd className="font-semibold text-gray-900 tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
              {payable.supplier?.status !== "verified" && (
                <p className="px-3 py-2 text-amber-900 border border-amber-300 bg-amber-50">{payable.supplier?.name} isn&apos;t verified, so this payment can&apos;t pass the bank detail check until it is.</p>
              )}

              {isSor ? (
                <>
                  <p className="text-xs text-gray-500">Sales on return: the supplier is owed reconciled units sold × unit cost.{payable.operations_done === false && " Some SOR lines on this order still need reconciling."}</p>
                  <fieldset className="p-4 space-y-3 border border-gray-200">
                    <legend className="px-1 text-xs font-semibold text-gray-700">Supplier&apos;s invoice</legend>
                    <SorInvoiceFields invoice={invoice} onChange={setInvoice} disabled={saving} />
                  </fieldset>
                </>
              ) : (
                <fieldset>
                  <legend className={labelClass}>Delivery being paid</legend>
                  {payable.receipts.length === 0 ? (
                    <p className="text-gray-500">No deliveries recorded on this order.</p>
                  ) : (
                    <div className="space-y-2">
                      {payable.receipts.map((r) => {
                        const approved = r.status === "approved";
                        return (
                          <label key={r.id} className={`flex gap-3 p-3 border ${String(r.id) === receiptId ? "border-blue-600 bg-blue-50" : "border-gray-300"} ${approved && Number(r.available) > 0 ? "cursor-pointer" : "opacity-60"}`}>
                            <input type="radio" name="sp-receipt" value={r.id} checked={String(r.id) === receiptId} onChange={() => pickReceipt(String(r.id))} disabled={!approved || Number(r.available) <= 0 || saving} className="mt-0.5 accent-blue-600" />
                            <span className="flex-1">
                              <span className="block font-semibold text-gray-900">
                                {r.grn_number} · {formatDay(r.delivered_on)} · invoice {r.invoice_number || "—"}
                              </span>
                              <span className="block text-xs text-gray-600">
                                Invoice {money(r.invoice_amount)} · accepted {money(r.accepted_value)} · payable (the lower) {money(r.payable)} · available {money(r.available)}
                                {r.target_payment_date && ` · due ${formatDay(r.target_payment_date)}`}
                              </span>
                              {!approved && <span className="block text-xs text-amber-700">{r.status_label}: needs all three goods sign-offs first.</span>}
                              {r.invoice_bank_matches_supplier === false && <span className="block text-xs text-red-700">The bank details on this invoice differ from the supplier register.</span>}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </fieldset>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="sp-amount" className={labelClass}>Amount (₦)</label>
                  <input id="sp-amount" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={saving || (!isSor && !receipt)} className={fieldClass(tooMuch)} />
                  {tooMuch && <p className="mt-1 text-xs text-red-600">Only {money(available)} is available. Part payments are fine.</p>}
                </div>
                <div>
                  <label htmlFor="sp-notes" className={labelClass}>Notes</label>
                  <input id="sp-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} disabled={saving} placeholder="e.g. First part payment" className={fieldClass()} />
                </div>
              </div>
            </>
          )}
        </div>
        <ModalFooter>
          <button type="button" onClick={onClose} disabled={saving} className={secondaryButtonClass}>Cancel</button>
          <button type="submit" disabled={!canSave} className={primaryButtonClass}>
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Saving…" : "Raise request"}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  );
};

// ---------------------------------------------------------------------------
// Details and actions
// ---------------------------------------------------------------------------

const BankCompare = ({ payment }) => {
  const register = payment.supplier || {};
  const rows = [
    ["Bank", payment.invoice_bank_name, register.bank_name],
    ["Account name", payment.invoice_account_name, register.account_name],
    ["Account no.", payment.invoice_account_number, register.account_number],
  ];
  const norm = (v) => String(v || "").trim().replace(/\s+/g, " ").toLowerCase();
  return (
    <div className="overflow-x-auto border border-gray-200">
      <table className="w-full">
        <thead className="text-left bg-gray-50">
          <tr>
            <th className={`px-3 py-2 ${statLabelClass}`} />
            <th className={`px-3 py-2 ${statLabelClass}`}>On the invoice</th>
            <th className={`px-3 py-2 ${statLabelClass}`}>Supplier register ({register.status_label})</th>
            {payment.confirmed_bank && <th className={`px-3 py-2 ${statLabelClass}`}>At junior check</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map(([label, invoice, current], i) => {
            const confirmed = payment.confirmed_bank ? [payment.confirmed_bank.bank_name, payment.confirmed_bank.account_name, payment.confirmed_bank.account_number][i] : null;
            const differs = norm(invoice) !== norm(current);
            return (
              <tr key={label} className={differs ? "bg-red-50" : ""}>
                <td className="px-3 py-2 text-gray-600">{label}</td>
                <td className="px-3 py-2 text-gray-900">{invoice || "—"}</td>
                <td className="px-3 py-2 text-gray-900">{current || "—"}</td>
                {payment.confirmed_bank && <td className="px-3 py-2 text-gray-900">{confirmed || "—"}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const DetailsModal = ({ payment, bankAccounts, onClose, onChanged }) => {
  const { user, can } = useAuth();
  const [history, setHistory] = useState(null);
  const [mode, setMode] = useState(null); // check | approve | hold | pay | edit | cancel
  const [method, setMethod] = useState("documents");
  const [evidence, setEvidence] = useState("");
  const [note, setNote] = useState("");
  const [holdOwner, setHoldOwner] = useState("procurement");
  const [paidOn, setPaidOn] = useState(todayIso());
  const [bankRef, setBankRef] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [amount, setAmount] = useState(String(Number(payment.amount)));
  const [notes, setNotes] = useState(payment.notes || "");
  const [invoice, setInvoice] = useState(sorInvoiceFrom(payment));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    http
      .get(`/supplier-payments/${payment.id}/history`)
      .then(({ data }) => setHistory(toList(data)))
      .catch(() => setHistory([]));
  }, [payment.id, payment.status, payment.amount]);

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

  const isSor = payment.purchase_type === "sor";
  const raisedOrChecked = [payment.requested?.by?.id, payment.junior_check?.by?.id].includes(user?.id);
  const actions = [
    can("supplier-payments.check") && payment.status === "requested" && payment.requested?.by?.id !== user?.id && { mode: "check", label: "Junior check done", primary: true },
    can("supplier-payments.approve") && payment.status === "junior_checked" && !raisedOrChecked && { mode: "approve", label: "Approve", primary: true },
    can("supplier-payments.pay") && payment.status === "approved" && { mode: "pay", label: "Record as paid", primary: true },
    can("supplier-payments.approve") && ["requested", "junior_checked", "approved"].includes(payment.status) && { mode: "hold", label: "Put on hold" },
    can("supplier-payments.request") && payment.can_edit && { mode: "edit", label: payment.status === "held" ? "Correct and resubmit" : "Change request" },
    can("supplier-payments.request") && !["paid", "cancelled"].includes(payment.status) && { mode: "cancel", label: "Cancel payment", danger: true },
  ].filter(Boolean);

  const steps = [
    ["Requested", payment.requested],
    ["Junior check", payment.junior_check],
    ["Senior approval", payment.senior_review],
    ["Paid", payment.status === "paid" ? { by: payment.paid_by, at: payment.paid_on } : null],
  ];

  return (
    <ModalShell title={payment.reference} subtitle={`${payment.supplier?.name} · ${payment.purchase_order?.order_number}${payment.goods_receipt ? ` · ${payment.goods_receipt.grn_number}` : ""}`} icon={Wallet} onClose={onClose} busy={busy} maxWidth="max-w-3xl">
      <div className="px-6 py-5 space-y-5 text-sm">
        {error && <ErrorBox title="Not done" message={error} />}
        {payment.hold && (
          <p className="px-3 py-2 text-red-800 border border-red-200 bg-red-50">
            On hold for the {payment.hold.owner_label.toLowerCase()} to fix: {payment.hold.reason} ({payment.hold.by?.name}, {formatDay(payment.hold.at)})
          </p>
        )}
        {payment.cancelled_reason && <p className="px-3 py-2 text-gray-700 border border-gray-200 bg-gray-50">Cancelled: {payment.cancelled_reason}</p>}

        <dl className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200 sm:grid-cols-4">
          {[
            ["Status", <StatusBadge key="s" payment={payment} />],
            ["Amount", money(payment.amount)],
            ["Available to pay", money(payment.available_to_pay)],
            ["Purchase type", payment.type_label],
            ["Invoice", payment.invoice_number ? `${payment.invoice_number} · ${money(payment.invoice_amount)}` : "—"],
            ["Payable (GRN)", payment.goods_receipt ? money(payment.goods_receipt.payable) : "—"],
            ["Due", payment.target_payment_date ? formatDay(payment.target_payment_date) : "—"],
            ["Paid", payment.paid_on ? `${formatDay(payment.paid_on)} · ${payment.bank_reference}` : "—"],
          ].map(([label, value]) => (
            <div key={label} className="px-3 py-2 bg-white">
              <dt className={statLabelClass}>{label}</dt>
              <dd className="text-gray-900 break-words">{value}</dd>
            </div>
          ))}
        </dl>
        {payment.notes && <p className="text-gray-700">Notes: {payment.notes}</p>}

        <div>
          <p className={`${statLabelClass} mb-2`}>Automatic checks</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {CHECKS.map((check) => {
              const ok = payment.checks?.[check.key];
              const help = typeof check.help === "string" ? check.help : check.help[payment.purchase_type];
              return (
                <li key={check.key} className={`flex gap-2 p-3 border ${ok ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}`}>
                  {ok ? <CheckCircle2 size={16} className="text-green-600 shrink-0" /> : <XCircle size={16} className="text-red-600 shrink-0" />}
                  <span>
                    <span className="block font-semibold text-gray-900">{check.label}</span>
                    <span className="block text-xs text-gray-600">{help}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <p className={`${statLabelClass} mb-2`}>Bank details</p>
          <BankCompare payment={payment} />
        </div>

        <ol className="grid gap-2 sm:grid-cols-4">
          {steps.map(([label, done]) => (
            <li key={label} className={`p-3 border ${done ? "border-green-200 bg-green-50/50" : "border-gray-200"}`}>
              <p className="flex items-center gap-2 font-semibold text-gray-900">
                {done ? <CheckCircle2 size={15} className="text-green-600" /> : <Circle size={15} className="text-gray-300" />}
                {label}
              </p>
              {done && <p className="mt-1 text-xs text-gray-700">{done.by?.name || "—"}, {formatDay(done.at)}</p>}
            </li>
          ))}
        </ol>
        {payment.junior_check && <p className="text-xs text-gray-600">Junior check: {payment.junior_check.method_label}. {payment.junior_check.evidence}</p>}
        {payment.bank_account && <p className="text-xs text-gray-600">Paid from {payment.bank_account.bank_name} {payment.bank_account.account_number}</p>}

        {mode && (
          <div className="p-3 space-y-3 border border-gray-200 bg-gray-50">
            {mode === "check" && (
              <>
                <p className="text-gray-900">Check PO, GRN, invoice{isSor ? ", SOR counts" : ""} and the amount. The supplier register&apos;s bank details are saved on the payment now.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="sp-method" className={labelClass}>How you checked</label>
                    <select id="sp-method" value={method} onChange={(e) => setMethod(e.target.value)} disabled={busy} className={fieldClass()}>
                      {CHECK_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="sp-evidence" className={labelClass}>Evidence</label>
                    <input id="sp-evidence" value={evidence} onChange={(e) => setEvidence(e.target.value)} maxLength={500} disabled={busy} placeholder="e.g. PO, GRN and invoice agree" className={fieldClass()} />
                  </div>
                </div>
              </>
            )}
            {mode === "approve" && (
              <>
                <p className="text-gray-900">Approve {money(payment.amount)} to {payment.supplier?.name}? Review the supplier register above first.</p>
                <label htmlFor="sp-note" className={labelClass}>Note <span className="font-normal text-gray-400 normal-case">(optional)</span></label>
                <input id="sp-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} disabled={busy} className={fieldClass()} />
              </>
            )}
            {mode === "hold" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="sp-hold-reason" className={labelClass}>Why on hold</label>
                  <input id="sp-hold-reason" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} disabled={busy} className={fieldClass()} />
                </div>
                <div>
                  <label htmlFor="sp-hold-owner" className={labelClass}>Who must fix it</label>
                  <select id="sp-hold-owner" value={holdOwner} onChange={(e) => setHoldOwner(e.target.value)} disabled={busy} className={fieldClass()}>
                    {HOLD_OWNERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            )}
            {mode === "pay" && (
              <>
                <p className="text-gray-900">Send {money(payment.amount)} from the bank first, then record it here.</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label htmlFor="sp-paid-on" className={labelClass}>Paid on</label>
                    <input id="sp-paid-on" type="date" value={paidOn} max={todayIso()} onChange={(e) => setPaidOn(e.target.value)} disabled={busy} className={fieldClass()} />
                  </div>
                  <div>
                    <label htmlFor="sp-bank-ref" className={labelClass}>Bank reference</label>
                    <input id="sp-bank-ref" value={bankRef} onChange={(e) => setBankRef(e.target.value)} maxLength={100} disabled={busy} className={fieldClass()} />
                  </div>
                  <div>
                    <label htmlFor="sp-bank-account" className={labelClass}>Paid from</label>
                    <select id="sp-bank-account" value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)} disabled={busy} className={fieldClass()}>
                      <option value="">Not recorded</option>
                      {bankAccounts.map((a) => <option key={a.id} value={a.id}>{a.bank_name} · {a.account_number}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}
            {mode === "edit" && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="sp-edit-amount" className={labelClass}>Amount (₦)</label>
                    <input id="sp-edit-amount" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={busy} className={fieldClass(!amountOk(amount))} />
                  </div>
                  <div>
                    <label htmlFor="sp-edit-notes" className={labelClass}>Notes</label>
                    <input id="sp-edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} disabled={busy} className={fieldClass()} />
                  </div>
                </div>
                {isSor && <SorInvoiceFields invoice={invoice} onChange={setInvoice} disabled={busy} />}
                <p className="text-xs text-gray-500">Saving sends it back to the junior accountant.</p>
              </>
            )}
            {mode === "cancel" && (
              <>
                <label htmlFor="sp-cancel" className={labelClass}>Why is it cancelled?</label>
                <input id="sp-cancel" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} disabled={busy} className={fieldClass()} />
              </>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setMode(null)} disabled={busy} className={secondaryButtonClass}>Back</button>
              <button
                type="button"
                disabled={
                  busy ||
                  (mode === "check" && !evidence.trim()) ||
                  ((mode === "hold" || mode === "cancel") && !note.trim()) ||
                  (mode === "pay" && (!paidOn || !bankRef.trim())) ||
                  (mode === "edit" && (!amountOk(amount) || (isSor && !sorInvoiceValid(invoice))))
                }
                onClick={() => {
                  const id = payment.id;
                  if (mode === "check") return run(() => http.post(`/supplier-payments/${id}/junior-check`, { method, evidence: evidence.trim() }), "check");
                  if (mode === "approve") return run(() => http.post(`/supplier-payments/${id}/approve`, { note: note.trim() || null }), "approve");
                  if (mode === "hold") return run(() => http.post(`/supplier-payments/${id}/hold`, { reason: note.trim(), owner: holdOwner }), "hold");
                  if (mode === "pay") return run(() => http.post(`/supplier-payments/${id}/pay`, { paid_on: paidOn, bank_reference: bankRef.trim(), bank_account_id: bankAccountId ? Number(bankAccountId) : null }), "pay");
                  if (mode === "edit") return run(() => http.put(`/supplier-payments/${id}`, { amount: Number(amount), notes: notes.trim() || null, ...(isSor ? sorInvoiceBody(invoice) : {}) }), "edit");
                  return run(() => http.post(`/supplier-payments/${id}/cancel`, { reason: note.trim() }), "cancel");
                }}
                className={mode === "cancel" || mode === "hold" ? dangerButtonClass : primaryButtonClass}
              >
                {busy && <Loader2 size={16} className="animate-spin" />}
                {actions.find((a) => a.mode === mode)?.label}
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

      {actions.length > 0 && !mode && (
        <ModalFooter className="justify-between">
          <div className="flex flex-wrap gap-2">
            {actions.filter((a) => !a.primary).map((a) => (
              <button
                key={a.mode}
                type="button"
                onClick={() => { setNote(""); setMode(a.mode); }}
                className={a.danger ? dangerButtonClass : secondaryButtonClass}
              >
                {a.mode === "edit" && <Pencil size={14} />} {a.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {actions.filter((a) => a.primary).map((a) => (
              <button key={a.mode} type="button" onClick={() => { setNote(""); setMode(a.mode); }} className={primaryButtonClass}>{a.label}</button>
            ))}
          </div>
        </ModalFooter>
      )}
    </ModalShell>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SupplierPayments() {
  const { can } = useAuth();
  const canRequest = can("supplier-payments.request");

  const [payments, setPayments] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [mine, setMine] = useState(false);
  const [status, setStatus] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [viewing, setViewing] = useState(null);
  const { notify, toastElement } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { data } = await http.get("/supplier-payments", {
        params: { page, mine: mine ? 1 : undefined, status: status || undefined, supplier_id: supplierId || undefined },
      });
      setPayments(toList(data));
      setLastPage(Number(data?.last_page) || 1);
    } catch (err) {
      setLoadError(errorText(err, "Could not load supplier payments."));
    } finally {
      setLoading(false);
    }
  }, [page, mine, status, supplierId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    http.get("/suppliers").then(({ data }) => setSuppliers(toList(data))).catch(() => {});
    if (can("supplier-payments.pay")) {
      http.get("/bank-accounts").then(({ data }) => setBankAccounts(toList(data))).catch(() => {});
    }
  }, [can]);

  const exportCsv = () => {
    // Same columns as the client's payment register
    const headers = [
      "Payment ID", "PO ID", "Supplier ID", "Supplier name", "Invoice no.", "Invoice amount",
      "Confirmed bank", "Confirmed account name", "Confirmed account no.", "Invoice bank", "Invoice account name", "Invoice account no.",
      "Junior accountant", "Junior check date", "Check evidence / method", "Senior accountant", "Supplier sheet reviewed on",
      "Proposed SOR payment", "Payment status", "Paid on", "Bank payment ref", "Purchase type", "Available to pay", "Amount",
      "Operations check", "Bank detail check", "Accounting check", "Amount check",
    ];
    const flag = (ok) => (ok ? "OK" : "FAIL");
    const rows = payments.map((p) => [
      p.reference, p.purchase_order?.order_number, p.supplier?.id, p.supplier?.name, p.invoice_number, p.invoice_amount,
      p.confirmed_bank?.bank_name ?? p.supplier?.bank_name, p.confirmed_bank?.account_name ?? p.supplier?.account_name, p.confirmed_bank?.account_number ?? p.supplier?.account_number,
      p.invoice_bank_name, p.invoice_account_name, p.invoice_account_number,
      p.junior_check?.by?.name, p.junior_check?.at?.slice(0, 10), p.junior_check ? `${p.junior_check.evidence} (${p.junior_check.method_label})` : "",
      p.senior_review?.by?.name, p.senior_review?.at?.slice(0, 10),
      p.purchase_type === "sor" ? p.amount : "", p.status_label, p.paid_on, p.bank_reference, p.type_label, p.available_to_pay, p.amount,
      flag(p.checks?.operations), flag(p.checks?.bank_details), flag(p.checks?.accounting), flag(p.checks?.amount),
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const url = window.URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `supplier-payments-${todayIso()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleChanged = (saved, action) => {
    const words = {
      check: "Junior check done. The senior accountant approves it next.",
      approve: "Approved. It is ready to pay.",
      hold: "Put on hold.",
      pay: saved?.purchase_order?.status === "closed" ? `Recorded as paid. ${saved.purchase_order.order_number} is fully paid and closed.` : "Recorded as paid.",
      edit: "Request saved. The junior accountant checks it next.",
      cancel: "Payment cancelled.",
    };
    notify("success", words[action], saved?.reference || "Done");
    setViewing(saved);
    load();
  };

  return (
    <div className="pt-0 mt-0 font-raleway">
      {toastElement}
      <PageTitle title="Supplier Payments" description="Payments to suppliers: raised by procurement, checked by the junior accountant, approved and paid by the senior accountant" />
      <PurchasingNav />

      <section className="mt-5 bg-white border border-gray-200">
        <PanelHeader title="Payment register" meta={loading ? "Loading…" : `${payments.length} shown`}>
          <button onClick={exportCsv} disabled={payments.length === 0} className={toolbarButtonClass.secondary}>
            <Download size={13} />
            Export CSV
          </button>
          <button onClick={load} disabled={loading} className={toolbarButtonClass.secondary}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          {canRequest && (
            <button onClick={() => setRequesting(true)} className={toolbarButtonClass.primary}>
              <Plus size={14} />
              New Request
            </button>
          )}
        </PanelHeader>

        <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-gray-200">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={mine} onChange={(e) => { setMine(e.target.checked); setPage(1); }} className="accent-blue-600" />
            My tasks
          </label>
          <FilterSelect value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Status">
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </FilterSelect>
          <FilterSelect value={supplierId} onChange={(e) => { setSupplierId(e.target.value); setPage(1); }} aria-label="Supplier">
            <option value="">All suppliers</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </FilterSelect>
        </div>

        {loading && payments.length === 0 ? (
          <LoadingState label="Loading supplier payments…" />
        ) : loadError ? (
          <EmptyState icon={Wallet} tone="red" title="Couldn't load supplier payments" hint={loadError} action={<button onClick={load} className={secondaryButtonClass}>Try again</button>} />
        ) : payments.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title={mine ? "Nothing waiting for you" : status || supplierId ? "No payments match" : "No supplier payments yet"}
            hint={canRequest ? "Raise a request once a delivery is approved (outright) or SOR sales are reconciled." : "Payment requests will appear here."}
          />
        ) : (
          <ul className="divide-y divide-gray-100">
            {payments.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => setViewing(p)} className="flex flex-wrap items-center justify-between w-full gap-3 px-5 py-3 text-left hover:bg-blue-50/50">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900">
                      <span className="font-mono text-xs text-gray-500">{p.reference}</span>
                      {p.supplier?.name}
                      <StatusBadge payment={p} />
                      <Badge className={p.purchase_type === "sor" ? "text-purple-800 bg-purple-50" : "text-gray-700 bg-gray-100"}>{p.purchase_type === "sor" ? "SOR" : "Outright"}</Badge>
                    </p>
                    <p className="text-xs text-gray-600">
                      {p.purchase_order?.order_number}{p.goods_receipt ? ` · ${p.goods_receipt.grn_number}` : ""} · invoice {p.invoice_number || "—"}
                      {p.hold ? ` · on hold for the ${p.hold.owner_label.toLowerCase()}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <CheckDots checks={p.checks} />
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 tabular-nums">{money(p.amount)}</p>
                      <p className="text-xs text-gray-500">{p.paid_on ? `Paid ${formatDay(p.paid_on)}` : p.target_payment_date ? `Due ${formatDay(p.target_payment_date)}` : formatDay(p.created_at)}</p>
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

      {requesting && (
        <RequestForm
          onClose={() => setRequesting(false)}
          onSaved={(saved) => {
            setRequesting(false);
            setViewing(saved);
            notify("success", `${saved.reference} raised for ${money(saved.amount)}. The junior accountant checks it next.`, "Request raised");
            load();
          }}
        />
      )}

      {viewing && !requesting && (
        <DetailsModal key={`${viewing.id}-${viewing.status}-${viewing.amount}`} payment={viewing} bankAccounts={bankAccounts} onClose={() => setViewing(null)} onChanged={handleChanged} />
      )}
    </div>
  );
}
