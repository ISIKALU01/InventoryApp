// Order Follow-up: the "control tower". One row per purchase order: where it
// is in the supplier-to-payment process (the client's 15-stage guide), the
// next action and who must do it. Worked out by the backend from the data.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ClipboardCheck, Download, Hourglass, Loader2, PauseCircle, RefreshCw, Wallet } from "lucide-react";
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
  StatTiles,
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

const OWNERS = [
  { value: "store_manager", label: "Store manager" },
  { value: "inventory_officer", label: "Inventory officer" },
  { value: "procurement", label: "Procurement officer" },
  { value: "junior_accountant", label: "Junior accountant" },
  { value: "senior_accountant", label: "Senior accountant" },
];

// Colour by part of the process: setting up, goods, problems, done, money
const stageClass = (number) => {
  if (number === 0) return "text-gray-600 bg-gray-100";
  if (number <= 6) return "text-amber-800 bg-amber-50";
  if (number <= 10) return "text-blue-800 bg-blue-50";
  if (number === 11) return "text-red-700 bg-red-100";
  if (number === 12 || number === 16) return "text-green-800 bg-green-50";
  return "text-purple-800 bg-purple-50";
};

const StageBadge = ({ stage }) => <Badge className={stageClass(stage.number)}>{stage.number > 0 && stage.number < 16 ? `${stage.number}. ` : ""}{stage.label}</Badge>;

// Where to go to do the next action
const ACTION_PAGES = {
  3: "/inventory/purchase-log",
  6: "/folio/supply-management",
  7: "/inventory/goods-received",
  8: "/inventory/goods-received",
  10: "/inventory/sor",
  11: "/folio/supplier-payments",
  13: "/folio/supplier-payments",
  14: "/folio/supplier-payments",
  15: "/folio/supplier-payments",
};

const errorText = (err, fallback) => err.response?.data?.message || fallback;
const todayIso = () => new Date().toISOString().slice(0, 10);
const money = (value) => formatNaira(Number(value || 0));

