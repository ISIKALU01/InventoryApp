// Top-bar Sync button: how many offline sales are waiting on this computer,
// and a panel to sync them now, see what synced, and deal with problems.
import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Loader2, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { ModalShell, ModalFooter, formatNaira, primaryButtonClass, secondaryButtonClass } from "../components/ui/Boxy";
import { useAuth } from "../context/AuthContext";
import { useConnection } from "./connection";
import { discardOfflineSale, retryOfflineSale, syncOfflineSales, useOfflineSales } from "./salesQueue";

const when = (iso) =>
  iso ? new Date(iso).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export function SyncButton() {
  const { sales, waiting, problems, syncing } = useOfflineSales();
  const [open, setOpen] = useState(false);

  const count = sales.length;
  const tone = problems.length
    ? "text-red-700 border-red-200 bg-red-50 hover:bg-red-100"
    : waiting.length
    ? "text-amber-800 border-amber-200 bg-amber-50 hover:bg-amber-100"
    : "text-gray-600 border-gray-200 bg-white hover:bg-gray-50";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border ${tone}`}
        title={count ? `${count} offline ${count === 1 ? "sale" : "sales"} waiting to sync` : "Offline sales: all synced"}
      >
        {syncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
        Sync
        {count > 0 && (
          <span className={`px-1.5 py-px text-[11px] font-bold text-white rounded-full ${problems.length ? "bg-red-600" : "bg-amber-600"}`}>{count}</span>
        )}
      </button>
      {open && <SyncPanel onClose={() => setOpen(false)} />}
    </>
  );
}

function SyncPanel({ onClose }) {
  const { waiting, problems, syncing, lastSync, recent } = useOfflineSales();
  const { online } = useConnection();
  const { can } = useAuth();
  const [result, setResult] = useState(null);
  const [confirmDiscard, setConfirmDiscard] = useState(null);

  const syncNow = async () => {
    setResult(await syncOfflineSales({ includeProblems: true }));
  };

  const reviewCount = recent.filter((r) => r.needs_review).length;

  return (
    <ModalShell title="Offline sales" subtitle="Sales made without internet, waiting on this computer" icon={RefreshCw} onClose={onClose} busy={syncing} maxWidth="max-w-2xl">
      <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
        <div className="grid grid-cols-3 gap-px bg-gray-200 border border-gray-200 text-center">
          {[
            ["Waiting", waiting.length, "text-amber-700"],
            ["Problems", problems.length, problems.length ? "text-red-600" : "text-gray-900"],
            ["Last sync", when(lastSync), "text-gray-900"],
          ].map(([label, value, tone]) => (
            <div key={label} className="px-3 py-3 bg-white">
              <p className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">{label}</p>
              <p className={`mt-1 text-sm font-bold ${tone}`}>{value}</p>
            </div>
          ))}
        </div>

        {result && !result.busy && (
          <div role="status" className={`px-4 py-3 text-sm border ${result.error ? "text-amber-900 border-amber-200 bg-amber-50" : "text-green-900 border-green-200 bg-green-50"}`}>
            {result.error ? (
              result.error
            ) : (
              <>
                {result.synced} {result.synced === 1 ? "sale" : "sales"} synced
                {result.review ? `, ${result.review} to check (see below)` : ""}
                {result.rejected ? `, ${result.rejected} couldn't be recorded` : ""}.
              </>
            )}
          </div>
        )}

        {!online && (
          <p className="text-xs text-gray-500">
            You&apos;re offline now. Sales sync by themselves as soon as the internet is back, or press Sync to try.
          </p>
        )}

        {problems.length > 0 && (
          <section>
            <h3 className="flex items-center gap-2 mb-2 text-sm font-semibold text-red-700">
              <AlertTriangle size={15} /> Couldn&apos;t be recorded
            </h3>
            <ul className="border border-red-200 divide-y divide-red-100">
              {problems.map((sale) => (
                <li key={sale.client_ref} className="px-4 py-3 text-sm bg-red-50/40">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">
                        {formatNaira(sale.total)} · {sale.payment_label || sale.payment_method} · {when(sale.sold_at)}
                      </p>
                      <p className="text-xs text-gray-600">{sale.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}</p>
                      <p className="mt-1 text-xs font-medium text-red-700">{sale.message}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button type="button" onClick={() => retryOfflineSale(sale.client_ref)} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50">
                        <RotateCcw size={12} /> Retry
                      </button>
                      {can("sales.manage") && (
                        <button type="button" onClick={() => setConfirmDiscard(sale)} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-white border border-red-200 hover:bg-red-50">
                          <Trash2 size={12} /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h3 className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-800">
            <Clock size={15} /> Waiting to sync
          </h3>
          {waiting.length === 0 ? (
            <p className="text-sm text-gray-500">Nothing waiting. Every offline sale on this computer has synced.</p>
          ) : (
            <ul className="border border-gray-200 divide-y divide-gray-100">
              {waiting.map((sale) => (
                <li key={sale.client_ref} className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{formatNaira(sale.total)} · {sale.payment_label || sale.payment_method}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {when(sale.sold_at)} · {sale.store_name || "Shop"} · {sale.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {recent.length > 0 && (
          <section>
            <h3 className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-800">
              <CheckCircle2 size={15} className="text-green-600" /> Recently synced
              {reviewCount > 0 && <span className="text-xs font-medium text-amber-700">({reviewCount} to check)</span>}
            </h3>
            <ul className="border border-gray-200 divide-y divide-gray-100">
              {recent.slice(0, 10).map((r) => (
                <li key={r.client_ref} className="px-4 py-2.5 text-sm">
                  <p className="text-gray-900">
                    Sale #{r.order_id} · {formatNaira(r.total)} · sold {when(r.sold_at)}
                    {r.needs_review && <span className="ml-2 text-xs font-semibold text-amber-700">To check</span>}
                  </p>
                  {r.notes?.length > 0 && <p className="text-xs text-amber-800">{r.notes.join(" ")}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <ModalFooter>
        <button type="button" onClick={onClose} disabled={syncing} className={secondaryButtonClass}>
          Close
        </button>
        <button type="button" onClick={syncNow} disabled={syncing || waiting.length + problems.length === 0} className={primaryButtonClass}>
          {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          {syncing ? "Syncing…" : "Sync now"}
        </button>
      </ModalFooter>

      {confirmDiscard && (
        <ModalShell title="Remove this sale?" subtitle="Only if it was recorded another way" icon={Trash2} iconClass="bg-red-600" onClose={() => setConfirmDiscard(null)}>
          <div className="px-6 py-5 text-sm text-gray-700">
            {formatNaira(confirmDiscard.total)} sold {when(confirmDiscard.sold_at)} is deleted from this computer and won&apos;t
            be synced. Record it by hand first, or the money and stock won&apos;t add up.
          </div>
          <ModalFooter>
            <button type="button" onClick={() => setConfirmDiscard(null)} className={secondaryButtonClass}>Keep it</button>
            <button
              type="button"
              onClick={async () => {
                await discardOfflineSale(confirmDiscard.client_ref);
                setConfirmDiscard(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              Remove sale
            </button>
          </ModalFooter>
        </ModalShell>
      )}
    </ModalShell>
  );
}
