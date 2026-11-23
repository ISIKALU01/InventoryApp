// Cinematic "system boot" loader: a SellaPad core with orbiting feature icons,
// a radar sweep and a live boot log. Colours follow the user's accent setting.
//
//   <SystemLoader />                                   full screen, open-ended
//   <SystemLoader duration={7000} />                   full screen, fills in 7s
//   <SystemLoader message="Checking your access" />    custom subtitle
//   <SystemLoader variant="inline" message="Loading products" />
import { useEffect, useState } from "react";
import {
  Package,
  ScanBarcode,
  ShoppingCart,
  Receipt,
  Truck,
  ChartColumn,
  Wallet,
  Users,
  Warehouse,
  CalendarClock,
  ArrowLeftRight,
  Tags,
  Check,
} from "lucide-react";
import styles from "./SystemLoader.module.css";

// Each ring carries a group of the app's features
const RINGS = [
  { key: "inner", icons: [Package, ScanBarcode, ShoppingCart] },
  { key: "middle", icons: [Receipt, Truck, ChartColumn, Wallet] },
  { key: "outer", icons: [Warehouse, CalendarClock, ArrowLeftRight, Users, Tags] },
];

const DEFAULT_STEPS = [
  "Establishing secure session",
  "Syncing inventory ledger",
  "Reconciling stock levels",
  "Loading sales & POS registers",
  "Scanning expiry dates",
  "Compiling dashboard insights",
];

// Fixed positions (no Math.random) so server and client render the same markup
const PARTICLES = [
  [8, 14, 0], [18, 72, 2.1], [27, 38, 4.3], [36, 88, 1.2], [44, 22, 3.4],
  [53, 64, 0.6], [61, 9, 2.8], [69, 47, 5.1], [77, 81, 1.7], [84, 29, 3.9],
  [91, 58, 0.9], [13, 93, 4.7], [72, 16, 2.4], [32, 55, 5.6],
];

// Progress in %: linear when a duration is known, otherwise eases toward 95%
function useProgress(duration) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const next = duration
        ? Math.min(100, (elapsed / duration) * 100)
        : 95 * (1 - Math.exp(-elapsed / 2600));
      setProgress(next);
      if (next >= 100) clearInterval(id);
    }, 60);
    return () => clearInterval(id);
  }, [duration]);

  return progress;
}

function Orbit({ rings }) {
  return (
    <div className={styles.orbit} aria-hidden="true">
      <div className={styles.sweep} />
      {rings.map((ring) => (
        <div key={ring.key} className={`${styles.ring} ${styles[ring.key]}`}>
          {ring.icons.map((Icon, i) => (
            <div
              key={i}
              className={styles.slot}
              style={{ "--a": `${(360 / ring.icons.length) * i}deg` }}
            >
              <div className={styles.chip} style={{ "--delay": `${i * 0.45}s` }}>
                <Icon strokeWidth={1.8} />
              </div>
            </div>
          ))}
        </div>
      ))}
      <div className={styles.core}>
        <span className={`${styles.coreArc} animate-spin`} />
        <span className={styles.monogram}>S</span>
      </div>
    </div>
  );
}

function FullScreen({ message, steps, duration }) {
  const progress = useProgress(duration);
  const active = Math.min(steps.length - 1, Math.floor((progress / 100) * steps.length));
  const finished = progress >= 100;
  // Log reads like a terminal: newest line at the bottom, last four visible
  const visible = steps.slice(0, active + 1).map((text, i) => ({ text, i })).slice(-4);

  return (
    <div className={`${styles.screen} ${styles.full}`} role="status" aria-live="polite">
      <div className={styles.grid} />
      <div className={styles.scanline} />
      {PARTICLES.map(([x, y, d], i) => (
        <span
          key={i}
          className={styles.particle}
          style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${d}s` }}
        />
      ))}

      <Orbit rings={RINGS} />

      <div className={styles.brand}>
        <h1 className={styles.title}>SellaPad</h1>
        <p className={styles.tagline}>{message}</p>
      </div>

      <div className={styles.console}>
        <div className={styles.consoleHead}>
          <span className={styles.live}>
            <span className={styles.liveDot} /> sellapad://core
          </span>
          <span>{Math.floor(progress)}%</span>
        </div>
        <ul className={styles.log}>
          {visible.map(({ text, i }) => {
            const done = i < active || finished;
            return (
              <li key={i} className={done ? styles.done : styles.running}>
                <span className={styles.mark}>
                  {done ? <Check size={13} strokeWidth={3} /> : <span className={styles.blink}>›</span>}
                </span>
                <span className={styles.logText}>{text}</span>
                <span className={styles.state}>{done ? "OK" : "···"}</span>
              </li>
            );
          })}
        </ul>
        <div className={styles.track}>
          <div className={styles.fill} style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}

function Inline({ message }) {
  return (
    <div className={styles.inlineWrap} role="status" aria-live="polite">
      <Orbit rings={RINGS.slice(0, 2)} />
      <p className={styles.inlineText}>
        {message}
        <span className={styles.dots}>
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </p>
    </div>
  );
}

export default function SystemLoader({
  variant = "fullscreen",
  message = "Own your inventory. Control your sales. Scale with confidence.",
  steps = DEFAULT_STEPS,
  duration,
}) {
  if (variant === "inline") return <Inline message={message} />;
  return <FullScreen message={message} steps={steps} duration={duration} />;
}
