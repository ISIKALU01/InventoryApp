// "Browse products": a list of every product with search, stock filters and
// sorting, where several products can be ticked and added at once. Opens on
// top of a form (stock transfer, requisition, purchase order, labels...) for
// when you don't remember a product's name, SKU or barcode.
import { useEffect, useMemo, useState } from "react";
import { Check, ListChecks, Search, X } from "lucide-react";
import { Badge, filterFieldClass, formatNaira, primaryButtonClass, secondaryButtonClass, statLabelClass } from "./ui/Boxy";

const LOW_STOCK = 5;
const SHOW_AT_MOST = 200;

const stockAt = (product, storeId) =>
  storeId ? (product.stores || []).find((s) => String(s.store_id) === String(storeId))?.stock ?? 0 : Number(product.stock) || 0;

/**
 * @param {object} props
 * @param {Array} props.products every product (from GET /products)
 * @param {Array} [props.stores] stores, for the "stock in" choice
 * @param {string|number} [props.storeId] show stock in this store (the user can change it unless lockStore)
 * @param {boolean} [props.lockStore] keep the stock column on storeId
 * @param {(product) => string|null} [props.disabledReason] why a product can't be picked here, or null
 * @param {Array<number>} [props.addedIds] products already on the form
 * @param {"price"|"cost"} [props.priceColumn] which price to show
 * @param {(products: Array) => void} props.onAdd
 * @param {() => void} props.onClose
 */
