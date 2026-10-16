// components/AppGuide.js
// The app guide: a slow, one-minute "video" of SellaPad at work, played in a
// modal from the top bar. It isn't a recorded file: every frame is drawn from
// one clock (seconds), so it stays sharp at any size, follows the theme and
// accent colour, and can be paused, scrubbed and slowed down.
//
// The stage is laid out on a fixed 960x540 canvas (sizes in px, not rem, so the
// Interface size setting can't break it) and scaled to fit the modal.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Boxes,
  CircleCheck,
  CirclePlay,
  ClipboardList,
  FileText,
  Folder,
  LayoutDashboard,
  Minus,
  Package,
  PackageCheck,
  Palette,
  Pause,
  Play,
  Plus,
  Printer,
  RotateCcw,
  Scale,
  ScanLine,
  Settings,
  ShoppingBasket,
  ShoppingCart,
  Store,
  Truck,
  Users,
  Wallet,
  Warehouse,
  X,
} from "lucide-react";
import { ACCENTS } from "../../utils/appearance";

// ---------------------------------------------------------------------------
// Timing helpers
// ---------------------------------------------------------------------------

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, k) => a + (b - a) * k;
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = (x) => 1 - Math.pow(1 - x, 3);

// 0 → 1 as t moves through [start, start + dur], eased
const prog = (t, start, dur = 0.6, curve = easeInOut) => curve(clamp((t - start) / dur));

// Fade and rise into place
const rise = (t, start, dur = 0.7, dist = 14) => {
  const k = prog(t, start, dur, easeOut);
  return { opacity: k, transform: `translateY(${(1 - k) * dist}px)` };
};

// Absolute box on the stage
const at = (left, top, width, height) => ({ position: "absolute", left, top, width, height });

const naira = (n) => `₦${Math.round(n).toLocaleString("en-NG")}`;

const formatTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// Blend in OKLCH so colours stay vivid mid-change instead of greying out
const mixColor = (a, b, k) => `color-mix(in oklch, ${b} ${(k * 100).toFixed(1)}%, ${a})`;

// ---------------------------------------------------------------------------
// Stage geometry
// ---------------------------------------------------------------------------

const STAGE_W = 960;
const STAGE_H = 540;
const SIDEBAR_W = 180;
const TOPBAR_H = 48;
const CONTENT_W = STAGE_W - SIDEBAR_W;
const CONTENT_H = STAGE_H - TOPBAR_H;
const FADE = 0.5;

const MENU = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Sales", icon: ShoppingCart },
  { label: "Inventory", icon: Boxes },
  { label: "Purchasing", icon: ShoppingBasket },
  { label: "Folio", icon: Folder },
  { label: "Staff & Roles", icon: Users },
  { label: "Settings", icon: Settings },
];
const menuY = (index) => 64 + index * 38;

// Intro and outro sit on the brand gradient. Colours are inline because the
// dark theme remaps white and pale shades inside the page area.
const BRAND_BG = {
  background:
    "linear-gradient(135deg, var(--color-indigo-900, #312e81) 0%, var(--color-indigo-700, #4338ca) 55%, var(--color-blue-500, #3b82f6) 100%)",
  color: "#fff",
};
const GLASS = { background: "rgba(255,255,255,0.14)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.28)" };

// ---------------------------------------------------------------------------
// Shared stage pieces
// ---------------------------------------------------------------------------

// Soft light blobs drifting behind the brand scenes
function Orbs({ t }) {
  const orbs = [
    { x: 120, y: 60, size: 420, phase: 0 },
    { x: 640, y: 260, size: 480, phase: 2.1 },
    { x: 420, y: -160, size: 360, phase: 4.2 },
  ];
  return orbs.map((o) => (
    <div
      key={o.phase}
      className="absolute rounded-full pointer-events-none"
      style={{
        left: o.x + Math.sin(t * 0.35 + o.phase) * 40,
        top: o.y + Math.cos(t * 0.3 + o.phase) * 30,
        width: o.size,
        height: o.size,
        background: "radial-gradient(circle, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 70%)",
      }}
    />
  ));
}

// The app's sidebar and top bar around the page scenes
function Chrome({ opacity, activeY, page, titleOpacity, sidebarColor }) {
  const faint = "rgba(255,255,255,0.72)";
  const line = "rgba(255,255,255,0.12)";

  return (
    <div className="absolute inset-0" style={{ opacity }}>
      <div
        className="absolute flex flex-col bg-indigo-800"
        style={{ ...at(0, 0, SIDEBAR_W, STAGE_H), color: "#fff", ...(sidebarColor && { backgroundColor: sidebarColor }) }}
      >
        <div className="flex items-center font-bold" style={{ height: TOPBAR_H, padding: "0 16px", fontSize: 17, borderBottom: `1px solid ${line}` }}>
          SellaPad
        </div>
        <div className="absolute rounded-lg" style={{ ...at(8, activeY, 164, 34), background: "rgba(0,0,0,0.22)" }} />
        {MENU.map(({ label, icon: Icon }, i) => {
          const near = clamp(1 - Math.abs(activeY - menuY(i)) / 38);
          return (
            <div
              key={label}
              className="absolute flex items-center font-medium"
              style={{ ...at(8, menuY(i), 164, 34), gap: 10, padding: "0 12px", fontSize: 12.5, color: near > 0.5 ? "#fff" : faint }}
            >
              <Icon size={15} />
              {label}
            </div>
          );
        })}
        <div className="absolute flex items-center" style={{ ...at(0, STAGE_H - 60, SIDEBAR_W, 60), gap: 10, padding: "0 16px", borderTop: `1px solid ${line}` }}>
          <div className="flex items-center justify-center font-bold rounded-full" style={{ width: 30, height: 30, fontSize: 11, background: "rgba(255,255,255,0.18)" }}>
            SM
          </div>
          <div style={{ fontSize: 11, lineHeight: 1.3 }}>
            <div className="font-medium">Store manager</div>
            <div style={{ color: faint }}>Main branch</div>
          </div>
        </div>
      </div>

      <div
        className="absolute flex items-center justify-between bg-white border-b border-gray-200"
        style={{ ...at(SIDEBAR_W, 0, CONTENT_W, TOPBAR_H), padding: "0 24px" }}
      >
        <span className="text-gray-800" style={{ fontSize: 15, opacity: titleOpacity }}>
          {page}
        </span>
        <div className="flex items-center text-gray-500" style={{ gap: 14 }}>
          <span className="border border-gray-200 text-gray-600" style={{ fontSize: 10.5, padding: "3px 8px" }}>
            Main branch
          </span>
          <Bell size={15} />
        </div>
      </div>
      <div className="absolute bg-gray-100" style={at(SIDEBAR_W, TOPBAR_H, CONTENT_W, CONTENT_H)} />
    </div>
  );
}

