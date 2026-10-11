// Every store side by side for a period, with an "All branches" total.
// Expenses and net profit are on the total only: expenses aren't recorded per branch.
import { useEffect, useState } from "react";
import http from "../../services/http";

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This week" },
  { value: "this_month", label: "This month" },
  { value: "this_quarter", label: "This quarter" },
  { value: "this_year", label: "This year" },
];

const naira = (value) =>
  `₦${Number(value || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const th = "px-3 py-2.5 text-[10px] font-semibold tracking-wide text-gray-500 uppercase whitespace-nowrap";

export default function BranchComparison() {
  const [period, setPeriod] = useState("this_month");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    http
      .get("/reports/branches", { params: { filter: period } })
      .then(({ data }) => !cancelled && setReport(data))
      .catch((err) => !cancelled && setError(err.response?.data?.message || "Could not load the branch comparison."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [period]);

  const unassigned = report?.unassigned;
  const hasUnassigned = unassigned && (unassigned.sales > 0 || unassigned.orders > 0);

  return (
    <section className="mt-8 bg-white shadow">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Branch comparison</h3>
          <p className="text-xs text-gray-500">Sales and gross profit per store, stock held at cost and at selling price.</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          aria-label="Period"
          className="px-2 py-1.5 text-sm border border-gray-300"
        >
          {PERIODS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="px-5 py-10 text-sm text-center text-gray-500">Loading…</p>
      ) : error ? (
        <p className="px-5 py-10 text-sm text-center text-red-600">{error}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left border-b border-gray-200 bg-gray-50">
              <tr>
                <th className={`${th} pl-5`}>Store</th>
                <th className={`${th} text-right`}>Sales</th>
                <th className={`${th} text-right`}>Cost of goods</th>
                <th className={`${th} text-right`}>Gross profit</th>
                <th className={`${th} text-right`}>Orders</th>
                <th className={`${th} text-right`}>Units sold</th>
                <th className={`${th} text-right`}>Stock at cost</th>
                <th className={`${th} text-right pr-5`}>Stock at price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 tabular-nums">
              {report.stores.map((row) => (
                <tr key={row.store.id}>
                  <td className="py-2.5 pl-5 pr-3 text-gray-900 whitespace-nowrap">
                    {row.store.name}
                    {row.store.type === "back_store" && <span className="ml-1 text-[11px] text-gray-500">(back store)</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right">{naira(row.sales)}</td>
                  <td className="px-3 py-2.5 text-right text-gray-600">{naira(row.cost_of_goods)}</td>
                  <td className={`px-3 py-2.5 text-right ${row.gross_profit < 0 ? "text-red-600" : ""}`}>{naira(row.gross_profit)}</td>
                  <td className="px-3 py-2.5 text-right">{row.orders}</td>
                  <td className="px-3 py-2.5 text-right">{row.units_sold}</td>
                  <td className="px-3 py-2.5 text-right text-gray-600">{naira(row.stock_at_cost)}</td>
                  <td className="py-2.5 pl-3 pr-5 text-right text-gray-600">{naira(row.stock_at_price)}</td>
                </tr>
              ))}
              {hasUnassigned && (
                <tr className="text-gray-500">
                  <td className="py-2.5 pl-5 pr-3 italic">Older sales (no store recorded)</td>
                  <td className="px-3 py-2.5 text-right">{naira(unassigned.sales)}</td>
                  <td className="px-3 py-2.5 text-right">{naira(unassigned.cost_of_goods)}</td>
                  <td className="px-3 py-2.5 text-right">{naira(unassigned.gross_profit)}</td>
                  <td className="px-3 py-2.5 text-right">{unassigned.orders}</td>
                  <td className="px-3 py-2.5 text-right">{unassigned.units_sold}</td>
                  <td className="px-3 py-2.5 text-right">—</td>
                  <td className="py-2.5 pl-3 pr-5 text-right">—</td>
                </tr>
              )}
            </tbody>
            <tfoot className="font-semibold border-t-2 border-gray-300 bg-gray-50 tabular-nums">
              <tr>
                <td className="py-2.5 pl-5 pr-3">All branches</td>
                <td className="px-3 py-2.5 text-right">{naira(report.total.sales)}</td>
                <td className="px-3 py-2.5 text-right">{naira(report.total.cost_of_goods)}</td>
                <td className="px-3 py-2.5 text-right">{naira(report.total.gross_profit)}</td>
                <td className="px-3 py-2.5 text-right">{report.total.orders}</td>
                <td className="px-3 py-2.5 text-right">{report.total.units_sold}</td>
                <td className="px-3 py-2.5 text-right">{naira(report.total.stock_at_cost)}</td>
                <td className="py-2.5 pl-3 pr-5 text-right">{naira(report.total.stock_at_price)}</td>
              </tr>
              <tr className="font-normal text-gray-700">
                <td className="py-2 pl-5 pr-3" colSpan={3}>Expenses (all branches)</td>
                <td className="px-3 py-2 text-right">− {naira(report.total.expenses)}</td>
                <td colSpan={4} />
              </tr>
              <tr>
                <td className="py-2.5 pl-5 pr-3" colSpan={3}>Net profit (all branches)</td>
                <td className={`px-3 py-2.5 text-right ${report.total.net_profit < 0 ? "text-red-600" : "text-green-700"}`}>
                  {naira(report.total.net_profit)}
                </td>
                <td colSpan={4} />
              </tr>
            </tfoot>
          </table>
          <p className="px-5 py-3 text-[11px] text-gray-500 border-t border-gray-100">
            An order with items from two stores counts once in the total. Expenses aren&apos;t recorded per branch, so net
            profit is for the whole business.
          </p>
        </div>
      )}
    </section>
  );
}
