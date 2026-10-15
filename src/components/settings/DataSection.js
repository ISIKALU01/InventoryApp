// Settings > Data Management: download the business's records as CSV or as
// one JSON backup, and see or clear what this browser keeps. Each user only
// sees the datasets their permissions let them open elsewhere in the app.
import { useEffect, useMemo, useState } from "react";
import {
  FaBroom,
  FaCheckCircle,
  FaDatabase,
  FaDownload,
  FaExclamationTriangle,
  FaFileCsv,
  FaFileDownload,
  FaHdd,
} from "react-icons/fa";
import BASE_URL from "../../../config";
import { useAuth } from "../../context/AuthContext";
import {
  DATASETS,
  downloadFile,
  fetchDataset,
  formatBytes,
  scrubRecords,
  toCsv,
  todayStamp,
} from "../../../utils/dataExport";
import { APPEARANCE_EVENT, APPEARANCE_KEY, DEFAULT_APPEARANCE, saveAppearance } from "../../../utils/appearance";
import { IDLE_MINUTES_KEY, LAST_ACTIVITY_KEY, saveIdleMinutes } from "../../../utils/idleSignOut";
import { ModalFooter, ModalShell, Panel, Spinner, secondaryButtonClass } from "./ui";

// Kept in step with the sales point (src/pages/transaction/sales-invoice.js)
const QUEUE_STORAGE_KEY = "salesPoint.queuedOrders";

const primaryButtonClass =
  "flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-none transition-colors hover:bg-blue-700 disabled:opacity-50";

const messageFrom = (error) => {
  if (error.response?.status === 403) return "Your role can't read this.";
  return error.response?.data?.message || error.message || "Couldn't download.";
};

const readStorage = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const storedBytes = (keys) => keys.reduce((sum, key) => sum + (readStorage(key)?.length || 0) * 2, 0);

const queuedOrderCount = () => {
  try {
    const saved = JSON.parse(readStorage(QUEUE_STORAGE_KEY));
    return Array.isArray(saved) ? saved.length : 0;
  } catch {
    return 0;
  }
};

const fileNameFor = (id) => `sellapad-${id}-${todayStamp()}`;

// What this browser keeps, grouped the way a person thinks of it
const describeDevice = () => {
  const parked = queuedOrderCount();
  return {
    total: storedBytes([APPEARANCE_KEY, IDLE_MINUTES_KEY, LAST_ACTIVITY_KEY, QUEUE_STORAGE_KEY, "token", "user"]),
    items: [
      {
        id: "preferences",
        label: "Preferences",
        detail: "Theme, colour, size and automatic sign-out",
        bytes: storedBytes([APPEARANCE_KEY, IDLE_MINUTES_KEY, LAST_ACTIVITY_KEY]),
        stored: Boolean(readStorage(APPEARANCE_KEY) || readStorage(IDLE_MINUTES_KEY)),
        action: "Reset",
        confirm: "Theme, colour, size and automatic sign-out on this device go back to their defaults.",
      },
      {
        id: "parked",
        label: "Queued sales orders",
        detail: parked ? `${parked} order${parked === 1 ? "" : "s"} parked at the sales point` : "No orders parked",
        bytes: storedBytes([QUEUE_STORAGE_KEY]),
        stored: parked > 0,
        action: "Discard",
        confirm: `The ${parked} queued order${parked === 1 ? "" : "s"} at the sales point will be lost. They exist only on this device.`,
      },
      {
        id: "session",
        label: "Sign-in",
        detail: "Your session and a copy of your profile. Signing out removes them.",
        bytes: storedBytes(["token", "user"]),
        stored: true,
      },
    ],
  };
};

