// components/guide/stockScenes.js
// Guide chapters: products, stock levels and labels, expiry, transfers, stock ledger.
import { ArrowRight, Barcode, ChevronDown, CircleCheck, FileUp, Minus, Package, Plus, Printer, Store, Trash2, Warehouse, X } from "lucide-react";
import {
  Button,
  Field,
  Flash,
  Heading,
  Kicker,
  Panel,
  Popup,
  Swap,
  Tag,
  Tile,
  at,
  clamp,
  easeInOut,
  easeOut,
  lerp,
  naira,
  prog,
  rise,
  typed,
} from "./kit";

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

const CATALOGUE = [
  ["Full cream milk 400g", "Dairy", 2450],
  ["Spaghetti 500g", "Groceries", 1100],
  ["Granulated sugar 1kg", "Groceries", 1850],
  ["Vegetable oil 1L", "Groceries", 3200],
  ["Strawberry yoghurt 250ml", "Dairy", 900],
  ["Orange juice 1L", "Beverages", 1650],
];
const SAVE_PRODUCT_AT = 5.6;

export function ProductsScene({ t }) {
  const added = prog(t, SAVE_PRODUCT_AT + 0.3, 0.6, easeOut);
  const name = typed(t, 0.8, "Chin chin 250g", 14);
  const sku = typed(t, 1.9, "SNK-250", 14);
  const barcode = typed(t, 2.5, "6151100039013", 22);
  const cost = typed(t, 3.9, "650", 10);
  const price = typed(t, 4.3, "900", 10);

  return (
    <>
      <Heading t={t} title="Products" sub="Your catalogue: add products one at a time, or import a whole list from a CSV file" />

      <Panel style={{ ...at(24, 62, 400, 406), ...rise(t, 0.2, 0.8) }}>
        <div className="flex items-center justify-between" style={{ padding: "12px 16px" }}>
          <p className="font-semibold text-gray-900" style={{ fontSize: 13 }}>Catalogue</p>
          <span className="flex items-center text-gray-700 border border-gray-300" style={{ gap: 6, padding: "4px 10px", fontSize: 11 }}>
            <FileUp size={13} /> Import CSV
          </span>
        </div>
        {[["Chin chin 250g", "Snacks", 900, true], ...CATALOGUE].map(([product, category, amount, fresh], i) => {
          const y = 52 + (fresh ? 0 : (i - 1) * 50 + lerp(0, 50, added));
          return (
            <div key={product} className="absolute flex items-center border-t border-gray-100" style={{ ...at(0, y, 398, 50), padding: "0 16px", gap: 10, opacity: fresh ? added : rise(t, 0.4 + i * 0.08, 0.5).opacity }}>
              {fresh && <Flash t={t} from={SAVE_PRODUCT_AT + 0.3} dur={1.8} />}
              <span className="relative flex items-center justify-center text-gray-500 bg-gray-100 shrink-0" style={{ width: 30, height: 30 }}>
                <Package size={15} />
              </span>
              <span className="relative flex-1 font-medium text-gray-900" style={{ fontSize: 12 }}>{product}</span>
              <span className="relative"><Tag tone={fresh ? "purple" : "gray"}>{category}</Tag></span>
              <span className="relative font-semibold text-right text-gray-900 tabular-nums" style={{ width: 64, fontSize: 12 }}>{naira(amount)}</span>
            </div>
          );
        })}
      </Panel>

      <Panel style={{ ...at(436, 62, 320, 406), ...rise(t, 0.35, 0.8), padding: 16 }}>
        <p className="font-semibold text-gray-900" style={{ fontSize: 13 }}>Add product</p>
        <p className="text-gray-500" style={{ fontSize: 10.5 }}>Create a product you can stock in your stores</p>
        <Field t={t} label="Product name" value={name} active={t > 0.7 && t < 1.9} style={at(16, 56, 288, 56)} />
        <Field t={t} label="SKU" value={sku} active={t > 1.8 && t < 2.5} style={at(16, 116, 110, 56)} />
        <Field t={t} label="Barcode" value={barcode} icon={Barcode} active={t > 2.4 && t < 3.2} style={at(134, 116, 170, 56)} />
        <Field t={t} label="Category" value={t > 3.4 ? "Snacks" : ""} placeholder="Choose a category" suffix={<ChevronDown size={13} className="text-gray-400" />} style={at(16, 176, 288, 56)} />
        <Field t={t} label="Cost price" value={cost && `₦${cost}`} active={t > 3.8 && t < 4.3} style={at(16, 236, 140, 56)} />
        <Field t={t} label="Selling price" value={price && `₦${price}`} active={t > 4.2 && t < 4.7} style={at(164, 236, 140, 56)} />
        <p className="absolute text-green-700" style={{ left: 16, top: 300, fontSize: 11, ...rise(t, 4.8, 0.5, 6) }}>
          ₦250 profit on each one · 28% margin
        </p>
        <Button t={t} press={SAVE_PRODUCT_AT} done={SAVE_PRODUCT_AT + 0.15} doneLabel="Product saved" style={at(16, 352, 288, 36)}>
          Save product
        </Button>
      </Panel>

      <p className="absolute text-gray-600" style={{ ...at(24, 474, 732, 16), fontSize: 10.5, ...rise(t, 6.8, 0.6, 6) }}>
        Group products with Product categories; the dashboard and reports use them.
      </p>
    </>
  );
}

