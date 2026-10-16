// Expenses: store managers request expenses for their store; approvers
// (chosen by the admin in Settings) approve them, paid from the store's cash
// at hand, or reject them. Accountants record expenses already paid from the
// bank. Each store's cash at hand, and an analysis of where money goes.
import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, Banknote, CheckCircle2, Clock, Download, History, Landmark, Loader2, Plus, Receipt, RefreshCw, Scale, Wallet, XCircle } from "lucide-react";
import TransactionNav from "../../components/TransactionNav";
import http from "../../../services/http";
import { useAuth } from "../../context/AuthContext";
import { storesFor } from "../../../utils/permissions";
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
  StatTiles,
  dangerButtonClass,
  fieldClass,
  filterFieldClass,
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

const STATUS_BADGE = {
  pending: "text-amber-800 bg-amber-50",
  approved: "text-green-800 bg-green-50",
  rejected: "text-red-700 bg-red-50",
  cancelled: "text-gray-600 bg-gray-100",
};

const money = (value) => formatNaira(Number(value || 0));
const todayIso = () => new Date().toISOString().slice(0, 10);
const monthStart = () => `${todayIso().slice(0, 8)}01`;
const nowTime = () => new Date().toTimeString().slice(0, 5);
const errorText = (err, fallback) => {
  const errors = err.response?.data?.errors;
  return (errors && Object.values(errors)[0]?.[0]) || err.response?.data?.message || fallback;
};
const csvCell = (value) => {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const downloadCsv = (name, headers, rows) => {
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  const url = window.URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}-${todayIso()}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
};

const StatusBadge = ({ expense }) => <Badge className={STATUS_BADGE[expense.status] || "text-gray-700 bg-gray-100"}>{expense.status_label || expense.status}</Badge>;

// ---------------------------------------------------------------------------
// Request (store managers) / record a bank-paid expense (accountants)
// ---------------------------------------------------------------------------

