// SOR Reconciliation: sales-on-return goods, one row per product on each SOR
// purchase order. The till suggests units sold; someone records the count,
// then the store manager and inventory officer sign it. Only a signed count
// is paid. Unsold units can be returned to the supplier.
import { useCallback, useEffect, useState } from "react";
import { storesFor } from "../../../utils/permissions";
import { AlertTriangle, CheckCircle2, Circle, Download, History, Loader2, RefreshCw, Scale, Undo2 } from "lucide-react";
import PurchasingNav from "../../components/PurchasingNav";
import http from "../../../services/http";
import { useAuth } from "../../context/AuthContext";
import {
  Badge,
  EmptyState,
  ErrorBox,
  FilterSelect,
  LoadingState,
  ModalShell,
  PageTitle,
  PanelHeader,
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
  { value: "", label: "All lines" },
  { value: "open", label: "Open" },
  { value: "reconciled", label: "Reconciled" },
  { value: "closed", label: "Closed" },
];

const STATUS_BADGE = {
  open: "text-amber-800 bg-amber-50",
  reconciled: "text-green-800 bg-green-50",
  closed: "text-gray-700 bg-gray-100",
};

const SIGN_OFFS = [
  { key: "store_sign", path: "store-sign", permission: "sor.store-sign", title: "Store manager", statement: "The sales count is right" },
  { key: "stock_sign", path: "stock-sign", permission: "sor.stock-sign", title: "Inventory officer", statement: "The stock on hand matches" },
];

const errorText = (err, fallback) => err.response?.data?.message || fallback;
const todayIso = () => new Date().toISOString().slice(0, 10);
const money = (value) => formatNaira(Number(value || 0));

