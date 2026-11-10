// Sales made while offline, kept on this computer until they're synced.
//
// Stored in IndexedDB (survives closing the app and restarting the PC). Each
// sale has its own id (client_ref), so sending it twice is harmless: the
// server records it once. Sync sends waiting sales to POST /orders/sync:
//  - automatically when the connection comes back, and every minute while
//    sales are waiting
//  - when someone presses Sync (also retries sales that had a problem)
//
// Signing out does NOT delete waiting sales: they stay on this computer and
// sync after the next sign-in.
import { useSyncExternalStore } from "react";
import http from "../../services/http";
import { isOnline, useConnection } from "./connection";

const DB_NAME = "sellapad";
const STORE = "offline-sales";
const RECENT_KEY = "sellapad:sync-recent";
const DEVICE_KEY = "sellapad:device-id";
const BATCH = 50;

export const WAITING = "waiting";
export const PROBLEM = "problem";

// ---- IndexedDB ------------------------------------------------------------------

let dbPromise = null;
const db = () => {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) {
          request.result.createObjectStore(STORE, { keyPath: "client_ref" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
};

const run = async (mode, action) => {
  const database = await db();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE, mode);
    const result = action(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(result?.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
};

// ---- State shared with the screens ------------------------------------------

let state = { sales: [], syncing: false, lastSync: null, recent: [], loaded: false };
const listeners = new Set();
const emit = (patch) => {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
};

const readRecent = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(RECENT_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

const rememberRecent = (entries) => {
  const recent = [...entries, ...state.recent].slice(0, 30);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  } catch {
    // Not kept between visits; fine
  }
  return recent;
};

const reload = async () => {
  const sales = (await run("readonly", (store) => store.getAll())) || [];
  sales.sort((a, b) => String(a.sold_at).localeCompare(String(b.sold_at)));
  emit({ sales, loaded: true });
  return sales;
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** { sales, waiting, problems, syncing, lastSync, recent } */
export const useOfflineSales = () => {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => state,
    () => state
  );
  useConnection(); // re-render when the connection changes
  return {
    ...snapshot,
    waiting: snapshot.sales.filter((s) => s.status === WAITING),
    problems: snapshot.sales.filter((s) => s.status === PROBLEM),
  };
};

// ---- Recording a sale ---------------------------------------------------------

const deviceId = () => {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2, 8).toUpperCase();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return "TILL";
  }
};

const newRef = () =>
  `OFF-${deviceId()}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Save a sale made offline. `sale` has store_id, payment_method, items
 * [{ product_id, name, quantity, unit_price }], and optionally
 * payment_reference, bank_account_id, customer_id, plus labels for the screen.
 */
export const saveOfflineSale = async (sale) => {
  const record = {
    ...sale,
    client_ref: newRef(),
    sold_at: new Date().toISOString(),
    total: sale.items.reduce((sum, item) => sum + Number(item.unit_price) * Number(item.quantity), 0),
    status: WAITING,
    message: null,
  };
  await run("readwrite", (store) => store.put(record));
  await reload();
  return record;
};

/** Stock already sold offline and not yet synced, per "storeId:productId" */
export const pendingQuantities = (sales) => {
  const totals = new Map();
  for (const sale of sales) {
    for (const item of sale.items || []) {
      const key = `${sale.store_id}:${item.product_id}`;
      totals.set(key, (totals.get(key) || 0) + Number(item.quantity));
    }
  }
  return totals;
};

/** Take a sale off this computer for good (a manager recorded it by hand) */
export const discardOfflineSale = async (clientRef) => {
  await run("readwrite", (store) => store.delete(clientRef));
  await reload();
};

/** Try a sale that had a problem again on the next sync */
export const retryOfflineSale = async (clientRef) => {
  const sale = state.sales.find((s) => s.client_ref === clientRef);
  if (!sale) return;
  await run("readwrite", (store) => store.put({ ...sale, status: WAITING, message: null }));
  await reload();
};

// ---- Syncing --------------------------------------------------------------------

const toPayload = (sale) => ({
  client_ref: sale.client_ref,
  sold_at: sale.sold_at,
  store_id: Number(sale.store_id),
  payment_method: sale.payment_method,
  payment_reference: sale.payment_reference || null,
  bank_account_id: sale.bank_account_id ? Number(sale.bank_account_id) : null,
  customer_id: sale.customer_id ? Number(sale.customer_id) : null,
  cashier_name: sale.cashier_name || null,
  items: sale.items.map((item) => ({
    product_id: Number(item.product_id),
    quantity: Number(item.quantity),
    unit_price: Number(item.unit_price),
  })),
});

/**
 * Send waiting sales. `includeProblems` (the Sync button) also re-sends sales
 * that had a problem. Returns { synced, review, rejected, error }.
 */
export const syncOfflineSales = async ({ includeProblems = false } = {}) => {
  if (state.syncing) return { busy: true };
  if (typeof window !== "undefined" && !localStorage.getItem("token")) {
    return { error: "Sign in to sync the sales waiting on this computer." };
  }

  emit({ syncing: true });
  const totals = { synced: 0, review: 0, rejected: 0, error: null };
  try {
    const sales = await reload();
    const toSend = sales.filter((s) => s.status === WAITING || (includeProblems && s.status === PROBLEM));

    for (let i = 0; i < toSend.length; i += BATCH) {
      const batch = toSend.slice(i, i + BATCH);
      let results;
      try {
        ({ data: { results } } = await http.post("/orders/sync", { sales: batch.map(toPayload) }));
      } catch (error) {
        totals.error = error.response?.status
          ? error.response.data?.message || "The server couldn't take the sales. Try again."
          : "Still offline. The sales stay on this computer and sync when the internet is back.";
        break;
      }

      const recent = [];
      for (const result of results || []) {
        const sale = batch.find((s) => s.client_ref === result.client_ref);
        if (!sale) continue;
        if (result.status === "synced" || result.status === "already_synced") {
          await run("readwrite", (store) => store.delete(sale.client_ref));
          totals.synced += 1;
          if (result.needs_review) totals.review += 1;
          recent.push({
            client_ref: sale.client_ref,
            order_id: result.order_id,
            total: sale.total,
            sold_at: sale.sold_at,
            synced_at: new Date().toISOString(),
            needs_review: Boolean(result.needs_review),
            notes: result.notes || [],
          });
        } else {
          await run("readwrite", (store) => store.put({ ...sale, status: PROBLEM, message: result.message || "Couldn't be recorded." }));
          totals.rejected += 1;
        }
      }
      if (recent.length) emit({ recent: rememberRecent(recent) });
    }
  } finally {
    await reload().catch(() => {});
    emit({ syncing: false, lastSync: new Date().toISOString() });
  }

  if (totals.synced > 0 && typeof window !== "undefined") {
    // The sales screen reloads stock
    window.dispatchEvent(new Event("sellapad:sales-synced"));
  }
  return totals;
};

// ---- Automatic sync ---------------------------------------------------------------

let autoStarted = false;

/** Called once from _app.js */
export const startAutoSync = () => {
  if (autoStarted || typeof window === "undefined" || !("indexedDB" in window)) return;
  autoStarted = true;
  emit({ recent: readRecent() });

  const trySync = () => {
    if (isOnline() && state.sales.some((s) => s.status === WAITING)) syncOfflineSales().catch(() => {});
  };

  reload()
    .then(trySync)
    .catch((error) => console.error("Offline sales couldn't be loaded:", error));
  window.addEventListener("online", () => setTimeout(trySync, 2000));
  // Also when the backend answers again after being unreachable
  let wasOnline = isOnline();
  setInterval(() => {
    const online = isOnline();
    if (online && !wasOnline) trySync();
    wasOnline = online;
  }, 5000);
  // Every minute, try anyway: the attempt itself finds out if the server is back
  setInterval(() => {
    if (state.sales.some((s) => s.status === WAITING)) syncOfflineSales().catch(() => {});
  }, 60_000);
};
