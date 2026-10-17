// components/AppGuide.js
// The app guide: a slow, three-minute "video" tour of SellaPad, played in a
// modal from the top bar. It isn't a recorded file: every frame is drawn from
// one clock (seconds), so it stays sharp at any size, follows the theme and
// accent colour, and can be paused, scrubbed, slowed down or jumped by chapter.
//
// The chapters live in components/guide/ (script.js is the running order).
// The stage is laid out on a fixed 960x540 canvas and scaled to fit the modal.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Boxes,
  CirclePlay,
  Folder,
  Inbox,
  LayoutDashboard,
  ListVideo,
  MapPin,
  Pause,
  Play,
  RotateCcw,
  Settings,
  ShoppingBasket,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";
import {
  CONTENT_H,
  CONTENT_W,
  SIDEBAR_W,
  STAGE_H,
  STAGE_W,
  TOPBAR_H,
  at,
  clamp,
  easeInOut,
  easeOut,
  formatTime,
  lerp,
  prog,
} from "./guide/kit";
import { SCENES, SECTIONS, TOTAL, accentTour, sceneIndexAt } from "./guide/script";

const FADE = 0.5;

// The sidebar as the guide draws it (`menu` in script.js indexes this)
const MENU = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Inbox", icon: Inbox },
  { label: "Sales", icon: ShoppingCart },
  { label: "Inventory", icon: Boxes },
  { label: "Purchasing", icon: ShoppingBasket },
  { label: "Folio", icon: Folder },
  { label: "User Management", icon: Users },
  { label: "Settings", icon: Settings },
];
const menuY = (index) => 64 + index * 38;

// ---------------------------------------------------------------------------
// Stage
// ---------------------------------------------------------------------------