// Cursor keyframes: [time, x, y, click?]. It glides between keys and clicks
// (with a ripple) on keys marked true.
const cursorAt = (keys, t) => {
  if (t <= keys[0][0]) return { x: keys[0][1], y: keys[0][2] };
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, x0, y0] = keys[i];
    const [t1, x1, y1] = keys[i + 1];
    if (t <= t1) {
      const k = easeInOut(clamp((t - t0) / (t1 - t0)));
      return { x: lerp(x0, x1, k), y: lerp(y0, y1, k) };
    }
  }
  const last = keys[keys.length - 1];
  return { x: last[1], y: last[2] };
};

function Cursor({ keys, t }) {
  if (!keys?.length) return null;
  const { x, y } = cursorAt(keys, t);
  const click = keys.filter((k) => k[3] && k[0] <= t).pop();
  const since = click ? t - click[0] : Infinity;
  const press = since < 0.3 ? 1 - Math.sin((since / 0.3) * Math.PI) * 0.18 : 1;
  const ripple = easeOut(clamp(since / 0.8));

  return (
    <>
      {since < 0.8 && (
        <span
          className="absolute rounded-full pointer-events-none bg-blue-500"
          style={{ ...at(click[1] - 22, click[2] - 22, 44, 44), transform: `scale(${0.2 + ripple})`, opacity: 0.45 * (1 - ripple) }}
        />
      )}
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        className="absolute pointer-events-none"
        style={{
          left: x - 4,
          top: y - 2,
          opacity: prog(t, keys[0][0] - 0.4, 0.5),
          transform: `scale(${press})`,
          transformOrigin: "4px 2px",
          filter: "drop-shadow(0 2px 3px rgb(0 0 0 / 0.35))",
        }}
      >
        <path d="M4 2 L4 19 L8.5 14.8 L11.5 21.5 L14.3 20.3 L11.4 13.7 L17.5 13.5 Z" fill="#fff" stroke="#111827" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </>
  );
}

const Panel = ({ style, className = "", children }) => (
  <div className={`absolute bg-white border border-gray-200 ${className}`} style={style}>
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// Scenes. Each gets its local time t (seconds from the scene start).
// Page scenes use content-area coordinates (780x492).
// ---------------------------------------------------------------------------

function IntroScene({ t }) {
  const logo = prog(t, 0.3, 1.4, easeOut);
  return (
    <div className="absolute inset-0 overflow-hidden" style={BRAND_BG}>
      <Orbs t={t} />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className="flex items-center justify-center rounded-2xl"
          style={{ ...GLASS, width: 84, height: 84, opacity: logo, transform: `scale(${lerp(0.6, 1, logo)}) rotate(${lerp(-10, 0, logo)}deg)` }}
        >
          <ShoppingBasket size={42} />
        </div>
        <div className="flex font-bold" style={{ marginTop: 26, fontSize: 54, letterSpacing: "-0.02em" }}>
          {"SellaPad".split("").map((ch, i) => (
            <span key={i} style={rise(t, 1.0 + i * 0.08, 0.9, 22)}>
              {ch}
            </span>
          ))}
        </div>
        <p style={{ ...rise(t, 2.1, 1), marginTop: 12, fontSize: 19, color: "rgba(255,255,255,0.82)" }}>
          Sell, stock and buy, all in one place
        </p>
        <p style={{ ...rise(t, 2.9, 1), marginTop: 28, fontSize: 11, letterSpacing: "0.32em", color: "rgba(255,255,255,0.6)" }}>
          A ONE-MINUTE TOUR
        </p>
      </div>
    </div>
  );
}

const KPIS = [
  { label: "Sales for today", value: 1284500, note: "+12.4% on yesterday", tone: "text-green-600" },
  { label: "Cost of goods sold", value: 812300, note: "63% of sales", tone: "text-gray-500" },
  { label: "Expenses for today", value: 96400, note: "-4.1% on yesterday", tone: "text-green-600" },
  { label: "Profit for today", value: 375800, note: "+18.9% on yesterday", tone: "text-green-600" },
];
const CATEGORIES = [
  ["Beverages", 0.82],
  ["Groceries", 0.64],
  ["Dairy", 0.48],
  ["Snacks", 0.36],
  ["Household", 0.22],
];
const CHART_W = 438;
const CHART_H = 200;
const TREND = [32, 40, 36, 52, 48, 60, 58, 72, 66, 80, 76, 92];
const TREND_POINTS = TREND.map((v, i) => [(i * CHART_W) / (TREND.length - 1), CHART_H - (v / 100) * 180]);
const TREND_LINE = TREND_POINTS.reduce((d, p, i, a) => {
  if (i === 0) return `M${p}`;
  const p0 = a[i - 2] || a[i - 1];
  const p1 = a[i - 1];
  const p3 = a[i + 1] || p;
  const c1 = [p1[0] + (p[0] - p0[0]) / 6, p1[1] + (p[1] - p0[1]) / 6];
  const c2 = [p[0] - (p3[0] - p1[0]) / 6, p[1] - (p3[1] - p1[1]) / 6];
  return `${d} C${c1} ${c2} ${p}`;
}, "");
const TREND_AREA = `${TREND_LINE} L${CHART_W},${CHART_H} L0,${CHART_H} Z`;
const [HOVER_X, HOVER_Y] = TREND_POINTS[9];

function DashboardScene({ t }) {
  const draw = prog(t, 2.2, 2.8);
  const hover = prog(t, 5.9, 0.5, easeOut);

  return (
    <>
      <div style={{ ...at(24, 12, 500, 40), ...rise(t, 0.2) }}>
        <p className="font-bold text-gray-900" style={{ fontSize: 19 }}>Ops Center</p>
        <p className="text-gray-500" style={{ fontSize: 11 }}>Today · All branches</p>
      </div>

      {KPIS.map((k, i) => (
        <Panel key={k.label} style={{ ...at(24 + i * 186, 60, 174, 88), ...rise(t, 0.4 + i * 0.15, 0.8, 18), padding: "12px 16px" }}>
          <p className="font-semibold tracking-wide text-gray-500 uppercase" style={{ fontSize: 9.5 }}>{k.label}</p>
          <p className="font-bold text-gray-900 tabular-nums" style={{ fontSize: 19, marginTop: 6 }}>
            {naira(k.value * prog(t, 0.6 + i * 0.2, 1.8, easeOut))}
          </p>
          <p className={k.tone} style={{ fontSize: 10, marginTop: 2, opacity: prog(t, 2.2 + i * 0.1, 0.6) }}>{k.note}</p>
        </Panel>
      ))}

      <Panel style={{ ...at(24, 164, 470, 304), ...rise(t, 1.2, 0.9, 18) }}>
        <div style={{ padding: "12px 16px" }}>
          <p className="font-semibold text-gray-900" style={{ fontSize: 13 }}>Sales trend</p>
          <p className="text-gray-500" style={{ fontSize: 10 }}>Last 12 days</p>
        </div>
        <svg className="text-blue-600" style={at(16, 52, CHART_W, CHART_H)} viewBox={`0 0 ${CHART_W} ${CHART_H}`} overflow="visible">
          <defs>
            <linearGradient id="guide-trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <line key={f} x1="0" x2={CHART_W} y1={CHART_H * f} y2={CHART_H * f} className="text-gray-200" stroke="currentColor" strokeDasharray="3 4" />
          ))}
          <path d={TREND_AREA} fill="url(#guide-trend-fill)" style={{ opacity: prog(t, 3.8, 1.4) }} />
          <path d={TREND_LINE} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - draw} />
          <circle cx={HOVER_X} cy={HOVER_Y} r={5 * hover} fill="currentColor" stroke="var(--color-white, #fff)" strokeWidth="2.5" />
        </svg>
        <div
          className="absolute text-white bg-gray-900 shadow-lg theme-fixed"
          style={{ ...at(16 + HOVER_X - 56, 52 + HOVER_Y - 58, 112, 42), padding: "5px 10px", opacity: hover, transform: `translateY(${(1 - hover) * 6}px)` }}
        >
          <p style={{ fontSize: 9.5, opacity: 0.7 }}>Day 10</p>
          <p className="font-semibold tabular-nums" style={{ fontSize: 12 }}>₦1,420,000</p>
        </div>
      </Panel>

      <Panel style={{ ...at(506, 164, 250, 304), ...rise(t, 1.4, 0.9, 18), padding: "12px 16px" }}>
        <p className="font-semibold text-gray-900" style={{ fontSize: 13 }}>Top categories</p>
        <p className="text-gray-500" style={{ fontSize: 10 }}>Share of today&apos;s sales</p>
        {CATEGORIES.map(([name, share], i) => {
          const k = prog(t, 2.6 + i * 0.18, 1.3);
          return (
            <div key={name} style={{ marginTop: i === 0 ? 20 : 16 }}>
              <div className="flex justify-between text-gray-700" style={{ fontSize: 11 }}>
                <span>{name}</span>
                <span className="tabular-nums text-gray-500">{Math.round(share * 100 * k)}%</span>
              </div>
              <div className="bg-gray-100" style={{ height: 6, marginTop: 5 }}>
                <div className="h-full bg-blue-600" style={{ width: `${share * 100 * k}%`, opacity: lerp(1, 0.55, i / 4) }} />
              </div>
            </div>
          );
        })}
      </Panel>
    </>
  );
}