export const productsCursor = [[0.4, 596, 136], [3.3, 596, 136], [3.4, 596, 256, true], [4.9, 596, 256], [SAVE_PRODUCT_AT, 596, 432, true], [6.4, 596, 432], [7.4, 220, 140]];

// ---------------------------------------------------------------------------
// Stock levels and labels
// ---------------------------------------------------------------------------

const STOCK = [
  { name: "Full cream milk 400g", sku: "MLK-400", qty: 124 },
  { name: "Spaghetti 500g", sku: "SPG-500", qty: 86 },
  { name: "Granulated sugar 1kg", sku: "SGR-1KG", qty: 6, flag: "low" },
  { name: "Vegetable oil 1L", sku: "OIL-1L", qty: 58 },
  { name: "Strawberry yoghurt 250ml", sku: "YGT-250", qty: 40, flag: "expiry" },
];
const STOCK_MAX = 160;
const PICK_ROW_AT = 4.4;
const PRINT_AT = 6.9;

// A made-up but steady barcode pattern for the label preview
const LABEL_BARS = (() => {
  let seed = 7;
  let x = 0;
  const bars = [];
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  while (x < 216) {
    const w = 1 + Math.floor(rnd() * 3);
    bars.push([x, w]);
    x += w + 1 + Math.floor(rnd() * 2);
  }
  return bars;
})();

