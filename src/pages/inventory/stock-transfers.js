// Stock Transfers: move stock between stores, usually from the back store to a
// shop so the sales point can sell it. A transfer moves every line or nothing,
// and can't be edited afterwards: to undo one, move the stock back.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import { FaArrowRight, FaExchangeAlt, FaExclamationTriangle, FaListUl, FaPlus, FaSearch, FaTimes, FaTruck } from "react-icons/fa";
import InventoryNav from "../../components/InventoryNav";
import ProductPicker from "../../components/ProductPicker";
import http from "../../../services/http";
import { findProductByCode } from "../../../utils/barcode";
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

const primaryButtonClass =
  "flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-none transition-colors hover:bg-blue-700 disabled:opacity-50";

const fieldClass = (hasError = false) =>
  `block w-full px-3 py-2.5 text-sm text-gray-800 bg-white border rounded-none outline-none transition-colors placeholder:text-gray-400 disabled:opacity-50 disabled:bg-gray-50 ${
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
      : "border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
  }`;

const labelClass = "block mb-1.5 text-xs font-semibold tracking-wide text-gray-600 uppercase";

const toList = (body) => (Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : []);

const isBackStore = (store) => store?.type === "back_store";

const typeLabel = (store) => (isBackStore(store) ? "Back store" : "Shop");

const TypeBadge = ({ store }) => (
  <span
    className={`px-1.5 py-px text-[10px] font-semibold ${
      isBackStore(store) ? "text-amber-800 bg-amber-50" : "text-green-800 bg-green-50"
    }`}
  >
    {typeLabel(store)}
  </span>
);

const formatWhen = (iso) =>
  iso
    ? new Date(iso).toLocaleString([], { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })
    : "—";

// Stock a product has in one store
const stockIn = (product, storeId) =>
  Number((product?.stores || []).find((s) => String(s.store_id) === String(storeId))?.stock ?? 0);

const itemsSummary = (items = []) =>
  items.map((item) => `${item.product?.name || "Product"} × ${item.quantity}`).join(", ");

// ---------------------------------------------------------------------------
// New transfer
// ---------------------------------------------------------------------------

