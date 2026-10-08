// Appearance preferences (theme, accent colour, interface size, motion).
// Stored per device in localStorage and applied as data-* attributes on
// <html>; the matching CSS lives in src/styles/globals.css.

export const APPEARANCE_KEY = "appearance";
export const APPEARANCE_EVENT = "appearancechange";

export const DEFAULT_APPEARANCE = {
  theme: "light", // "light" | "dark" | "system"
  accent: "default",
  scale: "default", // "compact" | "default" | "large"
  reduceMotion: false,
};

export const THEMES = [
  { id: "light", label: "Light", hint: "Bright and clear for daytime" },
  { id: "dark", label: "Dark", hint: "Easier on the eyes at night" },
  { id: "system", label: "System", hint: "Follow this device's setting" },
];

// `swatch` is the 600 shade used for buttons; `sidebar` the 800 shade
export const ACCENTS = [
  { id: "default", label: "Classic", swatch: "#2563eb", sidebar: "#3730a3" },
  { id: "emerald", label: "Emerald", swatch: "#059669", sidebar: "#065f46" },
  { id: "teal", label: "Teal", swatch: "#0d9488", sidebar: "#115e59" },
  { id: "violet", label: "Violet", swatch: "#7c3aed", sidebar: "#5b21b6" },
  { id: "rose", label: "Rose", swatch: "#e11d48", sidebar: "#9f1239" },
  { id: "orange", label: "Orange", swatch: "#ea580c", sidebar: "#9a3412" },
];

export const SCALES = [
  { id: "compact", label: "Compact", hint: "Fits more on small screens", sample: "text-xs" },
  { id: "default", label: "Default", hint: "Recommended", sample: "text-sm" },
  { id: "large", label: "Large", hint: "Bigger text and touch targets", sample: "text-base" },
];

const pick = (value, options, fallback) =>
  options.some((o) => o.id === value) ? value : fallback;

const sanitize = (raw = {}) => ({
  theme: pick(raw.theme, THEMES, DEFAULT_APPEARANCE.theme),
  accent: pick(raw.accent, ACCENTS, DEFAULT_APPEARANCE.accent),
  scale: pick(raw.scale, SCALES, DEFAULT_APPEARANCE.scale),
  reduceMotion: Boolean(raw.reduceMotion),
});

export const loadAppearance = () => {
  try {
    return sanitize(JSON.parse(localStorage.getItem(APPEARANCE_KEY)) || {});
  } catch {
    return { ...DEFAULT_APPEARANCE };
  }
};

export const prefersDark = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-color-scheme: dark)").matches;

export const resolveTheme = (theme) =>
  theme === "system" ? (prefersDark() ? "dark" : "light") : theme;

export const applyAppearance = (appearance) => {
  if (typeof document === "undefined") return;
  const { theme, accent, scale, reduceMotion } = sanitize(appearance);
  const root = document.documentElement;
  root.setAttribute("data-theme", resolveTheme(theme));
  root.setAttribute("data-accent", accent);
  root.setAttribute("data-scale", scale);
  root.setAttribute("data-motion", reduceMotion ? "reduce" : "full");
};

export const saveAppearance = (appearance) => {
  const clean = sanitize(appearance);
  try {
    localStorage.setItem(APPEARANCE_KEY, JSON.stringify(clean));
  } catch {
    // Storage blocked: still applies for this visit
  }
  applyAppearance(clean);
  window.dispatchEvent(new CustomEvent(APPEARANCE_EVENT, { detail: clean }));
  return clean;
};

// Runs in <head> before the page paints, so a dark theme never flashes light
export const appearanceScript = `(function(){try{var d=document.documentElement,a=JSON.parse(localStorage.getItem(${JSON.stringify(
  APPEARANCE_KEY
)})||"{}")||{},t=a.theme||"light";if(t==="system")t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";d.setAttribute("data-theme",t==="dark"?"dark":"light");d.setAttribute("data-accent",a.accent||"default");d.setAttribute("data-scale",a.scale||"default");d.setAttribute("data-motion",a.reduceMotion?"reduce":"full");}catch(e){}})();`;