export function StockLevelsScene({ t }) {
  const label = prog(t, PICK_ROW_AT + 0.3, 0.9, easeOut);
  const bars = prog(t, 5.3, 1.4);
  const pulse = 0.72 + 0.28 * Math.sin(t * 4);

  return (
    <>
      <Panel style={{ ...at(24, 16, 732, 452), ...rise(t, 0.1, 0.8) }}>
        <div className="absolute flex items-center justify-between" style={at(16, 0, 700, 56)}>
          <div>
            <p className="font-semibold text-gray-900" style={{ fontSize: 14 }}>Stock levels</p>
            <p className="text-gray-500" style={{ fontSize: 10.5 }}>Main branch · 5 of 214 products</p>
          </div>
          <span className="text-blue-700 bg-blue-50" style={{ fontSize: 10.5, padding: "4px 10px" }}>Shop floor</span>
        </div>

        <div className="absolute flex font-semibold tracking-wide text-gray-500 uppercase bg-gray-50 border-y border-gray-200" style={{ ...at(0, 56, 730, 32), alignItems: "center", padding: "0 16px", fontSize: 9.5 }}>
          <span style={{ width: 240 }}>Product</span>
          <span style={{ width: 110 }}>SKU</span>
          <span style={{ width: 210 }}>In stock</span>
          <span>Status</span>
        </div>

        {STOCK.map((row, i) => {
          const k = prog(t, 0.4 + i * 0.15, 0.6, easeOut);
          const fill = prog(t, 0.9 + i * 0.12, 1.4);
          const picked = i === 1 ? prog(t, PICK_ROW_AT, 0.3) : 0;
          const badge = row.flag ? prog(t, row.flag === "low" ? 2.2 : 2.6, 0.5, easeOut) : prog(t, 1.8, 0.5);
          return (
            <div key={row.sku} className="absolute flex items-center border-b border-gray-100" style={{ ...at(0, 88 + i * 56, 730, 56), padding: "0 16px", opacity: k, transform: `translateY(${(1 - k) * 10}px)` }}>
              <span className="absolute inset-0 bg-blue-50" style={{ opacity: picked }} />
              <span className="relative font-medium text-gray-900" style={{ width: 240, fontSize: 12.5 }}>{row.name}</span>
              <span className="relative text-gray-500 tabular-nums" style={{ width: 110, fontSize: 11 }}>{row.sku}</span>
              <span className="relative flex items-center" style={{ width: 210, gap: 10 }}>
                <span className="bg-gray-100" style={{ width: 130, height: 6 }}>
                  <span className={`block h-full ${row.flag === "low" ? "bg-amber-500" : "bg-blue-600"}`} style={{ width: `${(row.qty / STOCK_MAX) * 100 * fill}%` }} />
                </span>
                <span className="font-semibold text-gray-800 tabular-nums" style={{ fontSize: 12 }}>{Math.round(row.qty * fill)}</span>
              </span>
              <span className="relative" style={{ opacity: badge, transform: `scale(${lerp(0.85, 1, badge)})`, transformOrigin: "left center" }}>
                {row.flag === "low" ? (
                  <span style={{ opacity: t > 2.7 ? pulse : 1 }}><Tag tone="amber">Low stock · 6 left</Tag></span>
                ) : row.flag === "expiry" ? (
                  <Tag tone="red">Expires in 5 days</Tag>
                ) : (
                  <span className="flex items-center text-green-700" style={{ gap: 6, fontSize: 11 }}>
                    <span className="bg-green-500 rounded-full" style={{ width: 6, height: 6 }} /> In stock
                  </span>
                )}
              </span>
            </div>
          );
        })}

        <span className="absolute inset-0 pointer-events-none" style={{ background: "rgb(0 0 0 / 0.12)", opacity: label }} />
      </Panel>

      <Panel className="shadow-2xl" style={{ ...at(416, 120, 320, 330), opacity: label, transform: `translateX(${(1 - label) * 40}px)`, padding: 16 }}>
        <div className="flex items-center justify-between">
          <p className="flex items-center font-semibold text-gray-900" style={{ gap: 8, fontSize: 13 }}>
            <Printer size={15} className="text-blue-600" /> Print labels
          </p>
          <X size={14} className="text-gray-400" />
        </div>

        <div className="relative theme-fixed" style={{ marginTop: 14, height: 136, background: "#fff", border: "1px dashed #d1d5db", padding: "12px 18px", color: "#111827" }}>
          <p className="font-semibold" style={{ fontSize: 12 }}>Spaghetti 500g</p>
          <p className="font-bold tabular-nums" style={{ fontSize: 18 }}>₦1,100</p>
          <svg width="220" height="40" viewBox="0 0 220 40" style={{ marginTop: 6 }}>
            {LABEL_BARS.filter(([x]) => x <= 220 * bars).map(([x, w]) => (
              <rect key={x} x={x} y="0" width={w} height="40" fill="#111827" />
            ))}
          </svg>
          <p className="tabular-nums" style={{ fontSize: 9.5, letterSpacing: "0.3em", opacity: prog(t, 6.4, 0.5) }}>6151100023317</p>
        </div>

        <div className="flex items-center justify-between text-gray-700" style={{ marginTop: 16, fontSize: 12 }}>
          <span>Copies</span>
          <span className="flex items-center border border-gray-300" style={{ height: 30 }}>
            <span className="flex items-center justify-center text-gray-500" style={{ width: 28 }}><Minus size={12} /></span>
            <span className="font-semibold text-center tabular-nums" style={{ width: 32 }}>12</span>
            <span className="flex items-center justify-center text-gray-500" style={{ width: 28 }}><Plus size={12} /></span>
          </span>
        </div>

        <Button t={t} press={PRINT_AT} done={PRINT_AT + 0.15} doneLabel="Sent to printer" icon={Printer} style={at(16, 276, 288, 38)}>
          Print 12 labels
        </Button>
      </Panel>
    </>
  );
}

