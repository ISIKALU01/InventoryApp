// Stock Ledger: every rise and fall in a store's stock, with why, what caused
// it, who did it and the stock left after it. "Check ledger" confirms the
// ledger still adds up to the stock everywhere.
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Download, History, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import InventoryNav from "../../components/InventoryNav";
import http from "../../../services/http";
import {
  EmptyState,
  ErrorBox,
  FilterSelect,
  LoadingState,
  PageTitle,
  PanelHeader,
  filterFieldClass,
  formatDay,
  secondaryButtonClass,
  statLabelClass,
  toList,
  toolbarButtonClass,
} from "../../components/ui/Boxy";

const REASONS = [
  ["opening_balance", "Opening balance"],
  ["opening_stock", "New stock record"],
  ["stock_count", "Stock count / correction"],
  ["received", "Stock received"],
  ["goods_received", "Goods received (GRN)"],
  ["sale", "Sale"],
  ["sale_edited", "Sale edited"],
  ["sale_deleted", "Sale deleted"],
  ["transfer_out", "Transfer out"],
  ["transfer_in", "Transfer in"],
  ["returned_to_supplier", "Returned to supplier"],
  ["expired_disposed", "Expired, disposed of"],
  ["record_deleted", "Stock record deleted"],
];

const errorText = (err, fallback) => err.response?.data?.message || fallback;
const todayIso = () => new Date().toISOString().slice(0, 10);
const timeOf = (value) => (value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");

const csvCell = (value) => {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export default function StockLedger() {
  const [moves, setMoves] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [productId, setProductId] = useState("");
  const [storeId, setStoreId] = useState("");
  const [reason, setReason] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [check, setCheck] = useState(null);
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { data } = await http.get("/stock-movements", {
        params: { page, product_id: productId || undefined, store_id: storeId || undefined, reason: reason || undefined, from: from || undefined, to: to || undefined },
      });
      setMoves(toList(data));
      setLastPage(Number(data?.last_page) || 1);
      setTotal(Number(data?.total) || 0);
    } catch (err) {
      setLoadError(errorText(err, "Could not load the stock ledger."));
    } finally {
      setLoading(false);
    }
  }, [page, productId, storeId, reason, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    Promise.all([http.get("/products"), http.get("/stores")])
      .then(([p, s]) => {
        setProducts(toList(p.data).sort((a, b) => String(a.name).localeCompare(String(b.name))));
        setStores(toList(s.data).sort((a, b) => String(a.name).localeCompare(String(b.name))));
      })
      .catch(() => {});
  }, []);

  const runCheck = async () => {
    setChecking(true);
    try {
      const { data } = await http.get("/stock-movements/check");
      setCheck(data);
    } catch (err) {
      setCheck({ error: errorText(err, "Could not check the ledger.") });
    } finally {
      setChecking(false);
    }
  };

  const filter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const exportCsv = () => {
    const headers = ["Date", "Time", "Product", "SKU", "Store", "Change", "Stock after", "Reason", "Reference", "Note", "By"];
    const rows = moves.map((m) => [
      m.at?.slice(0, 10), timeOf(m.at), m.product?.name, m.product?.sku, m.store?.name, m.change, m.quantity_after,
      m.reason_label, m.reference?.label, m.note, m.by?.name,
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const url = window.URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `stock-ledger-${todayIso()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="pt-0 mt-0 font-raleway">
      <PageTitle title="Stock Ledger" description="Every rise and fall in stock: sales, deliveries, transfers, returns, counts and expired stock" />
      <InventoryNav />

      {check && (
        <div className="mt-5">
          {check.error ? (
            <ErrorBox title="Check failed" message={check.error} />
          ) : check.mismatches.length === 0 ? (
            <p className="flex items-center gap-2 px-4 py-3 text-green-800 border border-green-200 bg-green-50">
              <CheckCircle2 size={16} /> All {check.checked} stock records match the ledger.
            </p>
          ) : (
            <div className="px-4 py-3 border border-red-200 bg-red-50">
              <p className="font-semibold text-red-800">{check.mismatches.length} stock records don&apos;t match the ledger</p>
              <ul className="mt-1 text-sm text-red-800 list-disc list-inside">
                {check.mismatches.map((m) => (
                  <li key={`${m.product?.id}-${m.store?.id}`}>
                    {m.product?.name} in {m.store?.name}: stock {m.stock}, ledger {m.ledger} ({m.difference > 0 ? "+" : ""}{m.difference})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <section className="mt-5 bg-white border border-gray-200">
        <PanelHeader title="Movements" meta={loading ? "Loading…" : `${total} in total`}>
          <button onClick={runCheck} disabled={checking} className={toolbarButtonClass.secondary}>
            {checking ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
            Check ledger
          </button>
          <button onClick={exportCsv} disabled={moves.length === 0} className={toolbarButtonClass.secondary}>
            <Download size={13} />
            Export CSV
          </button>
          <button onClick={load} disabled={loading} className={toolbarButtonClass.secondary}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </PanelHeader>

        <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-gray-200">
          <FilterSelect value={productId} onChange={filter(setProductId)} aria-label="Product">
            <option value="">All products</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </FilterSelect>
          <FilterSelect value={storeId} onChange={filter(setStoreId)} aria-label="Store">
            <option value="">All stores</option>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </FilterSelect>
          <FilterSelect value={reason} onChange={filter(setReason)} aria-label="Reason">
            <option value="">Every reason</option>
            {REASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </FilterSelect>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            From <input type="date" value={from} max={to || undefined} onChange={filter(setFrom)} className={filterFieldClass} aria-label="From date" />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            To <input type="date" value={to} min={from || undefined} onChange={filter(setTo)} className={filterFieldClass} aria-label="To date" />
          </label>
        </div>

        {loading && moves.length === 0 ? (
          <LoadingState label="Loading the stock ledger…" />
        ) : loadError ? (
          <EmptyState icon={History} tone="red" title="Couldn't load the stock ledger" hint={loadError} action={<button onClick={load} className={secondaryButtonClass}>Try again</button>} />
        ) : moves.length === 0 ? (
          <EmptyState icon={History} title="No movements match" hint="Every sale, delivery, transfer, return and stock count appears here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-sm">
              <thead className="text-left bg-gray-50">
                <tr>
                  <th className={`px-4 py-2 ${statLabelClass}`}>When</th>
                  <th className={`px-3 py-2 ${statLabelClass}`}>Product</th>
                  <th className={`px-3 py-2 ${statLabelClass}`}>Store</th>
                  <th className={`px-3 py-2 text-right ${statLabelClass}`}>Change</th>
                  <th className={`px-3 py-2 text-right ${statLabelClass}`}>Stock after</th>
                  <th className={`px-3 py-2 ${statLabelClass}`}>Reason</th>
                  <th className={`px-3 py-2 ${statLabelClass}`}>By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {moves.map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{formatDay(m.at)} <span className="text-xs text-gray-500">{timeOf(m.at)}</span></td>
                    <td className="px-3 py-2 text-gray-900">{m.product?.name}</td>
                    <td className="px-3 py-2 text-gray-700">{m.store?.name}</td>
                    <td className={`px-3 py-2 text-right font-semibold tabular-nums ${m.change > 0 ? "text-green-700" : "text-red-700"}`}>{m.change > 0 ? `+${m.change}` : m.change}</td>
                    <td className="px-3 py-2 text-right text-gray-900 tabular-nums">{m.quantity_after}</td>
                    <td className="px-3 py-2 text-gray-800">
                      {m.reason_label}
                      {(m.reference?.label || m.note) && (
                        <span className="block text-xs text-gray-500">{[m.reference?.label, m.note].filter(Boolean).join(" · ")}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-700">{m.by?.name || "—"}</td>
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
    </div>
  );
}