const csvCell = (value) => {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const Checkpoint = ({ checkpoint }) => (
  <span title={checkpoint.notes.join(" · ")} className={`inline-block w-2.5 h-2.5 rounded-full ${checkpoint.ok ? "bg-green-500" : "bg-amber-500"}`} />
);

// ---------------------------------------------------------------------------
// Details
// ---------------------------------------------------------------------------

const DetailsModal = ({ row: initial, onClose, onChanged }) => {
  const { can } = useAuth();
  const canManage = can("follow-up.manage");
  const [row, setRow] = useState(initial);
  const [target, setTarget] = useState(initial.target_is_manual ? initial.target_payment_date : "");
  const [notes, setNotes] = useState(initial.follow_up_notes || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (request, message) => {
    setBusy(true);
    setError("");
    try {
      const { data } = await request();
      setRow(data);
      onChanged(data, message);
    } catch (err) {
      setError(errorText(err, "That didn't work. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const facts = [
    ["Supplier", `${row.supplier?.name} (${row.supplier_check})`],
    ["Purchase type", row.type_label],
    ["PO date", formatDay(row.order_date)],
    ["PO amount", money(row.total_amount)],
    ["Invoice no.", row.invoice_numbers.join(", ") || "—"],
    ["Invoice amount", row.invoice_amount === null ? "—" : money(row.invoice_amount)],
    ["Goods approval", row.goods_approval || "—"],
    [row.purchase_type === "sor" ? "SOR earned" : "Earned (lower of invoice and accepted)", money(row.earned)],
    ["Paid to date", money(row.paid_to_date)],
    ["Unpaid", money(row.unpaid)],
    ["Target payment date", row.target_payment_date ? `${formatDay(row.target_payment_date)}${row.target_is_manual ? " (set by hand)" : ""}` : "—"],
    ["Store request", row.store_request ? `${row.store_request.reference}, approved ${formatDay(row.store_request.approved_on)}` : "—"],
    ["Delivery notes", row.delivery_note_refs.join(", ") || "—"],
    ["Delivered on", row.delivered_on ? formatDay(row.delivered_on) : "—"],
    ["Reviewed", row.reviewed ? `${row.reviewed.by?.name}, ${formatDay(row.reviewed.at)}` : "—"],
    ["Order status", row.status_label],
  ];

  return (
    <ModalShell title={row.order_number} subtitle={`${row.supplier?.name} · ${row.type_label}`} icon={ClipboardCheck} onClose={onClose} busy={busy} maxWidth="max-w-3xl">
      <div className="px-6 py-5 space-y-5 text-sm">
        {error && <ErrorBox title="Not saved" message={error} />}

        <div className={`p-4 border ${row.stage.number === 11 ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
          <p className="flex flex-wrap items-center gap-2"><StageBadge stage={row.stage} /> {row.action_owner && <span className="text-gray-600">Waiting for: <span className="font-semibold text-gray-900">{row.action_owner}</span></span>}</p>
          <p className="mt-2 text-base text-gray-900">{row.next_action || "Nothing left to do."}</p>
          {ACTION_PAGES[row.stage.number] && (
            <Link href={ACTION_PAGES[row.stage.number]} className="inline-block mt-2 text-sm font-semibold text-blue-700 hover:underline">Go there →</Link>
          )}
        </div>

        <dl className="grid grid-cols-1 gap-px bg-gray-200 border border-gray-200 sm:grid-cols-2">
          {facts.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3 px-3 py-2 bg-white">
              <dt className="text-gray-600">{label}</dt>
              <dd className="font-semibold text-right text-gray-900 tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="grid gap-3 sm:grid-cols-2">
          {[["Request / supplier checkpoint", row.request_checkpoint], ["Delivery / SOR checkpoint", row.delivery_checkpoint]].map(([title, checkpoint]) => (
            <div key={title} className={`p-3 border ${checkpoint.ok ? "border-green-200" : "border-amber-300 bg-amber-50/50"}`}>
              <p className="flex items-center gap-2 font-semibold text-gray-900">
                {checkpoint.ok ? <CheckCircle2 size={15} className="text-green-600" /> : <AlertTriangle size={15} className="text-amber-600" />} {title}
              </p>
              <ul className="mt-1 text-xs text-gray-700 list-disc list-inside">
                {checkpoint.notes.map((note) => <li key={note}>{note}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <div className="p-4 space-y-3 border border-gray-200">
          <p className={statLabelClass}>Follow-up</p>
          {canManage ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor="fu-target" className={labelClass}>Target payment date</label>
                  <input id="fu-target" type="date" value={target} onChange={(e) => setTarget(e.target.value)} disabled={busy} className={fieldClass()} />
                  <p className="mt-1 text-xs text-gray-500">Leave empty to use delivery date + payment terms.</p>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="fu-notes" className={labelClass}>Notes</label>
                  <textarea id="fu-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} disabled={busy} className={fieldClass()} />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => http.put(`/follow-up/${row.id}`, { target_payment_date: target || null, follow_up_notes: notes.trim() || null }), "Follow-up saved.")}
                  className={secondaryButtonClass}
                >
                  {busy && <Loader2 size={14} className="animate-spin" />} Save follow-up
                </button>
              </div>
            </>
          ) : (
            <p className="text-gray-700">{row.follow_up_notes || "No notes."}</p>
          )}
        </div>
      </div>
      {canManage && (
        <ModalFooter>
          <button type="button" disabled={busy} onClick={() => run(() => http.post(`/follow-up/${row.id}/review`), "Marked as reviewed.")} className={primaryButtonClass}>
            <CheckCircle2 size={16} /> Mark reviewed
          </button>
        </ModalFooter>
      )}
    </ModalShell>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OrderFollowUp() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [mine, setMine] = useState(false);
  const [stage, setStage] = useState("");
  const [owner, setOwner] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [purchaseType, setPurchaseType] = useState("");
  const [includeClosed, setIncludeClosed] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [viewing, setViewing] = useState(null);
  const { notify, toastElement } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { data } = await http.get("/follow-up", {
        params: {
          page,
          mine: mine ? 1 : undefined,
          stage: stage === "" ? undefined : stage,
          owner: owner || undefined,
          supplier_id: supplierId || undefined,
          purchase_type: purchaseType || undefined,
          include_closed: includeClosed ? 1 : undefined,
        },
      });
      setRows(toList(data));
      setSummary(data.summary);
      setLastPage(Number(data?.last_page) || 1);
    } catch (err) {
      setLoadError(errorText(err, "Could not load the order follow-up."));
    } finally {
      setLoading(false);
    }
  }, [page, mine, stage, owner, supplierId, purchaseType, includeClosed]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    http.get("/suppliers").then(({ data }) => setSuppliers(toList(data))).catch(() => {});
  }, []);

  const filter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const tiles = [
    { icon: ClipboardCheck, iconClass: "text-blue-700 bg-blue-50", label: "Orders in progress", value: summary?.orders ?? 0 },
    { icon: Wallet, iconClass: "text-purple-700 bg-purple-50", label: "Unpaid to suppliers", value: money(summary?.total_unpaid) },
    { icon: PauseCircle, iconClass: "text-red-700 bg-red-50", label: "Payments on hold", value: summary?.payments_on_hold ?? 0 },
    { icon: Hourglass, iconClass: "text-amber-700 bg-amber-50", label: "Payments overdue", value: summary?.payments_overdue ?? 0, hint: "Past the target payment date" },
  ];

  const exportCsv = () => {
    // Same columns as the client's "Supermarket order follow-up" sheet
    const headers = [
      "PO ID", "Purchase type", "Supplier ID", "Supplier name", "Supplier check", "PO date", "Invoice no.", "PO amount", "Invoice amount",
      "Goods approval", "SOR earned value", "Paid to date", "Unpaid payable", "Current stage", "Next action", "Action owner",
      "Target payment date", "Follow-up notes", "Reviewed on", "Store request ref", "Request approved on", "Delivery note ref",
      "Delivered on", "Request / supplier checkpoint", "Delivery / SOR checkpoint",
    ];
    const csvRows = rows.map((r) => [
      r.order_number, r.type_label, r.supplier?.id, r.supplier?.name, r.supplier_check, r.order_date, r.invoice_numbers.join("; "),
      r.total_amount, r.invoice_amount, r.goods_approval, r.sor_earned, r.paid_to_date, r.unpaid, `${r.stage.number}. ${r.stage.label}`,
      r.next_action, r.action_owner, r.target_payment_date, r.follow_up_notes, r.reviewed?.at?.slice(0, 10),
      r.store_request?.reference, r.store_request?.approved_on?.slice(0, 10), r.delivery_note_refs.join("; "), r.delivered_on,
      r.request_checkpoint.notes.join("; "), r.delivery_checkpoint.notes.join("; "),
    ]);
    const csv = [headers, ...csvRows].map((row) => row.map(csvCell).join(",")).join("\n");
    const url = window.URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `order-follow-up-${todayIso()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="pt-0 mt-0 font-raleway">
      {toastElement}
      <PageTitle title="Order Follow-up" description="Every purchase order from request to payment: where it is, what happens next and who must do it" />
      <PurchasingNav />

      <div className="mt-5">
        <StatTiles tiles={tiles} loading={loading && !summary} columns="sm:grid-cols-2 lg:grid-cols-4" />
      </div>

      {summary?.by_stage?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3" aria-label="Orders by stage">
          <button type="button" onClick={() => { setStage(""); setPage(1); }} className={`px-2.5 py-1 text-xs font-semibold border ${stage === "" ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 bg-white text-gray-700"}`}>
            All stages
          </button>
          {summary.by_stage.map((s) => (
            <button
              key={s.number}
              type="button"
              onClick={() => { setStage(String(s.number)); setPage(1); }}
              className={`px-2.5 py-1 text-xs font-semibold border ${stage === String(s.number) ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 bg-white text-gray-700"}`}
            >
              {s.label} <span className="tabular-nums">({s.count})</span>
            </button>
          ))}
        </div>
      )}

      <section className="mt-3 bg-white border border-gray-200">
        <PanelHeader title="Orders" meta={loading ? "Loading…" : `${rows.length} shown`}>
          <button onClick={exportCsv} disabled={rows.length === 0} className={toolbarButtonClass.secondary}>
            <Download size={13} />
            Export CSV
          </button>
          <button onClick={load} disabled={loading} className={toolbarButtonClass.secondary}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </PanelHeader>

        <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-gray-200">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={mine} onChange={(e) => { setMine(e.target.checked); setPage(1); }} className="accent-blue-600" />
            My tasks
          </label>
          <FilterSelect value={owner} onChange={filter(setOwner)} aria-label="Action owner">
            <option value="">Any owner</option>
            {OWNERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </FilterSelect>
          <FilterSelect value={supplierId} onChange={filter(setSupplierId)} aria-label="Supplier">
            <option value="">All suppliers</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </FilterSelect>
          <FilterSelect value={purchaseType} onChange={filter(setPurchaseType)} aria-label="Purchase type">
            <option value="">Outright and SOR</option>
            <option value="outright">Outright</option>
            <option value="sor">Sales on return</option>
          </FilterSelect>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={includeClosed} onChange={(e) => { setIncludeClosed(e.target.checked); setPage(1); }} className="accent-blue-600" />
            Include closed and cancelled
          </label>
        </div>

        {loading && rows.length === 0 ? (
          <LoadingState label="Loading orders…" />
        ) : loadError ? (
          <EmptyState icon={ClipboardCheck} tone="red" title="Couldn't load the follow-up" hint={loadError} action={<button onClick={load} className={secondaryButtonClass}>Try again</button>} />
        ) : rows.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title={mine ? "Nothing waiting for you" : "No orders match"} hint="Orders appear here from the moment they are drafted until they are paid and closed." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[60rem] text-sm">
              <thead className="text-left bg-gray-50">
                <tr>
                  <th className={`px-4 py-2 ${statLabelClass}`}>Order</th>
                  <th className={`px-3 py-2 ${statLabelClass}`}>Stage</th>
                  <th className={`px-3 py-2 ${statLabelClass}`}>Next action</th>
                  <th className={`px-3 py-2 ${statLabelClass}`}>Owner</th>
                  <th className={`px-3 py-2 text-right ${statLabelClass}`}>Unpaid</th>
                  <th className={`px-3 py-2 ${statLabelClass}`}>Target</th>
                  <th className={`px-3 py-2 ${statLabelClass}`}>Checks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.id} onClick={() => setViewing(row)} className="cursor-pointer hover:bg-blue-50/50">
                    <td className="px-4 py-2">
                      <span className="block font-semibold text-gray-900">{row.order_number}</span>
                      <span className="text-xs text-gray-500">{row.supplier?.name} · {row.purchase_type === "sor" ? "SOR" : "Outright"}</span>
                    </td>
                    <td className="px-3 py-2"><StageBadge stage={row.stage} /></td>
                    <td className="px-3 py-2 text-gray-800 max-w-[22rem]">{row.next_action || "—"}</td>
                    <td className="px-3 py-2 text-gray-700">{row.action_owner || "—"}</td>
                    <td className="px-3 py-2 font-semibold text-right text-gray-900 tabular-nums">{money(row.unpaid)}</td>
                    <td className={`px-3 py-2 ${row.payment_overdue ? "font-semibold text-red-700" : "text-gray-700"}`}>
                      {row.target_payment_date ? formatDay(row.target_payment_date) : "—"}
                      {row.payment_overdue && <span className="block text-xs">Overdue</span>}
                    </td>
                    <td className="px-3 py-2">
                      <span className="flex gap-1">
                        <Checkpoint checkpoint={row.request_checkpoint} />
                        <Checkpoint checkpoint={row.delivery_checkpoint} />
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
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading} className={secondaryButtonClass}>Newer</button>
            <span className="text-xs text-gray-500">Page {page} of {lastPage}</span>
            <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page >= lastPage || loading} className={secondaryButtonClass}>Older</button>
          </div>
        )}
      </section>

      {viewing && (
        <DetailsModal
          key={viewing.id}
          row={viewing}
          onClose={() => setViewing(null)}
          onChanged={(saved, message) => {
            notify("success", message, saved.order_number);
            load();
          }}
        />
      )}
    </div>
  );
}
