// Store Requisitions: a store asks for stock to be bought; procurement
// approves or rejects; approved requests become purchase orders.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { storesFor } from "../../../utils/permissions";
import { CheckCircle2, ClipboardList, History, List, Loader2, Pencil, Plus, RefreshCw, Search, Trash2, X, XCircle } from "lucide-react";
import PurchasingNav from "../../components/PurchasingNav";
import ProductPicker from "../../components/ProductPicker";
import http from "../../../services/http";
import { useAuth } from "../../context/AuthContext";
import { findProductByCode } from "../../../utils/barcode";
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
  dangerButtonClass,
  fieldClass,
  formatDay,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  statLabelClass,
  toList,
  toolbarButtonClass,
  useToast,
} from "../../components/ui/Boxy";

const STATUS_OPTIONS = [
  { value: "", label: "All requisitions" },
  { value: "pending", label: "Waiting for approval" },
  { value: "approved", label: "Approved" },
  { value: "ordered", label: "Ordered" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_BADGE = {
  pending: "text-amber-800 bg-amber-50",
  approved: "text-green-800 bg-green-50",
  ordered: "text-blue-800 bg-blue-50",
  rejected: "text-red-700 bg-red-50",
  cancelled: "text-gray-600 bg-gray-100",
};

const errorText = (err, fallback) => err.response?.data?.message || fallback;

const formatWhen = (value) =>
  value ? new Date(value).toLocaleString([], { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—";

const daysLabel = (days) => (days === null || days === undefined ? "no recent sales" : days === 0 ? "runs out today" : `~${days} days left`);

const StatusBadge = ({ request }) => (
  <Badge className={STATUS_BADGE[request.status] || "text-gray-700 bg-gray-100"}>{request.status_label}</Badge>
);

// ---------------------------------------------------------------------------
// New / edit
// ---------------------------------------------------------------------------

const RequisitionForm = ({ stores, products, existing, onClose, onSaved }) => {
  const [storeId, setStoreId] = useState(existing ? String(existing.store.id) : String(stores.find((s) => s.type !== "back_store")?.id ?? stores[0]?.id ?? ""));
  const [lines, setLines] = useState(
    existing ? existing.items.map((item) => ({ product: item.product, quantity: String(item.quantity) })) : []
  );
  const [note, setNote] = useState(existing?.note || "");
  const [query, setQuery] = useState("");
  const [insights, setInsights] = useState({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [browsing, setBrowsing] = useState(false);
  const searchRef = useRef(null);

  // Stock and 30-day sales of every product in the chosen store
  useEffect(() => {
    if (!storeId) return;
    http
      .get("/purchase-requests/insights", { params: { store_id: storeId } })
      .then(({ data }) => setInsights(Object.fromEntries(toList(data).map((row) => [row.product_id, row]))))
      .catch(() => setInsights({}));
  }, [storeId]);

  const info = (productId) => insights[productId] || { stock: 0, sold_last_30_days: 0, days_of_stock: null };

  const available = useMemo(() => products.filter((p) => !lines.some((line) => line.product.id === p.id)), [products, lines]);

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return available.filter((p) => [p.name, p.sku, p.barcode].some((v) => String(v || "").toLowerCase().includes(term))).slice(0, 8);
  }, [available, query]);

  // Running low first: products the store sells, with the fewest days of stock
  const suggestions = useMemo(
    () =>
      available
        .filter((p) => info(p.id).days_of_stock !== null && info(p.id).days_of_stock <= 14)
        .sort((a, b) => info(a.id).days_of_stock - info(b.id).days_of_stock)
        .slice(0, 6),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- info reads insights
    [available, insights]
  );

  const addLine = (product) => {
    setMessage("");
    setQuery("");
    setLines((prev) => [...prev, { product, quantity: "" }]);
    searchRef.current?.focus();
  };

  // Several products ticked in "Browse products"
  const addPicked = (picked) => {
    setMessage("");
    setLines((prev) => [...prev, ...picked.filter((p) => !prev.some((line) => line.product.id === p.id)).map((product) => ({ product, quantity: "" }))]);
    setBrowsing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const exact = findProductByCode(available, query);
    if (exact) return addLine(exact);
    if (matches.length === 1) return addLine(matches[0]);
    const listed = findProductByCode(products, query);
    if (listed) setMessage(`${listed.name} is already on the list.`);
    else if (query.trim()) setMessage(`No product matches "${query.trim()}".`);
  };

  const quantityOk = (line) => /^\d+$/.test(line.quantity) && Number(line.quantity) >= 1;
  const canSave = storeId && lines.length > 0 && lines.every(quantityOk) && !saving;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError("");
    const body = {
      store_id: Number(storeId),
      note: note.trim() || null,
      items: lines.map((line) => ({ product_id: line.product.id, quantity: Number(line.quantity) })),
    };
    try {
      const { data } = existing ? await http.put(`/purchase-requests/${existing.id}`, body) : await http.post("/purchase-requests", body);
      onSaved(data, Boolean(existing));
    } catch (err) {
      setError(errorText(err, "Could not save the requisition."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={existing ? `Edit ${existing.reference}` : "New Requisition"}
      subtitle="Ask for stock to be bought for a store"
      icon={ClipboardList}
      onClose={onClose}
      busy={saving}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={submit}>
        <div className="px-6 py-5 space-y-4 text-sm">
          {error && <ErrorBox title="Not saved" message={error} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="req-store" className={labelClass}>Store needing the stock</label>
              <select
                id="req-store"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                disabled={saving || Boolean(existing)}
                className={fieldClass()}
              >
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name} {store.type === "back_store" ? "(back store)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="req-note" className={labelClass}>Note <span className="font-normal text-gray-400 normal-case">(optional)</span></label>
              <input id="req-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} disabled={saving} placeholder="e.g. Weekend promo" className={fieldClass()} />
            </div>
          </div>

          <div className="relative">
            <label htmlFor="req-search" className={labelClass}>Add products</label>
            <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
              <input
                id="req-search"
                ref={searchRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setMessage("");
                }}
                onKeyDown={handleKeyDown}
                disabled={saving}
                autoComplete="off"
                placeholder="Scan a barcode, or type a name or SKU"
                className={`${fieldClass()} pl-8`}
              />
            </div>
            <button type="button" onClick={() => setBrowsing(true)} disabled={saving} title="Browse products" aria-label="Browse products" className="flex items-center justify-center w-11 shrink-0 text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 hover:text-blue-700 disabled:opacity-50">
              <List size={16} />
            </button>
            </div>
            {matches.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 overflow-y-auto bg-white border border-gray-200 shadow-lg max-h-64">
                {matches.map((product) => (
                  <li key={product.id}>
                    <button type="button" onClick={() => addLine(product)} className="flex items-center justify-between w-full gap-3 px-3 py-2 text-left hover:bg-blue-50">
                      <span className="text-sm text-gray-900 truncate">{product.name}</span>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {info(product.id).stock} in stock · {daysLabel(info(product.id).days_of_stock)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {message && <p className="mt-1 text-xs text-red-600">{message}</p>}
          </div>

          {suggestions.length > 0 && (
            <div>
              <p className={`${statLabelClass} mb-1`}>Running low in this store</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addLine(product)}
                    className="px-2 py-1 text-xs border text-amber-800 border-amber-200 bg-amber-50 hover:bg-amber-100"
                  >
                    + {product.name} ({daysLabel(info(product.id).days_of_stock)})
                  </button>
                ))}
              </div>
            </div>
          )}

          {lines.length === 0 ? (
            <p className="px-4 py-6 text-center text-gray-500 border border-dashed border-gray-300">No products yet. Scan or search above.</p>
          ) : (
            <div className="overflow-x-auto border border-gray-200">
              <table className="w-full">
                <thead className="text-left bg-gray-50">
                  <tr>
                    <th className={`px-3 py-2 ${statLabelClass}`}>Product</th>
                    <th className={`px-3 py-2 text-right ${statLabelClass}`}>In stock</th>
                    <th className={`px-3 py-2 text-right ${statLabelClass}`}>Sold (30 days)</th>
                    <th className={`px-3 py-2 ${statLabelClass}`}>Lasts</th>
                    <th className={`px-3 py-2 ${statLabelClass}`}>Request</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 tabular-nums">
                  {lines.map((line) => {
                    const figures = info(line.product.id);
                    return (
                      <tr key={line.product.id}>
                        <td className="px-3 py-2 text-gray-900">{line.product.name}</td>
                        <td className="px-3 py-2 text-right">{figures.stock}</td>
                        <td className="px-3 py-2 text-right">{figures.sold_last_30_days}</td>
                        <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">{daysLabel(figures.days_of_stock)}</td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={line.quantity}
                            onChange={(e) => setLines((prev) => prev.map((l) => (l.product.id === line.product.id ? { ...l, quantity: e.target.value } : l)))}
                            disabled={saving}
                            aria-label={`Units of ${line.product.name}`}
                            placeholder="Units"
                            className={`${fieldClass(line.quantity !== "" && !quantityOk(line))} w-24`}
                          />
                        </td>
                        <td className="px-1">
                          <button
                            type="button"
                            onClick={() => setLines((prev) => prev.filter((l) => l.product.id !== line.product.id))}
                            className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-red-600"
                            aria-label={`Remove ${line.product.name}`}
                          >
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <ModalFooter>
          <button type="button" onClick={onClose} disabled={saving} className={secondaryButtonClass}>Cancel</button>
          <button type="submit" disabled={!canSave} className={primaryButtonClass}>
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Saving…" : existing ? "Save changes" : "Send for approval"}
          </button>
        </ModalFooter>
      </form>
      {browsing && (
        <ProductPicker
          products={products}
          stores={stores}
          storeId={storeId}
          addedIds={lines.map((line) => line.product.id)}
          onAdd={addPicked}
          onClose={() => setBrowsing(false)}
        />
      )}
    </ModalShell>
  );
};

// ---------------------------------------------------------------------------
// Details, decision, history
// ---------------------------------------------------------------------------

const DetailsModal = ({ request, canApprove, isMine, isAdmin, onClose, onChanged, onEdit }) => {
  const [history, setHistory] = useState(null);
  const [mode, setMode] = useState(null); // "approve" | "reject" | "cancel"
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    http
      .get(`/purchase-requests/${request.id}/history`)
      .then(({ data }) => setHistory(toList(data)))
      .catch(() => setHistory([]));
  }, [request.id, request.status]);

  const pending = request.status === "pending";
  const canDecide = canApprove && pending && !isMine;
  const canChange = (isMine || isAdmin) && pending;
  const canCancel = (isMine || isAdmin) && ["pending", "approved"].includes(request.status);

  const act = async () => {
    if (mode === "reject" && !text.trim()) {
      setError("Say why, so the store knows what to do instead.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const url = `/purchase-requests/${request.id}/${mode}`;
      const body = mode === "approve" ? { note: text.trim() || null } : mode === "reject" ? { reason: text.trim() } : {};
      const { data } = await http.post(url, body);
      onChanged(data, mode);
      setMode(null);
      setText("");
    } catch (err) {
      setError(errorText(err, "That didn't work. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title={request.reference} subtitle={`${request.store?.name} · ${request.status_label}`} icon={ClipboardList} onClose={onClose} busy={busy} maxWidth="max-w-3xl">
      <div className="px-6 py-5 space-y-5 text-sm">
        {error && <ErrorBox title="Not done" message={error} />}

        <dl className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200 sm:grid-cols-4">
          {[
            ["Status", <StatusBadge key="s" request={request} />],
            ["Requested by", `${request.requested_by?.name || "—"}, ${formatWhen(request.requested_at)}`],
            ["Decided by", request.decided_by ? `${request.decided_by.name}, ${formatWhen(request.decided_at)}` : "—"],
            ["Note", request.note || "—"],
          ].map(([label, value]) => (
            <div key={label} className="px-3 py-2 bg-white">
              <dt className={statLabelClass}>{label}</dt>
              <dd className="text-gray-900 break-words">{value}</dd>
            </div>
          ))}
        </dl>
        {request.decision_note && (
          <p className={`px-3 py-2 border ${request.status === "rejected" ? "text-red-800 border-red-200 bg-red-50" : "text-green-800 border-green-200 bg-green-50"}`}>
            {request.status === "rejected" ? "Rejected" : "Approved"}: {request.decision_note}
          </p>
        )}

        <div className="overflow-x-auto border border-gray-200">
          <table className="w-full">
            <thead className="text-left bg-gray-50">
              <tr>
                <th className={`px-3 py-2 ${statLabelClass}`}>Product</th>
                <th className={`px-3 py-2 text-right ${statLabelClass}`}>Requested</th>
                <th className={`px-3 py-2 text-right ${statLabelClass}`}>In stock then</th>
                <th className={`px-3 py-2 text-right ${statLabelClass}`}>Sold (30 days)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 tabular-nums">
              {request.items.map((item) => (
                <tr key={item.product?.id}>
                  <td className="px-3 py-2 text-gray-900">{item.product?.name}</td>
                  <td className="px-3 py-2 font-semibold text-right">{item.quantity}</td>
                  <td className="px-3 py-2 text-right">{item.stock_at_request}</td>
                  <td className="px-3 py-2 text-right">{item.sold_last_30_days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {mode && (
          <div className="p-3 space-y-2 border border-gray-200 bg-gray-50">
            {mode === "cancel" ? (
              <p>Cancel this requisition? It won&apos;t be ordered.</p>
            ) : (
              <>
                <label htmlFor="decision-text" className={labelClass}>
                  {mode === "approve" ? "Note (optional)" : "Reason"}
                </label>
                <input
                  id="decision-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={500}
                  autoFocus
                  disabled={busy}
                  placeholder={mode === "approve" ? "e.g. Order from Dangote" : "e.g. Back store has plenty, transfer it instead"}
                  className={fieldClass()}
                />
              </>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setMode(null)} disabled={busy} className={secondaryButtonClass}>Back</button>
              <button type="button" onClick={act} disabled={busy} className={mode === "approve" ? primaryButtonClass : dangerButtonClass}>
                {busy && <Loader2 size={16} className="animate-spin" />}
                {mode === "approve" ? "Approve" : mode === "reject" ? "Reject" : "Cancel requisition"}
              </button>
            </div>
          </div>
        )}

        <div>
          <p className={`${statLabelClass} mb-2`}>History</p>
          {history === null ? (
            <p className="text-gray-500">Loading…</p>
          ) : (
            <ul className="border border-gray-200 divide-y divide-gray-100">
              {history.map((entry) => (
                <li key={entry.id} className="flex gap-3 px-3 py-2">
                  <History size={14} className="mt-0.5 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-gray-900">{entry.description}</p>
                    <p className="text-xs text-gray-500">{entry.by?.name || "Someone"} · {formatWhen(entry.at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {canApprove && pending && isMine && (
          <p className="text-xs text-gray-500">You raised this requisition, so someone else must approve it.</p>
        )}
      </div>

      {!mode && (canDecide || canChange || canCancel) && (
        <ModalFooter className="justify-between">
          <div className="flex gap-2">
            {canChange && (
              <button type="button" onClick={() => onEdit(request)} className={secondaryButtonClass}>
                <Pencil size={14} /> Edit
              </button>
            )}
            {canCancel && (
              <button type="button" onClick={() => setMode("cancel")} className={secondaryButtonClass}>
                <Trash2 size={14} /> Cancel
              </button>
            )}
          </div>
          {canDecide && (
            <div className="flex gap-2">
              <button type="button" onClick={() => setMode("reject")} className={dangerButtonClass}>
                <XCircle size={16} /> Reject
              </button>
              <button type="button" onClick={() => setMode("approve")} className={primaryButtonClass}>
                <CheckCircle2 size={16} /> Approve
              </button>
            </div>
          )}
        </ModalFooter>
      )}
    </ModalShell>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function StoreRequisitions() {
  const { user, can } = useAuth();
  const canCreate = can("requisitions.create");
  const canApprove = can("requisitions.approve");
  // Only admins hold "manage users", and admins may change anyone's requisition
  const isAdmin = can("users.manage");

  const [requests, setRequests] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [status, setStatus] = useState(canApprove && !canCreate ? "pending" : "");
  const [storeId, setStoreId] = useState("");
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(undefined); // undefined closed, null new, request = edit
  const [viewing, setViewing] = useState(null);
  const { notify, toastElement } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { data } = await http.get("/purchase-requests", { params: { page, status: status || undefined, store_id: storeId || undefined } });
      setRequests(toList(data));
      setLastPage(Number(data?.last_page) || 1);
    } catch (err) {
      setLoadError(errorText(err, "Could not load requisitions."));
    } finally {
      setLoading(false);
    }
  }, [page, status, storeId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    Promise.all([http.get("/stores"), http.get("/products")])
      .then(([storesResponse, productsResponse]) => {
        setStores(storesFor(user, toList(storesResponse.data)).sort((a, b) => String(a.name).localeCompare(String(b.name))));
        setProducts(toList(productsResponse.data));
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- the user is loaded before any page renders; the server checks stores too

  const handleSaved = (saved, wasEdit) => {
    setForm(undefined);
    setViewing(null);
    notify("success", wasEdit ? `${saved.reference} was updated.` : `${saved.reference} was sent for approval.`, wasEdit ? "Requisition updated" : "Requisition sent");
    load();
  };

  const handleChanged = (saved, action) => {
    setViewing(saved);
    const words = { approve: "approved", reject: "rejected", cancel: "cancelled" };
    notify("success", `${saved.reference} was ${words[action]}.`, "Done");
    load();
  };

  return (
    <div className="pt-0 mt-0 font-raleway">
      {toastElement}
      <PageTitle title="Store Requisitions" description="Stores ask for stock to be bought; procurement approves before ordering" />
      <PurchasingNav />

      <section className="mt-5 bg-white border border-gray-200">
        <PanelHeader title="Requisitions" meta={loading ? "Loading…" : `${requests.length} shown`}>
          <button onClick={load} disabled={loading} className={toolbarButtonClass.secondary}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          {canCreate && (
            <button onClick={() => setForm(null)} disabled={stores.length === 0} className={toolbarButtonClass.primary}>
              <Plus size={14} />
              New Requisition
            </button>
          )}
        </PanelHeader>

        <div className="flex flex-wrap gap-3 px-5 py-3 border-b border-gray-200">
          <FilterSelect value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Status">
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </FilterSelect>
          <FilterSelect value={storeId} onChange={(e) => { setStoreId(e.target.value); setPage(1); }} aria-label="Store">
            <option value="">All stores</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </FilterSelect>
        </div>

        {loading && requests.length === 0 ? (
          <LoadingState label="Loading requisitions…" />
        ) : loadError ? (
          <EmptyState icon={ClipboardList} tone="red" title="Couldn't load requisitions" hint={loadError} action={<button onClick={load} className={secondaryButtonClass}>Try again</button>} />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={status || storeId ? "No requisitions match" : "No requisitions yet"}
            hint={canCreate ? "When a store runs low, raise a requisition for procurement to approve." : "Stores' requests for stock will appear here."}
          />
        ) : (
          <ul className="divide-y divide-gray-100">
            {requests.map((request) => (
              <li key={request.id}>
                <button type="button" onClick={() => setViewing(request)} className="flex flex-wrap items-center justify-between w-full gap-3 px-5 py-3 text-left hover:bg-blue-50/50">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900">
                      <span className="font-mono text-xs text-gray-500">{request.reference}</span>
                      {request.store?.name}
                      <StatusBadge request={request} />
                    </p>
                    <p className="text-xs text-gray-600 truncate max-w-[40rem]">
                      {request.items.map((item) => `${item.product?.name} × ${item.quantity}`).join(", ")}
                    </p>
                  </div>
                  <div className="text-xs text-right text-gray-500">
                    <p>{request.requested_by?.name || "—"} · {formatDay(request.requested_at)}</p>
                    <p>{request.total_units} units</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {lastPage > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading} className={secondaryButtonClass}>Newer</button>
            <span className="text-xs text-gray-500">Page {page} of {lastPage}</span>
            <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page >= lastPage || loading} className={secondaryButtonClass}>Older</button>
          </div>
        )}
      </section>

      {form !== undefined && (
        <RequisitionForm stores={stores} products={products} existing={form} onClose={() => setForm(undefined)} onSaved={handleSaved} />
      )}

      {viewing && form === undefined && (
        <DetailsModal
          request={viewing}
          canApprove={canApprove}
          isMine={viewing.requested_by?.id === user?.id}
          isAdmin={isAdmin}
          onClose={() => setViewing(null)}
          onChanged={handleChanged}
          onEdit={(request) => setForm(request)}
        />
      )}
    </div>
  );
}