// The app's sidebar and top bar around the page chapters
function Chrome({ opacity, activeY, page, titleOpacity, sidebarColor }) {
  const faint = "rgba(255,255,255,0.72)";
  const line = "rgba(255,255,255,0.12)";

  return (
    <div className="absolute inset-0" style={{ opacity }}>
      <div className="absolute flex flex-col bg-indigo-800" style={{ ...at(0, 0, SIDEBAR_W, STAGE_H), color: "#fff", ...(sidebarColor && { backgroundColor: sidebarColor }) }}>
        <div className="flex items-center font-bold" style={{ height: TOPBAR_H, padding: "0 16px", fontSize: 17, borderBottom: `1px solid ${line}` }}>
          SellaPad
        </div>
        <div className="absolute rounded-lg" style={{ ...at(8, activeY, 164, 34), background: "rgba(0,0,0,0.22)" }} />
        {MENU.map(({ label, icon: Icon }, i) => {
          const near = clamp(1 - Math.abs(activeY - menuY(i)) / 38);
          return (
            <div key={label} className="absolute flex items-center font-medium" style={{ ...at(8, menuY(i), 164, 34), gap: 10, padding: "0 12px", fontSize: 12.5, color: near > 0.5 ? "#fff" : faint }}>
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

      <div className="absolute flex items-center justify-between bg-white border-b border-gray-200" style={{ ...at(SIDEBAR_W, 0, CONTENT_W, TOPBAR_H), padding: "0 24px" }}>
        <span className="text-gray-800" style={{ fontSize: 15, opacity: titleOpacity }}>{page}</span>
        <div className="flex items-center text-gray-500" style={{ gap: 14 }}>
          <span className="border border-gray-200 text-gray-600" style={{ fontSize: 10.5, padding: "3px 8px" }}>Main branch</span>
          <span className="relative">
            <Bell size={15} />
            <span className="absolute flex items-center justify-center bg-red-600 rounded-full" style={{ ...at(8, -6, 13, 13), fontSize: 8, color: "#fff" }}>3</span>
          </span>
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
        <span className="absolute rounded-full pointer-events-none bg-blue-500" style={{ ...at(click[1] - 22, click[2] - 22, 44, 44), transform: `scale(${0.2 + ripple})`, opacity: 0.45 * (1 - ripple) }} />
      )}
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        className="absolute pointer-events-none"
        style={{ left: x - 4, top: y - 2, opacity: prog(t, keys[0][0] - 0.4, 0.5), transform: `scale(${press})`, transformOrigin: "4px 2px", filter: "drop-shadow(0 2px 3px rgb(0 0 0 / 0.35))" }}
      >
        <path d="M4 2 L4 19 L8.5 14.8 L11.5 21.5 L14.3 20.3 L11.4 13.7 L17.5 13.5 Z" fill="#fff" stroke="#111827" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </>
  );
}

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

// The chapter list, over the stage
function ChapterMenu({ current, onPick, onClose }) {
  return (
    <div
      className="absolute inset-0 z-10 overflow-y-auto guide-backdrop-in"
      style={{ background: "rgb(11 16 32 / 0.92)", color: "#fff" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="sticky top-0 flex items-center justify-between px-4 py-3 sm:px-5" style={{ background: "rgb(11 16 32 / 0.96)" }}>
        <p className="text-sm font-semibold">Chapters</p>
        <button type="button" onClick={onClose} aria-label="Close chapters" className="flex items-center justify-center w-8 h-8 transition-colors rounded-full hover:bg-white/10" style={{ color: "#fff" }}>
          <X size={16} />
        </button>
      </div>
      <div className="grid gap-x-6 gap-y-4 px-4 pb-5 sm:px-5 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <div key={section}>
            <p className="mb-1 text-[10px] font-semibold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>{section}</p>
            {SCENES.map((s, i) =>
              s.section !== section ? null : (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => onPick(i)}
                  className="flex items-center w-full gap-3 px-2 py-1.5 text-left transition-colors rounded hover:bg-white/10"
                  style={{ background: i === current ? "rgba(255,255,255,0.14)" : undefined }}
                >
                  <span className="w-5 text-[11px] tabular-nums" style={{ color: "rgba(255,255,255,0.5)" }}>{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1 text-sm truncate" style={{ color: "#fff" }}>{s.title}</span>
                  <span className="text-[11px] tabular-nums" style={{ color: "rgba(255,255,255,0.45)" }}>{formatTime(s.start)}</span>
                </button>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AppGuideModal({ onClose }) {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [closing, setClosing] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
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

  const openChapter = (i) => {
    seek(SCENES[i].start);
    setShowChapters(false);
    setPlaying(true);
  };

  const requestClose = useCallback(() => {
    setPlaying(false);
    setClosing(true);
  }, []);

  // Let the modal settle before the video starts. With reduced motion it waits
  // for the viewer to press play.
  useEffect(() => {
    setAccent(document.documentElement.dataset.accent || "default");
    const reduce = document.documentElement.dataset.motion === "reduce" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
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
        if (showChapters) setShowChapters(false);
        else requestClose();
      } else if (showChapters) {
        // Let the chapter list handle its own keys
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
  }, [jump, requestClose, showChapters, togglePlay]);

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
        style={{ width: "min(1000px, 100%, max(520px, calc((100dvh - 270px) * 16 / 9 + 48px)))" }}
      >
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-200 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex items-center justify-center w-9 h-9 text-blue-700 bg-blue-50 shrink-0">
              <CirclePlay size={20} />
            </span>
            <div className="min-w-0">
              <h2 id="app-guide-title" className="text-base font-semibold text-gray-900">App guide</h2>
              <p className="text-xs text-gray-500 truncate">
                {SCENES.length} chapters · {formatTime(TOTAL)} · Space to pause, arrows to skip
              </p>
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
          >
            <div aria-hidden="true" className="absolute top-0 left-0" style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
              <Stage time={time} ctx={ctx} />
            </div>

            <div
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
              style={{ background: "rgb(0 0 0 / 0.28)", opacity: playing ? 0 : 1, pointerEvents: playing ? "none" : "auto" }}
            >
              <span
                className="flex items-center justify-center gap-2 transition-transform duration-300 rounded-full shadow-2xl hover:scale-105"
                style={{ background: "rgba(255,255,255,0.94)", color: "#111827", padding: ended ? "14px 22px" : 18 }}
              >
                {ended ? (
                  <>
                    <RotateCcw size={20} /> <span className="text-sm font-semibold">Watch again</span>
                  </>
                ) : (
                  <Play size={26} style={{ marginLeft: 3 }} />
                )}
              </span>
            </div>

            {showChapters && <ChapterMenu current={index} onPick={openChapter} onClose={() => setShowChapters(false)} />}
          </div>
        </div>

        <div className="px-5 pt-4 sm:px-6" aria-live="polite">
          <div key={index} className="guide-caption-in">
            <p className="text-[11px] font-semibold tracking-wider text-blue-600 tabular-nums">
              {String(index + 1).padStart(2, "0")} / {SCENES.length} · {scene.section.toUpperCase()}
            </p>
            <p className="mt-0.5 text-base font-semibold text-gray-900">{scene.title}</p>
            <p className="mt-0.5 text-sm text-gray-600">{scene.caption}</p>
            {scene.where && (
              <p className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500">
                <MapPin size={12} className="text-blue-600 shrink-0" />
                Find it in <span className="font-medium text-gray-700">{scene.where}</span>
              </p>
            )}
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
            className="flex items-center flex-1 h-6 gap-[2px] cursor-pointer group touch-none"
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
                title={`${i + 1}. ${s.title}`}
                className={`h-1.5 overflow-hidden transition-[height] duration-200 group-hover:h-2.5 ${i === index ? "bg-blue-100" : "bg-gray-200"}`}
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
            onClick={() => {
              setShowChapters((v) => !v);
              setPlaying(false);
            }}
            aria-expanded={showChapters}
            className={`flex items-center gap-1.5 px-2.5 h-9 text-xs font-semibold border shrink-0 transition-colors ${
              showChapters ? "text-white bg-blue-600 border-blue-600" : "text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
          >
            <ListVideo size={15} />
            <span className="hidden sm:inline">Chapters</span>
          </button>
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
