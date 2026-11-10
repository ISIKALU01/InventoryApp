// Online/offline state for the whole app, and the offline service worker
// (public/sw.js) that lets the app open and show its data with no internet.
//
// "Offline" means either the computer has no network, or the backend can't be
// reached (services/http.js reports every request here). Pages read it with
// useConnection().
import { useSyncExternalStore } from "react";
import BASE_URL from "../../config";

const LAST_ONLINE_KEY = "sellapad:last-online";

let state = { online: true, lastOnlineAt: null };
const listeners = new Set();

const emit = (next) => {
  if (next.online === state.online && next.lastOnlineAt === state.lastOnlineAt) return;
  state = next;
  listeners.forEach((listener) => listener());
};

const readLastOnline = () => {
  try {
    return Number(localStorage.getItem(LAST_ONLINE_KEY)) || null;
  } catch {
    return null;
  }
};

/** The backend answered (live, not a saved copy) */
export const reportOnline = () => {
  const now = Date.now();
  try {
    localStorage.setItem(LAST_ONLINE_KEY, String(now));
  } catch {
    // Storage blocked: the time just isn't remembered
  }
  // Only the minute matters on screen; avoid re-rendering on every request
  const last = state.lastOnlineAt && now - state.lastOnlineAt < 60_000 ? state.lastOnlineAt : now;
  emit({ online: true, lastOnlineAt: last });
};

/** No network, or the backend didn't answer */
export const reportOffline = () => emit({ online: false, lastOnlineAt: state.lastOnlineAt ?? readLastOnline() });

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** { online, lastOnlineAt } — lastOnlineAt is when the backend last answered */
export const useConnection = () =>
  useSyncExternalStore(
    subscribe,
    () => state,
    () => state
  );

export const isOnline = () => state.online;

// ---- Service worker ----------------------------------------------------------

// On in production builds. NEXT_PUBLIC_OFFLINE_IN_DEV=true turns it on under
// `next dev` too, but dev reloads code all the time, so test with build + start.
const offlineEnabled = () =>
  process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_OFFLINE_IN_DEV === "true";

const postToWorker = async (message) => {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  registration.active?.postMessage(message);
};

/** Every page and app file in this build, from Next's build manifest */
const appFiles = () => {
  const manifest = window.__BUILD_MANIFEST || {};
  const routes = (manifest.sortedPages || Object.keys(manifest)).filter(
    (route) => route.startsWith("/") && !route.startsWith("/_") && !route.startsWith("/api") && !route.includes("[")
  );
  const files = Object.entries(manifest)
    .filter(([key, value]) => key.startsWith("/") && Array.isArray(value))
    .flatMap(([, value]) => value)
    .map((file) => `/_next/${file.replace(/^\.?\/+/, "")}`);
  return { routes, files };
};

/** Save every page for offline use (only while online) */
export const saveAppForOffline = () => {
  if (!offlineEnabled() || !navigator.onLine) return;
  postToWorker({ type: "warm", ...appFiles() }).catch(() => {});
};

/** Logging out: forget the saved API data, someone else may use this computer next */
export const clearOfflineData = () => postToWorker({ type: "clear-data" }).catch(() => {});

// ---- New version available ---------------------------------------------------
// An open till keeps the code it loaded. Every few minutes (online), ask the
// server which build it serves now; if it's newer, the top bar offers "Reload".

const UPDATE_CHECK_MS = 5 * 60_000;
export const UPDATE_EVENT = "sellapad:update-ready";

const checkForUpdate = async () => {
  const current = window.__NEXT_DATA__?.buildId;
  if (!current || !navigator.onLine) return;
  try {
    // sw-bypass: straight to the server, not the offline copy
    const response = await fetch(`/?sw-bypass=${Date.now()}`, { cache: "no-store" });
    const latest = (await response.text()).match(/"buildId":"([^"]+)"/)?.[1];
    if (latest && latest !== current) {
      window.__sellapadUpdateReady = true;
      window.dispatchEvent(new Event(UPDATE_EVENT));
    }
  } catch {
    // Offline or the server is busy: try again later
  }
};

let started = false;

/** Called once from _app.js */
export const startOffline = () => {
  if (started || typeof window === "undefined") return;
  started = true;

  state = { online: navigator.onLine, lastOnlineAt: readLastOnline() };

  // "Install app": keep the browser's offer for the top-bar button (ConnectionBadge.js)
  const installable = (event) => {
    window.__sellapadInstallPrompt = event;
    window.dispatchEvent(new Event("sellapad:installable"));
  };
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installable(event);
  });
  window.addEventListener("appinstalled", () => installable(null));
  window.addEventListener("offline", reportOffline);
  // Network back: the next request decides if the backend is reachable
  window.addEventListener("online", () => {
    fetch(`${BASE_URL}/test`, { cache: "no-store" })
      .then((response) => (response.headers.get("X-SellaPad-Offline") ? reportOffline() : reportOnline()))
      .catch(reportOffline);
    saveAppForOffline();
  });

  if (!offlineEnabled() || !("serviceWorker" in navigator)) return;
  setInterval(checkForUpdate, UPDATE_CHECK_MS);
  window.addEventListener("online", () => setTimeout(checkForUpdate, 5000));
  navigator.serviceWorker
    .register(`/sw.js?api=${encodeURIComponent(BASE_URL)}`)
    .then(() => {
      // After the page has settled, so it doesn't slow the first load
      setTimeout(saveAppForOffline, 3000);
    })
    .catch((error) => console.error("Offline mode couldn't start:", error));
};