const ExpenseForm = ({ mode, existing, stores, categories, onClose, onSaved }) => {
  const { user } = useAuth();
  const isRequest = mode === "request";
  const fixedStore = user?.store_access && !user.store_access.all && stores.length === 1 ? stores[0] : null;
  const [values, setValues] = useState({
    store_id: existing?.store_id ? String(existing.store_id) : fixedStore ? String(fixedStore.id) : "",
    category: existing?.category || "",
    amount: existing ? String(Number(existing.amount)) : "",
    description: existing?.description || "",
    date: existing?.date ? String(existing.date).slice(0, 10) : todayIso(),
    time: existing?.time || nowTime(),
    receipt_ref: existing?.receipt_ref || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (field) => (e) => setValues((prev) => ({ ...prev, [field]: e.target.value }));

  const categoryOptions = useMemo(() => {
    const names = categories.map((c) => c.name);
    return existing?.category && !names.includes(existing.category) ? [existing.category, ...names] : names;
  }, [categories, existing]);

  const ready = values.category && Number(values.amount) > 0 && values.description.trim() && (values.store_id || fixedStore) && !saving;

  const submit = async (e) => {
    e.preventDefault();
    if (!ready) return;
    setSaving(true);
    setError("");
    const body = {
      store_id: Number(values.store_id || fixedStore?.id),
      category: values.category,
      amount: Number(values.amount),
      description: values.description.trim(),
      date: values.date,
      receipt_ref: values.receipt_ref.trim() || null,
      // Correcting keeps who posted it; a new record is posted by you
      ...(isRequest ? {} : existing ? { time: values.time } : { time: values.time, posted_by: user?.name || "Accounts" }),
    };
    try {
      const { data } = isRequest
        ? await http.post("/expense-requests", body)
        : existing
        ? await http.put(`/expenses/${existing.id}`, body)
        : await http.post("/expenses", body);
      onSaved(data, isRequest ? "requested" : existing ? "updated" : "recorded");
    } catch (err) {
      setError(errorText(err, "Could not save the expense."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={isRequest ? "Request an Expense" : existing ? `Correct ${existing.reference}` : "Record a Bank-paid Expense"}
      subtitle={isRequest ? "Paid from your store's cash once it is approved" : "Already paid from the bank; doesn't touch store cash"}
      icon={Receipt}
      onClose={onClose}
      busy={saving}
      maxWidth="max-w-lg"
    >
      <form onSubmit={submit}>
        <div className="px-6 py-5 space-y-4 text-sm">
          {error && <ErrorBox title="Not saved" message={error} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="exp-store" className={labelClass}>Store</label>
              {fixedStore ? (
                <p id="exp-store" className={`${fieldClass()} bg-gray-50`}>{fixedStore.name}</p>
              ) : (
                <select id="exp-store" value={values.store_id} onChange={set("store_id")} disabled={saving} className={fieldClass()}>
                  <option value="">Choose the store</option>
                  {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </div>
            <div>
              <label htmlFor="exp-category" className={labelClass}>Category</label>
              <select id="exp-category" value={values.category} onChange={set("category")} disabled={saving} className={fieldClass()}>
                <option value="">Choose a category</option>
                {categoryOptions.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="exp-amount" className={labelClass}>Amount (₦)</label>
              <input id="exp-amount" type="number" min="0.01" step="0.01" value={values.amount} onChange={set("amount")} disabled={saving} className={fieldClass()} />
            </div>
            <div>
              <label htmlFor="exp-date" className={labelClass}>Date</label>
              <input id="exp-date" type="date" value={values.date} max={todayIso()} onChange={set("date")} disabled={saving} className={fieldClass()} />
            </div>
          </div>
          <div>
            <label htmlFor="exp-description" className={labelClass}>What it&apos;s for</label>
            <input id="exp-description" value={values.description} onChange={set("description")} maxLength={255} disabled={saving} placeholder="e.g. Diesel for the generator" className={fieldClass()} />
          </div>
          <div>
            <label htmlFor="exp-receipt" className={labelClass}>Receipt or invoice no. <span className="font-normal text-gray-400 normal-case">(optional)</span></label>
            <input id="exp-receipt" value={values.receipt_ref} onChange={set("receipt_ref")} maxLength={100} disabled={saving} className={fieldClass()} />
          </div>
        </div>
        <ModalFooter>
          <button type="button" onClick={onClose} disabled={saving} className={secondaryButtonClass}>Cancel</button>
          <button type="submit" disabled={!ready} className={primaryButtonClass}>
            {saving && <Loader2 size={16} className="animate-spin" />}
            {isRequest ? "Send for approval" : existing ? "Save" : "Record expense"}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  );
};

// ---------------------------------------------------------------------------
// Details: approve / reject / cancel / correct / delete
// ---------------------------------------------------------------------------

const DetailsModal = ({ expense, cash, onClose, onChanged, onEdit }) => {
  const { user, can } = useAuth();
  const [history, setHistory] = useState(null);
  const [mode, setMode] = useState(null); // approve | reject | delete
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    http.get(`/expenses/${expense.id}/history`).then(({ data }) => setHistory(toList(data))).catch(() => setHistory([]));
  }, [expense.id, expense.status]);

  const pending = expense.status === "pending";
  const mine = expense.requested_by?.id === user?.id;
  const canDecide = pending && can("expenses.approve") && !mine;
  const canCancel = pending && can("expenses.request") && (mine || user?.role === "admin");
  const correctable = can("expenses.manage") && !pending && !(expense.status === "approved" && expense.paid_from === "cash");
  const storeCash = cash.find((c) => c.store.id === expense.store_id);
  const short = canDecide && storeCash?.set_up && Number(storeCash.balance) < Number(expense.amount);

  const run = async (request, action) => {
    setBusy(true);
    setError("");
    try {
      const response = await request();
      onChanged(response?.data || null, action);
      setMode(null);
    } catch (err) {
      setError(errorText(err, "That didn't work. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title={expense.reference || "Expense"} subtitle={`${expense.category} · ${expense.store?.name || expense.location || "—"}`} icon={Receipt} onClose={onClose} busy={busy} maxWidth="max-w-2xl">
      <div className="px-6 py-5 space-y-5 text-sm">
        {error && <ErrorBox title="Not done" message={error} />}
        <dl className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200 sm:grid-cols-3">
          {[
            ["Status", <StatusBadge key="s" expense={expense} />],
            ["Amount", money(expense.amount)],
            ["Paid from", expense.paid_from_label],
            ["Date", formatDay(expense.date)],
            ["Store", expense.store?.name || expense.location || "—"],
            ["Receipt", expense.receipt_ref || "—"],
            ["Requested by", expense.requested_by?.name || expense.posted_by || "—"],
            ["Decided by", expense.decided_by ? `${expense.decided_by.name}, ${formatDay(expense.decided_at)}` : "—"],
            ["Note", expense.decision_note || "—"],
          ].map(([label, value]) => (
            <div key={label} className="px-3 py-2 bg-white">
              <dt className={statLabelClass}>{label}</dt>
              <dd className="text-gray-900 break-words">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-gray-800">{expense.description}</p>

        {canDecide && storeCash && (
          <p className={`px-3 py-2 border ${!storeCash.set_up || short ? "text-amber-900 border-amber-300 bg-amber-50" : "text-gray-700 border-gray-200 bg-gray-50"}`}>
            {storeCash.set_up
              ? `${storeCash.store.name} has ${money(storeCash.balance)} cash at hand${short ? ": not enough. Give the store cash first (Store cash tab)." : "."}`
              : `${storeCash.store.name}'s cash isn't set up yet. Count its cash first (Store cash tab).`}
          </p>
        )}

        {mode && (
          <div className="p-3 space-y-2 border border-gray-200 bg-gray-50">
            {mode === "delete" ? (
              <p>Delete {expense.reference}? This can&apos;t be undone.</p>
            ) : (
              <>
                <label htmlFor="exp-note" className={labelClass}>{mode === "reject" ? "Why is it rejected?" : "Note (optional)"}</label>
                <input id="exp-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} autoFocus disabled={busy} className={fieldClass()} />
              </>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setMode(null)} disabled={busy} className={secondaryButtonClass}>Back</button>
              <button
                type="button"
                disabled={busy || (mode === "reject" && !note.trim())}
                onClick={() =>
                  mode === "approve"
                    ? run(() => http.post(`/expenses/${expense.id}/approve`, { note: note.trim() || null }), "approved")
                    : mode === "reject"
                    ? run(() => http.post(`/expenses/${expense.id}/reject`, { reason: note.trim() }), "rejected")
                    : run(() => http.delete(`/expenses/${expense.id}`).then(() => null), "deleted")
                }
                className={mode === "approve" ? primaryButtonClass : dangerButtonClass}
              >
                {busy && <Loader2 size={16} className="animate-spin" />}
                {mode === "approve" ? "Approve and pay from cash" : mode === "reject" ? "Reject" : "Delete"}
              </button>
            </div>
          </div>
        )}

        <div>
          <p className={`${statLabelClass} mb-2`}>History</p>
          {history === null ? (
            <p className="text-gray-500">Loading…</p>
          ) : history.length === 0 ? (
            <p className="text-gray-500">Nothing recorded (an older expense).</p>
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
      {!mode && (canDecide || canCancel || correctable) && (
        <ModalFooter className="justify-between">
          <div className="flex gap-2">
            {canCancel && <button type="button" disabled={busy} onClick={() => run(() => http.post(`/expenses/${expense.id}/cancel`), "cancelled")} className={secondaryButtonClass}>Cancel request</button>}
            {correctable && <button type="button" onClick={() => onEdit(expense)} className={secondaryButtonClass}>Correct</button>}
            {correctable && <button type="button" onClick={() => setMode("delete")} className={secondaryButtonClass}>Delete</button>}
          </div>
          {canDecide && (
            <div className="flex gap-2">
              <button type="button" onClick={() => { setNote(""); setMode("reject"); }} className={dangerButtonClass}><XCircle size={16} /> Reject</button>
              <button type="button" onClick={() => { setNote(""); setMode("approve"); }} disabled={!storeCash?.set_up || short} className={primaryButtonClass}><CheckCircle2 size={16} /> Approve</button>
            </div>
          )}
        </ModalFooter>
      )}
      {mine && pending && !canCancel && <p className="px-6 pb-4 text-xs text-gray-500">Someone else approves your request.</p>}
    </ModalShell>
  );
};

// ---------------------------------------------------------------------------
// Store cash
// ---------------------------------------------------------------------------

const CashActionModal = ({ store, action, onClose, onDone }) => {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const titles = { count: "Count the Cash", float: "Give the Store Cash", banked: "Cash Taken to the Bank" };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = action === "count"
        ? await http.post(`/store-cash/${store.store.id}/count`, { counted_amount: Number(amount), note: note.trim() || null })
        : await http.post(`/store-cash/${store.store.id}/entries`, { type: action, amount: Number(amount), note: note.trim() || null });
      onDone(data, action);
    } catch (err) {
      setError(errorText(err, "Could not save."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title={titles[action]} subtitle={store.store.name} icon={Wallet} onClose={onClose} busy={busy} maxWidth="max-w-md">
      <form onSubmit={submit}>
        <div className="px-6 py-5 space-y-4 text-sm">
          {error && <ErrorBox title="Not saved" message={error} />}
          <p className="text-gray-600">
            {action === "count"
              ? store.set_up
                ? `The system expects ${money(store.balance)}. Enter what's actually there; any difference is recorded as short or over.`
                : "Enter the cash in the store now. Its cash at hand starts from this count."
              : action === "float"
              ? "Cash handed to the store, e.g. a float or top-up for expenses."
              : `Cash removed from the store and lodged at the bank. The store has ${money(store.balance)}.`}
          </p>
          <div>
            <label htmlFor="cash-amount" className={labelClass}>{action === "count" ? "Cash counted (₦)" : "Amount (₦)"}</label>
            <input id="cash-amount" type="number" min={action === "count" ? "0" : "0.01"} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus disabled={busy} className={fieldClass()} />
          </div>
          <div>
            <label htmlFor="cash-note" className={labelClass}>Note <span className="font-normal text-gray-400 normal-case">(optional)</span></label>
            <input id="cash-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} disabled={busy} placeholder={action === "banked" ? "e.g. GTBank Lekki, teller 4471" : ""} className={fieldClass()} />
          </div>
        </div>
        <ModalFooter>
          <button type="button" onClick={onClose} disabled={busy} className={secondaryButtonClass}>Cancel</button>
          <button type="submit" disabled={busy || amount === "" || Number(amount) < 0} className={primaryButtonClass}>
            {busy && <Loader2 size={16} className="animate-spin" />} Save
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  );
};

const CashHistoryModal = ({ store, onClose }) => {
  const [data, setData] = useState(null);
  useEffect(() => {
    http.get(`/store-cash/${store.store.id}`).then(({ data: d }) => setData(d)).catch(() => setData({ history: [] }));
  }, [store.store.id]);

  return (
    <ModalShell title={`${store.store.name}: Cash History`} subtitle="Counts, cash given, cash banked and expenses paid" icon={History} onClose={onClose} maxWidth="max-w-2xl">
      <div className="px-6 py-5 text-sm">
        {data === null ? (
          <p className="text-gray-500">Loading…</p>
        ) : data.history.length === 0 ? (
          <p className="text-gray-500">Nothing yet.</p>
        ) : (
          <ul className="border border-gray-200 divide-y divide-gray-100">
            {data.history.map((row, i) => (
              <li key={`${row.type}-${i}`} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <span>
                  <span className="font-semibold text-gray-900">{row.label}</span>
                  {row.counted_amount !== null && row.counted_amount !== undefined && <span className="text-gray-600"> · counted {money(row.counted_amount)}</span>}
                  {(row.reference || row.note) && <span className="block text-xs text-gray-500">{[row.reference, row.note].filter(Boolean).join(" · ")}</span>}
                  <span className="block text-xs text-gray-400">{row.by?.name || "—"} · {formatDay(row.at)}</span>
                </span>
                <span className={`font-semibold tabular-nums ${Number(row.amount) < 0 ? "text-red-700" : "text-green-700"}`}>
                  {Number(row.amount) > 0 ? "+" : ""}{money(row.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ModalShell>
  );
};

const CashTab = ({ cash, canManageCash, onAction, onHistory }) =>
  cash.length === 0 ? (
    <EmptyState icon={Wallet} title="No stores" hint="Stores you work at appear here." />
  ) : (
    <div className="grid gap-px bg-gray-200 sm:grid-cols-2 xl:grid-cols-3">
      {cash.map((c) => (
        <div key={c.store.id} className="p-5 space-y-3 bg-white">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-900">{c.store.name}</p>
              <p className="text-xs text-gray-500">{c.set_up ? `Tracked since ${formatDay(c.since)}` : "Cash not set up yet"}</p>
            </div>
            <button type="button" onClick={() => onHistory(c)} className="text-xs font-semibold text-blue-700 hover:underline">History</button>
          </div>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{c.set_up ? money(c.balance) : "—"}</p>
          {c.set_up && (
            <dl className="grid grid-cols-2 text-xs text-gray-600 gap-x-3 gap-y-1">
              <dt>Cash sales</dt><dd className="text-right tabular-nums">+{money(c.cash_sales)}</dd>
              <dt>Cash given</dt><dd className="text-right tabular-nums">+{money(c.given)}</dd>
              <dt>Expenses paid</dt><dd className="text-right tabular-nums">−{money(c.cash_expenses)}</dd>
              <dt>Taken to bank</dt><dd className="text-right tabular-nums">−{money(c.banked)}</dd>
              <dt>Count differences</dt><dd className="text-right tabular-nums">{money(c.count_differences)}</dd>
            </dl>
          )}
          {c.pending_requests?.count > 0 && <p className="text-xs text-amber-700">{c.pending_requests.count} waiting for approval ({money(c.pending_requests.total)})</p>}
          {canManageCash && (
            <div className="flex flex-wrap gap-2 pt-1">
              <button type="button" onClick={() => onAction(c, "count")} className={secondaryButtonClass}><Scale size={14} /> Count</button>
              {c.set_up && <button type="button" onClick={() => onAction(c, "float")} className={secondaryButtonClass}><Banknote size={14} /> Give cash</button>}
              {c.set_up && <button type="button" onClick={() => onAction(c, "banked")} className={secondaryButtonClass}><Landmark size={14} /> To bank</button>}
            </div>
          )}
        </div>
      ))}
    </div>
  );

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

const AnalysisTab = ({ stores }) => {
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(todayIso());
  const [storeId, setStoreId] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    http
      .get("/expenses/analysis", { params: { from, to, store_id: storeId || undefined } })
      .then(({ data: d }) => { setData(d); setError(""); })
      .catch((err) => setError(errorText(err, "Could not load the analysis.")));
  }, [from, to, storeId]);

  const exportCsv = () =>
    downloadCsv(`expense-analysis-${from}-to-${to}`, ["Category", "Total", "Count", "Share of spending %"], data.by_category.map((r) => [r.category, r.total, r.count, r.share]));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-gray-200">
        <label className="flex items-center gap-2 text-sm text-gray-600">From <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className={filterFieldClass} /></label>
        <label className="flex items-center gap-2 text-sm text-gray-600">To <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className={filterFieldClass} /></label>
        <FilterSelect value={storeId} onChange={(e) => setStoreId(e.target.value)} aria-label="Store">
          <option value="">All my stores</option>
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </FilterSelect>
        <button type="button" onClick={exportCsv} disabled={!data} className={toolbarButtonClass.secondary}><Download size={13} /> Export CSV</button>
      </div>
      {error ? (
        <EmptyState icon={BarChart3} tone="red" title="Couldn't load the analysis" hint={error} />
      ) : data === null ? (
        <LoadingState label="Working it out…" />
      ) : (
        <div className="p-5 space-y-6">
          <StatTiles
            columns="sm:grid-cols-2 lg:grid-cols-4"
            tiles={[
              { icon: Receipt, iconClass: "text-blue-700 bg-blue-50", label: "Spent (approved)", value: money(data.total), hint: `${data.count} expenses` },
              { icon: BarChart3, iconClass: "text-purple-700 bg-purple-50", label: "Sales in the same period", value: money(data.sales) },
              { icon: Scale, iconClass: "text-green-700 bg-green-50", label: "Expenses ÷ sales", value: data.share_of_sales === null ? "—" : `${data.share_of_sales}%` },
              { icon: Clock, iconClass: "text-amber-700 bg-amber-50", label: "Waiting for approval", value: money(data.pending.total), hint: `${data.pending.count} requests` },
            ]}
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className={`${statLabelClass} mb-2`}>By category</p>
              {data.by_category.length === 0 ? <p className="text-sm text-gray-500">No approved expenses in this period.</p> : (
                <ul className="space-y-2">
                  {data.by_category.map((row) => (
                    <li key={row.category}>
                      <div className="flex justify-between text-sm"><span className="text-gray-900">{row.category} <span className="text-xs text-gray-500">({row.count})</span></span><span className="font-semibold tabular-nums">{money(row.total)}</span></div>
                      <div className="h-2 mt-1 bg-gray-100"><div className="h-2 bg-blue-600" style={{ width: `${row.share || 0}%` }} /></div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="space-y-6">
              <div>
                <p className={`${statLabelClass} mb-2`}>By store</p>
                <ul className="text-sm border border-gray-200 divide-y divide-gray-100">
                  {data.by_store.map((row) => (
                    <li key={row.store.id ?? "none"} className="flex justify-between gap-3 px-3 py-2">
                      <span>{row.store.name}<span className="block text-xs text-gray-500">{row.share_of_sales === null ? "" : `${row.share_of_sales}% of its sales`}</span></span>
                      <span className="font-semibold tabular-nums">{money(row.total)}</span>
                    </li>
                  ))}
                  {data.by_store.length === 0 && <li className="px-3 py-2 text-gray-500">—</li>}
                </ul>
              </div>
              <div>
                <p className={`${statLabelClass} mb-2`}>By month</p>
                <ul className="text-sm border border-gray-200 divide-y divide-gray-100">
                  {data.by_month.map((row) => (
                    <li key={row.month} className="flex justify-between px-3 py-2"><span>{row.month}</span><span className="font-semibold tabular-nums">{money(row.total)}</span></li>
                  ))}
                  {data.by_month.length === 0 && <li className="px-3 py-2 text-gray-500">—</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Expenses() {
  const { user, can } = useAuth();
  const [tab, setTab] = useState("expenses");
  const [expenses, setExpenses] = useState([]);
  const [cash, setCash] = useState([]);
  const [allStores, setAllStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [storeId, setStoreId] = useState("");
  const [category, setCategory] = useState("");
  const [form, setForm] = useState(null); // { mode, existing }
  const [viewing, setViewing] = useState(null);
  const [cashAction, setCashAction] = useState(null);
  const [cashHistory, setCashHistory] = useState(null);
  const { notify, toastElement } = useToast();

  const myStores = storesFor(user, allStores);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [e, c] = await Promise.all([http.get("/expenses"), http.get("/store-cash")]);
      setExpenses(toList(e.data));
      setCash(toList(c.data));
    } catch (err) {
      setError(errorText(err, "Could not load expenses."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    Promise.all([http.get("/stores"), http.get("/expense-categories")])
      .then(([s, c]) => {
        setAllStores(toList(s.data).sort((a, b) => String(a.name).localeCompare(String(b.name))));
        setCategories(toList(c.data));
      })
      .catch(() => {});
  }, [load]);

  const waiting = expenses.filter((e) => e.status === "pending");
  const myTurn = can("expenses.approve") ? waiting.filter((e) => e.requested_by?.id !== user?.id) : [];
  const thisMonth = expenses.filter((e) => e.status === "approved" && String(e.date).slice(0, 7) === todayIso().slice(0, 7));
  const cashTotal = cash.filter((c) => c.set_up).reduce((sum, c) => sum + Number(c.balance), 0);

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    return expenses
      .filter((e) => tab !== "waiting" || e.status === "pending")
      .filter((e) => !status || e.status === status)
      .filter((e) => !storeId || String(e.store_id) === storeId)
      .filter((e) => !category || e.category === category)
      .filter((e) => !term || [e.reference, e.description, e.category, e.location, e.posted_by, e.receipt_ref, e.amount].some((v) => String(v || "").toLowerCase().includes(term)));
  }, [expenses, tab, status, storeId, category, search]);

  const exportCsv = () =>
    downloadCsv("expenses", ["Reference", "Date", "Store", "Category", "Description", "Amount", "Status", "Paid from", "Receipt", "Requested by", "Decided by", "Decided on", "Note"],
      shown.map((e) => [e.reference, String(e.date).slice(0, 10), e.store?.name || e.location, e.category, e.description, e.amount, e.status_label, e.paid_from_label, e.receipt_ref, e.requested_by?.name || e.posted_by, e.decided_by?.name, e.decided_at?.slice(0, 10), e.decision_note]));

  const handleSaved = (saved, action) => {
    setForm(null);
    const words = { requested: `${saved.reference} was sent for approval.`, recorded: `${saved.reference} was recorded.`, updated: `${saved.reference} was corrected.` };
    notify("success", words[action], "Saved");
    load();
  };

  const handleChanged = (saved, action) => {
    const words = { approved: "Approved and paid from the store's cash.", rejected: "Rejected.", cancelled: "Request cancelled.", deleted: "Deleted." };
    notify("success", words[action], "Done");
    setViewing(action === "deleted" ? null : saved);
    load();
  };

  const tiles = [
    { icon: Receipt, iconClass: "text-blue-700 bg-blue-50", label: "Spent this month", value: money(thisMonth.reduce((s, e) => s + Number(e.amount), 0)), hint: `${thisMonth.length} approved` },
    { icon: Clock, iconClass: "text-amber-700 bg-amber-50", label: "Waiting for approval", value: waiting.length, hint: waiting.length ? money(waiting.reduce((s, e) => s + Number(e.amount), 0)) : undefined },
    { icon: Wallet, iconClass: "text-green-700 bg-green-50", label: "Cash at hand", value: money(cashTotal), hint: `${cash.filter((c) => c.set_up).length} of ${cash.length} stores set up` },
    { icon: CheckCircle2, iconClass: "text-purple-700 bg-purple-50", label: "Your turn", value: myTurn.length, hint: can("expenses.approve") ? "Requests for you to decide" : "You don't approve expenses" },
  ];

  const tabClass = (key) => `px-4 py-2 text-sm font-semibold border ${tab === key ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`;

  return (
    <div className="pt-0 mt-0 font-raleway">
      {toastElement}
      <PageTitle title="Expenses" description="Requests, approvals, each store's cash at hand, and where the money goes" />
      <TransactionNav />

      <div className="mt-5">
        <StatTiles tiles={tiles} loading={loading && expenses.length === 0} columns="sm:grid-cols-2 lg:grid-cols-4" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
        <div className="flex flex-wrap" role="tablist">
          {[["expenses", "All expenses"], ["waiting", `Waiting for approval${waiting.length ? ` (${waiting.length})` : ""}`], ["cash", "Store cash"], ["analysis", "Analysis"]].map(([key, label], i) => (
            <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`${tabClass(key)} ${i ? "-ml-px" : ""}`}>{label}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {can("expenses.request") && (
            <button type="button" onClick={() => setForm({ mode: "request" })} className={toolbarButtonClass.primary}><Plus size={14} /> Request expense</button>
          )}
          {can("expenses.manage") && (
            <button type="button" onClick={() => setForm({ mode: "record" })} className={toolbarButtonClass.secondary}><Landmark size={13} /> Record bank-paid expense</button>
          )}
        </div>
      </div>

      <section className="mt-3 bg-white border border-gray-200">
        {tab === "cash" ? (
          <>
            <PanelHeader title="Cash at hand" meta="Cash sales + cash given − expenses paid − cash banked">
              <button onClick={load} disabled={loading} className={toolbarButtonClass.secondary}><RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh</button>
            </PanelHeader>
            <CashTab cash={cash} canManageCash={can("cash.manage")} onAction={(c, action) => setCashAction({ store: c, action })} onHistory={setCashHistory} />
          </>
        ) : tab === "analysis" ? (
          <>
            <PanelHeader title="Analysis" meta="Approved expenses only" />
            <AnalysisTab stores={myStores} />
          </>
        ) : (
          <>
            <PanelHeader title={tab === "waiting" ? "Waiting for approval" : "Expenses"} meta={loading ? "Loading…" : `${shown.length} shown`}>
              <button onClick={exportCsv} disabled={shown.length === 0} className={toolbarButtonClass.secondary}><Download size={13} /> Export CSV</button>
              <button onClick={load} disabled={loading} className={toolbarButtonClass.secondary}><RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh</button>
            </PanelHeader>
            <div className="flex flex-wrap gap-3 px-5 py-3 border-b border-gray-200">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reference, description, amount…" aria-label="Search expenses" className={`${filterFieldClass} flex-1 min-w-[12rem]`} />
              {tab === "expenses" && (
                <FilterSelect value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
                  <option value="">Any status</option>
                  <option value="pending">Waiting for approval</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </FilterSelect>
              )}
              <FilterSelect value={storeId} onChange={(e) => setStoreId(e.target.value)} aria-label="Store">
                <option value="">All my stores</option>
                {myStores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </FilterSelect>
              <FilterSelect value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
                <option value="">Any category</option>
                {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </FilterSelect>
            </div>
            {loading && expenses.length === 0 ? (
              <LoadingState label="Loading expenses…" />
            ) : error ? (
              <EmptyState icon={Receipt} tone="red" title="Couldn't load expenses" hint={error} action={<button onClick={load} className={secondaryButtonClass}>Try again</button>} />
            ) : shown.length === 0 ? (
              <EmptyState icon={Receipt} title={tab === "waiting" ? "Nothing waiting for approval" : "No expenses match"} hint={can("expenses.request") ? "Request an expense when your store needs to spend cash." : "Expenses appear here once they are requested or recorded."} />
            ) : (
              <ul className="divide-y divide-gray-100">
                {shown.map((e) => (
                  <li key={e.id}>
                    <button type="button" onClick={() => setViewing(e)} className="flex flex-wrap items-center justify-between w-full gap-3 px-5 py-3 text-left hover:bg-blue-50/50">
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900">
                          <span className="font-mono text-xs font-normal text-gray-500">{e.reference}</span>
                          {e.category}
                          <StatusBadge expense={e} />
                          {e.status === "pending" && myTurn.some((m) => m.id === e.id) && <Badge className="text-amber-800 bg-amber-50">Your turn</Badge>}
                        </span>
                        <span className="block text-xs text-gray-600 truncate max-w-[40rem]">{e.description} · {e.store?.name || e.location || "—"} · {e.requested_by?.name || e.posted_by}</span>
                      </span>
                      <span className="text-right">
                        <span className="block text-sm font-semibold text-gray-900 tabular-nums">{money(e.amount)}</span>
                        <span className="block text-xs text-gray-500">{formatDay(e.date)} · {e.paid_from_label}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      {form && (
        <ExpenseForm
          mode={form.mode}
          existing={form.existing}
          stores={myStores}
          categories={categories}
          onClose={() => setForm(null)}
          onSaved={handleSaved}
        />
      )}
      {viewing && !form && (
        <DetailsModal
          key={`${viewing.id}-${viewing.status}`}
          expense={viewing}
          cash={cash}
          onClose={() => setViewing(null)}
          onChanged={handleChanged}
          onEdit={(e) => { setViewing(null); setForm({ mode: "record", existing: e }); }}
        />
      )}
      {cashAction && (
        <CashActionModal
          store={cashAction.store}
          action={cashAction.action}
          onClose={() => setCashAction(null)}
          onDone={(data, action) => {
            setCashAction(null);
            const words = { count: data.difference !== undefined && Number(data.difference) !== 0 && cashAction.store.set_up ? `Counted. Difference: ${money(data.difference)}.` : "Counted.", float: "Cash given to the store.", banked: "Recorded as taken to the bank." };
            notify("success", words[action], cashAction.store.store.name);
            load();
          }}
        />
      )}
      {cashHistory && <CashHistoryModal store={cashHistory} onClose={() => setCashHistory(null)} />}
    </div>
  );
}
