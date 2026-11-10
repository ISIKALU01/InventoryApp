// SellaPad offline service worker.
//
// Lets the app open and show its data with no internet:
// - App code (/_next/static/...) is saved the first time it's seen and never
//   changes (file names carry a hash), so it's served from the saved copy.
// - Pages are fetched from the network when possible, otherwise the saved copy.
//   Once online, the app sends the list of every page ("warm"), so all pages
//   open offline even if nobody visited them yet.
// - API reads (GET) go to the backend first; if it can't be reached or answers
//   with a server error (5xx), the last saved answer is used, marked with the
//   header X-SellaPad-Offline: 1.
// Writes (POST/PUT/DELETE) are never saved or replayed here.
//
// Registered by src/offline/connection.js as /sw.js?api=<backend /api URL>.

const VERSION = "v1";
const STATIC_CACHE = `sellapad-static-${VERSION}`;
const PAGE_CACHE = `sellapad-pages-${VERSION}`;
const API_CACHE = `sellapad-api-${VERSION}`;
const KEEP = [STATIC_CACHE, PAGE_CACHE, API_CACHE];

const API_BASE = (new URL(self.location.href).searchParams.get("api") || "").replace(/\/+$/, "");

// Live-only API reads: a saved answer would be wrong or unsafe
// (the cart is kept on the till itself while offline)
const API_NEVER_SAVE = [/\/pos-payments\//, /\/pos-device\//, /\/logout$/, /\/cart(\/|$)/];

const PAGE_TIMEOUT_MS = 5000;
const API_TIMEOUT_MS = 15000;
const SAVED_TIMEOUT_MS = 4000;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith("sellapad-") && !KEEP.includes(key)) await caches.delete(key);
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  const { type } = event.data || {};
  if (type === "warm") event.waitUntil(warm(event.data.routes || [], event.data.files || []));
  // Logging out: someone else may use this computer next
  if (type === "clear-data") event.waitUntil(caches.delete(API_CACHE));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (API_BASE && request.url.startsWith(API_BASE + "/")) {
    if (API_NEVER_SAVE.some((re) => re.test(url.pathname))) return;
    event.respondWith(apiRead(request));
    return;
  }

  if (url.origin !== self.location.origin) return;
  // The app asking which version the server has now (connection.js)
  if (url.searchParams.has("sw-bypass")) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(savedFirst(request, STATIC_CACHE));
  } else if (request.mode === "navigate") {
    event.respondWith(page(request));
  } else if (!url.pathname.startsWith("/_next/") && !url.pathname.startsWith("/api/")) {
    // Images, icons, fonts in /public
    event.respondWith(savedThenRefresh(request, STATIC_CACHE));
  }
});

// ---- Strategies ---------------------------------------------------------------

const withTimeout = (promise, ms) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => (clearTimeout(timer), resolve(value)),
      (error) => (clearTimeout(timer), reject(error))
    );
  });

async function savedFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const saved = await cache.match(request);
  if (saved) return saved;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function savedThenRefresh(request, cacheName) {
  const cache = await caches.open(cacheName);
  const saved = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return saved || (await network) || Response.error();
}

// Pages are saved by path, so /sales?x=1 and /sales open the same saved page
const pageKey = (url) => new URL(url).origin + (new URL(url).pathname.replace(/\/+$/, "") || "/");

async function page(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await withTimeout(fetch(request), PAGE_TIMEOUT_MS);
    if (response.ok) cache.put(pageKey(request.url), response.clone());
    return response;
  } catch {
    const saved = await cache.match(pageKey(request.url));
    if (saved) return saved;
    return new Response(OFFLINE_PAGE, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
}

// Once the backend fails, don't make every screen wait on it again: answer from
// the saved copies at once and only let one request through every few seconds
// to see if it's back. (A broken server can take ~8 s per request to fail.)
const RETRY_EVERY_MS = 10000;
let backendDownSince = 0;
let lastProbe = 0;

async function apiRead(request) {
  const cache = await caches.open(API_CACHE);
  const saved = await cache.match(request, { ignoreVary: true });

  const down = backendDownSince > 0;
  if (down && saved && Date.now() - lastProbe < RETRY_EVERY_MS) return offlineCopy(saved);
  if (down) lastProbe = Date.now();

  try {
    // Don't keep someone waiting long when there's a saved copy to show
    const response = await withTimeout(fetch(request), saved ? SAVED_TIMEOUT_MS : API_TIMEOUT_MS);
    // Server up but broken (database down, 502/503 from the host): treat as offline
    if (response.status >= 500) throw new Error(`server error ${response.status}`);
    backendDownSince = 0;
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    if (!backendDownSince) backendDownSince = Date.now();
    lastProbe = Date.now();
    if (saved) return offlineCopy(saved);
    return new Response(
      JSON.stringify({ message: "You're offline, and this hasn't been opened on this computer while online yet.", offline: true }),
      { status: 503, headers: { "Content-Type": "application/json", "X-SellaPad-Offline": "1" } }
    );
  }
}

async function offlineCopy(saved) {
  const headers = new Headers(saved.headers);
  headers.set("X-SellaPad-Offline", "1");
  return new Response(await saved.clone().blob(), { status: saved.status, statusText: saved.statusText, headers });
}

// ---- Saving every page while online --------------------------------------------

let warming = null;

async function warm(routes, files) {
  if (warming) return warming;
  warming = (async () => {
    const staticCache = await caches.open(STATIC_CACHE);
    const pageCache = await caches.open(PAGE_CACHE);
    const wanted = new Set(files.map((f) => new URL(f, self.location.origin).href));

    for (const route of routes) {
      try {
        const response = await fetch(route, { credentials: "same-origin" });
        if (!response.ok) continue;
        const html = await response.clone().text();
        await pageCache.put(pageKey(new URL(route, self.location.origin).href), response);
        for (const match of html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)) {
          wanted.add(new URL(match[1], self.location.origin).href);
        }
      } catch {
        // Offline again mid-way: the rest is saved next time
      }
    }

    for (const href of wanted) {
      if (await staticCache.match(href)) continue;
      try {
        const response = await fetch(href);
        if (response.ok) await staticCache.put(href, response);
      } catch {
        // Try again on the next warm
      }
    }

    // Drop app code from older versions of the app
    for (const request of await staticCache.keys()) {
      const { pathname } = new URL(request.url);
      if (pathname.startsWith("/_next/static/") && !wanted.has(request.url)) await staticCache.delete(request);
    }
  })().finally(() => {
    warming = null;
  });
  return warming;
}

const OFFLINE_PAGE = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Offline</title>
<style>body{font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;background:#f3f4f6;color:#111827}
div{max-width:28rem;padding:2rem;background:#fff;border:1px solid #e5e7eb;text-align:center}h1{font-size:1.1rem}p{color:#4b5563;font-size:.9rem}
a{display:inline-block;margin-top:1rem;padding:.6rem 1.2rem;background:#2563eb;color:#fff;text-decoration:none}</style></head>
<body><div><h1>You're offline</h1><p>This page hasn't been saved on this computer yet. Open SellaPad once while online and every page is saved for offline use.</p><a href="/dashboard">Go to the dashboard</a></div></body></html>`;