export default function ProductPicker({
  products,
  stores = [],
  storeId = "",
  lockStore = false,
  disabledReason = () => null,
  addedIds = [],
  priceColumn = "price",
  title = "Browse products",
  onAdd,
  onClose,
}) {
  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [sort, setSort] = useState("name");
  const [store, setStore] = useState(storeId ? String(storeId) : "");
  const [picked, setPicked] = useState(() => new Set());

  // Escape closes the picker only, not the form underneath it
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const added = useMemo(() => new Set(addedIds.map(String)), [addedIds]);
  const storeName = stores.find((s) => String(s.id) === store)?.name;

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    const list = products
      .map((product) => ({ product, stock: stockAt(product, store), reason: disabledReason(product) }))
      .filter(({ product }) => !term || [product.name, product.sku, product.barcode, product.description].some((v) => String(v || "").toLowerCase().includes(term)))
      .filter(({ stock }) => {
        if (stockFilter === "in") return stock > 0;
        if (stockFilter === "low") return stock > 0 && stock <= LOW_STOCK;
        if (stockFilter === "out") return stock <= 0;
        return true;
      });

    const byName = (a, b) => String(a.product.name).localeCompare(String(b.product.name));
    const priceOf = (row) => Number(priceColumn === "cost" ? row.product.cost_price : row.product.price) || 0;
    const sorters = {
      name: byName,
      stock_low: (a, b) => a.stock - b.stock || byName(a, b),
      stock_high: (a, b) => b.stock - a.stock || byName(a, b),
      price_low: (a, b) => priceOf(a) - priceOf(b) || byName(a, b),
      price_high: (a, b) => priceOf(b) - priceOf(a) || byName(a, b),
    };
    list.sort(sorters[sort] || byName);
    return list;
  }, [products, query, stockFilter, sort, store, disabledReason, priceColumn]);

  const shown = rows.slice(0, SHOW_AT_MOST);
  const selectable = shown.filter(({ product, reason }) => !reason && !added.has(String(product.id)));
  const allShownPicked = selectable.length > 0 && selectable.every(({ product }) => picked.has(product.id));

  const toggle = (id) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAllShown = () =>
    setPicked((prev) => {
      const next = new Set(prev);
      selectable.forEach(({ product }) => (allShownPicked ? next.delete(product.id) : next.add(product.id)));
      return next;
    });

  const addPicked = () => {
    const chosen = products.filter((p) => picked.has(p.id));
    if (chosen.length) onAdd(chosen);
  };

  const price = (product) => {
    const value = priceColumn === "cost" ? product.cost_price : product.price;
    return value === undefined || value === null ? "—" : formatNaira(Number(value));
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-10 overflow-y-auto bg-gray-900/30 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-label={title} className="relative w-full max-w-4xl bg-white border border-gray-300 shadow-2xl modal-in">
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center min-w-0 gap-3">
            <div className="flex items-center justify-center w-10 h-10 text-white bg-blue-600 shrink-0">
              <ListChecks size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold leading-tight text-gray-900 truncate">{title}</h2>
              <p className="text-xs text-gray-500">Tick one or more products, then add them</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex items-center justify-center w-8 h-8 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-gray-200">
          <div className="relative flex-1 min-w-[14rem]">
            <Search size={14} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              placeholder="Name, SKU, barcode or description"
              aria-label="Search products"
              className={`${filterFieldClass} w-full pl-8`}
            />
          </div>
          {stores.length > 0 && (
            <select value={store} onChange={(e) => setStore(e.target.value)} disabled={lockStore} aria-label="Show stock in" className={filterFieldClass}>
              <option value="">Stock: all stores</option>
              {stores.map((s) => <option key={s.id} value={s.id}>Stock in {s.name}</option>)}
            </select>
          )}
          <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} aria-label="Stock" className={filterFieldClass}>
            <option value="all">Any stock</option>
            <option value="in">In stock</option>
            <option value="low">Running low (1–{LOW_STOCK})</option>
            <option value="out">Out of stock</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort" className={filterFieldClass}>
            <option value="name">Name A–Z</option>
            <option value="stock_low">Lowest stock first</option>
            <option value="stock_high">Highest stock first</option>
            <option value="price_low">{priceColumn === "cost" ? "Cheapest cost first" : "Cheapest first"}</option>
            <option value="price_high">{priceColumn === "cost" ? "Dearest cost first" : "Dearest first"}</option>
          </select>
        </div>

        <div className="overflow-auto max-h-[55vh]">
          {shown.length === 0 ? (
            <p className="px-6 py-10 text-sm text-center text-gray-500">No products match. Try another search or filter.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 text-left bg-gray-50">
                <tr>
                  <th className="w-10 px-4 py-2">
                    <input type="checkbox" checked={allShownPicked} onChange={toggleAllShown} disabled={selectable.length === 0} aria-label="Tick every product shown" className="accent-blue-600" />
                  </th>
                  <th className={`px-3 py-2 ${statLabelClass}`}>Product</th>
                  <th className={`px-3 py-2 text-right ${statLabelClass}`}>{store ? `In ${storeName}` : "In stock"}</th>
                  <th className={`px-3 py-2 text-right ${statLabelClass}`}>{priceColumn === "cost" ? "Cost" : "Price"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shown.map(({ product, stock, reason }) => {
                  const isAdded = added.has(String(product.id));
                  const blocked = isAdded || Boolean(reason);
                  const isPicked = picked.has(product.id);
                  return (
                    <tr
                      key={product.id}
                      onClick={() => !blocked && toggle(product.id)}
                      className={blocked ? "text-gray-400" : `cursor-pointer ${isPicked ? "bg-blue-50" : "hover:bg-gray-50"}`}
                    >
                      <td className="px-4 py-2">
                        {isAdded ? (
                          <Check size={15} className="text-green-600" aria-label="Already added" />
                        ) : (
                          <input
                            type="checkbox"
                            checked={isPicked}
                            disabled={blocked}
                            onChange={() => toggle(product.id)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Tick ${product.name}`}
                            className="accent-blue-600"
                          />
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`block ${blocked ? "" : "text-gray-900"}`}>{product.name}</span>
                        <span className="block text-[11px] text-gray-500">
                          {[product.sku, product.barcode].filter(Boolean).join(" · ") || "No code"}
                          {isAdded && " · already on the list"}
                          {!isAdded && reason && ` · ${reason}`}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {stock}
                        {stock > 0 && stock <= LOW_STOCK && <Badge className="ml-2 text-amber-800 bg-amber-50">Low</Badge>}
                        {stock <= 0 && <Badge className="ml-2 text-red-700 bg-red-50">Out</Badge>}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{price(product)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {rows.length > SHOW_AT_MOST && (
            <p className="px-6 py-2 text-xs text-center text-gray-500">Showing {SHOW_AT_MOST} of {rows.length}. Search to narrow the list.</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <span className="text-sm text-gray-600">
            {rows.length} {rows.length === 1 ? "product" : "products"} · <span className="font-semibold text-gray-900">{picked.size} ticked</span>
            {picked.size > 0 && (
              <button type="button" onClick={() => setPicked(new Set())} className="ml-2 text-xs text-blue-700 hover:underline">Clear</button>
            )}
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={secondaryButtonClass}>Cancel</button>
            <button type="button" onClick={addPicked} disabled={picked.size === 0} className={primaryButtonClass}>
              Add {picked.size || ""} {picked.size === 1 ? "product" : "products"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
