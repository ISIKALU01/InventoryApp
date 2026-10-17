// components/guide/kit.js
// Building blocks for the app guide's scenes (see components/AppGuide.js).
// Everything is drawn from the scene's local clock `t` (seconds), on a fixed
// 960x540 stage. Sizes are px, not rem, so the Interface size setting can't
// break the layout. Page scenes use content-area coordinates (780x492).
import { CircleCheck } from "lucide-react";

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------

export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOut = (x) => 1 - Math.pow(1 - x, 3);

// 0 → 1 as t moves through [start, start + dur], eased
export const prog = (t, start, dur = 0.6, curve = easeInOut) => curve(clamp((t - start) / dur));

// Fade and rise into place
export const rise = (t, start, dur = 0.7, dist = 14) => {
  const k = prog(t, start, dur, easeOut);
  return { opacity: k, transform: `translateY(${(1 - k) * dist}px)` };
};

// Fade out after `start` (for things that leave)
export const leave = (t, start, dur = 0.5) => 1 - prog(t, start, dur);

// A quick dip when something is clicked at `at`
export const pressScale = (t, at) => (at !== undefined && t >= at && t < at + 0.25 ? 0.96 : 1);

// Text typed one character at a time from `start`
export const typed = (t, start, text, cps = 16) => text.slice(0, Math.max(0, Math.floor((t - start) * cps)));
export const typingEnds = (start, text, cps = 16) => start + text.length / cps;

// A count that eases from one value to another
export const countTo = (t, start, from, to, dur = 1) => lerp(from, to, prog(t, start, dur, easeOut));

// ---------------------------------------------------------------------------
// Formatting and layout
// ---------------------------------------------------------------------------

export const at = (left, top, width, height) => ({ position: "absolute", left, top, width, height });

export const naira = (n) => `${n < 0 ? "−" : ""}₦${Math.abs(Math.round(n)).toLocaleString("en-NG")}`;

export const formatTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// Blend in OKLCH so colours stay vivid mid-change instead of greying out
export const mixColor = (a, b, k) => `color-mix(in oklch, ${b} ${(k * 100).toFixed(1)}%, ${a})`;

// ---------------------------------------------------------------------------
// Stage geometry
// ---------------------------------------------------------------------------

export const STAGE_W = 960;
export const STAGE_H = 540;
export const SIDEBAR_W = 180;
export const TOPBAR_H = 48;
export const CONTENT_W = STAGE_W - SIDEBAR_W;
export const CONTENT_H = STAGE_H - TOPBAR_H;

// Intro and outro sit on the brand gradient. Colours are inline because the
// dark theme remaps white and pale shades inside the page area.
export const BRAND_BG = {
  background:
    "linear-gradient(135deg, var(--color-indigo-900, #312e81) 0%, var(--color-indigo-700, #4338ca) 55%, var(--color-blue-500, #3b82f6) 100%)",
  color: "#fff",
};
export const GLASS = { background: "rgba(255,255,255,0.14)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.28)" };

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

export const Panel = ({ style, className = "", children }) => (
  <div className={`absolute bg-white border border-gray-200 ${className}`} style={style}>
    {children}
  </div>
);

export const Heading = ({ t, title, sub, start = 0.1 }) => (
  <div style={{ ...at(24, 10, 732, 44), ...rise(t, start) }}>
    <p className="font-bold text-gray-900" style={{ fontSize: 19 }}>{title}</p>
    <p className="text-gray-500" style={{ fontSize: 11 }}>{sub}</p>
  </div>
);

export const Kicker = ({ children, style }) => (
  <p className="font-semibold tracking-wide text-gray-500 uppercase" style={{ fontSize: 9.5, ...style }}>{children}</p>
);

const TONES = {
  amber: "text-amber-800 bg-amber-50",
  green: "text-green-800 bg-green-50",
  blue: "text-blue-800 bg-blue-50",
  purple: "text-purple-800 bg-purple-50",
  red: "text-red-700 bg-red-50",
  gray: "text-gray-600 bg-gray-100",
};

export const Tag = ({ tone = "gray", children, style }) => (
  <span className={`inline-flex items-center font-medium whitespace-nowrap ${TONES[tone]}`} style={{ fontSize: 10.5, padding: "3px 8px", gap: 5, ...style }}>
    {children}
  </span>
);

// Cross-fades through `items` ([time, node]); the first shows from the start
export const Swap = ({ t, items, dur = 0.5, style }) => (
  <span className="inline-grid" style={style}>
    {items.map(([start, node], i) => {
      const next = items[i + 1];
      const opacity = Math.min(i === 0 ? 1 : prog(t, start, dur), next ? 1 - prog(t, next[0], dur) : 1);
      return (
        <span key={i} style={{ gridArea: "1 / 1", opacity, transform: `translateY(${(1 - Math.min(1, opacity * 2)) * 4}px)` }}>
          {node}
        </span>
      );
    })}
  </span>
);

