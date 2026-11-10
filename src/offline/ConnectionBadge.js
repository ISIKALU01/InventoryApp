// Top-bar badge and banner that say whether the app is online. Offline, the
// app shows the data saved the last time it was online, and can't save changes.
import { useEffect, useState } from "react";
import { CloudOff, Download, RefreshCw, Wifi } from "lucide-react";
import { UPDATE_EVENT, useConnection } from "./connection";

const time = (ms) =>
  ms ? new Date(ms).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : null;

export function ConnectionBadge() {
  const { online } = useConnection();

  return online ? (
    <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-green-700 bg-green-50" title="Connected to SellaPad">
      <Wifi size={13} /> Online
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-red-700 bg-red-50" role="status">
      <CloudOff size={13} /> Offline
    </span>
  );
}

export function OfflineBanner() {
  const { online, lastOnlineAt } = useConnection();
  if (online) return null;

  const since = time(lastOnlineAt);
  return (
    <div role="alert" className="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2 text-sm text-amber-900 border-b border-amber-200 bg-amber-50">
      <CloudOff size={16} className="shrink-0 text-amber-700" />
      <span className="font-semibold">You&apos;re offline.</span>
      <span>
        Showing what was saved {since ? `when you were last online (${since})` : "the last time you were online"}. Changes
        can&apos;t be saved until the internet is back.
      </span>
    </div>
  );
}

// "Install app" button: shown when Edge/Chrome can install SellaPad as a
// desktop app (own window, taskbar icon, opens offline). Hidden once installed.
export function InstallAppButton() {
  // The browser offers it once per page load, maybe before this mounts (see startOffline)
  const [prompt, setPrompt] = useState(null);

  useEffect(() => {
    const sync = () => setPrompt(window.__sellapadInstallPrompt || null);
    sync();
    window.addEventListener("sellapad:installable", sync);
    return () => window.removeEventListener("sellapad:installable", sync);
  }, []);

  if (!prompt) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        prompt.prompt();
        await prompt.userChoice.catch(() => null);
        window.__sellapadInstallPrompt = null;
        setPrompt(null);
      }}
      className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100"
      title="Install SellaPad on this computer: its own window, a taskbar icon, and it opens without internet"
    >
      <Download size={13} /> Install app
    </button>
  );
}

// "New version ready": shown when the server has a newer build than this open
// window (see checkForUpdate in connection.js). Reloading mid-sale would lose
// nothing saved, but the cashier chooses when.
export function UpdateBanner() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setReady(Boolean(window.__sellapadUpdateReady));
    sync();
    window.addEventListener(UPDATE_EVENT, sync);
    return () => window.removeEventListener(UPDATE_EVENT, sync);
  }, []);

  if (!ready) return null;

  return (
    <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-sm text-blue-900 border-b border-blue-200 bg-blue-50">
      <RefreshCw size={15} className="shrink-0 text-blue-700" />
      <span>
        <span className="font-semibold">A new version of SellaPad is ready.</span> Reload when you finish the current sale.
      </span>
      <button type="button" onClick={() => window.location.reload()} className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700">
        Reload now
      </button>
    </div>
  );
}
