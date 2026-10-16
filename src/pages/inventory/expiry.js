// Expiry: stock that has expired or expires soon, with its value at cost.
// Expired units stay listed (sales skip them) until someone disposes of them.
import { useCallback, useEffect, useRef, useState } from "react";
import { storesFor } from "../../../utils/permissions";
import Head from "next/head";
import { FaCalendarTimes, FaExclamationTriangle, FaTrash } from "react-icons/fa";
import InventoryNav from "../../components/InventoryNav";
import http from "../../../services/http";
import { useAuth } from "../../context/AuthContext";
import { EXPIRY_WARNING_DAYS, describeDaysLeft } from "../../../utils/expiry";
import {
  ModalFooter,
  ModalShell,
  Panel,
  Spinner,
  TOAST_DURATION,
  Toast,
  secondaryButtonClass,
  statLabelClass,
} from "../../components/settings/ui";

const SHOW_OPTIONS = [
  { value: "attention", label: "Needs attention" },
  { value: "expired", label: "Expired" },
  { value: "expiring", label: "Expiring soon" },
  { value: "all", label: "All batches" },
];

const WINDOW_OPTIONS = [7, 14, 30, 60, 90];

const naira = (value) =>
  `₦${Number(value || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });

const STATUS_STYLE = {
  expired: "text-red-700 bg-red-50",
  expiring: "text-amber-800 bg-amber-50",
  ok: "text-green-800 bg-green-50",
};

const SummaryTile = ({ title, figures, tone }) => (
  <div className={`p-4 bg-white border-l-4 border border-gray-200 ${tone}`}>
    <p className={statLabelClass}>{title}</p>
    <p className="mt-1 text-2xl font-semibold text-gray-900 tabular-nums">{naira(figures?.value)}</p>
    <p className="text-xs text-gray-500 tabular-nums">
      {figures?.units ?? 0} units in {figures?.batches ?? 0} batch{figures?.batches === 1 ? "" : "es"}
    </p>
  </div>
);

export default function Expiry() {
  const { can, user } = useAuth();
  const canDispose = can("inventory.manage");

  const [show, setShow] = useState("attention");
  const [days, setDays] = useState(EXPIRY_WARNING_DAYS);
  const [storeId, setStoreId] = useState("");
  const [stores, setStores] = useState([]);
  const [batches, setBatches] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [toDispose, setToDispose] = useState(null);
  const [disposeQty, setDisposeQty] = useState("");
  const [disposeError, setDisposeError] = useState("");
  const [disposing, setDisposing] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const notify = (type, message, title) => {
    clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), type, message, title });
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION[type]);
  };

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { data } = await http.get("/stock-batches", { params: { show, days, store_id: storeId || undefined } });
      setBatches(data?.data || []);
      setSummary(data?.summary || null);
    } catch (error) {
      setLoadError(error.response?.data?.message || "Could not load expiry information.");
    } finally {
      setLoading(false);
    }
  }, [show, days, storeId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    http
      .get("/stores")
      .then(({ data }) => setStores(storesFor(user, Array.isArray(data) ? data : data?.data || []).sort((a, b) => String(a.name).localeCompare(String(b.name)))))
      .catch(() => setStores([]));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- the user is loaded before any page renders; the server checks stores too

  const openDispose = (batch) => {
    setToDispose(batch);
    setDisposeQty(String(batch.quantity));
    setDisposeError("");
  };

  const disposeQuantity = Number(disposeQty);
  const disposeValid = Number.isInteger(disposeQuantity) && disposeQuantity >= 1 && toDispose && disposeQuantity <= toDispose.quantity;

  const confirmDispose = async () => {
    if (!disposeValid) return;
    setDisposing(true);
    setDisposeError("");
    try {
      await http.post(`/stock-batches/${toDispose.id}/dispose`, { quantity: disposeQuantity });
      notify(
        "success",
        `${disposeQuantity} × ${toDispose.product?.name} removed from ${toDispose.store?.name}.`,
        "Disposed"
      );
      setToDispose(null);
      load();
    } catch (error) {
      const errors = error.response?.data?.errors;
      setDisposeError(errors?.quantity?.[0] || error.response?.data?.message || "Could not dispose of this stock.");
    } finally {
      setDisposing(false);
    }
  };

  return (
    <div className="pb-6 font-raleway">
      <Head>
        <title>Expiry - SellaPad</title>
      </Head>
      {toast && <Toast key={toast.id} toast={toast} onClose={() => setToast(null)} />}

      <InventoryNav />

      <div className="mt-4 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <SummaryTile title="Already expired" figures={summary?.expired} tone="border-l-red-600" />
          <SummaryTile title={`Expiring within ${summary?.days ?? days} days`} figures={summary?.expiring} tone="border-l-amber-500" />
        </div>

        <Panel
          title="Expiry"
          description="Stock recorded with an expiry date, soonest first. Value is at cost price. Sales take the soonest-expiring good stock first and skip expired stock."
          bodyClass=""
        >
          <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-gray-200">
            <label className="flex items-center gap-2">
              <span className={statLabelClass}>Show</span>
              <select value={show} onChange={(e) => setShow(e.target.value)} className="px-2 py-1.5 text-sm border border-gray-300">
                {SHOW_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className={statLabelClass}>Warn me</span>
              <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="px-2 py-1.5 text-sm border border-gray-300">
                {WINDOW_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option} days ahead</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className={statLabelClass}>Store</span>
              <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="px-2 py-1.5 text-sm border border-gray-300">
                <option value="">All stores</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </label>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 text-sm text-gray-500 py-14">
              <div className="w-5 h-5 border-2 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              Loading…
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center px-5 text-center py-14">
              <p className="text-sm font-medium text-gray-700">Couldn&apos;t load expiry information</p>
              <p className="mt-1 text-xs text-red-600">{loadError}</p>
              <button type="button" onClick={load} className={`${secondaryButtonClass} mt-4`}>Try Again</button>
            </div>
          ) : batches.length === 0 ? (
            <div className="flex flex-col items-center px-5 text-center py-14">
              <FaCalendarTimes className="mb-3 text-2xl text-gray-300" />
              <p className="text-sm font-medium text-gray-700">
                {show === "all" ? "No stock has an expiry date yet" : "Nothing needs attention"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Record expiry dates when adding stock on the Inventory page, or with the expiry_date column in the stock import.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr className="text-left">
                    <th className={`px-5 py-2.5 ${statLabelClass}`}>Product</th>
                    <th className={`px-3 py-2.5 ${statLabelClass}`}>Store</th>
                    <th className={`px-3 py-2.5 ${statLabelClass}`}>Batch</th>
                    <th className={`px-3 py-2.5 ${statLabelClass}`}>Expiry</th>
                    <th className={`px-3 py-2.5 text-right ${statLabelClass}`}>Units</th>
                    <th className={`px-3 py-2.5 text-right ${statLabelClass}`}>Value</th>
                    {canDispose && <th className={`px-5 py-2.5 text-right ${statLabelClass}`}>Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {batches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{batch.product?.name}</p>
                        {batch.product?.barcode && <p className="font-mono text-[11px] text-gray-500">{batch.product.barcode}</p>}
                      </td>
                      <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                        {batch.store?.name}
                        {batch.store?.type === "back_store" && <span className="ml-1 text-[11px] text-gray-500">(back store)</span>}
                      </td>
                      <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{batch.batch_number || "—"}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <p className="text-gray-900">{formatDate(batch.expiry_date)}</p>
                        <span className={`inline-block mt-0.5 px-1.5 py-px text-[10px] font-semibold ${STATUS_STYLE[batch.status] || ""}`}>
                          {describeDaysLeft(batch.days_left)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{batch.quantity}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{naira(batch.value)}</td>
                      {canDispose && (
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openDispose(batch)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-700 border border-red-200 hover:bg-red-50"
                          >
                            <FaTrash className="text-[10px]" />
                            Dispose
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      {toDispose && (
        <ModalShell
          title="Dispose of stock"
          subtitle={`${toDispose.product?.name} · ${toDispose.store?.name}`}
          icon={FaTrash}
          iconClass="bg-red-600"
          onClose={() => !disposing && setToDispose(null)}
          busy={disposing}
          maxWidth="max-w-md"
        >
          <div className="px-6 py-5 space-y-4 text-sm">
            {disposeError && (
              <div role="alert" className="flex items-start gap-3 px-4 py-3 text-red-800 border border-red-200 bg-red-50">
                <FaExclamationTriangle className="mt-0.5 shrink-0 text-red-600" />
                <span>{disposeError}</span>
              </div>
            )}
            <p className="text-gray-700">
              Batch {toDispose.batch_number || "without a number"}, {describeDaysLeft(toDispose.days_left).toLowerCase()} (
              {formatDate(toDispose.expiry_date)}). The units leave the store&apos;s stock and can&apos;t be sold.
            </p>
            <label className="block">
              <span className={statLabelClass}>Units to dispose of (up to {toDispose.quantity})</span>
              <input
                type="number"
                min="1"
                max={toDispose.quantity}
                step="1"
                value={disposeQty}
                onChange={(e) => setDisposeQty(e.target.value)}
                disabled={disposing}
                className="block w-32 px-3 py-2 mt-1 text-sm border border-gray-300 tabular-nums"
              />
            </label>
            {!disposeValid && <p className="text-xs text-red-600">Enter a whole number from 1 to {toDispose.quantity}.</p>}
          </div>
          <ModalFooter>
            <button type="button" onClick={() => setToDispose(null)} disabled={disposing} className={secondaryButtonClass}>Cancel</button>
            <button
              type="button"
              onClick={confirmDispose}
              disabled={disposing || !disposeValid}
              className="flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-none transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              {disposing ? <Spinner /> : <FaTrash className="mr-2 text-xs" />}
              {disposing ? "Disposing…" : `Dispose of ${Number.isInteger(disposeQuantity) && disposeQuantity > 0 ? disposeQuantity : ""} units`}
            </button>
          </ModalFooter>
        </ModalShell>
      )}
    </div>
  );
}