// A button that dips when pressed and can turn green with a done label
export const Button = ({ t, press, done, doneLabel, icon: Icon, children, style, tone = "primary" }) => {
  const k = done !== undefined ? prog(t, done, 0.4) : 0;
  const tones = {
    primary: "text-white bg-blue-600",
    secondary: "text-gray-700 bg-white border border-gray-300",
    danger: "text-white bg-red-600",
  };
  const { transform = "", ...rest } = style || {};
  return (
    <div
      className={`absolute flex items-center justify-center overflow-hidden font-medium whitespace-nowrap ${tones[tone]}`}
      style={{ gap: 7, fontSize: 12, ...rest, transform: `${transform} scale(${pressScale(t, press)})` }}
    >
      <span className="absolute inset-0 bg-green-600" style={{ opacity: k }} />
      <span className="relative flex items-center" style={{ gap: 7, color: k > 0.5 ? "#fff" : undefined }}>
        {k > 0.5 ? (
          <>
            <CircleCheck size={14} /> {doneLabel}
          </>
        ) : (
          <>
            {Icon && <Icon size={14} />}
            {children}
          </>
        )}
      </span>
    </div>
  );
};

// A labelled input. `value` may be partly typed; the caret blinks while active.
export const Field = ({ t, label, value, placeholder, active, style, icon: Icon, suffix }) => (
  <div className="absolute" style={style}>
    <Kicker>{label}</Kicker>
    <div
      className={`flex items-center bg-white border ${active ? "border-blue-600" : "border-gray-300"}`}
      style={{ marginTop: 5, height: 32, padding: "0 10px", gap: 8, fontSize: 12, boxShadow: active ? "0 0 0 1px var(--color-blue-600, #2563eb)" : undefined }}
    >
      {Icon && <Icon size={14} className="text-gray-400 shrink-0" />}
      <span className={`flex-1 truncate ${value ? "text-gray-900" : "text-gray-400"}`}>
        {value || placeholder}
        {active && <span className="inline-block bg-gray-900" style={{ width: 1, height: 13, marginLeft: 1, verticalAlign: -2, opacity: Math.sin(t * 9) > 0 ? 1 : 0 }} />}
      </span>
      {suffix}
    </div>
  </div>
);

// A small figure tile that counts up
export const Tile = ({ t, start = 0.3, style, label, value, to, format = naira, hint, accent }) => (
  <Panel className={accent ? `border-l-4 ${accent}` : ""} style={{ ...style, ...rise(t, start, 0.8, 16), padding: "11px 14px" }}>
    <Kicker>{label}</Kicker>
    <p className="font-bold text-gray-900 tabular-nums" style={{ fontSize: 18, marginTop: 4 }}>
      {value ?? format(to)}
    </p>
    {hint && <p className="text-gray-500" style={{ fontSize: 10, marginTop: 1 }}>{hint}</p>}
  </Panel>
);

// A soft flash behind a row that has just changed
export const Flash = ({ t, from, dur = 1.4 }) => (
  <span className="absolute inset-0 bg-blue-50" style={{ opacity: t >= from ? 1 - prog(t, from, dur) : 0 }} />
);

export const Avatar = ({ name, size = 30, style }) => (
  <span
    className="flex items-center justify-center font-semibold text-blue-700 bg-blue-50 rounded-full shrink-0"
    style={{ width: size, height: size, fontSize: size * 0.36, ...style }}
  >
    {name
      .split(" ")
      .slice(0, 2)
      .map((p) => p[0])
      .join("")}
  </span>
);

// A toggle switch that flips at `flip` (or stays put)
export const Toggle = ({ t, on, flip }) => {
  const k = flip === undefined ? (on ? 1 : 0) : on ? 1 - prog(t, flip, 0.35) : prog(t, flip, 0.35);
  return (
    <span className="relative inline-block rounded-full" style={{ width: 34, height: 19 }}>
      <span className="absolute inset-0 bg-gray-300 rounded-full" />
      <span className="absolute inset-0 bg-blue-600 rounded-full" style={{ opacity: k }} />
      <span className="absolute rounded-full shadow" style={{ ...at(2 + 15 * k, 2, 15, 15), background: "#fff" }} />
    </span>
  );
};

// A modal-like card that pops in at `show` and leaves at `hide`
export const Popup = ({ t, show, hide, style, children, className = "" }) => {
  const k = prog(t, show, 0.6, easeOut) * (hide === undefined ? 1 : leave(t, hide, 0.4));
  if (k <= 0) return null;
  const { transform = "", ...rest } = style;
  return (
    <>
      <span className="absolute inset-0" style={{ background: "rgb(0 0 0 / 0.14)", opacity: k }} />
      <Panel className={`shadow-2xl ${className}`} style={{ ...rest, opacity: k, transform: `${transform} translateY(${(1 - k) * 14}px) scale(${lerp(0.97, 1, k)})` }}>
        {children}
      </Panel>
    </>
  );
};