export const stockLevelsCursor = [[0.6, 620, 440], [3.6, 620, 440], [PICK_ROW_AT, 150, 188, true], [5.4, 150, 188], [PRINT_AT, 576, 415, true], [7.6, 576, 415]];

// ---------------------------------------------------------------------------
// Expiry
// ---------------------------------------------------------------------------

const BATCHES = [
  { name: "Fresh bread loaf", batch: "B-0398", qty: 12, note: "Expired 2 days ago", tone: "red", expired: true },
  { name: "Sliced cheese 200g", batch: "B-0377", qty: 6, note: "Expired yesterday", tone: "red", expired: true },
  { name: "Strawberry yoghurt 250ml", batch: "B-0412", qty: 40, note: "Expires in 5 days", tone: "amber" },
  { name: "Orange juice 1L", batch: "B-0420", qty: 24, note: "Expires in 12 days", tone: "amber" },
];
const DISPOSE_AT = 1.9;
const CONFIRM_DISPOSE_AT = 3.9;

export function ExpiryScene({ t }) {
  const removed = prog(t, CONFIRM_DISPOSE_AT + 0.6, 0.6);

  return (
    <>
      <Heading t={t} title="Expiry" sub="Expired units stay listed, and sales skip them, until someone disposes of them" />
      <Tile t={t} start={0.3} accent="border-l-red-600" style={at(24, 62, 236, 72)} label="Already expired" value={removed > 0.5 ? "1 batch · 6 units" : "2 batches · 18 units"} />
      <Tile t={t} start={0.45} accent="border-l-amber-500" style={at(272, 62, 236, 72)} label="Expiring soon" value="2 batches · 64 units" hint="In the next 14 days" />
      <Tile t={t} start={0.6} style={at(520, 62, 236, 72)} label="Value at risk" to={lerp(91200, 74400, removed)} />

      <Panel style={{ ...at(24, 148, 732, 320), ...rise(t, 0.6, 0.8) }}>
        <div className="flex items-center" style={{ padding: "12px 16px", gap: 8 }}>
          <p className="flex-1 font-semibold text-gray-900" style={{ fontSize: 13 }}>Batches</p>
          {["Needs attention", "Expired", "Expiring soon", "All batches"].map((f, i) => (
            <span key={f} className={i === 0 ? "text-white bg-blue-600" : "text-gray-600 bg-gray-100"} style={{ fontSize: 10.5, padding: "4px 9px" }}>{f}</span>
          ))}
        </div>
        {BATCHES.map((b, i) => {
          const isBread = i === 0;
          const y = 46 + (i === 0 ? 0 : (i - removed) * 58);
          return (
            <div key={b.batch} className="absolute flex items-center border-t border-gray-100" style={{ ...at(0, y, 730, 58), padding: "0 16px", gap: 12, opacity: rise(t, 0.8 + i * 0.12, 0.5).opacity * (isBread ? 1 - removed : 1) }}>
              <span className="absolute inset-0 bg-blue-50" style={{ opacity: isBread ? prog(t, DISPOSE_AT, 0.3) : 0 }} />
              <div className="relative" style={{ width: 240 }}>
                <p className="font-medium text-gray-900" style={{ fontSize: 12.5 }}>{b.name}</p>
                <p className="text-gray-500 tabular-nums" style={{ fontSize: 10.5 }}>Batch {b.batch} · Main branch</p>
              </div>
              <span className="relative font-semibold text-gray-800 tabular-nums" style={{ width: 90, fontSize: 12 }}>{b.qty} units</span>
              <span className="relative flex-1"><Tag tone={b.tone}>{b.note}</Tag></span>
              {b.expired && (
                <span className="relative flex items-center text-red-700 border border-red-200" style={{ gap: 6, padding: "5px 10px", fontSize: 11, transform: `scale(${isBread && t >= DISPOSE_AT && t < DISPOSE_AT + 0.25 ? 0.95 : 1})` }}>
                  <Trash2 size={12} /> Dispose
                </span>
              )}
            </div>
          );
        })}
      </Panel>

      <div className="absolute flex items-center bg-white border border-l-4 border-gray-200 shadow-xl border-l-green-600" style={{ ...at(24, 412, 420, 46), ...rise(t, CONFIRM_DISPOSE_AT + 0.9, 0.6, 12), gap: 8, padding: "0 14px", fontSize: 11.5 }}>
        <CircleCheck size={14} className="text-green-600" />
        <span className="text-gray-800">Stock ledger: <b>−12</b> Fresh bread loaf · “Expired, disposed of”</span>
      </div>

      <Popup t={t} show={DISPOSE_AT + 0.2} hide={CONFIRM_DISPOSE_AT + 0.25} style={{ ...at(220, 130, 340, 230), padding: 18 }}>
        <p className="font-semibold text-gray-900" style={{ fontSize: 14 }}>Dispose of stock</p>
        <p className="text-gray-500" style={{ fontSize: 11, marginTop: 2 }}>Fresh bread loaf · batch B-0398 · 12 expired units</p>
        <Field t={t} label="Units to dispose of" value={typed(t, 2.5, "12", 6)} active={t > 2.4 && t < 2.9} style={at(18, 64, 304, 56)} />
        <Field t={t} label="Note" value={typed(t, 2.9, "Past expiry date, binned", 22)} active={t > 2.9 && t < CONFIRM_DISPOSE_AT} style={at(18, 122, 304, 56)} />
        <Button t={t} tone="danger" press={CONFIRM_DISPOSE_AT} icon={Trash2} style={at(18, 182, 304, 34)}>Dispose of 12 units</Button>
      </Popup>
    </>
  );
}

