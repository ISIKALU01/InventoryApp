// Print Labels: price tags and shelf labels with scannable barcodes.
// Pick products (search or scan), set how many of each, then Print. Only the
// label sheet is printed; the rest of the app is hidden on paper.
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Head from "next/head";
import Link from "next/link";
import { FaListUl, FaPrint, FaSearch, FaTag, FaTimes } from "react-icons/fa";
import InventoryNav from "../../components/InventoryNav";
import ProductPicker from "../../components/ProductPicker";
import BarcodeSvg from "../../components/BarcodeSvg";
import http from "../../../services/http";
import { findProductByCode } from "../../../utils/barcode";
import { Panel, secondaryButtonClass, statLabelClass } from "../../components/settings/ui";

const LABEL_TYPES = {
  price: { label: "Price tag", size: "50 × 30 mm", className: "label-price" },
  shelf: { label: "Shelf label", size: "90 × 38 mm", className: "label-shelf" },
};

const MAX_COPIES = 200;

const naira = (value) =>
  `₦${Number(value || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Label = ({ product, type, showPrice }) => (
  <div className={`label ${LABEL_TYPES[type].className}`}>
    <p className="label-name">{product.name}</p>
    {type === "shelf" && product.sku && <p className="label-sku">SKU {product.sku}</p>}
    {showPrice && <p className="label-price-text">{naira(product.price)}</p>}
    {product.barcode ? (
      <BarcodeSvg
        value={product.barcode}
        height={type === "shelf" ? 34 : 26}
        width={type === "shelf" ? 1.6 : 1.3}
        fontSize={type === "shelf" ? 12 : 10}
        className="label-barcode"
      />
    ) : (
      <p className="label-nocode">No barcode</p>
    )}
  </div>
);

export default function PrintLabels() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [lines, setLines] = useState([]); // { product, copies }
  const [type, setType] = useState("price");
  const [showPrice, setShowPrice] = useState(true);
  const [browsing, setBrowsing] = useState(false);
  const searchRef = useRef(null);
  // The print sheet goes straight under <body>, outside the app layout
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    http
      .get("/products")
      .then(({ data }) => setProducts(Array.isArray(data) ? data : data?.data || []))
      .catch((error) => setLoadError(error.response?.data?.message || "Could not load products."))
      .finally(() => setLoading(false));
  }, []);

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return products
      .filter((p) => [p.name, p.sku, p.barcode].some((v) => String(v || "").toLowerCase().includes(term)))
      .slice(0, 8);
  }, [products, query]);

  const addProduct = (product) => {
    setMessage("");
    setQuery("");
    setLines((prev) =>
      prev.some((line) => line.product.id === product.id)
        ? prev.map((line) =>
            line.product.id === product.id ? { ...line, copies: Math.min(MAX_COPIES, Number(line.copies || 0) + 1) } : line
          )
        : [...prev, { product, copies: 1 }]
    );
    searchRef.current?.focus();
  };

  // Several products ticked in "Browse products", one label each to start
  const addPicked = (picked) => {
    setMessage("");
    setLines((prev) => [...prev, ...picked.filter((p) => !prev.some((line) => line.product.id === p.id)).map((product) => ({ product, copies: 1 }))]);
    setBrowsing(false);
  };

  // Enter (or a scanner) adds an exact barcode/SKU, or the only match
  const handleKeyDown = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const exact = findProductByCode(products, query);
    if (exact) return addProduct(exact);
    if (matches.length === 1) return addProduct(matches[0]);
    if (query.trim()) setMessage(`No product matches "${query.trim()}".`);
  };

  const setCopies = (id, value) =>
    setLines((prev) => prev.map((line) => (line.product.id === id ? { ...line, copies: value } : line)));

  const copiesOf = (line) => {
    const n = Number(line.copies);
    return Number.isInteger(n) && n >= 1 ? Math.min(n, MAX_COPIES) : 0;
  };

  const sheet = lines.flatMap((line) => Array.from({ length: copiesOf(line) }, (_, i) => ({ key: `${line.product.id}-${i}`, product: line.product })));
  const withoutBarcode = lines.filter((line) => !line.product.barcode).length;

  return (
    <div className="pb-6 font-raleway">
      <Head>
        <title>Print Labels - SellaPad</title>
      </Head>

      <div className="no-print">
        <InventoryNav />
      </div>

      <div className="mt-4 space-y-5 no-print">
        <Panel
          title="Print Labels"
          description="Price tags and shelf labels with scannable barcodes. Add products, set how many of each, then print."
          action={
            <button
              type="button"
              onClick={() => window.print()}
              disabled={sheet.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white transition-colors bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <FaPrint className="text-[11px]" />
              Print {sheet.length || ""} label{sheet.length === 1 ? "" : "s"}
            </button>
          }
          bodyClass="p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center gap-4">
            <fieldset className="flex gap-2">
              <legend className={`${statLabelClass} mb-1`}>Label</legend>
              {Object.entries(LABEL_TYPES).map(([value, option]) => (
                <label
                  key={value}
                  className={`px-3 py-2 text-sm border cursor-pointer ${type === value ? "border-blue-600 bg-blue-50" : "border-gray-300"}`}
                >
                  <input type="radio" name="label-type" value={value} checked={type === value} onChange={() => setType(value)} className="mr-2 accent-blue-600" />
                  {option.label} <span className="text-xs text-gray-500">({option.size})</span>
                </label>
              ))}
            </fieldset>
            <label className="flex items-center gap-2 mt-5 text-sm">
              <input type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} className="accent-blue-600" />
              Show price
            </label>
          </div>

          <div className="relative">
            <label htmlFor="labels-search" className={statLabelClass}>Add products</label>
            <div className="flex gap-2 mt-1">
            <div className="relative flex-1">
              <FaSearch className="absolute text-xs text-gray-400 -translate-y-1/2 left-3 top-1/2" />
              <input
                id="labels-search"
                ref={searchRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setMessage("");
                }}
                onKeyDown={handleKeyDown}
                disabled={loading}
                autoComplete="off"
                placeholder={loading ? "Loading products…" : "Scan a barcode, or type a name or SKU"}
                className="block w-full py-2.5 pl-8 pr-3 text-sm border border-gray-300 outline-none focus:border-blue-600"
              />
            </div>
            <button type="button" onClick={() => setBrowsing(true)} disabled={loading} title="Browse products" aria-label="Browse products" className="flex items-center justify-center w-11 shrink-0 text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 hover:text-blue-700 disabled:opacity-50">
              <FaListUl className="text-sm" />
            </button>
            </div>
            {matches.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 overflow-y-auto bg-white border border-gray-200 shadow-lg max-h-64">
                {matches.map((product) => (
                  <li key={product.id}>
                    <button type="button" onClick={() => addProduct(product)} className="flex justify-between w-full gap-3 px-3 py-2 text-left hover:bg-blue-50">
                      <span className="text-sm text-gray-900 truncate">{product.name}</span>
                      <span className="text-xs text-gray-500">{product.barcode || "no barcode"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {(message || loadError) && <p className="mt-1 text-xs text-red-600">{message || loadError}</p>}
          </div>

          {lines.length === 0 ? (
            <p className="px-4 py-6 text-sm text-center text-gray-500 border border-dashed border-gray-300">
              No products yet. Scan or search above to add them.
            </p>
          ) : (
            <ul className="border border-gray-200 divide-y divide-gray-200">
              {lines.map((line) => (
                <li key={line.product.id} className="flex flex-wrap items-center gap-3 px-4 py-2">
                  <div className="flex-1 min-w-[10rem]">
                    <p className="text-sm font-medium text-gray-900">{line.product.name}</p>
                    <p className="text-[11px] text-gray-500">
                      {line.product.barcode || <span className="text-amber-700">No barcode: the label will show the name and price only</span>}
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    Copies
                    <input
                      type="number"
                      min="1"
                      max={MAX_COPIES}
                      step="1"
                      value={line.copies}
                      onChange={(e) => setCopies(line.product.id, e.target.value)}
                      aria-label={`Copies of ${line.product.name}`}
                      className={`w-20 px-2 py-1.5 text-sm border tabular-nums ${copiesOf(line) ? "border-gray-300" : "border-red-400"}`}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setLines((prev) => prev.filter((l) => l.product.id !== line.product.id))}
                    className="flex items-center justify-center w-8 h-8 text-gray-500 hover:bg-gray-100 hover:text-red-600"
                    aria-label={`Remove ${line.product.name}`}
                  >
                    <FaTimes className="text-xs" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {withoutBarcode > 0 && (
            <p className="text-xs text-amber-700">
              {withoutBarcode} product{withoutBarcode === 1 ? " has" : "s have"} no barcode. Use{" "}
              <Link href="/inventory/manage-products" className="underline">Create missing barcodes</Link> on Manage Products first.
            </p>
          )}

          {lines.length > 0 && (
            <div className="flex justify-end">
              <button type="button" onClick={() => setLines([])} className={secondaryButtonClass}>Clear list</button>
            </div>
          )}
        </Panel>

        {sheet.length > 0 && (
          <Panel title="Preview" description="What will be printed, at actual size." bodyClass="p-5 overflow-x-auto">
            <div className="label-sheet">
              {sheet.map(({ key, product }) => (
                <Label key={key} product={product} type={type} showPrice={showPrice} />
              ))}
            </div>
          </Panel>
        )}

        {sheet.length === 0 && lines.length === 0 && !loading && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <FaTag /> Tip: print on sticker sheets, or plain paper and cut along the edges.
          </div>
        )}
      </div>

      {/* Only this is printed */}
      {mounted &&
        createPortal(
          <div id="label-print-area" className="label-sheet" aria-hidden="true">
            {sheet.map(({ key, product }) => (
              <Label key={key} product={product} type={type} showPrice={showPrice} />
            ))}
          </div>,
          document.body
        )}

      <style jsx global>{`
        .label-sheet {
          display: flex;
          flex-wrap: wrap;
          gap: 2mm;
        }
        .label {
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 2mm;
          border: 0.3mm dashed #9ca3af;
          background: #fff;
          color: #000;
          overflow: hidden;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .label-price {
          width: 50mm;
          height: 30mm;
        }
        .label-shelf {
          width: 90mm;
          height: 38mm;
        }
        .label-name {
          width: 100%;
          margin: 0;
          font-weight: 600;
          text-align: center;
          line-height: 1.15;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .label-price .label-name {
          font-size: 8pt;
        }
        .label-shelf .label-name {
          font-size: 11pt;
        }
        .label-sku {
          margin: 0;
          font-size: 7pt;
          color: #374151;
        }
        .label-price-text {
          margin: 0;
          font-weight: 700;
        }
        .label-price .label-price-text {
          font-size: 11pt;
        }
        .label-shelf .label-price-text {
          font-size: 18pt;
        }
        .label-barcode {
          max-width: 100%;
          height: auto;
        }
        .label-nocode {
          margin: 0;
          font-size: 7pt;
          color: #6b7280;
        }
        #label-print-area {
          display: none;
        }
        @media print {
          @page {
            margin: 8mm;
          }
          body * {
            visibility: hidden !important;
          }
          #label-print-area,
          #label-print-area * {
            visibility: visible !important;
          }
          #label-print-area {
            display: flex !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .label {
            border-color: #d1d5db;
          }
        }
      `}</style>

      {browsing && (
        <ProductPicker
          products={products}
          addedIds={lines.map((line) => line.product.id)}
          onAdd={addPicked}
          onClose={() => setBrowsing(false)}
        />
      )}
    </div>
  );
}