const csvCell = (value) => {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const StatusBadge = ({ line }) => <Badge className={STATUS_BADGE[line.status] || "text-gray-700 bg-gray-100"}>{line.status_label}</Badge>;

const Tick = ({ done, label }) => (
  <span title={done ? `${label}: ${done.by?.name}, ${formatDay(done.at)}` : `${label}: not yet`} className="inline-flex">
    {done ? <CheckCircle2 size={15} className="text-green-600" /> : <Circle size={15} className="text-gray-300" />}
  </span>
);

// ---------------------------------------------------------------------------
// Details: count, sign-offs, returns
// ---------------------------------------------------------------------------

const DetailsModal = ({ line: initial, stores, onClose, onChanged }) => {
  const { user, can } = useAuth();
  const [line, setLine] = useState(initial);
  const [history, setHistory] = useState(null);
  const [mode, setMode] = useState(null); // count | return | a sign-off key
  const [sold, setSold] = useState("");
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const [returnQty, setReturnQty] = useState("");
  const [returnStore, setReturnStore] = useState(String((stores.find((s) => s.type === "back_store") || stores[0])?.id ?? ""));
  const [returnReason, setReturnReason] = useState("");
  const [returnRef, setReturnRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Full line with its returns
  useEffect(() => {
    http.get(`/sor-lines/${initial.id}`).then(({ data }) => setLine(data)).catch(() => {});
  }, [initial.id]);

  useEffect(() => {
    http
      .get(`/sor-lines/${line.id}/history`)
      .then(({ data }) => setHistory(toList(data)))
      .catch(() => setHistory([]));
  }, [line.id, line.status, line.units_sold, line.units_returned, line.store_sign, line.stock_sign]);

  const run = async (request, action) => {
    setBusy(true);
    setError("");
    try {
      const { data } = await request();
      // Only some responses carry the returns list, so keep the one we have
      setLine((prev) => ({ ...prev, ...data }));
      onChanged(data, action);
      setMode(null);
      return true;
    } catch (err) {
      setError(errorText(err, "That didn't work. Please try again."));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const openCount = () => {
    setSold(String(line.suggested_units_sold));
    setReason("");
    setEvidence(line.evidence || "");
    setMode("count");
  };

  const soldNumber = /^\d+$/.test(sold) ? Number(sold) : null;
  const differs = soldNumber !== null && soldNumber !== line.suggested_units_sold;
  const tooMany = soldNumber !== null && soldNumber + line.units_returned > line.units_received;
  const belowReconciled = soldNumber !== null && soldNumber < line.reconciled_units_sold;
  const canSaveCount = soldNumber !== null && !tooMany && !belowReconciled && (!differs || reason.trim()) && !busy;

  const unsold = Math.max(0, line.units_on_hand);
  const returnNumber = /^\d+$/.test(returnQty) ? Number(returnQty) : null;
  const canSaveReturn = returnNumber !== null && returnNumber >= 1 && returnNumber <= unsold && returnStore && returnReason.trim() && !busy;

  const signedByMe = SIGN_OFFS.find((step) => line[step.key]?.by?.id === user?.id);

  return (
    <ModalShell title={`${line.product?.name}`} subtitle={`${line.purchase_order?.order_number} · ${line.supplier?.name}`} icon={Scale} onClose={onClose} busy={busy} maxWidth="max-w-3xl">
      <div className="px-6 py-5 space-y-5 text-sm">
        {error && <ErrorBox title="Not done" message={error} />}
        {!line.quantity_check && (
          <p className="flex items-center gap-2 px-3 py-2 text-red-800 border border-red-200 bg-red-50">
            <AlertTriangle size={16} /> Sold plus returned is more than was received. Recount before anything is paid.
          </p>
        )}

        <dl className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200 sm:grid-cols-4">
          {[
            ["Status", <StatusBadge key="s" line={line} />],
            ["Received", line.units_received],
            ["Sold (counted)", line.units_sold],
            ["Returned", line.units_returned],
            ["On hand", line.units_on_hand],
            ["Unit cost", money(line.unit_cost)],
            ["Earned payable", money(line.earned_payable)],
            ["First delivered", formatDay(line.first_delivered_on)],
          ].map(([label, value]) => (
            <div key={label} className="px-3 py-2 bg-white">
              <dt className={statLabelClass}>{label}</dt>
              <dd className="font-semibold text-gray-900 tabular-nums">{value ?? "—"}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-gray-500">
          Earned payable uses the last count both people signed ({line.reconciled_units_sold} sold
          {line.reconciled_at ? `, ${formatDay(line.reconciled_at)}` : ""}). The current count would make it {money(line.pending_payable)}.
        </p>

        <div className="p-4 space-y-2 border border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={statLabelClass}>Units sold</p>
            {can("sor.count") && !mode && (
              <button type="button" onClick={openCount} className={secondaryButtonClass}>Record a count</button>
            )}
          </div>
          <p className="text-gray-700">
            The till shows <span className="font-semibold">{line.suggested_units_sold}</span> sold since {formatDay(line.first_delivered_on)} (oldest SOR delivery first).
          </p>
          {line.counted ? (
            <p className="text-gray-700">
              Last count: <span className="font-semibold">{line.units_sold}</span> by {line.counted.by?.name}, {formatDay(line.counted.at)}
              {line.correction_reason && <span className="block text-amber-800">Differs from the till ({line.counted_suggestion}): {line.correction_reason}</span>}
              {line.evidence && <span className="block text-gray-500">Evidence: {line.evidence}</span>}
            </p>
          ) : (
            <p className="text-gray-500">Not counted yet.</p>
          )}

          {mode === "count" && (
            <div className="pt-2 space-y-3 border-t border-gray-100">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor="sor-sold" className={labelClass}>Units sold to date</label>
                  <input id="sor-sold" type="number" min={line.reconciled_units_sold} step="1" value={sold} onChange={(e) => setSold(e.target.value)} disabled={busy} className={fieldClass(tooMany || belowReconciled)} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="sor-evidence" className={labelClass}>Evidence <span className="font-normal text-gray-400 normal-case">(optional)</span></label>
                  <input id="sor-evidence" value={evidence} onChange={(e) => setEvidence(e.target.value)} maxLength={500} disabled={busy} placeholder="e.g. Till report 1–12 Oct, shelf count" className={fieldClass()} />
                </div>
              </div>
              {tooMany && <p className="text-xs text-red-600">Sold plus returned ({soldNumber + line.units_returned}) can&apos;t be more than the {line.units_received} received.</p>}
              {belowReconciled && <p className="text-xs text-red-600">{line.reconciled_units_sold} were already reconciled. A count can&apos;t go lower.</p>}
              {differs && (
                <div>
                  <label htmlFor="sor-reason" className={labelClass}>Why is it different from the till ({line.suggested_units_sold})?</label>
                  <input id="sor-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} disabled={busy} placeholder="e.g. 2 loaves damaged, not sold" className={fieldClass()} />
                </div>
              )}
              <p className="text-xs text-gray-500">Saving a count clears both sign-offs: they need to sign the new number.</p>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setMode(null)} disabled={busy} className={secondaryButtonClass}>Back</button>
                <button
                  type="button"
                  disabled={!canSaveCount}
                  onClick={() => run(() => http.post(`/sor-lines/${line.id}/count`, { units_sold: soldNumber, correction_reason: differs ? reason.trim() : null, evidence: evidence.trim() || null }), "count")}
                  className={primaryButtonClass}
                >
                  {busy && <Loader2 size={16} className="animate-spin" />} Save count
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          <p className={`${statLabelClass} mb-2`}>Sign-offs for the current count</p>
          <ol className="grid gap-2 sm:grid-cols-2">
            {SIGN_OFFS.map((step) => {
              const done = line[step.key];
              const blockedBySelf = signedByMe && signedByMe.key !== step.key;
              return (
                <li key={step.key} className={`p-3 border ${done ? "border-green-200 bg-green-50/50" : "border-gray-200"}`}>
                  <p className="flex items-center gap-2 font-semibold text-gray-900">
                    {done ? <CheckCircle2 size={16} className="text-green-600" /> : <Circle size={16} className="text-gray-300" />}
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-600">&ldquo;{step.statement}&rdquo;</p>
                  {done ? (
                    <p className="mt-1 text-xs text-gray-700">{done.by?.name}, {formatDay(done.at)}</p>
                  ) : !can(step.permission) ? (
                    <p className="mt-1 text-xs text-gray-500">Waiting.</p>
                  ) : !line.counted ? (
                    <p className="mt-1 text-xs text-gray-500">After a count is recorded.</p>
                  ) : blockedBySelf ? (
                    <p className="mt-1 text-xs text-gray-500">You signed the other check, so someone else must do this.</p>
                  ) : mode === step.key ? (
                    <div className="flex gap-2 mt-2">
                      <button type="button" onClick={() => setMode(null)} disabled={busy} className={secondaryButtonClass}>Back</button>
                      <button type="button" disabled={busy} onClick={() => run(() => http.post(`/sor-lines/${line.id}/${step.path}`), step.key)} className={primaryButtonClass}>
                        {busy && <Loader2 size={16} className="animate-spin" />} Sign {line.units_sold} sold
                      </button>
                    </div>
                  ) : (
                    !mode && <button type="button" onClick={() => setMode(step.key)} className={`${primaryButtonClass} mt-2`}>Sign</button>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="p-4 space-y-2 border border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={statLabelClass}>Returns to the supplier</p>
            {can("sor.return") && !mode && unsold > 0 && (
              <button type="button" onClick={() => setMode("return")} className={secondaryButtonClass}>
                <Undo2 size={14} /> Return unsold units
              </button>
            )}
          </div>
          {mode === "return" && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="sor-return-qty" className={labelClass}>Quantity <span className="font-normal text-gray-400 normal-case">(up to {unsold})</span></label>
                  <input id="sor-return-qty" type="number" min="1" max={unsold} step="1" value={returnQty} onChange={(e) => setReturnQty(e.target.value)} disabled={busy} className={fieldClass(returnNumber !== null && returnNumber > unsold)} />
                </div>
                <div>
                  <label htmlFor="sor-return-store" className={labelClass}>Taken from</label>
                  <select id="sor-return-store" value={returnStore} onChange={(e) => setReturnStore(e.target.value)} disabled={busy} className={fieldClass()}>
                    {stores.map((s) => <option key={s.id} value={s.id}>{s.name}{s.type === "back_store" ? " (back store)" : ""}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="sor-return-reason" className={labelClass}>Why</label>
                  <input id="sor-return-reason" value={returnReason} onChange={(e) => setReturnReason(e.target.value)} maxLength={500} disabled={busy} placeholder="e.g. Close to expiry" className={fieldClass()} />
                </div>
                <div>
                  <label htmlFor="sor-return-ref" className={labelClass}>Return note no. <span className="font-normal text-gray-400 normal-case">(optional)</span></label>
                  <input id="sor-return-ref" value={returnRef} onChange={(e) => setReturnRef(e.target.value)} maxLength={100} disabled={busy} className={fieldClass()} />
                </div>
              </div>
              <p className="text-xs text-gray-500">Stock goes down in the store you choose. The inventory officer then checks the stock again.</p>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setMode(null)} disabled={busy} className={secondaryButtonClass}>Back</button>
                <button
                  type="button"
                  disabled={!canSaveReturn}
                  onClick={() =>
                    run(
                      () => http.post(`/sor-lines/${line.id}/returns`, { quantity: returnNumber, store_id: Number(returnStore), reason: returnReason.trim(), reference: returnRef.trim() || null }),
                      "return"
                    ).then((ok) => {
                      if (ok) {
                        setReturnQty("");
                        setReturnReason("");
                        setReturnRef("");
                      }
                    })
                  }
                  className={primaryButtonClass}
                >
                  {busy && <Loader2 size={16} className="animate-spin" />} Return to supplier
                </button>
              </div>
            </div>
          )}
          {line.returns?.length > 0 ? (
            <ul className="border border-gray-200 divide-y divide-gray-100">
              {line.returns.map((r) => (
                <li key={r.id} className="px-3 py-2">
                  <span className="font-semibold tabular-nums">{r.quantity}</span> from {r.store?.name}{r.reference ? ` (${r.reference})` : ""}: {r.reason}
                  <span className="block text-xs text-gray-500">{r.by?.name}, {formatDay(r.at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            mode !== "return" && <p className="text-gray-500">Nothing returned.</p>
          )}
        </div>

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
    </ModalShell>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SorReconciliation() {
  const { user } = useAuth();
  const [lines, setLines] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [status, setStatus] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [viewing, setViewing] = useState(null);
  const { notify, toastElement } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { data } = await http.get("/sor-lines", { params: { page, status: status || undefined, supplier_id: supplierId || undefined } });
      setLines(toList(data));
      setLastPage(Number(data?.last_page) || 1);
    } catch (err) {
      setLoadError(errorText(err, "Could not load SOR lines."));
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
        // Returns leave from a store you work at
        setStores(storesFor(user, toList(st.data)).sort((a, b) => String(a.name).localeCompare(String(b.name))));
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- the user is loaded before any page renders; the server checks stores too

  const exportCsv = () => {
    // Same columns as the client's SOR sheet
    const headers = [
      "PO ID", "Supplier", "Item / SKU", "Units received", "Units sold to date", "Units returned to supplier", "Units still on hand",
      "Unit cost", "Earned payable", "Quantity check", "Store manager", "Store sign-off date", "Inventory officer", "Stock check date",
      "Sales / return evidence", "SOR status",
    ];
    const rows = lines.map((l) => [
      l.purchase_order?.order_number, l.supplier?.name, [l.product?.name, l.product?.sku].filter(Boolean).join(" / "),
      l.units_received, l.units_sold, l.units_returned, l.units_on_hand, l.unit_cost, l.earned_payable,
      l.quantity_check ? "OK" : "FAIL", l.store_sign?.by?.name, l.store_sign?.at?.slice(0, 10), l.stock_sign?.by?.name, l.stock_sign?.at?.slice(0, 10),
      [l.evidence, l.correction_reason].filter(Boolean).join(" | "), l.status_label,
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const url = window.URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `sor-reconciliation-${todayIso()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleChanged = (saved, action) => {
    const words = {
      count: "Count saved. It needs both sign-offs.",
      store_sign: "Sales count signed.",
      stock_sign: "Stock on hand signed.",
      return: "Units returned to the supplier.",
    };
    const message = saved.status === "reconciled" || saved.status === "closed"
      ? `Reconciled: ${saved.reconciled_units_sold} sold, earned ${money(saved.earned_payable)}.${saved.status === "closed" ? " Nothing left on hand, so it is closed." : ""}`
      : words[action];
    notify("success", message, "Done");
    load();
  };

  return (
    <div className="pt-0 mt-0 font-raleway">
      {toastElement}
      <PageTitle title="SOR Reconciliation" description="Sales-on-return goods: what came in, what sold, what went back, and what the supplier has earned" />
      <PurchasingNav />

      <section className="mt-5 bg-white border border-gray-200">
        <PanelHeader title="SOR lines" meta={loading ? "Loading…" : `${lines.length} shown`}>
          <button onClick={exportCsv} disabled={lines.length === 0} className={toolbarButtonClass.secondary}>
            <Download size={13} />
            Export CSV
          </button>
          <button onClick={load} disabled={loading} className={toolbarButtonClass.secondary}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
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

        {loading && lines.length === 0 ? (
          <LoadingState label="Loading SOR lines…" />
        ) : loadError ? (
          <EmptyState icon={Scale} tone="red" title="Couldn't load SOR lines" hint={loadError} action={<button onClick={load} className={secondaryButtonClass}>Try again</button>} />
        ) : lines.length === 0 ? (
          <EmptyState
            icon={Scale}
            title={status || supplierId ? "No lines match" : "No sales-on-return goods yet"}
            hint="A line appears here when goods from a sales-on-return purchase order are posted into stock."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-sm">
              <thead className="text-left bg-gray-50">
                <tr>
                  <th className={`px-4 py-2 ${statLabelClass}`}>Order / product</th>
                  <th className={`px-3 py-2 text-right ${statLabelClass}`}>Received</th>
                  <th className={`px-3 py-2 text-right ${statLabelClass}`}>Sold</th>
                  <th className={`px-3 py-2 text-right ${statLabelClass}`}>Till says</th>
                  <th className={`px-3 py-2 text-right ${statLabelClass}`}>Returned</th>
                  <th className={`px-3 py-2 text-right ${statLabelClass}`}>On hand</th>
                  <th className={`px-3 py-2 text-right ${statLabelClass}`}>Earned</th>
                  <th className={`px-3 py-2 ${statLabelClass}`}>Signed</th>
                  <th className={`px-3 py-2 ${statLabelClass}`}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 tabular-nums">
                {lines.map((line) => (
                  <tr key={line.id} onClick={() => setViewing(line)} className={`cursor-pointer hover:bg-blue-50/50 ${line.quantity_check ? "" : "bg-red-50"}`}>
                    <td className="px-4 py-2">
                      <span className="block font-semibold text-gray-900">{line.product?.name}</span>
                      <span className="text-xs text-gray-500">{line.purchase_order?.order_number} · {line.supplier?.name}</span>
                    </td>
                    <td className="px-3 py-2 text-right">{line.units_received}</td>
                    <td className="px-3 py-2 text-right">{line.units_sold}</td>
                    <td className={`px-3 py-2 text-right ${line.suggested_units_sold !== line.units_sold ? "text-amber-700" : "text-gray-500"}`}>{line.suggested_units_sold}</td>
                    <td className="px-3 py-2 text-right">{line.units_returned}</td>
                    <td className="px-3 py-2 text-right">{line.units_on_hand}</td>
                    <td className="px-3 py-2 text-right">{money(line.earned_payable)}</td>
                    <td className="px-3 py-2">
                      <span className="flex gap-1">
                        {SIGN_OFFS.map((step) => <Tick key={step.key} done={line[step.key]} label={step.title} />)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="flex flex-wrap items-center gap-1">
                        <StatusBadge line={line} />
                        {!line.quantity_check && <Badge className="text-red-700 bg-red-100">Check fails</Badge>}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {lastPage > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading} className={secondaryButtonClass}>Previous</button>
            <span className="text-xs text-gray-500">Page {page} of {lastPage}</span>
            <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page >= lastPage || loading} className={secondaryButtonClass}>Next</button>
          </div>
        )}
      </section>

      {viewing && <DetailsModal line={viewing} stores={stores} onClose={() => setViewing(null)} onChanged={handleChanged} />}
    </div>
  );
}
