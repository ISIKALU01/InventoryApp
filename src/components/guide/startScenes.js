// components/guide/startScenes.js
// Guide chapters: intro, dashboard, inbox, outro.
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  CircleCheck,
  Megaphone,
  PackageCheck,
  Receipt,
  ShoppingBasket,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { BRAND_BG, GLASS, Heading, Kicker, Panel, Tag, at, easeOut, lerp, naira, prog, rise } from "./kit";

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

// ---------------------------------------------------------------------------

export function IntroScene({ t }) {
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
          Sell, stock, buy and get paid, all in one place
        </p>
        <p style={{ ...rise(t, 2.9, 1), marginTop: 28, fontSize: 11, letterSpacing: "0.32em", color: "rgba(255,255,255,0.6)" }}>
          A GUIDED TOUR · 24 CHAPTERS
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

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

export function DashboardScene({ t }) {
  const draw = prog(t, 2.2, 2.8);
  const hover = prog(t, 5.9, 0.5, easeOut);

  return (
    <>
      <Heading t={t} title="Ops Center" sub="Today · All branches. Tick “By branch” to compare stores side by side" />

      {KPIS.map((k, i) => (
        <Panel key={k.label} style={{ ...at(24 + i * 186, 60, 174, 88), ...rise(t, 0.4 + i * 0.15, 0.8, 18), padding: "12px 16px" }}>
          <Kicker>{k.label}</Kicker>
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

export const dashboardCursor = [[0.8, 640, 440], [4.6, 640, 440], [5.9, HOVER_X + 40, HOVER_Y + 216]];

// ---------------------------------------------------------------------------

const MESSAGES = [
  { icon: PackageCheck, title: "Delivery GRN-0311 is waiting for your store check", meta: "Goods received · 2 min ago", turn: true, unread: true },
  { icon: Wallet, title: "Payment PAY-0219 to Bright Foods Ltd is ready to pay", meta: "Supplier payments · 14 min ago", turn: true, unread: true },
  { icon: Megaphone, title: "Stock count on Saturday, 8am. Please be on time", meta: "From Admin · 40 min ago", to: "To Store managers", unread: true },
  { icon: AlertTriangle, title: "Granulated sugar 1kg is low on the shop floor", meta: "Stock levels · 1 h ago" },
  { icon: Receipt, title: "Expense EXP-0093 (cleaning supplies) was approved", meta: "Expenses · 3 h ago" },
];
const TAB_AT = 4.4;
const OPEN_AT = 5.9;

export function InboxScene({ t }) {
  const turnOnly = prog(t, TAB_AT, 0.5);
  const tabs = [
    ["All", 24, 56],
    ["Unread (3)", 84, 86],
    ["Your turn (2)", 174, 104],
  ];
  return (
    <>
      <Heading t={t} title="Inbox" sub="Messages about everything happening on the platform, sent to the people they concern" />

      {tabs.map(([label, x, w], i) => {
        const on = i === 2 ? turnOnly : i === 0 ? 1 - turnOnly : 0;
        return (
          <div key={label} className="absolute flex items-center justify-center overflow-hidden text-gray-600 border border-gray-200 bg-white" style={{ ...at(x, 62, w, 28), fontSize: 11.5, ...rise(t, 0.3 + i * 0.1, 0.6, 8) }}>
            <span className="absolute inset-0 bg-blue-600" style={{ opacity: on }} />
            <span className="relative" style={{ color: on > 0.5 ? "#fff" : undefined }}>{label}</span>
          </div>
        );
      })}
      <NewMessageButton t={t} />

      <Panel style={{ ...at(24, 100, 732, 368), ...rise(t, 0.3, 0.8) }}>
        {MESSAGES.map((m, i) => {
          const k = prog(t, 0.7 + i * 0.4, 0.6, easeOut);
          const dim = m.turn ? 1 : lerp(1, 0.28, turnOnly);
          const opened = i === 0 ? prog(t, OPEN_AT, 0.4) : 0;
          const Icon = m.icon;
          return (
            <div
              key={m.title}
              className="absolute flex items-center border-b border-gray-100"
              style={{ ...at(0, 8 + i * 60, 730, 60), gap: 14, padding: "0 18px", opacity: k * dim, transform: `translateX(${(1 - k) * 18}px)` }}
            >
              <span className="absolute inset-0 bg-blue-50" style={{ opacity: m.turn ? turnOnly * 0.6 + opened * 0.4 : 0 }} />
              <span className="relative rounded-full bg-blue-600" style={{ width: 7, height: 7, opacity: m.unread ? 1 - opened : 0 }} />
              <span className="relative flex items-center justify-center text-blue-700 bg-blue-50 shrink-0" style={{ width: 34, height: 34 }}>
                <Icon size={17} />
              </span>
              <div className="relative flex-1 min-w-0">
                <p className={`truncate text-gray-900 ${m.unread && opened < 0.5 ? "font-semibold" : ""}`} style={{ fontSize: 12.5 }}>{m.title}</p>
                <p className="text-gray-500" style={{ fontSize: 10.5 }}>{m.meta}</p>
              </div>
              <span className="relative flex items-center" style={{ gap: 8 }}>
                {m.turn && <Tag tone="amber">Your turn</Tag>}
                {m.to && <Tag tone="red">{m.to}</Tag>}
                {i === 0 && (
                  <span className="font-medium text-blue-700" style={{ fontSize: 11, opacity: opened }}>
                    Open delivery →
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </Panel>

      <BellPeek t={t} />
    </>
  );
}

// "New message" for admins, in the corner of the inbox
function NewMessageButton({ t }) {
  return (
    <div className="absolute flex items-center font-medium text-white bg-blue-600" style={{ ...at(640, 62, 116, 28), ...rise(t, 0.6, 0.6, 8), gap: 6, padding: "0 12px", fontSize: 11.5 }}>
      <Megaphone size={13} /> New message
    </div>
  );
}

// The top-bar bell, enlarged for a moment so viewers notice it
function BellPeek({ t }) {
  const k = prog(t, 2.6, 0.6, easeOut) * (1 - prog(t, 4.0, 0.5));
  if (k <= 0) return null;
  return (
    <div className="absolute bg-white border border-gray-200 shadow-xl" style={{ ...at(520, 6, 236, 82), opacity: k, transform: `translateY(${(1 - k) * -10}px)`, padding: "10px 14px" }}>
      <p className="flex items-center font-semibold text-gray-900" style={{ gap: 8, fontSize: 12 }}>
        <span className="flex items-center justify-center text-white bg-red-600 rounded-full" style={{ width: 18, height: 18, fontSize: 10 }}>3</span>
        The bell in the top bar
      </p>
      <p className="text-gray-500" style={{ fontSize: 10.5, marginTop: 4, lineHeight: 1.4 }}>
        Shows unread messages, with a dot when something needs your action.
      </p>
    </div>
  );
}

export const inboxCursor = [[0.5, 560, 430], [3.6, 560, 430], [TAB_AT, 226, 76, true], [5.0, 226, 76], [OPEN_AT, 330, 138, true], [6.8, 330, 138]];

// ---------------------------------------------------------------------------

const OUTRO_CHIPS = [
  [ShoppingCart, "Sell"],
  [Receipt, "Track spending"],
  [Boxes, "Control stock"],
  [ShoppingBasket, "Buy safely"],
  [Truck, "Transfer"],
  [Users, "Manage staff"],
  [BarChart3, "See profit"],
];

export function OutroScene({ t }) {
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
        <div className="flex flex-wrap justify-center" style={{ marginTop: 22, gap: 10, maxWidth: 720 }}>
          {OUTRO_CHIPS.map(([Icon, label], i) => (
            <span key={label} className="flex items-center rounded-full" style={{ ...GLASS, ...rise(t, 1.5 + i * 0.14, 0.7, 12), gap: 7, padding: "7px 14px", fontSize: 13 }}>
              <Icon size={14} /> {label}
            </span>
          ))}
        </div>
        <p style={{ ...rise(t, 2.9, 1), marginTop: 28, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
          Open this guide any time from the top bar, and jump to any chapter
        </p>
      </div>
    </div>
  );
}