export const expiryCursor = [[0.4, 560, 440], [DISPOSE_AT, 690, 223, true], [2.4, 390, 222], [3.3, 390, 222], [CONFIRM_DISPOSE_AT, 390, 329, true], [4.8, 390, 329], [6.0, 640, 98]];

// ---------------------------------------------------------------------------
// Stock transfers
// ---------------------------------------------------------------------------

const BOXES = [1.6, 2.0, 2.4];
const BOX_FLIGHT = 1.4;
const SEND_AT = 1.1;

export function TransfersScene({ t }) {
  const sent = BOXES.reduce((n, s) => n + 8 * prog(t, s, 0.3), 0);
  const landed = BOXES.reduce((n, s) => n + 8 * prog(t, s + BOX_FLIGHT, 0.3), 0);

  const store = (left, Icon, name, count, badge, delay) => (
    <Panel style={{ ...at(left, 90, 260, 196), ...rise(t, delay, 0.8, 18), padding: 20 }}>
      <div className="flex items-center" style={{ gap: 10 }}>
        <span className="flex items-center justify-center text-blue-700 bg-blue-50" style={{ width: 34, height: 34 }}>
          <Icon size={18} />
        </span>
        <div>
          <p className="font-semibold text-gray-900" style={{ fontSize: 13 }}>{name}</p>
          <p className="text-gray-500" style={{ fontSize: 10.5 }}>Granulated sugar 1kg</p>
        </div>
      </div>
      <p className="font-bold text-gray-900 tabular-nums" style={{ fontSize: 40, marginTop: 18, lineHeight: 1 }}>{Math.round(count)}</p>
      <p className="text-gray-500" style={{ fontSize: 11, marginTop: 4 }}>units on hand</p>
      <div className="absolute" style={{ left: 20, bottom: 18 }}>{badge}</div>
    </Panel>
  );

  return (
    <>
      <Heading t={t} title="Stock transfers" sub="Move stock between the back store, the shop floor and other branches; both counts update together" />

      {store(24, Warehouse, "Back store", 240 - sent, null, 0.2)}
      {store(496, Store, "Shop floor", 6 + landed, <Swap t={t} items={[[0, <Tag key="l" tone="amber">Low stock</Tag>], [3.9, <Tag key="r" tone="green">Restocked</Tag>]]} />, 0.35)}

      <Button t={t} press={SEND_AT} style={{ ...at(300, 166, 180, 44), ...rise(t, 0.5, 0.7), fontSize: 12.5 }}>
        Send 24 units <ArrowRight size={15} />
      </Button>

      {BOXES.map((start) => {
        const k = clamp((t - start) / BOX_FLIGHT);
        if (k <= 0 || k >= 1) return null;
        const e = easeInOut(k);
        const lift = Math.sin(Math.PI * e);
        return (
          <div
            key={start}
            className="absolute flex items-center justify-center border rounded-md shadow-lg text-amber-700 bg-amber-100 border-amber-300"
            style={{ ...at(lerp(154, 626, e) - 16, 150 - lift * 110 - 16, 32, 32), opacity: Math.min(1, k * 6, (1 - k) * 6), transform: `rotate(${(e - 0.5) * 36}deg) scale(${0.8 + lift * 0.3})` }}
          >
            <Package size={16} />
          </div>
        );
      })}

      <Panel style={{ ...at(24, 306, 732, 162), ...rise(t, 0.6, 0.8), padding: "14px 20px" }}>
        <p className="font-semibold text-gray-900" style={{ fontSize: 13 }}>Stock ledger</p>
        {[
          ["TR-031", "Back store → Shop floor · Granulated sugar 1kg", "−24 / +24", 4.4],
          ["Alert", "Low stock cleared on the shop floor", "30 on hand", 4.9],
        ].map(([ref, text, amount, start]) => (
          <div key={ref} className="flex items-center justify-between border-b border-gray-100" style={{ ...rise(t, start, 0.7, 8), padding: "10px 0", fontSize: 12 }}>
            <span className="flex items-center" style={{ gap: 10 }}>
              <span className="font-semibold text-blue-700 bg-blue-50 tabular-nums" style={{ fontSize: 10, padding: "2px 7px" }}>{ref}</span>
              <span className="text-gray-700">{text}</span>
            </span>
            <span className="font-semibold text-gray-900 tabular-nums">{amount}</span>
          </div>
        ))}
      </Panel>
    </>
  );
}

