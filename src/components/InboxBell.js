// The bell in the top bar: unread count, a dot when something needs your
// action, and the latest messages. Checks every minute, when the window gets
// focus, and when the Inbox page reads or clears messages.
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Bell } from "lucide-react";
import http from "../../services/http";
import { useAuth } from "../context/AuthContext";

export const INBOX_CHANGED = "inbox:changed";

export const timeAgo = (value) => {
  if (!value) return "";
  const seconds = Math.max(0, (Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  if (seconds < 7 * 86400) return `${Math.floor(seconds / 86400)} d ago`;
  return new Date(value).toLocaleDateString([], { day: "numeric", month: "short" });
};

export default function InboxBell() {
  const router = useRouter();
  const { user } = useAuth();
  const [counts, setCounts] = useState({ unread: 0, needs_action: 0 });
  const [open, setOpen] = useState(false);
  const [latest, setLatest] = useState(null);
  const boxRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const { data } = await http.get("/inbox/counts");
      setCounts(data);
    } catch {
      // Signed out or offline: keep what we have
    }
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    refresh();
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    window.addEventListener(INBOX_CHANGED, refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(INBOX_CHANGED, refresh);
    };
  }, [user, refresh]);

  // Close when clicking elsewhere or changing page
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (!boxRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);
  useEffect(() => setOpen(false), [router.pathname]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLatest(null);
      try {
        const { data } = await http.get("/inbox", { params: { filter: "unread" } });
        setLatest((data.data || []).slice(0, 6));
        if (data.counts) setCounts(data.counts);
      } catch {
        setLatest([]);
      }
    }
  };

  const openMessage = async (row) => {
    setOpen(false);
    try {
      await http.post(`/inbox/${row.id}/read`);
    } catch {
      // Still open the page
    }
    window.dispatchEvent(new Event(INBOX_CHANGED));
    router.push(row.link || "/inbox");
  };

  if (!user) return null;

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={`Inbox: ${counts.unread} unread${counts.needs_action ? `, ${counts.needs_action} need your action` : ""}`}
        className="relative flex items-center justify-center w-10 h-10 text-gray-600 rounded-full hover:bg-gray-100"
      >
        <Bell size={20} />
        {counts.unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-600 rounded-full">
            {counts.unread > 99 ? "99+" : counts.unread}
          </span>
        )}
        {counts.needs_action > 0 && <span className="absolute bottom-1 right-1.5 w-2.5 h-2.5 bg-amber-500 border-2 border-white rounded-full" />}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 bg-white border border-gray-200 shadow-xl w-80 sm:w-96">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-900">Inbox</p>
            <p className="text-xs text-gray-500">
              {counts.unread} unread{counts.needs_action ? ` · ${counts.needs_action} need you` : ""}
            </p>
          </div>
          {latest === null ? (
            <p className="px-4 py-6 text-sm text-center text-gray-500">Loading…</p>
          ) : latest.length === 0 ? (
            <p className="px-4 py-6 text-sm text-center text-gray-500">You&apos;re all caught up.</p>
          ) : (
            <ul className="overflow-y-auto divide-y divide-gray-100 max-h-96">
              {latest.map((row) => (
                <li key={row.id}>
                  <button type="button" onClick={() => openMessage(row)} className="w-full px-4 py-3 text-left hover:bg-blue-50/50">
                    <span className="flex items-center gap-2">
                      {row.needs_action && <span className="px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 bg-amber-50">Your turn</span>}
                      <span className="text-sm font-semibold text-gray-900 truncate">{row.title}</span>
                    </span>
                    {row.body && <span className="block mt-0.5 text-xs text-gray-600 line-clamp-2">{row.body}</span>}
                    <span className="block mt-0.5 text-[11px] text-gray-400">{row.from?.name ? `${row.from.name} · ` : ""}{timeAgo(row.created_at)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Link href="/inbox" className="block px-4 py-2.5 text-sm font-semibold text-center text-blue-700 border-t border-gray-200 hover:bg-gray-50">
            Open inbox
          </Link>
        </div>
      )}
    </div>
  );
}