const CART = [
  { name: "Full cream milk 400g", code: "6154000052041", price: 2450, at: 1.5 },
  { name: "Spaghetti 500g", code: "6151100023317", price: 1100, at: 2.7 },
  { name: "Granulated sugar 1kg", code: "6152200041125", price: 1850, at: 3.9 },
];
const SCANS = [0.9, 2.1, 3.3, 4.5]; // the fourth scans the milk again
const REPEAT_AT = 5.1;
const PAY_METHODS = ["Cash", "Transfer", "Card", "Customer"];
const PAY_AT = 6.0;
const COMPLETE_AT = 7.5;

function SalesScene({ t }) {
  const scanning = SCANS.findIndex((s) => t >= s && t < s + 0.6);
  const scanned = scanning >= 0 ? -1 : SCANS.findIndex((s) => t >= s + 0.6 && t < s + 1.3);
  const scannedCode = scanned >= 0 ? CART[scanned % 3].code : null;
  const milkQty = t >= REPEAT_AT ? 2 : 1;
  const total =
    CART.reduce((sum, item) => sum + item.price * prog(t, item.at, 0.6), 0) + CART[0].price * prog(t, REPEAT_AT, 0.6);
  const picked = prog(t, PAY_AT, 0.35);
  const done = prog(t, COMPLETE_AT + 0.15, 0.4);
  const pressed = t >= COMPLETE_AT && t < COMPLETE_AT + 0.25;

  return (
    <>
      <Panel style={{ ...at(24, 16, 470, 452), ...rise(t, 0.1, 0.8) }}>
        <div className="absolute flex items-center overflow-hidden bg-white border border-gray-300" style={{ ...at(16, 16, 436, 40), gap: 10, padding: "0 12px" }}>
          <ScanLine size={16} className={scanning >= 0 ? "text-red-500" : "text-gray-400"} />
          <span className={scannedCode ? "text-green-600 font-medium tabular-nums" : "text-gray-400"} style={{ fontSize: 12 }}>
            {scanning >= 0 ? "Scanning…" : scannedCode ? `${scannedCode}  ✓` : "Scan a barcode, or search by name or SKU"}
          </span>
          {scanning >= 0 && (
            <span
              className="absolute bg-red-500"
              style={{
                left: 8,
                right: 8,
                top: 19,
                height: 2,
                boxShadow: "0 0 10px 2px rgb(239 68 68 / 0.6)",
                opacity: 0.65 + 0.35 * Math.sin(t * 38),
                transform: `scaleX(${prog(t, SCANS[scanning], 0.3, easeOut)})`,
              }}
            />
          )}
        </div>

        <div className="absolute flex font-semibold tracking-wide text-gray-500 uppercase border-b border-gray-200" style={{ ...at(16, 72, 436, 26), fontSize: 9.5 }}>
          <span style={{ width: 250 }}>Item</span>
          <span style={{ width: 60 }}>Qty</span>
          <span className="flex-1 text-right">Amount</span>
        </div>

        {CART.map((item, i) => {
          const k = prog(t, item.at, 0.6, easeOut);
          const flash = Math.max(t >= item.at ? 1 - prog(t, item.at, 1.4) : 0, i === 0 && t >= REPEAT_AT ? 1 - prog(t, REPEAT_AT, 1.4) : 0);
          const qty = i === 0 ? milkQty : 1;
          const bump = i === 0 ? 1 + 0.3 * Math.sin(Math.PI * clamp((t - REPEAT_AT) / 0.4)) : 1;
          return (
            <div
              key={item.name}
              className="absolute flex items-center border-b border-gray-100"
              style={{ ...at(16, 104 + i * 48, 436, 48), opacity: k, transform: `translateX(${(1 - k) * -16}px)` }}
            >
              <span className="absolute inset-0 bg-blue-50" style={{ opacity: flash }} />
              <div className="relative" style={{ width: 250 }}>
                <p className="font-medium text-gray-900" style={{ fontSize: 12.5 }}>{item.name}</p>
                <p className="text-gray-400 tabular-nums" style={{ fontSize: 10 }}>{naira(item.price)} each</p>
              </div>
              <span className="relative inline-block font-semibold text-gray-800 tabular-nums" style={{ width: 60, fontSize: 13 }}>
                <span className="inline-block" style={{ transform: `scale(${bump})` }}>× {qty}</span>
              </span>
              <span className="relative flex-1 font-semibold text-right text-gray-900 tabular-nums" style={{ fontSize: 13 }}>
                {naira(item.price * qty)}
              </span>
            </div>
          );
        })}

        <div className="absolute flex justify-between text-gray-500 border-t border-gray-200" style={{ ...at(16, 404, 436, 34), paddingTop: 10, fontSize: 11, opacity: prog(t, 1.5, 0.6) }}>
          <span>{CART.filter((item) => t >= item.at).length} items · {CART.filter((item) => t >= item.at).length + (t >= REPEAT_AT ? 1 : 0)} units</span>
          <span>Main branch till</span>
        </div>
      </Panel>

      <Panel style={{ ...at(506, 16, 250, 452), ...rise(t, 0.3, 0.8), padding: 16 }}>
        <p className="font-semibold tracking-wide text-gray-500 uppercase" style={{ fontSize: 9.5 }}>Total</p>
        <p className="font-bold text-gray-900 tabular-nums" style={{ fontSize: 28, marginTop: 2 }}>{naira(total)}</p>

        <p className="absolute font-semibold tracking-wide text-gray-500 uppercase" style={{ left: 16, top: 104, fontSize: 9.5 }}>Payment method</p>
        {PAY_METHODS.map((m, i) => {
          const on = m === "Transfer" ? picked : 0;
          return (
            <div
              key={m}
              className="absolute flex items-center justify-center overflow-hidden text-gray-700 border border-gray-300"
              style={{ ...at(16 + (i % 2) * 113, 124 + Math.floor(i / 2) * 44, 105, 36), fontSize: 12 }}
            >
              <span className="absolute inset-0 bg-blue-600" style={{ opacity: on }} />
              <span className="relative" style={{ color: on > 0.5 ? "#fff" : undefined }}>{m}</span>
            </div>
          );
        })}

        <div className="absolute" style={{ ...at(16, 224, 218, 60), ...rise(t, PAY_AT + 0.3, 0.6) }}>
          <p className="font-semibold tracking-wide text-gray-500 uppercase" style={{ fontSize: 9.5 }}>Paid into</p>
          <div className="flex items-center justify-between text-gray-800 border border-gray-300" style={{ marginTop: 6, height: 34, padding: "0 10px", fontSize: 12 }}>
            GTBank •••• 2041 <span className="text-gray-400">▾</span>
          </div>
        </div>

        <div
          className="absolute flex items-center justify-center overflow-hidden font-medium text-white bg-blue-600"
          style={{ ...at(16, 392, 218, 44), gap: 8, fontSize: 13, opacity: lerp(0.45, 1, picked), transform: `scale(${pressed ? 0.96 : 1})` }}
        >
          <span className="absolute inset-0 bg-green-600" style={{ opacity: done }} />
          <span className="relative flex items-center" style={{ gap: 8 }}>
            {done > 0.5 ? <><CircleCheck size={16} /> Sale saved</> : "Complete sale"}
          </span>
        </div>
      </Panel>

      <div
        className="absolute bg-white border border-l-4 border-gray-200 shadow-xl border-l-green-600"
        style={{ ...at(104, 300, 300, 58), ...rise(t, COMPLETE_AT + 0.35, 0.7, 16), padding: "9px 14px" }}
      >
        <p className="flex items-center font-semibold text-gray-900" style={{ gap: 6, fontSize: 12.5 }}>
          <CircleCheck size={14} className="text-green-600" /> Sale saved
        </p>
        <p className="text-gray-600" style={{ fontSize: 11, marginTop: 2 }}>INV-1042 · ₦7,850 · receipt ready to print</p>
      </div>
    </>
  );
}

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