export const transfersCursor = [[0.2, 600, 440], [SEND_AT, 390, 188, true], [2.2, 390, 188], [3.6, 560, 420]];

// ---------------------------------------------------------------------------
// Stock ledger
// ---------------------------------------------------------------------------

const MOVES = [
  ["08:00", "Stock count / correction", "gray", "Count SC-112 · Amaka Obi", -2, 18],
  ["10:14", "Sale", "blue", "INV-1031 · Till 1", -6, 12],
  ["12:40", "Sale", "blue", "INV-1042 · Till 1", -1, 11],
  ["13:05", "Sale", "blue", "INV-1047 · Till 2", -5, 6],
  ["14:20", "Transfer in", "green", "TR-031 · from Back store", 24, 30],
  ["15:02", "Sale deleted", "amber", "INV-1037 · Amaka Obi", 1, 31],
];
const REASON_AT = 4.6;

export function LedgerScene({ t }) {
  const salesOnly = prog(t, REASON_AT + 0.2, 0.5);
  const chips = [
    ["Product", "Granulated sugar 1kg", 24, 220],
    ["Store", "Shop floor", 252, 150],
  ];

  return (
    <>
      <Heading t={t} title="Stock ledger" sub="Every unit in or out, with the reason, the document and who did it. Counts never change silently" />
      {chips.map(([k, v, x, w], i) => (
        <span key={k} className="absolute flex items-center justify-between bg-gray-100" style={{ ...at(x, 62, w, 30), ...rise(t, 0.3 + i * 0.1, 0.5, 6), padding: "0 10px", fontSize: 11 }}>
          <span><span className="text-gray-500">{k}: </span><span className="text-gray-900">{v}</span></span>
          <ChevronDown size={12} className="text-gray-400" />
        </span>
      ))}
      <span className="absolute flex items-center justify-between bg-gray-100" style={{ ...at(410, 62, 180, 30), ...rise(t, 0.5, 0.5, 6), padding: "0 10px", fontSize: 11, transform: `scale(${t >= REASON_AT && t < REASON_AT + 0.25 ? 0.96 : 1})` }}>
        <span><span className="text-gray-500">Reason: </span><Swap t={t} items={[[0, <span key="e" className="text-gray-900">Every reason</span>], [REASON_AT + 0.2, <span key="s" className="font-semibold text-blue-700">Sale</span>]]} /></span>
        <ChevronDown size={12} className="text-gray-400" />
      </span>

      <Panel style={{ ...at(24, 104, 732, 364), ...rise(t, 0.4, 0.8) }}>
        <div className="flex font-semibold tracking-wide text-gray-500 uppercase bg-gray-50 border-b border-gray-200" style={{ height: 32, alignItems: "center", padding: "0 16px", fontSize: 9.5 }}>
          <span style={{ width: 60 }}>Time</span>
          <span style={{ width: 190 }}>Reason</span>
          <span style={{ width: 250 }}>Reference</span>
          <span style={{ width: 90, textAlign: "right" }}>Change</span>
          <span className="flex-1 text-right">Balance</span>
        </div>
        {MOVES.map(([time, reason, tone, ref, change, balance], i) => {
          const k = prog(t, 0.8 + i * 0.45, 0.6, easeOut);
          const dim = reason === "Sale" ? 1 : lerp(1, 0.25, salesOnly);
          return (
            <div key={time} className="absolute flex items-center border-b border-gray-100" style={{ ...at(0, 32 + i * 52, 730, 52), padding: "0 16px", fontSize: 12, opacity: k * dim, transform: `translateY(${(1 - k) * -10}px)` }}>
              <Flash t={t} from={0.8 + i * 0.45} dur={1} />
              <span className="relative text-gray-500 tabular-nums" style={{ width: 60 }}>{time}</span>
              <span className="relative" style={{ width: 190 }}><Tag tone={tone}>{reason}</Tag></span>
              <span className="relative text-gray-700" style={{ width: 250 }}>{ref}</span>
              <span className={`relative font-semibold tabular-nums ${change > 0 ? "text-green-600" : "text-red-600"}`} style={{ width: 90, textAlign: "right" }}>
                {change > 0 ? `+${change}` : `−${-change}`}
              </span>
              <span className="relative flex items-center justify-end flex-1 font-semibold text-gray-900 tabular-nums" style={{ gap: 8 }}>
                <span className="bg-gray-100" style={{ width: 60, height: 5 }}>
                  <span className="block h-full bg-blue-600" style={{ width: `${(balance / 32) * 100}%` }} />
                </span>
                {balance}
              </span>
            </div>
          );
        })}
      </Panel>
    </>
  );
}

export const ledgerCursor = [[0.5, 620, 440], [3.8, 620, 440], [REASON_AT, 500, 77, true], [5.4, 500, 77], [6.6, 420, 200]];
