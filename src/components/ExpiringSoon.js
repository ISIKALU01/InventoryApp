// Dashboard section: products about to expire, like an alarm.
// The look-ahead window (40, 80, 120… days) is picked here and remembered
// per browser. Only for users who may see stock levels.
import { useEffect, useState } from "react";
import Link from "next/link";
import { FaBell, FaCalendarCheck } from "react-icons/fa";
import http from "../../services/http";
import { useAuth } from "../context/AuthContext";
import {
  DASHBOARD_EXPIRY_DEFAULT,
  DASHBOARD_EXPIRY_WINDOWS,
  describeDaysLeft,
  expiryUrgency,
} from "../../utils/expiry";

const STORAGE_KEY = "dashboard.expiryWindow";
const ROWS_SHOWN = 8;

const naira = (value) =>
  `₦${Number(value || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });

const URGENCY_BADGE = {
  critical: "text-red-700 bg-red-100",
  soon: "text-amber-800 bg-amber-100",
  later: "text-yellow-800 bg-yellow-50",
};

const readSavedWindow = () => {
  try {
    const saved = Number(window.localStorage.getItem(STORAGE_KEY));
    return DASHBOARD_EXPIRY_WINDOWS.includes(saved) ? saved : DASHBOARD_EXPIRY_DEFAULT;
  } catch {
    return DASHBOARD_EXPIRY_DEFAULT;
  }
};

// storeId: one branch, or empty for all
export default function ExpiringSoon({ storeId = "", className = "" }) {
  const { can } = useAuth();
  const allowed = can("inventory.view");
  const [days, setDays] = useState(DASHBOARD_EXPIRY_DEFAULT);
  const [batches, setBatches] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // localStorage only exists in the browser, so read it after the first render
  useEffect(() => setDays(readSavedWindow()), []);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    http
      .get("/stock-batches", { params: { show: "expiring", days, store_id: storeId || undefined } })
      .then(({ data }) => {
        if (cancelled) return;
        setBatches(data?.data || []);
        setSummary(data?.summary?.expiring || null);
      })
      .catch(() => !cancelled && setFailed(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [allowed, days, storeId]);

  const changeWindow = (value) => {
    setDays(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // not saved; the filter still works for this visit
    }
  };

  if (!allowed) return null;

  const units = summary?.units || 0;
  const criticalCount = batches.filter((batch) => expiryUrgency(batch.days_left) === "critical").length;
  const alarming = units > 0;

  return (
    <section
      className={`bg-white shadow-md rounded-lg overflow-hidden border-t-4 ${
        criticalCount ? "border-red-500" : alarming ? "border-amber-400" : "border-green-500"
      } ${className}`}
      aria-labelledby="expiring-soon-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span
            className={`relative flex items-center justify-center w-10 h-10 rounded-full ${
              criticalCount ? "bg-red-100 text-red-600" : alarming ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"
            }`}
          >
            {alarming ? <FaBell className={criticalCount ? "animate-pulse" : ""} /> : <FaCalendarCheck />}
            {criticalCount > 0 && (
              <span className="absolute -top-1 -right-1 flex w-3 h-3">
                <span className="absolute inline-flex w-full h-full bg-red-400 rounded-full opacity-75 animate-ping"></span>
                <span className="relative inline-flex w-3 h-3 bg-red-500 rounded-full"></span>
              </span>
            )}
          </span>
          <div>
            <h2 id="expiring-soon-title" className="text-lg font-semibold text-gray-900">Expiring soon</h2>
            <p className="text-xs text-gray-500">Products that expire within the next {days} days, soonest first</p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          Expiring in
          <select
            value={days}
            onChange={(e) => changeWindow(Number(e.target.value))}
            className="px-2 py-1 text-sm text-black border border-gray-300 rounded-md"
          >
            {DASHBOARD_EXPIRY_WINDOWS.map((option) => (
              <option key={option} value={option}>
                {option} days
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="py-10 text-sm text-center text-gray-500">Loading…</p>
      ) : failed ? (
        <p className="py-10 text-sm text-center text-red-600">Couldn&apos;t load expiring products.</p>
      ) : !alarming ? (
        <div className="flex flex-col items-center py-10 text-center">
          <FaCalendarCheck className="mb-2 text-2xl text-green-500" />
          <p className="text-sm font-medium text-gray-700">Nothing expires in the next {days} days</p>
          <p className="mt-1 text-xs text-gray-500">Pick a longer window to look further ahead.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-3 bg-amber-50/40">
            <div>
              <p className="text-xs text-gray-500 uppercase">Value at cost</p>
              <p className="text-xl font-bold text-amber-700 tabular-nums">{naira(summary.value)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Units</p>
              <p className="text-xl font-bold text-gray-900 tabular-nums">{units.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Within 7 days</p>
              <p className={`text-xl font-bold tabular-nums ${criticalCount ? "text-red-600" : "text-gray-900"}`}>
                {criticalCount} batch{criticalCount === 1 ? "" : "es"}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-left text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-5 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium">Store</th>
                  <th className="px-3 py-2 font-medium">Batch</th>
                  <th className="px-3 py-2 font-medium">Expiry date</th>
                  <th className="px-3 py-2 font-medium text-right">Qty</th>
                  <th className="px-3 py-2 font-medium text-right">Value</th>
                  <th className="px-5 py-2 font-medium">Time left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {batches.slice(0, ROWS_SHOWN).map((batch) => (
                  <tr key={batch.id} className="text-gray-800">
                    <td className="px-5 py-2 font-medium">{batch.product?.name || "—"}</td>
                    <td className="px-3 py-2 text-gray-600">{batch.store?.name || "—"}</td>
                    <td className="px-3 py-2 text-gray-600">{batch.batch_number || "—"}</td>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{formatDate(batch.expiry_date)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{batch.quantity}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{naira(batch.value)}</td>
                    <td className="px-5 py-2">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${
                          URGENCY_BADGE[expiryUrgency(batch.days_left)]
                        }`}
                      >
                        {describeDaysLeft(batch.days_left)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-5 py-3 text-sm border-t border-gray-100">
            <span className="text-gray-500">
              {batches.length > ROWS_SHOWN
                ? `Showing ${ROWS_SHOWN} of ${batches.length} batches`
                : `${batches.length} batch${batches.length === 1 ? "" : "es"}`}
            </span>
            <Link
              href={{ pathname: "/inventory/expiry", query: { show: "expiring", days, ...(storeId ? { store_id: storeId } : {}) } }}
              className="font-semibold text-indigo-600 hover:underline"
            >
              View all on the Expiry page
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