const MoveStockModal = ({ stores, products, onClose, onDone }) => {
  const defaultFrom = stores.find(isBackStore) || stores[0];
  const defaultTo = stores.find((s) => !isBackStore(s) && s.id !== defaultFrom?.id) || stores.find((s) => s.id !== defaultFrom?.id);

  const [fromId, setFromId] = useState(defaultFrom ? String(defaultFrom.id) : "");
  const [toId, setToId] = useState(defaultTo ? String(defaultTo.id) : "");
  const [lines, setLines] = useState([]); // { product, quantity }
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [browsing, setBrowsing] = useState(false);
  const searchRef = useRef(null);

  // Products the source store holds and that aren't on the list yet
  const available = useMemo(
    () =>
      products.filter(
        (p) => stockIn(p, fromId) > 0 && !lines.some((line) => line.product.id === p.id)
      ),
    [products, fromId, lines]
  );

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return available
      .filter((p) =>
        [p.name, p.sku, p.barcode].some((value) => String(value || "").toLowerCase().includes(term))
      )
      .slice(0, 8);
  }, [available, query]);

  // Changing the source store empties the list: the stock to move depends on it
  const changeFrom = (value) => {
    setFromId(value);
    setLines([]);
    setErrors({});
    if (value === toId) setToId("");
  };

  const addLine = (product) => {
    setLines((prev) => [...prev, { product, quantity: "1" }]);
    setQuery("");
    setErrors({});
    searchRef.current?.focus();
  };

  // Several products ticked in "Browse products"
  const addPicked = (picked) => {
    setLines((prev) => [...prev, ...picked.filter((p) => !prev.some((line) => line.product.id === p.id)).map((product) => ({ product, quantity: "1" }))]);
    setBrowsing(false);
    setErrors({});
    setFormError("");
  };

  // Enter (or a scanner) adds an exact barcode/SKU match, or the only match
  const handleSearchKeyDown = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const exact = findProductByCode(available, query);
    if (exact) return addLine(exact);
    if (matches.length === 1) return addLine(matches[0]);

    const elsewhere = findProductByCode(products, query);
    if (elsewhere && lines.some((line) => line.product.id === elsewhere.id)) {
      setFormError(`${elsewhere.name} is already on the list. Change its quantity instead.`);
    } else if (elsewhere) {
      setFormError(`${elsewhere.name} isn't in the store you're moving from.`);
    } else if (query.trim()) {
      setFormError(`No product matches "${query.trim()}".`);
    }
  };

  // Server errors are by line number, so any change to the list clears them
  const setQuantity = (productId, value) => {
    setErrors({});
    setLines((prev) => prev.map((line) => (line.product.id === productId ? { ...line, quantity: value } : line)));
  };

  const removeLine = (productId) => {
    setErrors({});
    setLines((prev) => prev.filter((line) => line.product.id !== productId));
  };

  // What the form can tell before asking the server
  const quantityProblem = (line) => {
    const quantity = Number(line.quantity);
    const max = stockIn(line.product, fromId);
    if (line.quantity === "" || !Number.isInteger(quantity) || quantity < 1) return "Enter a whole number of 1 or more.";
    if (quantity > max) return `Only ${max} available.`;
    return "";
  };

  const lineProblem = (line, index) =>
    quantityProblem(line) || errors[`items.${index}.quantity`] || errors[`items.${index}.product_id`] || "";

  const canSubmit =
    Boolean(fromId && toId) && fromId !== toId && lines.length > 0 && lines.every((line) => !quantityProblem(line));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setFormError("");
    setErrors({});

    setSaving(true);
    try {
      const { data } = await http.post("/stock-transfers", {
        from_store_id: Number(fromId),
        to_store_id: Number(toId),
        note: note.trim() || null,
        items: lines.map((line) => ({ product_id: line.product.id, quantity: Number(line.quantity) })),
      });
      onDone(data);
    } catch (error) {
      const fieldErrors = Object.fromEntries(
        Object.entries(error.response?.data?.errors || {}).map(([field, messages]) => [field, messages[0]])
      );
      setErrors(fieldErrors);
      const general = fieldErrors.from_store_id || fieldErrors.to_store_id || fieldErrors.items || fieldErrors.note;
      setFormError(
        general ||
          (error.response?.status === 403
            ? "You don't have permission to move stock."
            : Object.keys(fieldErrors).length
            ? "Some lines can't be moved. Nothing was moved; fix them and try again."
            : error.response?.data?.message || "Could not move the stock.")
      );
    } finally {
      setSaving(false);
    }
  };

  const fromStore = stores.find((s) => String(s.id) === fromId);
  const toStore = stores.find((s) => String(s.id) === toId);

  return (
    <ModalShell
      title="Move Stock"
      subtitle="Everything on the list moves together, or nothing does"
      icon={FaTruck}
      onClose={onClose}
      busy={saving}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="px-6 py-6 space-y-5">
          {formError && (
            <div role="alert" className="flex items-start gap-3 px-4 py-3 text-sm text-red-800 border border-red-200 bg-red-50">
              <FaExclamationTriangle className="mt-0.5 shrink-0 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <div>
              <label htmlFor="transfer-from" className={labelClass}>From</label>
              <select id="transfer-from" value={fromId} onChange={(e) => changeFrom(e.target.value)} disabled={saving} className={fieldClass()}>
                <option value="">Choose a store</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>{store.name} ({typeLabel(store)})</option>
                ))}
              </select>
            </div>
            <FaArrowRight className="hidden mb-3.5 text-gray-400 sm:block" aria-hidden="true" />
            <div>
              <label htmlFor="transfer-to" className={labelClass}>To</label>
              <select id="transfer-to" value={toId} onChange={(e) => setToId(e.target.value)} disabled={saving} className={fieldClass()}>
                <option value="">Choose a store</option>
                {stores
                  .filter((store) => String(store.id) !== fromId)
                  .map((store) => (
                    <option key={store.id} value={store.id}>{store.name} ({typeLabel(store)})</option>
                  ))}
              </select>
            </div>
          </div>
          {toStore && isBackStore(toStore) && fromStore && !isBackStore(fromStore) && (
            <p className="-mt-2 text-xs text-amber-700">
              Stock moved into a back store can&apos;t be sold until it is moved to a shop again.
            </p>
          )}

          <div className="relative">
            <label htmlFor="transfer-search" className={labelClass}>Add products</label>
            <div className="flex gap-2">
            <div className="relative flex-1">
              <FaSearch className="absolute text-xs text-gray-400 -translate-y-1/2 left-3 top-1/2" />
              <input
                id="transfer-search"
                ref={searchRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setFormError("");
                }}
                onKeyDown={handleSearchKeyDown}
                disabled={saving || !fromId}
                autoComplete="off"
                placeholder={fromId ? "Scan a barcode, or type a name or SKU" : "Choose the store to move from first"}
                className={`${fieldClass()} pl-8`}
              />
            </div>
            <button type="button" onClick={() => setBrowsing(true)} disabled={saving || !fromId} title="Browse products" aria-label="Browse products" className="flex items-center justify-center w-11 shrink-0 text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 hover:text-blue-700 disabled:opacity-50">
              <FaListUl className="text-sm" />
            </button>
            </div>
            {matches.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 overflow-y-auto bg-white border border-gray-200 shadow-lg max-h-64">
                {matches.map((product) => (
                  <li key={product.id}>
                    <button
                      type="button"
                      onClick={() => addLine(product)}
                      className="flex items-center justify-between w-full gap-3 px-3 py-2 text-left hover:bg-blue-50"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm text-gray-900 truncate">{product.name}</span>
                        <span className="block text-[11px] text-gray-500 truncate">
                          {[product.sku, product.barcode].filter(Boolean).join(" · ") || "No code"}
                        </span>
                      </span>
                      <span className="text-xs text-gray-600 whitespace-nowrap tabular-nums">{stockIn(product, fromId)} available</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {lines.length === 0 ? (
            <p className="px-4 py-6 text-sm text-center text-gray-500 border border-dashed border-gray-300">
              No products yet. Scan or search above to add them.
            </p>
          ) : (
            <ul className="border border-gray-200 divide-y divide-gray-200">
              {lines.map((line, index) => {
                const problem = lineProblem(line, index);
                return (
                  <li key={line.product.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-[10rem]">
                      <p className="text-sm font-medium text-gray-900">{line.product.name}</p>
                      <p className="text-[11px] text-gray-500">{stockIn(line.product, fromId)} in {fromStore?.name}</p>
                      {problem && <p className="mt-0.5 text-xs text-red-600">{problem}</p>}
                    </div>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      max={stockIn(line.product, fromId)}
                      value={line.quantity}
                      onChange={(e) => setQuantity(line.product.id, e.target.value)}
                      disabled={saving}
                      aria-label={`Quantity of ${line.product.name}`}
                      className={`${fieldClass(Boolean(problem))} w-24 tabular-nums`}
                    />
                    <button
                      type="button"
                      onClick={() => removeLine(line.product.id)}
                      disabled={saving}
                      className="flex items-center justify-center w-8 h-8 text-gray-500 hover:bg-gray-100 hover:text-red-600"
                      aria-label={`Remove ${line.product.name}`}
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div>
            <label htmlFor="transfer-note" className={labelClass}>
              Note <span className="font-normal text-gray-400 normal-case">(optional)</span>
            </label>
            <input
              id="transfer-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              disabled={saving}
              placeholder="e.g. Morning restock"
              className={fieldClass(Boolean(errors.note))}
            />
          </div>
        </div>

        <ModalFooter>
          <button type="button" onClick={onClose} disabled={saving} className={secondaryButtonClass}>Cancel</button>
          <button type="submit" disabled={saving || !canSubmit} className={primaryButtonClass}>
            {saving ? <Spinner /> : <FaExchangeAlt className="mr-2" />}
            {saving ? "Moving…" : `Move ${lines.length} product${lines.length === 1 ? "" : "s"}`}
          </button>
        </ModalFooter>
      </form>
      {browsing && (
        <ProductPicker
          title={`Products in ${fromStore?.name || "this store"}`}
          products={products}
          stores={stores}
          storeId={fromId}
          lockStore
          disabledReason={(p) => (stockIn(p, fromId) > 0 ? null : `none in ${fromStore?.name}`)}
          addedIds={lines.map((line) => line.product.id)}
          onAdd={addPicked}
          onClose={() => setBrowsing(false)}
        />
      )}
    </ModalShell>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function StockTransfers() {
  const [transfers, setTransfers] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [storeFilter, setStoreFilter] = useState("");
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [moving, setMoving] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const notify = (type, message, title) => {
    clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), type, message, title });
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION[type]);
  };

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const loadTransfers = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { data } = await http.get("/stock-transfers", { params: { page, store_id: storeFilter || undefined } });
      setTransfers(toList(data));
      setLastPage(Number(data?.last_page) || 1);
    } catch (error) {
      setLoadError(error.response?.data?.message || "Could not load stock transfers.");
    } finally {
      setLoading(false);
    }
  }, [page, storeFilter]);

  // Stores and products for the form; products carry their stock per store
  const loadStock = useCallback(async () => {
    try {
      const [storesResponse, productsResponse] = await Promise.all([http.get("/stores"), http.get("/products")]);
      setStores(toList(storesResponse.data).sort((a, b) => String(a.name).localeCompare(String(b.name))));
      setProducts(toList(productsResponse.data));
    } catch (error) {
      setLoadError(error.response?.data?.message || "Could not load stores and products.");
    }
  }, []);

  useEffect(() => {
    loadTransfers();
  }, [loadTransfers]);

  useEffect(() => {
    loadStock();
  }, [loadStock]);

  const handleDone = (transfer) => {
    setMoving(false);
    notify(
      "success",
      `${transfer.reference}: ${itemsSummary(transfer.items)} moved from ${transfer.from_store?.name} to ${transfer.to_store?.name}.`,
      "Stock moved"
    );
    setPage(1);
    loadTransfers();
    loadStock(); // stock levels changed
  };

  const canMove = stores.length >= 2;

  return (
    <div className="pb-6 font-raleway">
      <Head>
        <title>Stock Transfers - SellaPad</title>
      </Head>
      {toast && <Toast key={toast.id} toast={toast} onClose={() => setToast(null)} />}

      <InventoryNav />

      <div className="mt-4 space-y-5">
        <Panel
          title="Stock Transfers"
          description="Move stock from the back store to a shop so it can be sold, or between any two stores."
          action={
            <button
              type="button"
              onClick={() => setMoving(true)}
              disabled={!canMove}
              title={canMove ? undefined : "You need at least two stores. Add them in Settings."}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white transition-colors bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <FaPlus className="text-[11px]" />
              Move Stock
            </button>
          }
          bodyClass=""
        >
          <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-gray-200">
            <label htmlFor="transfer-filter" className={statLabelClass}>Store</label>
            <select
              id="transfer-filter"
              value={storeFilter}
              onChange={(e) => {
                setStoreFilter(e.target.value);
                setPage(1);
              }}
              className="px-2 py-1.5 text-sm border border-gray-300"
            >
              <option value="">All stores</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>{store.name} ({typeLabel(store)})</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 text-sm text-gray-500 py-14">
              <div className="w-5 h-5 border-2 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              Loading transfers…
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center px-5 text-center py-14">
              <p className="text-sm font-medium text-gray-700">Couldn&apos;t load stock transfers</p>
              <p className="mt-1 text-xs text-red-600">{loadError}</p>
              <button type="button" onClick={loadTransfers} className={`${secondaryButtonClass} mt-4`}>Try Again</button>
            </div>
          ) : transfers.length === 0 ? (
            <div className="flex flex-col items-center px-5 text-center py-14">
              <FaTruck className="mb-3 text-2xl text-gray-300" />
              <p className="text-sm font-medium text-gray-700">No stock has been moved yet</p>
              <p className="mt-1 text-xs text-gray-500">
                {canMove ? "Use Move Stock to send goods from the back store to a shop." : "Add a back store and a shop in Settings first."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {transfers.map((transfer) => (
                <li key={transfer.id}>
                  <button
                    type="button"
                    onClick={() => setViewing(transfer)}
                    className="flex flex-wrap items-start justify-between w-full gap-3 px-5 py-3 text-left hover:bg-blue-50/50"
                  >
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900">
                        <span className="font-mono text-xs text-gray-500">{transfer.reference}</span>
                        <span>{transfer.from_store?.name}</span>
                        <FaArrowRight className="text-[10px] text-gray-400" />
                        <span>{transfer.to_store?.name}</span>
                      </p>
                      <p className="text-xs text-gray-600 truncate max-w-[40rem]">{itemsSummary(transfer.items)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{formatWhen(transfer.created_at)}</p>
                      <p className="text-xs text-gray-500">by {transfer.transferred_by_user?.name || "a deleted user"}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {lastPage > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200">
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading} className={secondaryButtonClass}>
                Newer
              </button>
              <span className="text-xs text-gray-500">Page {page} of {lastPage}</span>
              <button type="button" onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page >= lastPage || loading} className={secondaryButtonClass}>
                Older
              </button>
            </div>
          )}
        </Panel>
      </div>

      {moving && <MoveStockModal stores={stores} products={products} onClose={() => setMoving(false)} onDone={handleDone} />}

      {viewing && (
        <ModalShell
          title={viewing.reference}
          subtitle={formatWhen(viewing.created_at)}
          icon={FaTruck}
          onClose={() => setViewing(null)}
          maxWidth="max-w-lg"
        >
          <div className="px-6 py-5 space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200">
              <div className="p-3 bg-white">
                <p className={statLabelClass}>From</p>
                <p className="font-medium text-gray-900">{viewing.from_store?.name}</p>
                <TypeBadge store={viewing.from_store} />
              </div>
              <div className="p-3 bg-white">
                <p className={statLabelClass}>To</p>
                <p className="font-medium text-gray-900">{viewing.to_store?.name}</p>
                <TypeBadge store={viewing.to_store} />
              </div>
            </div>
            <ul className="border border-gray-200 divide-y divide-gray-200">
              {(viewing.items || []).map((item) => (
                <li key={item.id} className="flex justify-between gap-3 px-4 py-2">
                  <span className="text-gray-900">{item.product?.name}</span>
                  <span className="font-semibold tabular-nums">{item.quantity}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-500">
              Moved by {viewing.transferred_by_user?.name || "a deleted user"}
              {viewing.note ? ` · ${viewing.note}` : ""}
            </p>
            <p className="text-xs text-gray-500">To undo this, move the stock back with a new transfer.</p>
          </div>
          <ModalFooter>
            <button type="button" onClick={() => setViewing(null)} className={secondaryButtonClass}>Close</button>
          </ModalFooter>
        </ModalShell>
      )}
    </div>
  );
}