export default function DataSection({ notify }) {
  const { user, can } = useAuth();
  const datasets = useMemo(() => DATASETS.filter((d) => !d.permission || can(d.permission)), [can]);

  // id -> { state: "busy" | "done" | "error", text }
  const [progress, setProgress] = useState({});
  const [backup, setBackup] = useState(null); // { running, current, done, failed: [] }
  const [device, setDevice] = useState(null);
  const [toClear, setToClear] = useState(null); // a device item to confirm

  const busy = Boolean(backup?.running) || Object.values(progress).some((p) => p.state === "busy");

  const setRow = (id, value) => setProgress((prev) => ({ ...prev, [id]: value }));

  // ---- CSV per dataset -----------------------------------------------------

  const exportCsv = async (dataset) => {
    setRow(dataset.id, { state: "busy", text: "Starting…" });
    try {
      const rows = await fetchDataset(dataset, (page, last) =>
        setRow(dataset.id, { state: "busy", text: last > 1 ? `Page ${page} of ${last}` : "Reading…" })
      );
      if (rows.length === 0) {
        setRow(dataset.id, { state: "done", text: "Nothing to export" });
        notify("error", `There are no ${dataset.label.toLowerCase()} to export yet.`, "Nothing exported");
        return;
      }
      downloadFile(toCsv(rows), `${fileNameFor(dataset.id)}.csv`, "text/csv;charset=utf-8");
      setRow(dataset.id, { state: "done", text: `${rows.length} row${rows.length === 1 ? "" : "s"}` });
      notify("success", `${rows.length} ${dataset.label.toLowerCase()} saved as CSV.`, "Export ready");
    } catch (err) {
      console.error(`Error exporting ${dataset.id}:`, err);
      setRow(dataset.id, { state: "error", text: messageFrom(err) });
      notify("error", messageFrom(err), `${dataset.label} not exported`);
    }
  };

  // ---- Full backup ---------------------------------------------------------

  // Reads each dataset in turn (gentler on the server than all at once) and
  // saves them in one file. A dataset that fails is listed in the file.
  const exportBackup = async () => {
    const result = {};
    const failed = [];
    setBackup({ running: true, current: null, done: 0, failed });

    for (const dataset of datasets) {
      setBackup((prev) => ({ ...prev, current: dataset.label }));
      try {
        result[dataset.id] = scrubRecords(await fetchDataset(dataset));
      } catch (err) {
        console.error(`Error backing up ${dataset.id}:`, err);
        failed.push({ dataset: dataset.id, label: dataset.label, error: messageFrom(err) });
      }
      setBackup((prev) => ({ ...prev, done: prev.done + 1, failed: [...failed] }));
    }

    const saved = Object.keys(result);
    if (saved.length === 0) {
      setBackup({ running: false, current: null, done: datasets.length, failed });
      notify("error", "No data could be read. Check your connection and try again.", "Backup not created");
      return;
    }

    const file = {
      app: "SellaPad",
      format: 1,
      exported_at: new Date().toISOString(),
      exported_by: { id: user?.id, name: user?.name, email: user?.email, role: user?.role },
      source: BASE_URL,
      counts: Object.fromEntries(saved.map((id) => [id, result[id].length])),
      failed,
      data: result,
    };
    const json = JSON.stringify(file, null, 2);
    downloadFile(json, `${fileNameFor("backup")}.json`, "application/json");

    setBackup({ running: false, current: null, done: datasets.length, failed, size: json.length, saved: saved.length });
    notify(
      failed.length ? "error" : "success",
      failed.length
        ? `${saved.length} of ${datasets.length} datasets saved. ${failed.map((f) => f.label).join(", ")} could not be read.`
        : `${saved.length} datasets saved in one file.`,
      failed.length ? "Backup partly created" : "Backup ready"
    );
  };

  // ---- This device ---------------------------------------------------------

  const readDevice = () => setDevice(describeDevice());

  useEffect(() => {
    const onStorage = () => setDevice(describeDevice());
    onStorage();
    window.addEventListener("storage", onStorage);
    window.addEventListener(APPEARANCE_EVENT, onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(APPEARANCE_EVENT, onStorage);
    };
  }, []);

  const clearItem = (item) => {
    try {
      if (item.id === "preferences") {
        saveAppearance(DEFAULT_APPEARANCE);
        saveIdleMinutes(0);
        notify("success", "Preferences on this device are back to their defaults.", "Preferences reset");
      } else if (item.id === "parked") {
        localStorage.removeItem(QUEUE_STORAGE_KEY);
        notify("success", "Queued sales orders on this device were discarded.", "Queue cleared");
      }
    } catch (err) {
      console.error("Error clearing device data:", err);
      notify("error", "This browser blocked the change.", "Not cleared");
    }
    setToClear(null);
    readDevice();
  };

  // ---- Render --------------------------------------------------------------

  const statusOf = (dataset) => {
    const row = progress[dataset.id];
    if (!row) return null;
    const tone = row.state === "error" ? "text-red-600" : row.state === "done" ? "text-green-700" : "text-gray-500";
    return (
      <span className={`flex items-center gap-1.5 text-xs ${tone}`}>
        {row.state === "busy" && (
          <span className="w-3 h-3 border-2 border-gray-400 rounded-full border-t-transparent animate-spin" />
        )}
        {row.state === "done" && <FaCheckCircle className="text-[11px]" />}
        {row.state === "error" && <FaExclamationTriangle className="text-[11px]" />}
        <span className="truncate">{row.text}</span>
      </span>
    );
  };

  return (
    <>
      <Panel
        title="Full Backup"
        description="Everything you can see, saved in one file"
        action={
          <button type="button" onClick={exportBackup} disabled={busy || datasets.length === 0} className={primaryButtonClass}>
            {backup?.running ? <Spinner /> : <FaFileDownload className="mr-2 text-xs" />}
            {backup?.running ? "Backing up…" : "Download Backup"}
          </button>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Saves {datasets.length} dataset{datasets.length === 1 ? "" : "s"} as a JSON file you can keep as a dated
            copy of your records. Passwords and sign-in tokens are left out.
          </p>

          {backup && (
            <div className="px-4 py-3 border border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>
                  {backup.running
                    ? `Reading ${backup.current || "…"}`
                    : `${backup.saved ?? 0} of ${datasets.length} saved${backup.size ? ` · ${formatBytes(backup.size)}` : ""}`}
                </span>
                <span>
                  {backup.done}/{datasets.length}
                </span>
              </div>
              <div className="h-1 mt-2 bg-gray-200">
                <div
                  className={`h-1 transition-all ${backup.failed.length ? "bg-amber-500" : "bg-blue-600"}`}
                  style={{ width: `${(backup.done / Math.max(datasets.length, 1)) * 100}%` }}
                />
              </div>
              {backup.failed.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-xs text-amber-800">
                  {backup.failed.map((f) => (
                    <li key={f.dataset}>
                      {f.label}: {f.error}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <p className="flex items-start gap-2 text-xs text-gray-500">
            <FaExclamationTriangle className="mt-0.5 shrink-0 text-amber-500" />
            Backups hold customer, supplier and bank details. Store them somewhere private. This file is for your
            records; restoring it into the app needs the server team.
          </p>
        </div>
      </Panel>

      <Panel
        title="Export Data"
        description="Download one list as a spreadsheet (CSV) that opens in Excel or Google Sheets"
        bodyClass="p-0"
      >
        {datasets.length === 0 ? (
          <p className="px-5 py-8 text-sm text-center text-gray-500">Your role doesn&apos;t give access to any records to export.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {datasets.map((dataset) => (
              <li key={dataset.id} className="flex items-center gap-3 px-5 py-3">
                <FaFileCsv className="text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{dataset.label}</p>
                  {dataset.hint && <p className="text-xs text-gray-500 truncate">{dataset.hint}</p>}
                </div>
                <div className="hidden w-36 sm:block">{statusOf(dataset)}</div>
                <button
                  type="button"
                  onClick={() => exportCsv(dataset)}
                  disabled={busy}
                  aria-label={`Export ${dataset.label} as CSV`}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 transition-colors hover:bg-gray-100 disabled:opacity-50"
                >
                  <FaDownload className="text-[10px]" />
                  CSV
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title="This Device"
        description={device ? `Data this browser keeps · ${formatBytes(device.total)}` : "Data this browser keeps"}
        bodyClass="p-0"
      >
        <ul className="divide-y divide-gray-100">
          {(device?.items || []).map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-5 py-3">
              <FaHdd className="text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500">{item.detail}</p>
              </div>
              <span className="hidden w-16 text-xs text-right text-gray-500 sm:block">{formatBytes(item.bytes)}</span>
              {item.action ? (
                <button
                  type="button"
                  onClick={() => setToClear(item)}
                  disabled={!item.stored}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 transition-colors hover:bg-gray-100 disabled:opacity-40"
                >
                  <FaBroom className="text-[10px]" />
                  {item.action}
                </button>
              ) : (
                <span className="w-[74px]" />
              )}
            </li>
          ))}
        </ul>
        <p className="px-5 py-3 text-[11px] text-gray-500 border-t border-gray-100">
          Your business records live on the server, not here. Clearing this device never deletes sales, stock or
          accounts.
        </p>
      </Panel>

      {toClear && (
        <ModalShell
          title={`${toClear.action} ${toClear.label}`}
          subtitle="On this device only"
          icon={FaDatabase}
          iconClass="bg-amber-600"
          onClose={() => setToClear(null)}
          maxWidth="max-w-md"
        >
          <div className="px-6 py-5">
            <p className="text-sm text-gray-600">{toClear.confirm}</p>
          </div>
          <ModalFooter>
            <button onClick={() => setToClear(null)} className={secondaryButtonClass}>
              Cancel
            </button>
            <button onClick={() => clearItem(toClear)} className={primaryButtonClass}>
              {toClear.action}
            </button>
          </ModalFooter>
        </ModalShell>
      )}
    </>
  );
}