function InventoryScene({ t }) {
  const label = prog(t, PICK_ROW_AT + 0.3, 0.9, easeOut);
  const bars = prog(t, 5.3, 1.4);
  const printed = prog(t, PRINT_AT + 0.15, 0.4);
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
            <div
              key={row.sku}
              className="absolute flex items-center border-b border-gray-100"
              style={{ ...at(0, 88 + i * 56, 730, 56), padding: "0 16px", opacity: k, transform: `translateY(${(1 - k) * 10}px)` }}
            >
              <span className="absolute inset-0 bg-blue-50" style={{ opacity: picked }} />
              <span className="relative font-medium text-gray-900" style={{ width: 240, fontSize: 12.5 }}>{row.name}</span>
              <span className="relative text-gray-500 tabular-nums" style={{ width: 110, fontSize: 11 }}>{row.sku}</span>
              <span className="relative flex items-center" style={{ width: 210, gap: 10 }}>
                <span className="bg-gray-100" style={{ width: 130, height: 6 }}>
                  <span
                    className={`block h-full ${row.flag === "low" ? "bg-amber-500" : "bg-blue-600"}`}
                    style={{ width: `${(row.qty / STOCK_MAX) * 100 * fill}%` }}
                  />
                </span>
                <span className="font-semibold text-gray-800 tabular-nums" style={{ fontSize: 12 }}>{Math.round(row.qty * fill)}</span>
              </span>
              <span className="relative" style={{ opacity: badge, transform: `scale(${lerp(0.85, 1, badge)})`, transformOrigin: "left center" }}>
                {row.flag === "low" ? (
                  <span className="font-medium text-amber-700 bg-amber-100" style={{ fontSize: 10.5, padding: "3px 8px", opacity: t > 2.7 ? pulse : 1 }}>
                    Low stock · 6 left
                  </span>
                ) : row.flag === "expiry" ? (
                  <span className="font-medium text-red-700 bg-red-100" style={{ fontSize: 10.5, padding: "3px 8px" }}>
                    Expires in 5 days
                  </span>
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

      <Panel
        className="shadow-2xl"
        style={{ ...at(416, 120, 320, 330), opacity: label, transform: `translateX(${(1 - label) * 40}px)`, padding: 16 }}
      >
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

        <div
          className="absolute flex items-center justify-center overflow-hidden font-medium text-white bg-blue-600"
          style={{ ...at(16, 276, 288, 38), gap: 8, fontSize: 12.5, transform: `scale(${t >= PRINT_AT && t < PRINT_AT + 0.25 ? 0.96 : 1})` }}
        >
          <span className="absolute inset-0 bg-green-600" style={{ opacity: printed }} />
          <span className="relative flex items-center" style={{ gap: 8 }}>
            {printed > 0.5 ? <><CircleCheck size={15} /> Sent to printer</> : <><Printer size={15} /> Print 12 labels</>}
          </span>
        </div>
      </Panel>
    </>
  );
}

const FLOW = [
  {
    label: "Requisition",
    icon: ClipboardList,
    kicker: "Store requisition",
    ref: "REQ-0142",
    status: "Approved",
    rows: [["Spaghetti 500g", "× 48"], ["Granulated sugar 1kg", "× 60"], ["Vegetable oil 1L", "× 24"]],
  },
  {
    label: "Purchase order",
    icon: FileText,
    kicker: "Purchase order",
    ref: "PO-0088",
    status: "Sent",
    rows: [["Supplier", "Bright Foods Ltd"], ["Lines", "12"], ["Order total", "₦640,000"]],
  },
  {
    label: "Goods received",
    icon: PackageCheck,
    kicker: "Goods received",
    ref: "GRN-0311",
    status: "Checked in",
    rows: [["Received", "12 of 12 lines"], ["Short or damaged", "0"], ["Stock added to", "Back store"]],
  },
  {
    label: "SOR reconciliation",
    icon: Scale,
    kicker: "Sale or return",
    ref: "SOR-0057",
    status: "Matched",
    rows: [["Sold", "220 units"], ["Returned", "12 units"], ["Amount due", "₦612,400"]],
  },
  {
    label: "Supplier payment",
    icon: Wallet,
    kicker: "Supplier payment",
    ref: "PAY-0219",
    status: "Paid",
    rows: [["Paid to", "Bright Foods Ltd"], ["Method", "Bank transfer"], ["Amount", "₦612,400"]],
  },
];
const FLOW_AT = [1.0, 2.5, 4.0, 5.5, 7.0];
const flowX = (i) => 90 + i * 150;
const FLOW_Y = 150;

const tokenX = (t) => {
  for (let i = 0; i < FLOW_AT.length - 1; i++) {
    if (t < FLOW_AT[i + 1]) {
      return lerp(flowX(i), flowX(i + 1), prog(t, FLOW_AT[i] + 0.5, FLOW_AT[i + 1] - FLOW_AT[i] - 0.5));
    }
  }
  return flowX(FLOW.length - 1);
};

function PurchasingScene({ t }) {
  const x = tokenX(t);
  return (
    <>
      <div style={{ ...at(24, 12, 700, 50), ...rise(t, 0.2) }}>
        <p className="font-bold text-gray-900" style={{ fontSize: 19 }}>Purchasing, start to finish</p>
        <p className="text-gray-500" style={{ fontSize: 11 }}>Every order follows the same path, so nothing gets lost between the store and the supplier</p>
      </div>

      <div className="absolute bg-gray-200" style={{ ...at(flowX(0), FLOW_Y - 2, flowX(4) - flowX(0), 4), opacity: prog(t, 0.3, 0.6) }} />
      <div className="absolute bg-blue-600" style={{ ...at(flowX(0), FLOW_Y - 2, x - flowX(0), 4), opacity: prog(t, 0.8, 0.4) }} />
      <div
        className="absolute bg-blue-600 rounded-full"
        style={{ ...at(x - 7, FLOW_Y - 7, 14, 14), opacity: prog(t, 0.8, 0.4), boxShadow: "0 0 0 6px rgb(59 130 246 / 0.25), 0 0 18px 4px rgb(59 130 246 / 0.45)" }}
      />

      {FLOW.map(({ label, icon: Icon }, i) => {
        const appear = prog(t, 0.3 + i * 0.12, 0.6, easeOut);
        const lit = prog(t, FLOW_AT[i], 0.5, easeOut);
        const doneK = i < FLOW.length - 1 ? prog(t, FLOW_AT[i + 1], 0.4, easeOut) : prog(t, FLOW_AT[i] + 0.6, 0.4, easeOut);
        return (
          <div key={label} style={{ opacity: appear }}>
            <div
              className="absolute flex items-center justify-center overflow-hidden text-gray-400 bg-white border-2 border-gray-300 rounded-full"
              style={{ ...at(flowX(i) - 24, FLOW_Y - 24, 48, 48), transform: `scale(${appear * (1 + 0.14 * Math.sin(Math.PI * lit))})` }}
            >
              <span className="absolute inset-0 bg-blue-600" style={{ opacity: lit }} />
              <Icon size={20} className="relative" style={{ color: lit > 0.5 ? "#fff" : undefined }} />
            </div>
            <span
              className="absolute flex items-center justify-center bg-green-600 rounded-full"
              style={{ ...at(flowX(i) + 12, FLOW_Y - 30, 18, 18), color: "#fff", opacity: doneK, transform: `scale(${doneK})` }}
            >
              <CircleCheck size={12} />
            </span>
            <p
              className="absolute font-medium text-center text-gray-800"
              style={{ ...at(flowX(i) - 70, FLOW_Y + 34, 140, 20), fontSize: 11.5, opacity: lerp(0.45, 1, lit) }}
            >
              {label}
            </p>
          </div>
        );
      })}

      <Panel className="shadow-sm" style={{ ...at(200, 232, 380, 216), opacity: prog(t, FLOW_AT[0], 0.5) }}>
        {FLOW.map((doc, i) => {
          const fadeOut = i < FLOW.length - 1 ? 1 - prog(t, FLOW_AT[i + 1] - 0.2, 0.4) : 1;
          const style = rise(t, FLOW_AT[i] + 0.15, 0.6, 10);
          return (
            <div key={doc.ref} className="absolute inset-0" style={{ ...style, opacity: style.opacity * fadeOut, padding: "16px 20px" }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold tracking-wide text-gray-500 uppercase" style={{ fontSize: 9.5 }}>{doc.kicker}</p>
                  <p className="font-bold text-gray-900 tabular-nums" style={{ fontSize: 17 }}>{doc.ref}</p>
                </div>
                <span className="font-medium text-green-700 bg-green-100" style={{ fontSize: 10.5, padding: "3px 9px" }}>{doc.status}</span>
              </div>
              <div style={{ marginTop: 12 }}>
                {doc.rows.map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-gray-100" style={{ padding: "8px 0", fontSize: 12 }}>
                    <span className="text-gray-500">{k}</span>
                    <span className="font-semibold text-gray-900 tabular-nums">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </Panel>
    </>
  );
}

const BOXES = [1.6, 2.0, 2.4];
const BOX_FLIGHT = 1.4;
const SEND_AT = 1.1;

function TransfersScene({ t }) {
  const sent = BOXES.reduce((n, s) => n + 8 * prog(t, s, 0.3), 0);
  const landed = BOXES.reduce((n, s) => n + 8 * prog(t, s + BOX_FLIGHT, 0.3), 0);
  const restocked = prog(t, 3.9, 0.6);

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
      <div style={{ ...at(24, 12, 700, 50), ...rise(t, 0.1) }}>
        <p className="font-bold text-gray-900" style={{ fontSize: 19 }}>Stock transfers</p>
        <p className="text-gray-500" style={{ fontSize: 11 }}>Move stock between stores and branches; both counts update together</p>
      </div>

      {store(24, Warehouse, "Back store", 240 - sent, null, 0.2)}
      {store(
        496,
        Store,
        "Shop floor",
        6 + landed,
        <span className="relative block" style={{ height: 20 }}>
          <span className="absolute font-medium whitespace-nowrap text-amber-700 bg-amber-100" style={{ fontSize: 10.5, padding: "3px 8px", opacity: 1 - restocked }}>
            Low stock
          </span>
          <span className="absolute font-medium text-green-700 whitespace-nowrap bg-green-100" style={{ fontSize: 10.5, padding: "3px 8px", opacity: restocked }}>
            Restocked
          </span>
        </span>,
        0.35
      )}

      <div
        className="absolute flex items-center justify-center font-medium text-white bg-blue-600 shadow-lg"
        style={{ ...at(300, 166, 180, 44), gap: 8, fontSize: 12.5, ...rise(t, 0.5, 0.7), ...(t >= SEND_AT && t < SEND_AT + 0.25 && { transform: "scale(0.95)" }) }}
      >
        Send 24 units <ArrowRight size={15} />
      </div>

      {BOXES.map((start) => {
        const k = clamp((t - start) / BOX_FLIGHT);
        if (k <= 0 || k >= 1) return null;
        const e = easeInOut(k);
        const lift = Math.sin(Math.PI * e);
        return (
          <div
            key={start}
            className="absolute flex items-center justify-center border rounded-md shadow-lg text-amber-700 bg-amber-100 border-amber-300"
            style={{
              ...at(lerp(154, 626, e) - 16, 150 - lift * 110 - 16, 32, 32),
              opacity: Math.min(1, k * 6, (1 - k) * 6),
              transform: `rotate(${(e - 0.5) * 36}deg) scale(${0.8 + lift * 0.3})`,
            }}
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

// Settings shows off accent colours: three others, then back to the user's own
const ACCENT_CLICKS = [1.2, 2.6, 4.0, 5.4];
const accentTour = (current) => {
  const others = ["emerald", "violet", "orange", "teal", "rose", "default"].filter((id) => id !== current).slice(0, 3);
  return [current, ...others, current].map((id) => ACCENTS.find((a) => a.id === id) || ACCENTS[0]);
};
const accentStep = (t) => ACCENT_CLICKS.filter((c) => t >= c).length;
const accentColor = (tour, t, key) => {
  const step = accentStep(t);
  if (step === 0) return tour[0][key];
  return mixColor(tour[step - 1][key], tour[step][key], prog(t, ACCENT_CLICKS[step - 1], 0.8));
};
const swatchX = (id) => 96 + ACCENTS.findIndex((a) => a.id === id) * 104;
const SWATCH_Y = 148;

function SettingsScene({ t, ctx }) {
  const step = accentStep(t);
  const selected = ctx.tour[step].id;
  const ringK = step === 0 ? 1 : prog(t, ACCENT_CLICKS[step - 1], 0.4, easeOut);
  const color = accentColor(ctx.tour, t, "swatch");

  return (
    <>
      <Panel style={{ ...at(24, 16, 732, 452), ...rise(t, 0.1, 0.8), padding: "16px 24px" }}>
        <p className="flex items-center font-semibold text-gray-900" style={{ gap: 8, fontSize: 14 }}>
          <Palette size={16} className="text-blue-600" /> Appearance
        </p>
        <p className="text-gray-500" style={{ fontSize: 11 }}>Make SellaPad yours. Changes apply on this device.</p>
        <p className="font-semibold tracking-wide text-gray-500 uppercase" style={{ marginTop: 22, fontSize: 9.5 }}>Accent colour</p>
      </Panel>

      {ACCENTS.map((a, i) => {
        const on = a.id === selected ? ringK : 0;
        return (
          <div key={a.id} style={rise(t, 0.4 + i * 0.08, 0.6, 10)}>
            <span
              className="absolute rounded-full"
              style={{
                ...at(swatchX(a.id) - 20, SWATCH_Y - 20, 40, 40),
                background: a.swatch,
                boxShadow: `0 0 0 ${3 * on}px var(--color-white, #fff), 0 0 0 ${5 * on}px ${a.swatch}`,
              }}
            />
            <span className="absolute text-center text-gray-600" style={{ ...at(swatchX(a.id) - 40, SWATCH_Y + 28, 80, 16), fontSize: 11 }}>
              {a.label}
            </span>
          </div>
        );
      })}

      <div className="absolute border border-gray-200 bg-gray-50" style={{ ...at(48, 222, 684, 222), ...rise(t, 0.8, 0.8), padding: 20 }}>
        <p className="font-semibold tracking-wide text-gray-500 uppercase" style={{ fontSize: 9.5 }}>Preview</p>
        <div className="flex items-center" style={{ marginTop: 16, gap: 16 }}>
          <span className="flex items-center font-medium" style={{ background: color, color: "#fff", padding: "10px 18px", fontSize: 12.5, gap: 8 }}>
            <ShoppingCart size={15} /> Complete sale
          </span>
          <span className="relative rounded-full" style={{ width: 40, height: 22, background: color }}>
            <span className="absolute bg-white rounded-full" style={{ ...at(20, 3, 16, 16), background: "#fff" }} />
          </span>
          <span className="font-medium" style={{ color, fontSize: 12.5 }}>View sales list →</span>
        </div>
        <p className="font-semibold tracking-wide text-gray-500 uppercase" style={{ marginTop: 22, fontSize: 9.5 }}>Interface size</p>
        <div className="flex" style={{ marginTop: 8, gap: 8 }}>
          {["Compact", "Default", "Large"].map((s) => (
            <span
              key={s}
              className={s === "Default" ? "font-medium" : "text-gray-600 border border-gray-300"}
              style={{ padding: "7px 14px", fontSize: 11.5, ...(s === "Default" && { background: color, color: "#fff" }) }}
            >
              {s}
            </span>
          ))}
        </div>
        <div className="bg-gray-200" style={{ marginTop: 22, height: 6 }}>
          <div className="h-full" style={{ width: `${30 + 50 * prog(t, 1, 5)}%`, background: color }} />
        </div>
      </div>
    </>
  );
}

const settingsCursor = (ctx) => {
  const keys = [[0.4, 420, 420]];
  ACCENT_CLICKS.forEach((c, i) => {
    keys.push([c, swatchX(ctx.tour[i + 1].id), SWATCH_Y, true]);
    keys.push([c + 0.35, swatchX(ctx.tour[i + 1].id), SWATCH_Y]);
  });
  keys.push([6.6, 560, 400]);
  return keys;
};

const OUTRO_CHIPS = [
  [ShoppingCart, "Sell"],
  [Boxes, "Track stock"],
  [ShoppingBasket, "Buy"],
  [Truck, "Transfer"],
  [BarChart3, "See profit"],
];

function OutroScene({ t }) {
  const pop = prog(t, 0.3, 0.9, easeOut);
  return (
    <div className="absolute inset-0 overflow-hidden" style={BRAND_BG}>
      <Orbs t={t + 5} />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className="flex items-center justify-center rounded-full"
          style={{ ...GLASS, width: 76, height: 76, opacity: pop, transform: `scale(${lerp(0.5, 1, pop) * (1 + 0.1 * Math.sin(Math.PI * pop))})` }}
        >
          <CircleCheck size={38} />
        </div>
        <p className="font-bold" style={{ ...rise(t, 0.8, 0.9, 18), marginTop: 24, fontSize: 40, letterSpacing: "-0.02em" }}>
          You&apos;re ready
        </p>
        <div className="flex" style={{ marginTop: 22, gap: 10 }}>
          {OUTRO_CHIPS.map(([Icon, label], i) => (
            <span key={label} className="flex items-center rounded-full" style={{ ...GLASS, ...rise(t, 1.5 + i * 0.15, 0.7, 12), gap: 7, padding: "7px 14px", fontSize: 13 }}>
              <Icon size={14} /> {label}
            </span>
          ))}
        </div>
        <p style={{ ...rise(t, 2.8, 1), marginTop: 28, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
          Open this guide any time from the top bar
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Script
// ---------------------------------------------------------------------------

const SCENES = (() => {
  let start = 0;
  return [
    {
      title: "Welcome to SellaPad",
      caption: "A quick look at how the app runs a shop, from the till to the supplier.",
      duration: 5,
      full: true,
      Component: IntroScene,
    },
    {
      title: "Your day at a glance",
      caption: "The dashboard adds up today's sales, cost of goods, expenses and profit as they happen.",
      duration: 8,
      menu: 0,
      page: "Dashboard",
      Component: DashboardScene,
      cursor: [[0.8, 640, 440], [4.6, 640, 440], [5.9, HOVER_X + 40, HOVER_Y + 216]],
    },
    {
      title: "Sell in seconds",
      caption: "Scan a barcode or search, choose how the customer pays, and the sale is saved with a receipt.",
      duration: 10,
      menu: 1,
      page: "Sales",
      Component: SalesScene,
      cursor: [[0.4, 330, 330], [5.2, 330, 330], [PAY_AT, 687, 158, true], [6.7, 687, 158], [COMPLETE_AT, 631, 430, true], [8.4, 631, 430], [9.4, 600, 470]],
    },
    {
      title: "Know what's on the shelf",
      caption: "Stock levels flag low stock and items close to expiry. Print barcode labels for any product.",
      duration: 8.5,
      menu: 2,
      page: "Inventory",
      Component: InventoryScene,
      cursor: [[0.6, 620, 440], [3.6, 620, 440], [PICK_ROW_AT, 150, 188, true], [5.4, 150, 188], [PRINT_AT, 576, 415, true], [7.6, 576, 415]],
    },
    {
      title: "Buy without losing track",
      caption: "Requisition, purchase order, goods received, SOR reconciliation and payment, one step after another.",
      duration: 9,
      menu: 3,
      page: "Purchasing",
      Component: PurchasingScene,
    },
    {
      title: "Move stock between stores",
      caption: "Send stock from the back store to the shop floor. Both counts and the stock ledger update together.",
      duration: 7,
      menu: 2,
      page: "Inventory",
      Component: TransfersScene,
      cursor: [[0.2, 600, 440], [SEND_AT, 390, 188, true], [2.2, 390, 188], [3.6, 560, 420]],
    },
    {
      title: "Make it yours",
      caption: "Pick an accent colour, theme and interface size in Settings. Changes apply on this device.",
      duration: 7,
      menu: 6,
      page: "Settings",
      Component: SettingsScene,
      cursor: settingsCursor,
      sidebarColor: (t, ctx) => accentColor(ctx.tour, t, "sidebar"),
    },
    {
      title: "You're ready",
      caption: "That's the tour. Open this guide again any time from the top bar.",
      duration: 5.5,
      full: true,
      Component: OutroScene,
    },
  ].map((scene) => {
    const timed = { ...scene, start };
    start += scene.duration;
    return timed;
  });
})();
const TOTAL = SCENES.reduce((sum, s) => sum + s.duration, 0);

const sceneIndexAt = (time) => {
  for (let i = SCENES.length - 1; i >= 0; i--) if (time >= SCENES[i].start) return i;
  return 0;
};

function Stage({ time, ctx }) {
  const index = sceneIndexAt(time);
  const scene = SCENES[index];
  const prev = SCENES[index - 1];
  const next = SCENES[index + 1];
  const t = time - scene.start;
  const d = scene.duration;

  const opacity = Math.min(prog(t, 0, index === 0 ? 1 : FADE), next ? 1 - prog(t, d - FADE, FADE) : 1);
  const drift = 1 + (scene.full ? 0.04 : 0.015) * (t / d); // a slow push-in, like a camera
  const keys = typeof scene.cursor === "function" ? scene.cursor(ctx) : scene.cursor;
  const { Component } = scene;
  const body = (
    <div className="absolute inset-0" style={{ opacity, transform: `scale(${drift})` }}>
      <Component t={t} d={d} ctx={ctx} />
      <Cursor keys={keys} t={t} />
    </div>
  );

  if (scene.full) return body;

  const chromeOpacity = Math.min(prev && !prev.full ? 1 : prog(t, 0, FADE), next && !next.full ? 1 : 1 - prog(t, d - FADE, FADE));
  const fromMenu = prev && !prev.full ? prev.menu : scene.menu;

  return (
    <>
      <Chrome
        opacity={chromeOpacity}
        activeY={menuY(lerp(fromMenu, scene.menu, prog(t, 0, 0.9)))}
        page={scene.page}
        titleOpacity={opacity}
        sidebarColor={scene.sidebarColor?.(t, ctx)}
      />
      <div className="absolute overflow-hidden" style={at(SIDEBAR_W, TOPBAR_H, CONTENT_W, CONTENT_H)}>
        {body}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Player modal and the top-bar button
// ---------------------------------------------------------------------------

const SPEEDS = [1, 0.75, 0.5];

export function AppGuideButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 border border-gray-200 shrink-0 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
      aria-label="Open the app guide"
      title="App guide"
    >
      <CirclePlay size={17} className="text-blue-600" />
      <span className="hidden sm:inline">App guide</span>
    </button>
  );
}

export default function AppGuideModal({ onClose }) {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [closing, setClosing] = useState(false);
  const [scale, setScale] = useState(1);
  const [accent, setAccent] = useState("default");
  const timeRef = useRef(0);
  const stageRef = useRef(null);
  const dialogRef = useRef(null);
  const segmentRefs = useRef([]);

  const ctx = useMemo(() => ({ tour: accentTour(accent) }), [accent]);
  const index = sceneIndexAt(time);
  const scene = SCENES[index];
  const ended = time >= TOTAL;

  const seek = useCallback((s) => {
    const v = clamp(s, 0, TOTAL);
    timeRef.current = v;
    setTime(v);
  }, []);

  const togglePlay = useCallback(() => {
    if (timeRef.current >= TOTAL) {
      seek(0);
      setPlaying(true);
    } else {
      setPlaying((p) => !p);
    }
  }, [seek]);

  const jump = useCallback(
    (dir) => {
      const i = sceneIndexAt(timeRef.current);
      if (dir < 0 && timeRef.current - SCENES[i].start > 1.5) seek(SCENES[i].start);
      else seek(SCENES[clamp(i + dir, 0, SCENES.length - 1)].start);
    },
    [seek]
  );

  const requestClose = useCallback(() => {
    setPlaying(false);
    setClosing(true);
  }, []);

  // Let the modal settle before the video starts. With reduced motion it waits
  // for the viewer to press play.
  useEffect(() => {
    setAccent(document.documentElement.dataset.accent || "default");
    const reduce =
      document.documentElement.dataset.motion === "reduce" ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return undefined;
    const id = setTimeout(() => setPlaying(true), 500);
    return () => clearTimeout(id);
  }, []);

  // The clock
  useEffect(() => {
    if (!playing) return undefined;
    let frame;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const next = Math.min(TOTAL, timeRef.current + dt * speed);
      timeRef.current = next;
      setTime(next);
      if (next >= TOTAL) setPlaying(false);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed]);

  // Scale the 960x540 stage to the space it has
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / STAGE_W));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Lock page scroll, take focus, and hand it back on close
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  useEffect(() => {
    if (!closing) return undefined;
    const id = setTimeout(onClose, 220);
    return () => clearTimeout(id);
  }, [closing, onClose]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
      } else if (e.key === " " && !e.target.closest?.("button")) {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        jump(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        jump(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump, requestClose, togglePlay]);

  // Scrubbing: map the pointer onto the chapter under it
  const seekToPointer = (clientX) => {
    const rects = segmentRefs.current.map((el) => el.getBoundingClientRect());
    const i = rects.findIndex((r, n) => clientX <= r.right || n === rects.length - 1);
    seek(SCENES[i].start + clamp((clientX - rects[i].left) / rects[i].width) * SCENES[i].duration);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm ${closing ? "guide-backdrop-out" : "guide-backdrop-in"}`}
      onMouseDown={(e) => e.target === e.currentTarget && requestClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-guide-title"
        tabIndex={-1}
        className={`relative max-h-full overflow-y-auto bg-white shadow-2xl outline-none ${closing ? "guide-panel-out" : "guide-panel-in"}`}
        style={{ width: "min(1000px, 100%, max(520px, calc((100dvh - 250px) * 16 / 9 + 48px)))" }}
      >
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-200 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex items-center justify-center w-9 h-9 text-blue-700 bg-blue-50 shrink-0">
              <CirclePlay size={20} />
            </span>
            <div className="min-w-0">
              <h2 id="app-guide-title" className="text-base font-semibold text-gray-900">App guide</h2>
              <p className="text-xs text-gray-500 truncate">A one-minute tour of SellaPad · Space to pause, arrows to skip</p>
            </div>
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close the app guide"
            className="flex items-center justify-center text-gray-500 transition-colors w-9 h-9 shrink-0 hover:bg-gray-100 hover:text-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pt-5 sm:px-6">
          <div
            ref={stageRef}
            className="relative w-full overflow-hidden cursor-pointer select-none ring-1 ring-gray-200"
            style={{ aspectRatio: "16 / 9", background: "#0b1020" }}
            onClick={togglePlay}
            aria-hidden="true"
          >
            <div className="absolute top-0 left-0" style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
              <Stage time={time} ctx={ctx} />
            </div>

            <div
              className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
              style={{ background: "rgb(0 0 0 / 0.28)", opacity: playing ? 0 : 1, pointerEvents: playing ? "none" : "auto" }}
            >
              <span
                className="flex items-center justify-center gap-2 rounded-full shadow-2xl transition-transform duration-300 hover:scale-105"
                style={{ background: "rgba(255,255,255,0.94)", color: "#111827", padding: ended ? "14px 22px" : 18 }}
              >
                {ended ? <><RotateCcw size={20} /> <span className="text-sm font-semibold">Watch again</span></> : <Play size={26} style={{ marginLeft: 3 }} />}
              </span>
            </div>
          </div>
        </div>

        <div className="px-5 pt-4 sm:px-6" aria-live="polite">
          <div key={index} className="guide-caption-in">
            <p className="text-[11px] font-semibold tracking-wider text-blue-600 tabular-nums">
              {String(index + 1).padStart(2, "0")} / {String(SCENES.length).padStart(2, "0")}
            </p>
            <p className="mt-0.5 text-base font-semibold text-gray-900">{scene.title}</p>
            <p className="mt-0.5 text-sm text-gray-600">{scene.caption}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-5 pt-4 pb-5 sm:px-6">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={ended ? "Replay" : playing ? "Pause" : "Play"}
            className="flex items-center justify-center text-white transition-colors bg-blue-600 w-9 h-9 shrink-0 hover:bg-blue-700"
          >
            {ended ? <RotateCcw size={16} /> : playing ? <Pause size={16} /> : <Play size={16} />}
          </button>

          <div
            role="slider"
            tabIndex={0}
            aria-label="Guide progress"
            aria-valuemin={0}
            aria-valuemax={Math.round(TOTAL)}
            aria-valuenow={Math.round(time)}
            aria-valuetext={`${formatTime(time)}, ${scene.title}`}
            className="flex items-center flex-1 h-6 gap-[3px] cursor-pointer group touch-none"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              seekToPointer(e.clientX);
            }}
            onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && seekToPointer(e.clientX)}
          >
            {SCENES.map((s, i) => (
              <div
                key={s.title}
                ref={(el) => {
                  segmentRefs.current[i] = el;
                }}
                title={s.title}
                className="h-1.5 overflow-hidden bg-gray-200 transition-[height] duration-200 group-hover:h-2.5"
                style={{ flexGrow: s.duration, flexBasis: 0 }}
              >
                <div className="h-full bg-blue-600" style={{ width: `${clamp((time - s.start) / s.duration) * 100}%` }} />
              </div>
            ))}
          </div>

          <span className="hidden text-xs text-gray-500 tabular-nums sm:inline shrink-0">
            {formatTime(time)} / {formatTime(TOTAL)}
          </span>
          <button
            type="button"
            onClick={() => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length])}
            className="px-2.5 h-9 text-xs font-semibold text-gray-700 border border-gray-300 tabular-nums shrink-0 transition-colors hover:bg-gray-100"
            aria-label={`Playback speed ${speed}x`}
            title="Playback speed"
          >
            {speed}×
          </button>
        </div>
      </div>
    </div>
  );
}
