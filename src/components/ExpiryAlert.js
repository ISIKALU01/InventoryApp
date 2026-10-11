// Banner shown when stock has expired or expires within the warning window.
// Only for users who may see stock levels; renders nothing otherwise.
import { useEffect, useState } from "react";
import Link from "next/link";
import { FaCalendarTimes } from "react-icons/fa";
import http from "../../services/http";
import { useAuth } from "../context/AuthContext";

const naira = (value) =>
  `₦${Number(value || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ExpiryAlert({ className = "" }) {
  const { can } = useAuth();
  const allowed = can("inventory.view");
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    http
      .get("/stock-batches", { params: { show: "attention" } })
      .then(({ data }) => !cancelled && setSummary(data?.summary || null))
      .catch(() => {}); // the banner is extra; the page works without it
    return () => {
      cancelled = true;
    };
  }, [allowed]);

  const expired = summary?.expired?.units || 0;
  const expiring = summary?.expiring?.units || 0;
  if (!allowed || (expired === 0 && expiring === 0)) return null;

  const parts = [];
  if (expired) parts.push(`${expired} unit${expired === 1 ? " has" : "s have"} expired (${naira(summary.expired.value)})`);
  if (expiring) parts.push(`${expiring} expire within ${summary.days} days (${naira(summary.expiring.value)})`);

  return (
    <div
      role="status"
      className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm border ${
        expired ? "text-red-800 border-red-200 bg-red-50" : "text-amber-800 border-amber-200 bg-amber-50"
      } ${className}`}
    >
      <span className="flex items-center gap-2">
        <FaCalendarTimes className="shrink-0" />
        {parts.join(" · ")}
      </span>
      <Link href="/inventory/expiry" className="font-semibold underline whitespace-nowrap">
        View expiry
      </Link>
    </div>
  );
}
