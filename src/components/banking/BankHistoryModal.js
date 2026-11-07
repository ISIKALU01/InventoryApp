// A bank's credit/debit history, like a statement: card sales credited from
// the store card machines, manual entries and balance edits, each with the
// balance straight after it. From GET /bank-accounts/{id}/history.
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  History,
} from "lucide-react";

import { bankAPI } from "../../../services/api";
import {
  Badge,
  EmptyState,
  FilterSelect,
  LoadingState,
  ModalShell,
  formatNaira,
  secondaryButtonClass,
  statLabelClass,
  toDate,
} from "../ui/Boxy";

const SOURCE_BADGE = {
  pos_payment: "text-blue-700 bg-blue-50",
  manual: "text-gray-700 bg-gray-100",
  adjustment: "text-amber-800 bg-amber-50",
};

const when = (value) =>
  toDate(value)?.toLocaleString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }) || "—";

export default function BankHistoryModal({ bank, onClose }) {
  const [filters, setFilters] = useState({
    type: "",
    source: "",
    from: "",
    to: "",
  });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setResult(
        await bankAPI.getHistory(bank.id, { ...filters, page, per_page: 20 }),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [bank.id, filters, page]);

  useEffect(() => {
    load();
  }, [load]);

  const setFilter = (key, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const lines = result?.data || [];
  const meta = result?.meta;
  const summary = result?.summary;
  const balance = result?.bank_account?.balance ?? bank.balance;

  let body;
  if (loading && !result) {
    body = <LoadingState label="Loading history…" />;
  } else if (error) {
    body = (
      <EmptyState
        icon={AlertTriangle}
        tone="red"
        title="Couldn't load the history"
        hint={error}
        action={
          <button onClick={load} className={secondaryButtonClass}>
            Try again
          </button>
        }
      />
    );
  } else if (lines.length === 0) {
    body = (
      <EmptyState
        icon={History}
        title="Nothing here yet"
        hint="Card sales on machines that settle to this bank show here as soon as the card is paid."
      />
    );
  } else {
    body = (
      <ul className={`divide-y divide-gray-100 ${loading ? "opacity-60" : ""}`}>
        {lines.map((line) => {
          const credit = line.type === "credit";
          return (
            <li key={line.id} className="flex items-start gap-3 px-5 py-3">
              <div
                className={`mt-0.5 flex items-center justify-center w-8 h-8 shrink-0 ${credit ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}
              >
                {credit ? (
                  <ArrowDownLeft size={16} />
                ) : (
                  <ArrowUpRight size={16} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {line.description || line.source_label}
                </p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5 text-xs text-gray-500">
                  <Badge
                    className={SOURCE_BADGE[line.source] || SOURCE_BADGE.manual}
                  >
                    {line.source_label}
                  </Badge>
                  <span>{when(line.created_at)}</span>
                  {line.reference && (
                    <span className="font-mono">{line.reference}</span>
                  )}
                  {line.sale?.order_id && (
                    <span>Sale #{line.sale.order_id}</span>
                  )}
                  {line.sale?.card && <span>{line.sale.card}</span>}
                  {line.created_by && <span>by {line.created_by.name}</span>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p
                  className={`text-sm font-semibold ${credit ? "text-green-700" : "text-red-600"}`}
                >
                  {credit ? "+" : "−"}
                  {formatNaira(line.amount)}
                </p>
                <p className="text-xs text-gray-500">
                  {line.balance_after != null
                    ? `Bal. ${formatNaira(line.balance_after)}`
                    : "—"}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ModalShell
      title="Bank history"
      subtitle={`${bank.bank_name} · ${bank.account_number}`}
      icon={History}
      onClose={onClose}
      maxWidth="max-w-3xl"
    >
      <div className="grid grid-cols-3 border-b border-gray-200 divide-x divide-gray-200">
        {[
          ["Balance now", formatNaira(balance), "text-gray-900"],
          [
            "Money in",
            summary ? formatNaira(summary.credits) : "—",
            "text-green-700",
          ],
          [
            "Money out",
            summary ? formatNaira(summary.debits) : "—",
            "text-red-600",
          ],
        ].map(([label, value, tone]) => (
          <div key={label} className="px-5 py-3">
            <p className={statLabelClass}>{label}</p>
            <p className={`mt-1 text-sm font-bold truncate ${tone}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-gray-200 bg-gray-50">
        <FilterSelect
          value={filters.type}
          onChange={(e) => setFilter("type", e.target.value)}
          aria-label="Money in or out"
        >
          <option value="">In and out</option>
          <option value="credit">Money in</option>
          <option value="debit">Money out</option>
        </FilterSelect>
        <FilterSelect
          value={filters.source}
          onChange={(e) => setFilter("source", e.target.value)}
          aria-label="Kind of entry"
        >
          <option value="">All entries</option>
          <option value="pos_payment">Card sales</option>
          <option value="manual">Manual entries</option>
          <option value="adjustment">Balance edits</option>
        </FilterSelect>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFilter("from", e.target.value)}
          aria-label="From"
          className="px-2 py-1.5 text-sm border border-gray-300"
        />
        <span className="text-xs text-gray-500">to</span>
        <input
          type="date"
          value={filters.to}
          onChange={(e) => setFilter("to", e.target.value)}
          aria-label="To"
          className="px-2 py-1.5 text-sm border border-gray-300"
        />
      </div>

      <div className="max-h-[55vh] overflow-y-auto">{body}</div>

      {meta && meta.total > 0 && (
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-gray-200 bg-gray-50">
          <span className="text-xs text-gray-500">
            {meta.total} {meta.total === 1 ? "entry" : "entries"}
          </span>
          {meta.last_page > 1 && (
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1 || loading}
                aria-label="Previous page"
                className="flex items-center justify-center w-8 h-8 bg-white border border-gray-300 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="flex items-center h-8 px-3 text-xs font-medium text-gray-700 bg-white border-gray-300 border-y">
                Page {meta.current_page} of {meta.last_page}
              </span>
              <button
                type="button"
                onClick={() => setPage(page + 1)}
                disabled={page >= meta.last_page || loading}
                aria-label="Next page"
                className="flex items-center justify-center w-8 h-8 bg-white border border-gray-300 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </ModalShell>
  );
}
